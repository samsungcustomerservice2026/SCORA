import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { validateTcsWinnersCodes } from '../lib/tcsWinnersConfig';
import { softFirestore, withFirestoreRetry } from '../lib/firestoreSafe';
import {
  DEFAULT_ACADEMY_SURVEY,
  DEFAULT_SURVEY_ID,
  normalizeSurveyDefinition,
} from '../lib/surveyDefinitions';

const ENGINEERS_COLLECTION = 'engineers';
const TCS_DASHBOARD_WINNERS_COLLECTION = 'tcs_dashboard_winners';

/** Only these collections may be archived from the admin UI (prevents arbitrary path writes). */
const ALLOWED_ENGINEER_COLLECTIONS = new Set([
  'engineers',
  'tcs_mx_receptionists',
  'tcs_mx_galaxy_consultants',
  'tcs_da_engineers',
  'tcs_vd_engineers',
  'pqa_mx_centers',
  'pqa_ce_centers',
]);

async function readCollection(collectionName) {
  return withFirestoreRetry(async () => {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  });
}

// Engineers
export const getEngineers = async (collectionName = ENGINEERS_COLLECTION) => {
    const rows = await softFirestore(() => readCollection(collectionName), []);
    return rows.filter((eng) => !eng.hidden);
};

export const getHiddenEngineers = async (collectionName = ENGINEERS_COLLECTION) => {
    const rows = await softFirestore(() => readCollection(collectionName), []);
    return rows.filter((eng) => eng.hidden);
};

export const saveEngineer = async (engineer, collectionName = ENGINEERS_COLLECTION) => {
    if (engineer.id && engineer.id.length > 15) { // Firestore IDs are typically 20 chars. Date.now() is 13.
        try {
            const docRef = doc(db, collectionName, engineer.id);
            await setDoc(docRef, engineer, { merge: true });
            return engineer.id;
        } catch (e) {
            console.error("Error saving engineer: ", e);
            throw e;
        }
    } else {
        // Create new
        const docRef = await addDoc(collection(db, collectionName), engineer);
        return docRef.id;
    }
};

export const archiveEngineer = async (id, collectionName = ENGINEERS_COLLECTION) => {
    if (!ALLOWED_ENGINEER_COLLECTIONS.has(collectionName)) {
        throw new Error('Invalid engineer collection');
    }
    const engineerRef = doc(db, collectionName, id);
    await updateDoc(engineerRef, { hidden: true });
};

export const deleteEngineerPermanent = async (id, collectionName = ENGINEERS_COLLECTION) => {
    await deleteDoc(doc(db, collectionName, id));
};


// Admins — Firestore rules let a client read only its own admins/{uid} doc,
// so the directory and every write go through the Admin SDK endpoint.
const ADMIN_ACCOUNTS_API = '/api/admin/accounts';

/** Fields the accounts endpoint accepts; credentials live in Firebase Auth. */
const ADMIN_WRITABLE_FIELDS = [
    'name',
    'username',
    'role',
    'access',
    'permissions',
    'tcsEnvs',
    'pqaEnvs',
    'quizEnvs',
];

export const getAdmins = async () => {
    const { authFetch } = await import('../lib/auth/clientAuth');
    try {
        const res = await authFetch(ADMIN_ACCOUNTS_API, { method: 'GET' });
        if (!res.ok) return [];
        const data = await res.json().catch(() => ({}));
        return Array.isArray(data?.admins) ? data.admins : [];
    } catch (err) {
        console.warn('admin directory load failed:', err?.message || err);
        return [];
    }
};

export const saveAdmin = async (admin) => {
    if (!admin?.id) {
        throw new Error('New admin accounts are created through /api/admin/bootstrap.');
    }
    const { authJson } = await import('../lib/auth/clientAuth');
    const patch = { id: admin.id };
    for (const field of ADMIN_WRITABLE_FIELDS) {
        if (admin[field] !== undefined) patch[field] = admin[field];
    }
    await authJson(ADMIN_ACCOUNTS_API, patch, 'PATCH');
    return admin.id;
};

export const deleteAdmin = async (id) => {
    const { authJson } = await import('../lib/auth/clientAuth');
    await authJson(ADMIN_ACCOUNTS_API, { id }, 'DELETE');
};

// TCS Dashboard Winners (Top 6 by quarter/product)
export const getTcsDashboardWinners = async () => {
    return softFirestore(() => readCollection(TCS_DASHBOARD_WINNERS_COLLECTION), []);
};

export const saveTcsDashboardWinners = async (payload) => {
    const quarterKey = String(payload?.quarterKey || '').toUpperCase().trim();
    const product = String(payload?.product || '').toUpperCase().trim();
    const mxRole = product === 'MX'
        ? String(payload?.mxRole || 'engineers').trim()
        : 'engineers';
    if (!/^Q[1-4]-\d{4}$/.test(quarterKey)) {
        throw new Error('Invalid quarterKey. Expected format Q1-2026.');
    }
    if (!['MX', 'DA', 'AV'].includes(product)) {
        throw new Error('Invalid product. Expected MX, DA, or AV.');
    }
    if (product === 'MX' && !['engineers', 'receptionists', 'galaxy_consultants'].includes(mxRole)) {
        throw new Error('Invalid MX role. Expected engineers, receptionists, or galaxy_consultants.');
    }
    const winners = Array.isArray(payload?.winners)
        ? payload.winners.map((code) => String(code || '').trim()).filter(Boolean)
        : [];
    const validation = validateTcsWinnersCodes(winners, mxRole);
    if (!validation.ok) {
        throw new Error(validation.error || 'Invalid winners list.');
    }
    const normalizedWinners = validation.winners;
    const docId = product === 'MX' && mxRole !== 'engineers'
        ? `${quarterKey}-${product}-${mxRole}`
        : `${quarterKey}-${product}`;
    const docRef = doc(db, TCS_DASHBOARD_WINNERS_COLLECTION, docId);
    const normalizedPayload = {
        quarterKey,
        product,
        winners: normalizedWinners,
        updatedAt: new Date().toISOString(),
        updatedBy: payload?.updatedBy || 'admin',
    };
    if (product === 'MX') normalizedPayload.mxRole = mxRole;
    await setDoc(docRef, normalizedPayload, { merge: true });
    return docId;
};

// Feedback
const FEEDBACK_COLLECTION = 'feedback';
/** Firestore folder-like path:
 *  samsung_academy_survey (collection) / records (doc) / responses (subcollection)
 */
const SAMSUNG_ACADEMY_SURVEY_ROOT = 'samsung_academy_survey';
const SAMSUNG_ACADEMY_SURVEY_DOC = 'records';
const SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION = 'responses';
const SAMSUNG_ACADEMY_DEFINITIONS_SUBCOLLECTION = 'definitions';

function surveyDefinitionsCol() {
  return collection(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC, SAMSUNG_ACADEMY_DEFINITIONS_SUBCOLLECTION);
}

export const saveFeedback = async (feedbackData) => {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
        ...feedbackData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

export const getFeedbacks = async () => {
    const rows = await softFirestore(() => readCollection(FEEDBACK_COLLECTION), []);
    return rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
};

/**
 * Visitor-facing display switches (all default to on):
 * the floating Samsung Academy survey shortcut, the Arabic feedback form,
 * and the in-app "turn on phone alerts" banner.
 */
export const getAcademySurveySettings = async () => {
    const snap = await softFirestore(
      () => withFirestoreRetry(() => getDoc(doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC))),
      null,
    );
    if (!snap || !snap.exists()) {
        return {
          academySurveyPopupEnabled: true,
          feedbackEnabled: true,
          notifyAlertsEnabled: true,
          activeSurveyId: DEFAULT_SURVEY_ID,
        };
    }
    const data = snap.data() || {};
    return {
        academySurveyPopupEnabled: data.academySurveyPopupEnabled !== false,
        feedbackEnabled: data.feedbackEnabled !== false,
        notifyAlertsEnabled: data.notifyAlertsEnabled !== false,
        activeSurveyId: String(data.activeSurveyId || DEFAULT_SURVEY_ID).trim() || DEFAULT_SURVEY_ID,
        updatedAt: data.updatedAt || null,
        updatedBy: data.updatedBy || null,
    };
};

export const saveAcademySurveySettings = async (settings, updatedBy = 'admin') => {
    await setDoc(
        doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC),
        {
            type: 'SAMSUNG_ACADEMY_SURVEY_CONTAINER',
            updatedAt: new Date().toISOString(),
            updatedBy,
            ...settings,
        },
        { merge: true }
    );
};

export const getSurveyDefinitions = async () => {
    const rows = await softFirestore(
      () => withFirestoreRetry(async () => {
        const snapshot = await getDocs(surveyDefinitionsCol());
        return snapshot.docs.map((item) => normalizeSurveyDefinition({ ...item.data(), id: item.id }));
      }),
      [],
    );
    return rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
};

export const saveSurveyDefinition = async (definition, updatedBy = 'admin') => {
    const normalized = normalizeSurveyDefinition(definition);
    const col = surveyDefinitionsCol();
    const ref = normalized.id
      ? doc(col, normalized.id)
      : doc(col);
    const payload = {
      ...normalized,
      id: ref.id,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    await setDoc(ref, payload, { merge: true });
    return ref.id;
};

export const deleteSurveyDefinition = async (id) => {
    if (!id) throw new Error('Missing survey id');
    await deleteDoc(doc(surveyDefinitionsCol(), id));
};

/** Writes the original Academy survey so admins can edit it. No-op if any definition exists. */
export const ensureDefaultSurveyDefinition = async (updatedBy = 'admin') => {
    const existing = await getSurveyDefinitions();
    if (existing.length) return existing;
    try {
        await setDoc(doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC), {
            type: 'SAMSUNG_ACADEMY_SURVEY_CONTAINER',
            activeSurveyId: DEFAULT_SURVEY_ID,
            updatedAt: new Date().toISOString(),
            updatedBy,
        }, { merge: true });
        await saveSurveyDefinition({ ...DEFAULT_ACADEMY_SURVEY, id: DEFAULT_SURVEY_ID }, updatedBy);
    } catch (err) {
        console.warn('Could not seed default survey definition:', err?.code || err?.message || err);
        return [];
    }
    return getSurveyDefinitions();
};

export const saveSamsungAcademySurvey = async (surveyData) => {
    // Visitors may create a response only. The parent `records` doc is admin-only,
    // so updating it here makes every public submit fail with permission denied.
    const docRef = await addDoc(collection(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC, SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION), {
        ...surveyData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

export const getSamsungAcademySurveys = async () => {
    return softFirestore(
      () => withFirestoreRetry(async () => {
        const snapshot = await getDocs(collection(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC, SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION));
        return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      }),
      [],
    );
};

