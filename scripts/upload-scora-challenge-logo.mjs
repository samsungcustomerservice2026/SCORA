/**
 * Upload public/scora_challenge_logo.jpg to Firebase Storage → branding/
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const filePath = resolve(root, 'public/scora_challenge_logo.jpg');

const firebaseConfig = {
  apiKey: 'AIzaSyCeD7Xrt6kwPWVgjNIrpwy0jnI8yQso1iM',
  authDomain: 'tcs-for-engineers.firebaseapp.com',
  projectId: 'tcs-for-engineers',
  storageBucket: 'tcs-for-engineers.firebasestorage.app',
  messagingSenderId: '283193216884',
  appId: '1:283193216884:web:75df672769338634722621',
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const bytes = readFileSync(filePath);
const objectPath = 'branding/scora_challenge_logo.jpg';
const storageRef = ref(storage, objectPath);

async function main() {
  try {
    await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
  } catch (err) {
    // Fallback if branding rules are not deployed yet
    console.warn('branding/ upload failed, trying PQA/…', err?.code || err?.message);
    const fallback = ref(storage, 'PQA/scora_challenge_logo.jpg');
    await uploadBytes(fallback, bytes, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(fallback);
    console.log(JSON.stringify({ path: 'PQA/scora_challenge_logo.jpg', url }, null, 2));
    return;
  }
  const url = await getDownloadURL(storageRef);
  console.log(JSON.stringify({ path: objectPath, url }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
