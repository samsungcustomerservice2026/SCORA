import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { validateTcsWinnersCodes } from '../lib/tcsWinnersConfig';
import { softFirestore, withFirestoreRetry } from '../lib/firestoreSafe';

const ENGINEERS_COLLECTION = 'engineers';
const ADMINS_COLLECTION = 'admins';
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


// Admins
export const getAdmins = async () => {
    return softFirestore(() => readCollection(ADMINS_COLLECTION), []);
};

export const saveAdmin = async (admin) => {
    if (admin.id) {
        const docRef = doc(db, ADMINS_COLLECTION, admin.id);
        await setDoc(docRef, admin, { merge: true });
        return admin.id;
    } else {
        const docRef = await addDoc(collection(db, ADMINS_COLLECTION), admin);
        return docRef.id;
    }
};

export const deleteAdmin = async (id) => {
    await deleteDoc(doc(db, ADMINS_COLLECTION, id));
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

/** Whether the floating Samsung Academy survey shortcut is shown on the TCS portal (default: on). */
export const getAcademySurveySettings = async () => {
    const snap = await softFirestore(
      () => withFirestoreRetry(() => getDoc(doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC))),
      null,
    );
    if (!snap || !snap.exists()) {
        return { academySurveyPopupEnabled: true, feedbackEnabled: true };
    }
    const data = snap.data() || {};
    return {
        academySurveyPopupEnabled: data.academySurveyPopupEnabled !== false,
        feedbackEnabled: data.feedbackEnabled !== false,
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

