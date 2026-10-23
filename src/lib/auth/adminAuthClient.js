/**
 * Admin authentication (client). Firebase Auth email/password only.
 *
 * The legacy Firestore username + passwordB64 path has been removed: it read
 * every admins/{id} doc, which required the collection to be world-readable
 * and exposed reversible credentials. Firestore rules now allow a client to
 * read only its own admins/{uid} doc; the directory is served by
 * /api/admin/accounts under the Admin SDK.
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { ROLES } from './roles';

const UI_KEY = 'adminUiPrefs_v1';
const MIGRATION_SESSION_KEY = 'adminMigrationSession_v1';
const MIGRATION_TTL_MS = 2 * 60 * 60 * 1000;

/** First owner — used only when Firestore admins/{uid} cannot be written yet. */
const BOOTSTRAP_OWNER_EMAIL = 'fawzymaherahmed@gmail.com';
const BOOTSTRAP_OWNER_USERNAME = 'fawzy.m';

function normalizeRole(raw) {
  const u = String(raw || '').trim().toUpperCase();
  if (u === 'SUPER_ADMIN') return ROLES.SUPER_ADMIN;
  const l = u.toLowerCase();
  if (l === 'super_admin') return ROLES.SUPER_ADMIN;
  if (l === 'admin') return ROLES.ADMIN;
  if (l === 'editor') return ROLES.EDITOR;
  if (l === 'viewer') return ROLES.VIEWER;
  if (u === 'ADMIN') return ROLES.ADMIN;
  return ROLES.ADMIN;
}

export function shapeAdminUser(uid, data = {}, email = '') {
  const role = normalizeRole(data.role);
  const legacySuper = String(data.role || '').toUpperCase() === 'SUPER_ADMIN' || role === ROLES.SUPER_ADMIN;
  return {
    id: data.id || uid,
    uid,
    firebaseUid: uid,
    username: data.username || email.split('@')[0] || uid,
    email: data.email || email,
    name: data.name || data.username || 'Admin',
    role: legacySuper ? 'SUPER_ADMIN' : String(data.role || 'ADMIN').toUpperCase(),
    authRole: role,
    access: data.access || (legacySuper ? 'ALL' : 'LIMITED'),
    permissions: data.permissions || null,
    tcsEnvs: data.tcsEnvs,
    pqaEnvs: data.pqaEnvs,
    quizEnvs: data.quizEnvs,
    migrationAuth: !!data.migrationAuth,
  };
}

export async function loadAdminProfile(uid, email = '') {
  if (!uid) return null;
  // Rules permit exactly this read: the caller's own admins/{uid} document.
  try {
    const byId = await getDoc(doc(db, 'admins', uid));
    if (byId.exists()) return shapeAdminUser(uid, byId.data(), email);
  } catch {
    /* fall through to the server lookup below */
  }

  // Legacy documents are keyed by username and only carry firebaseUid, which a
  // client cannot query under the current rules. Resolve those server-side.
  try {
    const { authFetch } = await import('./clientAuth');
    const res = await authFetch('/api/admin/accounts?self=1', { method: 'GET' });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.admin) return shapeAdminUser(uid, data.admin, email);
    }
  } catch {
    /* fall through to the owner unlock below */
  }

  // Owner unlock so the first SUPER_ADMIN can still reach the portal before the
  // admins/{uid} document exists. The document itself must be provisioned by
  // /api/admin/bootstrap — the client can no longer write it.
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail === BOOTSTRAP_OWNER_EMAIL) {
    return shapeAdminUser(
      uid,
      {
        firebaseUid: uid,
        email: BOOTSTRAP_OWNER_EMAIL,
        username: BOOTSTRAP_OWNER_USERNAME,
        name: 'Fawzy',
        role: 'SUPER_ADMIN',
        access: 'ALL',
        migrationAuth: true,
      },
      BOOTSTRAP_OWNER_EMAIL,
    );
  }

  return null;
}

function toAuthEmail(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.toLowerCase();
  return `${raw.toLowerCase()}@admins.tcs-for-engineers.local`;
}

function isAuthNotConfigured(err) {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  return (
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    /configuration-not-found|OPERATION_NOT_ALLOWED|Identity Toolkit/i.test(msg)
  );
}

export function readMigrationSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(MIGRATION_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.profile || !parsed?.loginAt) return null;
    if (Date.now() - Number(parsed.loginAt) > MIGRATION_TTL_MS) {
      sessionStorage.removeItem(MIGRATION_SESSION_KEY);
      return null;
    }
    return parsed.profile;
  } catch {
    return null;
  }
}

export function clearMigrationSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(MIGRATION_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Map a login id to the Firebase Auth email. A bare username cannot be looked
 * up in Firestore any more, so it resolves through the owner mapping or the
 * internal address convention.
 */
function resolveLoginEmail(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.toLowerCase();
  if (raw.toLowerCase() === BOOTSTRAP_OWNER_USERNAME) return BOOTSTRAP_OWNER_EMAIL;
  return toAuthEmail(raw);
}

/** Firebase Auth email/password sign-in. */
export async function signInAdmin(loginId, password) {
  const raw = String(loginId || '').trim();
  const email = resolveLoginEmail(loginId);
  if (!email) throw new Error('Enter your admin email or username.');

  await setPersistence(auth, browserLocalPersistence);

  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (isAuthNotConfigured(err)) {
      throw new Error('Firebase Authentication is not enabled for this project.');
    }
    if (
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/wrong-password'
    ) {
      throw new Error('User or Password are wrong');
    }
    throw new Error(err?.message || 'Authentication failed');
  }

  clearMigrationSession();
  const profile = await loadAdminProfile(cred.user.uid, cred.user.email || email);
  if (!profile) {
    await signOut(auth);
    throw new Error(
      'Signed in, but no admin profile is linked to this account. Ask a SUPER_ADMIN to provision it via /api/admin/bootstrap.',
    );
  }
  saveAdminUiPrefs({ username: profile.username || raw, name: profile.name });
  return { user: cred.user, profile };
}

export async function signOutAdmin() {
  clearAdminUiPrefs();
  clearMigrationSession();
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
}

export function saveAdminUiPrefs(prefs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ ...prefs, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function clearAdminUiPrefs() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(UI_KEY);
    localStorage.removeItem('adminSession');
  } catch {
    /* ignore */
  }
}

export function subscribeAdminAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      const migrationProfile = readMigrationSession();
      if (migrationProfile) {
        callback({ user: null, profile: migrationProfile, migration: true });
        return;
      }
      callback({ user: null, profile: null });
      return;
    }
    try {
      const profile = await loadAdminProfile(user.uid, user.email || '');
      callback({ user, profile: profile || null });
    } catch (err) {
      callback({ user, profile: null, error: err });
    }
  });
}

export { toAuthEmail, ROLES };
