/**
 * Admin authentication (client).
 * Order:
 * 1) Firebase Auth email/password
 * 2) Legacy Firestore username + passwordB64 (when rules allow read)
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
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
  try {
    const byId = await getDoc(doc(db, 'admins', uid));
    if (byId.exists()) return shapeAdminUser(uid, byId.data(), email);
  } catch {
    /* continue */
  }
  try {
    const q = query(collection(db, 'admins'), where('firebaseUid', '==', uid), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return shapeAdminUser(uid, { ...d.data(), id: d.id }, email);
    }
  } catch {
    /* continue */
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail === BOOTSTRAP_OWNER_EMAIL) {
    const seed = {
      firebaseUid: uid,
      email: BOOTSTRAP_OWNER_EMAIL,
      username: BOOTSTRAP_OWNER_USERNAME,
      name: 'Fawzy',
      role: 'SUPER_ADMIN',
      access: 'ALL',
      migrationAuth: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'admins', uid), seed, { merge: true });
    } catch {
      /* live rules may still deny — session still works via seed below */
    }
    return shapeAdminUser(uid, seed, BOOTSTRAP_OWNER_EMAIL);
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

function encodePasswordCandidates(password) {
  const plain = String(password ?? '');
  const out = new Set();
  try {
    out.add(window.btoa(plain));
  } catch {
    /* ignore */
  }
  try {
    out.add(window.btoa(unescape(encodeURIComponent(plain))));
  } catch {
    /* ignore */
  }
  return [...out];
}

function passwordMatchesStored(storedRaw, password) {
  const stored = String(storedRaw || '');
  if (!stored) return false;
  if (stored === password) return true;
  return encodePasswordCandidates(password).includes(stored);
}

function saveMigrationSession(profile) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(MIGRATION_SESSION_KEY, JSON.stringify({ profile, loginAt: Date.now() }));
  } catch {
    /* ignore */
  }
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

async function loadAllAdminsForMigration() {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    const code = String(err?.code || '');
    if (code === 'permission-denied' || /insufficient permissions/i.test(String(err?.message || ''))) {
      const e = new Error('admins_unreadable');
      e.code = 'admins_unreadable';
      throw e;
    }
    throw err;
  }
}

/** Legacy: Firestore passwordB64 */
export async function signInAdminLegacy(loginId, password) {
  const username = String(loginId || '').trim();
  if (!username || password == null || password === '') {
    throw new Error('User or Password are wrong');
  }

  const rows = await loadAllAdminsForMigration();
  if (!rows.length) {
    const e = new Error('No admin accounts found in Firestore.');
    e.code = 'no_admins';
    throw e;
  }

  const userMatch = rows.find(
    (a) => String(a.username || '').trim().toLowerCase() === username.toLowerCase(),
  );
  if (!userMatch) {
    const known = rows.map((a) => a.username).filter(Boolean).slice(0, 12).join(', ');
    const e = new Error(known ? `Unknown admin "${username}". Found: ${known}` : `Unknown admin "${username}".`);
    e.code = 'unknown_user';
    throw e;
  }

  const stored = userMatch.passwordB64 || userMatch.password_b64 || userMatch.password || '';
  if (!passwordMatchesStored(stored, password)) {
    const e = new Error('User or Password are wrong');
    e.code = 'bad_password';
    throw e;
  }

  if (userMatch.username === 'fawzy.m' || userMatch.username === 'g.samir') {
    userMatch.role = 'SUPER_ADMIN';
    userMatch.access = 'ALL';
  }

  const profile = shapeAdminUser(userMatch.id || userMatch.username, {
    ...userMatch,
    migrationAuth: true,
  });
  saveMigrationSession(profile);
  saveAdminUiPrefs({ username: profile.username, name: profile.name });
  return { user: null, profile, migration: true };
}

async function resolveLoginEmail(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.toLowerCase();
  if (raw.toLowerCase() === BOOTSTRAP_OWNER_USERNAME) return BOOTSTRAP_OWNER_EMAIL;
  try {
    const q = query(collection(db, 'admins'), where('username', '==', raw), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const email = String(snap.docs[0].data()?.email || '').trim();
      if (email.includes('@')) return email.toLowerCase();
    }
  } catch {
    /* admins may be unreadable */
  }
  return toAuthEmail(raw);
}

/**
 * Firebase Auth email/password, then legacy Firestore username+passwordB64.
 */
export async function signInAdmin(loginId, password) {
  const raw = String(loginId || '').trim();
  const looksLikeEmail = raw.includes('@');

  // Prefer Firebase Auth first (email, or username → mapped email / convention)
  try {
    await setPersistence(auth, browserLocalPersistence);
    const email = await resolveLoginEmail(loginId);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    clearMigrationSession();
    const profile = await loadAdminProfile(cred.user.uid, cred.user.email || email);
    if (profile) {
      saveAdminUiPrefs({ username: profile.username || raw, name: profile.name });
      return { user: cred.user, profile };
    }
    await signOut(auth);
    throw new Error('Signed in, but no admin profile is linked to this account.');
  } catch (authErr) {
    if (
      authErr?.message === 'Signed in, but no admin profile is linked to this account.'
    ) {
      throw authErr;
    }
    if (
      !isAuthNotConfigured(authErr) &&
      authErr?.code !== 'auth/invalid-credential' &&
      authErr?.code !== 'auth/user-not-found' &&
      authErr?.code !== 'auth/wrong-password'
    ) {
      /* continue to legacy */
    }
  }

  // Username → legacy Firestore
  if (!looksLikeEmail) {
    return signInAdminLegacy(loginId, password);
  }

  // Email → Firebase Auth (retry path)
  await setPersistence(auth, browserLocalPersistence);
  const email = toAuthEmail(loginId);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    clearMigrationSession();
    const profile = await loadAdminProfile(cred.user.uid, cred.user.email || email);
    if (!profile) {
      await signOut(auth);
      throw new Error('Signed in, but no admin profile is linked to this account.');
    }
    saveAdminUiPrefs({ username: profile.username, name: profile.name });
    return { user: cred.user, profile };
  } catch (err) {
    if (isAuthNotConfigured(err) || err?.code === 'auth/invalid-credential') {
      return signInAdminLegacy(loginId, password);
    }
    throw new Error(err?.message || 'Authentication failed');
  }
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
