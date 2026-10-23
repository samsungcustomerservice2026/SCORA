import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin, requireSuperAdmin, authErrorResponse } from '../../../../lib/auth/serverAuth';
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';
import { writeAuditLog } from '../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLECTION = 'admins';

/**
 * Admin account directory. Replaces direct client access to admins/{uid},
 * which had to stay world-readable/writable while admin login was migrating
 * to Firebase Auth. Firestore rules now allow a client to read only its own
 * profile, so listing and all writes come through here under the Admin SDK.
 */

/** Credentials live in Firebase Auth and must never be read or written here. */
const CREDENTIAL_FIELDS = new Set(['passwordB64', 'password_b64', 'password', 'pwd']);

/** Profile fields a SUPER_ADMIN may set. Anything else is ignored. */
const WRITABLE_FIELDS = new Set([
  'name',
  'username',
  'role',
  'access',
  'permissions',
  'tcsEnvs',
  'pqaEnvs',
  'quizEnvs',
]);

const CLAIM_ROLES = ['super_admin', 'admin', 'editor', 'viewer'];

function sanitize(id, data = {}) {
  const out = { id };
  for (const [key, value] of Object.entries(data)) {
    if (CREDENTIAL_FIELDS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

function notConfigured() {
  return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
}

/** Doc id is the Auth uid for current accounts; legacy docs carry firebaseUid. */
function resolveUid(id, data = {}) {
  return String(data.firebaseUid || id || '').trim();
}

/**
 * GET — list admin accounts (any signed-in admin), or with ?self=1 return just
 * the caller's own profile. The self lookup resolves legacy documents keyed by
 * username via their firebaseUid, which a client can no longer query directly.
 */
export async function GET(request) {
  try {
    if (!isFirebaseAdminConfigured()) return notConfigured();

    if (new URL(request.url).searchParams.get('self') === '1') {
      const ctx = await requireAuth(request);
      if (!ctx.adminDoc) {
        return NextResponse.json({ error: 'No admin profile', code: 'no_profile' }, { status: 404 });
      }
      const { id, ...rest } = ctx.adminDoc;
      return NextResponse.json({ ok: true, admin: sanitize(id, rest) });
    }

    await requireAdmin(request);

    const db = getAdminDb();
    const snap = await db.collection(COLLECTION).get();
    const admins = snap.docs.map((d) => sanitize(d.id, d.data()));
    return NextResponse.json({ ok: true, admins });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/** PATCH — update an admin profile. SUPER_ADMIN only. */
export async function PATCH(request) {
  try {
    if (!isFirebaseAdminConfigured()) return notConfigured();
    const actor = await requireSuperAdmin(request);

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const existing = snap.data() || {};
    const targetUid = resolveUid(id, existing);

    const patch = {};
    for (const [key, value] of Object.entries(body)) {
      if (WRITABLE_FIELDS.has(key)) patch[key] = value;
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'No updatable fields supplied' }, { status: 400 });
    }

    // A super admin must not be able to lock themselves out of their own portal.
    const nextRole = patch.role ? String(patch.role).toUpperCase() : '';
    if (targetUid && targetUid === actor.uid && nextRole && nextRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You cannot remove your own SUPER_ADMIN role', code: 'self_demotion' },
        { status: 400 },
      );
    }

    patch.updatedAt = new Date().toISOString();
    patch.updatedBy = actor.uid;
    await ref.set(patch, { merge: true });

    // Keep custom claims aligned with the stored role so Firestore rules and
    // server authorisation agree without waiting for a re-bootstrap.
    if (nextRole && targetUid) {
      const claimsRole = CLAIM_ROLES.includes(nextRole.toLowerCase()) ? nextRole.toLowerCase() : 'admin';
      try {
        await getAdminAuth().setCustomUserClaims(targetUid, {
          role: claimsRole,
          isAdmin: true,
          isSuperAdmin: claimsRole === 'super_admin',
        });
      } catch (claimErr) {
        console.warn('setCustomUserClaims failed for', targetUid, claimErr?.message || claimErr);
      }
    }

    await writeAuditLog({
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'admin_update',
      entityType: 'admin',
      entityId: id,
      oldValue: sanitize(id, existing),
      newValue: patch,
    });

    const after = await ref.get();
    return NextResponse.json({ ok: true, admin: sanitize(after.id, after.data()) });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/** DELETE — remove an admin profile and revoke its claims. SUPER_ADMIN only. */
export async function DELETE(request) {
  try {
    if (!isFirebaseAdminConfigured()) return notConfigured();
    const actor = await requireSuperAdmin(request);

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || new URL(request.url).searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const existing = snap.data() || {};
    const targetUid = resolveUid(id, existing);
    if (targetUid && targetUid === actor.uid) {
      return NextResponse.json(
        { error: 'You cannot delete your own account', code: 'self_delete' },
        { status: 400 },
      );
    }

    await ref.delete();

    // Strip admin claims so a deleted account cannot keep privileged access.
    if (targetUid) {
      try {
        await getAdminAuth().setCustomUserClaims(targetUid, {
          role: null,
          isAdmin: false,
          isSuperAdmin: false,
        });
        await getAdminAuth().revokeRefreshTokens(targetUid);
      } catch (claimErr) {
        console.warn('claim revoke failed for', targetUid, claimErr?.message || claimErr);
      }
    }

    await writeAuditLog({
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'admin_delete',
      entityType: 'admin',
      entityId: id,
      oldValue: sanitize(id, existing),
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return authErrorResponse(err);
  }
}
