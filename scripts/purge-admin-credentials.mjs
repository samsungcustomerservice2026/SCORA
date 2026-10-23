/**
 * Remove legacy reversible credentials from admins/{id} documents.
 *
 * The admins collection was world-readable while admin login was migrating to
 * Firebase Auth, so any passwordB64 value stored there must be treated as
 * compromised. Credentials now live in Firebase Auth only; these fields are
 * dead weight and a standing liability.
 *
 * Dry run (default):  node scripts/purge-admin-credentials.mjs
 * Apply changes:      node scripts/purge-admin-credentials.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CREDENTIAL_FIELDS = ['passwordB64', 'password_b64', 'password', 'pwd'];
const APPLY = process.argv.includes('--apply');

/** Minimal .env.local reader — scripts do not go through Next.js env loading. */
function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadServiceAccount() {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64 JSON');
    }
  }
}

loadEnvLocal();

const serviceAccount = loadServiceAccount();
if (!serviceAccount) {
  console.error(
    'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Add it to .env.local before running this script.',
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'tcs-for-engineers',
});

const db = admin.firestore();

const snap = await db.collection('admins').get();
console.log(`Scanned ${snap.size} admin document(s) in project ${serviceAccount.project_id}.`);

const affected = [];
for (const docSnap of snap.docs) {
  const data = docSnap.data() || {};
  const found = CREDENTIAL_FIELDS.filter((field) => data[field] !== undefined);
  if (found.length) {
    affected.push({ id: docSnap.id, username: data.username || '(no username)', fields: found });
  }
}

if (!affected.length) {
  console.log('No legacy credential fields found. Nothing to purge.');
  process.exit(0);
}

console.log(`\nFound legacy credential fields in ${affected.length} document(s):`);
for (const row of affected) {
  console.log(`  - ${row.id}  (${row.username})  ->  ${row.fields.join(', ')}`);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to remove these fields.');
  console.log('Treat every listed account password as compromised and rotate it in Firebase Auth.');
  process.exit(0);
}

let purged = 0;
for (const row of affected) {
  const patch = {};
  for (const field of row.fields) patch[field] = admin.firestore.FieldValue.delete();
  patch.credentialsPurgedAt = new Date().toISOString();
  await db.collection('admins').doc(row.id).update(patch);
  purged += 1;
  console.log(`Purged ${row.fields.join(', ')} from ${row.id}`);
}

console.log(`\nDone. Cleared credential fields from ${purged} document(s).`);
console.log('Rotate the password of every listed account in Firebase Auth — those values were readable.');
process.exit(0);
