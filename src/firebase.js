import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

export const firebaseConfig = {
  apiKey: "AIzaSyCeD7Xrt6kwPWVgjNIrpwy0jnI8yQso1iM",
  authDomain: "tcs-for-engineers.firebaseapp.com",
  projectId: "tcs-for-engineers",
  storageBucket: "tcs-for-engineers.firebasestorage.app",
  messagingSenderId: "283193216884",
  appId: "1:283193216884:web:75df672769338634722621",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const isBrowser = typeof window !== "undefined";

let firestorePoisoned = false;

/** True after Firestore hard-asserts (client unusable until full page reload). */
export function isFirestorePoisoned() {
  return firestorePoisoned;
}

export function markFirestorePoisoned(err) {
  const msg = String(err?.message || err || "");
  if (/INTERNAL ASSERTION FAILED|Unexpected state \(ID: (b815|ca9)\)/i.test(msg)) {
    firestorePoisoned = true;
    return true;
  }
  return false;
}

/**
 * Firestore 12.x can throw an uncaught hardAssert (ca9 → b815) that poisons the
 * client and floods the Next.js overlay. Also swallow non-Error promise
 * rejections that are raw Event objects (shows up as "[object Event]").
 */
function installFirestoreAssertGuard() {
  if (!isBrowser || window.__gogoFirestoreAssertGuard) return;
  window.__gogoFirestoreAssertGuard = true;

  const isAssert = (value) =>
    /FIRESTORE|INTERNAL ASSERTION FAILED|Unexpected state \(ID: (b815|ca9)\)/i.test(
      String(value?.message || value || ""),
    );

  const isEventRejection = (reason) => {
    if (reason == null) return false;
    if (typeof Event !== "undefined" && reason instanceof Event) return true;
    // Serialized / cross-realm Event often only exposes isTrusted.
    if (
      typeof reason === "object" &&
      !(reason instanceof Error) &&
      Object.prototype.hasOwnProperty.call(reason, "isTrusted") &&
      !reason.message
    ) {
      return true;
    }
    return false;
  };

  window.addEventListener(
    "error",
    (event) => {
      if (!isAssert(event.error) && !isAssert(event.message)) return;
      firestorePoisoned = true;
      event.preventDefault();
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason;
      if (isAssert(reason)) {
        firestorePoisoned = true;
        event.preventDefault();
        return;
      }
      if (isEventRejection(reason)) {
        event.preventDefault();
      }
    },
    true,
  );
}

if (isBrowser) {
  installFirestoreAssertGuard();
  try {
    setLogLevel("silent");
  } catch {
    /* ignore */
  }
}

let appCheckInitialized = false;
if (isBrowser && !appCheckInitialized) {
  const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY;
  if (appCheckSiteKey) {
    appCheckInitialized = true;
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn("Firebase App Check initialization failed:", e);
    }
  }
}

/**
 * Keep Firestore settings minimal.
 * Do NOT call enableNetwork()/disableNetwork() — that triggers ca9/b815 in firebase@12.9.
 * Do NOT force long-polling.
 */
function createFirestore() {
  const settings = {
    ignoreUndefinedProperties: true,
  };
  if (isBrowser) {
    try {
      settings.localCache = memoryLocalCache();
    } catch {
      /* private mode */
    }
  }
  try {
    return initializeFirestore(app, settings);
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestore();

/**
 * No-op reconnect helper kept for call-site compatibility.
 * Intentionally does NOT call enableNetwork (SDK assertion trigger).
 */
export async function ensureFirestoreNetwork() {
  if (!isBrowser || firestorePoisoned) return false;
  return navigator.onLine !== false;
}

export const storage = getStorage(app);
export const auth = getAuth(app);
