/**
 * Paste into Firebase Console → Firestore → Rules (merge with existing rules).
 * Path layout for GoGo:
 *   gogo_assistant / workspace
 *   gogo_assistant / workspace / qa / {qaId}
 *   gogo_assistant / workspace / culture / {cultureId}
 *   gogo_assistant / workspace / chats / {visitorId}
 *   gogo_assistant / workspace / learned / {learnedId}
 *   gogo_assistant / workspace / feedback / {feedbackId}
 *   gogo_assistant / workspace / products / {productId}
 *
 * Chat docs MUST use document id === visitorId. Clients only read/write their own chat.
 * Curated Q&A (`qa`) is admin-write only. Learned + feedback + products stay shared memory.
 */
export const FIREBASE_GOGO_FIRESTORE_RULES_SNIPPET = `
// --- GoGo AI assistant ---
match /gogo_assistant/{docId} {
  allow read, write: if true; // workspace root marker
}

match /gogo_assistant/workspace {
  allow read, write: if true;
}

match /gogo_assistant/workspace/qa/{qaId} {
  allow read: if true;
  allow write: if isAdmin();
}

match /gogo_assistant/workspace/culture/{cultureId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}

match /gogo_assistant/workspace/learned/{learnedId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}

match /gogo_assistant/workspace/products/{productId} {
  allow read: if true;
  allow create, update: if true;
  allow delete: if false;
}

match /gogo_assistant/workspace/feedback/{feedbackId} {
  allow read: if isAdmin();
  allow create: if true;
  allow update, delete: if false;
}

match /gogo_assistant/workspace/chats/{visitorId} {
  allow create: if request.resource.data.visitorId == visitorId
    && request.resource.data.visitorId is string
    && request.resource.data.visitorId.size() >= 8
    && request.resource.data.visitorId.size() <= 80
    && request.resource.data.keys().hasAll(['visitorId', 'messages', 'updatedAt']);
  allow read, update: if resource.data.visitorId == visitorId
    && request.resource.data.visitorId == visitorId;
  allow delete: if false;
}
`;

export const FIREBASE_GOGO_CONSOLE_HINT =
  'Firebase Console → Firestore → Data → gogo_assistant / workspace / {qa, culture, chats, learned, feedback, products}\n' +
  'Product docs use template fields: id, name_en/ar, series, variant, aliases, seriesKeys, specs, gsmarenaUrl, source=gsmarena\n' +
  'Admin Q&A catalog: gogo_assistant / workspace / qa — admin write only (published rows answer free text)\n' +
  'NEW structured KB (model-number primary): samsung_kb / workspace / products + samsung_kb / catalog_meta — see firebaseSamsungKbRules.js';
