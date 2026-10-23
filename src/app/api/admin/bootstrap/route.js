import { NextResponse } from 'next/server';
import { requireSuperAdmin, authErrorResponse, ROLES } from '../../../../lib/auth/serverAuth';
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';
import { writeAuditLog } from '../../../../lib/audit/log';
import {
  ACCESS_SCOPES,
  DEFAULT_FORM_PERMISSIONS,
  PERM,
  allPermissions,
  sanitizePermissions,
} from '../../../../lib/adminPermissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bootstrap / link admin users. SUPER_ADMIN only (or one-time BOOTSTRAP_ADMIN_SECRET).
 * body: { email, password?, role, name, username, access?, permissions? }
 */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const bootstrapSecret = process.env.BOOTSTRAP_ADMIN_SECRET || '';
    const provided = request.headers.get('x-bootstrap-secret') || body.bootstrapSecret || '';

    let actor = null;
    if (bootstrapSecret && provided && provided === bootstrapSecret) {
      actor = { uid: 'bootstrap', role: ROLES.SUPER_ADMIN };
    } else {
      actor = await requireSuperAdmin(request);
    }

    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'admin').toLowerCase();
    const name = String(body.name || 'Admin').slice(0, 80);
    const username = String(body.username || email.split('@')[0] || 'admin').slice(0, 40);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const auth = getAdminAuth();
    const db = getAdminDb();

    let user;
    let createdUser = false;
    try {
      user = await auth.getUserByEmail(email);
    } catch (lookupErr) {
      if (lookupErr?.code !== 'auth/user-not-found') throw lookupErr;
      if (!body.password || String(body.password).length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters for a new account.', code: 'weak_password' }, { status: 400 });
      }
      try {
        user = await auth.createUser({
          email,
          password: String(body.password),
          displayName: name,
          emailVerified: true,
        });
        createdUser = true;
      } catch (createErr) {
        const reason = {
          'auth/invalid-email': 'That email address is not valid.',
          'auth/invalid-password': 'Password must be at least 8 characters.',
          'auth/email-already-exists': 'That email already has an account.',
        }[createErr?.code];
        if (reason) return NextResponse.json({ error: reason, code: createErr.code }, { status: 400 });
        throw createErr;
      }
    }

    const claimsRole = ['super_admin', 'admin', 'editor', 'viewer'].includes(role) ? role : 'admin';
    await auth.setCustomUserClaims(user.uid, {
      role: claimsRole,
      isAdmin: true,
      isSuperAdmin: claimsRole === 'super_admin',
    });

    const isOwner = claimsRole === 'super_admin';
    const requestedAccess = String(body.access || '').toUpperCase();
    const adminDoc = {
      firebaseUid: user.uid,
      email,
      username,
      name,
      role: isOwner ? 'SUPER_ADMIN' : claimsRole.toUpperCase(),
      access: isOwner ? 'ALL' : ACCESS_SCOPES.includes(requestedAccess) ? requestedAccess : 'TCS_ONLY',
      permissions: isOwner
        ? allPermissions(PERM.READ_WRITE)
        : { ...DEFAULT_FORM_PERMISSIONS, ...(sanitizePermissions(body.permissions) || {}) },
      // passwordB64 intentionally omitted — Firebase Auth is the credential store
      updatedAt: new Date().toISOString(),
    };

    const ref = db.collection('admins').doc(user.uid);
    const before = await ref.get();
    if (!before.exists) adminDoc.createdAt = adminDoc.updatedAt;
    await ref.set(adminDoc, { merge: true });

    await writeAuditLog({
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'admin_upsert',
      entityType: 'admin',
      entityId: user.uid,
      newValue: { email, role: claimsRole, username, access: adminDoc.access, permissions: adminDoc.permissions },
    });

    return NextResponse.json({
      ok: true,
      uid: user.uid,
      email,
      role: claimsRole,
      existingUser: !createdUser,
      admin: { id: user.uid, ...adminDoc },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
