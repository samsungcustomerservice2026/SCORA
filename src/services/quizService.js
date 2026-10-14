import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import {
  QUIZ_COLLECTIONS,
  QUIZ_MAX_PLAYERS,
  QUIZ_PIN_LENGTH,
  QUIZ_SESSION_STATUS,
  QUIZ_DIVISIONS,
} from '../constants/quiz';
import { scoraChallengeJoinUrl, scoraChallengeHostPath, scoraChallengeResultsPath } from '../constants/scoraChallengePaths';
import {
  normalizeQuizSettings,
  prepareSessionQuestions,
  buildRankMap,
  getQuestionTimeLimit,
} from '../lib/quizSessionHelpers';
import { checkQuizAnswer, isScoredQuestionType } from '../lib/quizAnswerCheck';
import { computeQuizPoints } from '../lib/quizScoring';

const templatesCol = () => collection(db, QUIZ_COLLECTIONS.templates);
const sessionsCol = () => collection(db, QUIZ_COLLECTIONS.sessions);
const logsCol = () => collection(db, QUIZ_COLLECTIONS.logs);

function playersCol(sessionId) {
  return collection(db, QUIZ_COLLECTIONS.sessions, sessionId, 'players');
}

function answersCol(sessionId) {
  return collection(db, QUIZ_COLLECTIONS.sessions, sessionId, 'answers');
}

function sessionRef(sessionId) {
  return doc(db, QUIZ_COLLECTIONS.sessions, sessionId);
}

function randomPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function isPinAvailable(pin) {
  const q = query(sessionsCol(), where('pin', '==', pin), limit(20));
  const snap = await getDocs(q);
  return snap.docs.every((d) => {
    const status = d.data()?.status;
    return status === QUIZ_SESSION_STATUS.FINISHED;
  });
}

async function allocateUniquePin() {
  for (let i = 0; i < 40; i++) {
    const pin = randomPin();
    if (await isPinAvailable(pin)) return pin;
  }
  throw new Error('Could not allocate a unique game PIN. Try again.');
}

export async function writeQuizLog(entry) {
  try {
    await addDoc(logsCol(), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('quiz log write failed', e);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function listQuizTemplates(division = null) {
  const snap = await getDocs(templatesCol());
  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => !t.hidden);
  if (division && QUIZ_DIVISIONS.includes(division)) {
    rows = rows.filter((t) => t.division === division);
  }
  return rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export async function saveQuizTemplate(template, actor = 'admin') {
  const division = QUIZ_DIVISIONS.includes(template.division) ? template.division : 'MX';
  const payload = {
    title: String(template.title || '').trim(),
    titleAr: String(template.titleAr || '').trim(),
    division,
    questions: Array.isArray(template.questions) ? template.questions : [],
    settings: normalizeQuizSettings(template.settings),
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
    hidden: false,
  };
  if (template.id) {
    await setDoc(doc(db, QUIZ_COLLECTIONS.templates, template.id), payload, { merge: true });
    await writeQuizLog({
      type: 'TEMPLATE',
      action: 'updated',
      actor,
      division,
      details: { templateId: template.id, title: payload.title },
    });
    return template.id;
  }
  const ref = await addDoc(templatesCol(), {
    ...payload,
    createdAt: new Date().toISOString(),
    createdBy: actor,
  });
  await writeQuizLog({
    type: 'TEMPLATE',
    action: 'created',
    actor,
    division,
    details: { templateId: ref.id, title: payload.title },
  });
  return ref.id;
}

export async function archiveQuizTemplate(templateId, actor = 'admin') {
  await updateDoc(doc(db, QUIZ_COLLECTIONS.templates, templateId), { hidden: true });
  await writeQuizLog({ type: 'TEMPLATE', action: 'archived', actor, details: { templateId } });
}

// ─── Live sessions ───────────────────────────────────────────────────────────

export async function listActiveQuizSessions(division = null) {
  const snap = await getDocs(sessionsCol());
  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) =>
      s.status === QUIZ_SESSION_STATUS.LOBBY
      || s.status === QUIZ_SESSION_STATUS.QUESTION
      || s.status === QUIZ_SESSION_STATUS.REVEAL
    );
  if (division) rows = rows.filter((s) => s.division === division);
  return rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function listFinishedQuizSessions(limitN = 50, division = null) {
  const snap = await getDocs(sessionsCol());
  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.status === QUIZ_SESSION_STATUS.FINISHED);
  if (division) rows = rows.filter((s) => s.division === division);
  return rows
    .sort((a, b) => String(b.finishedAt || '').localeCompare(String(a.finishedAt || '')))
    .slice(0, limitN);
}

export async function startQuizLiveSession({ templateId, hostUsername }) {
  const tSnap = await getDoc(doc(db, QUIZ_COLLECTIONS.templates, templateId));
  if (!tSnap.exists()) throw new Error('Quiz template not found');
  const template = tSnap.data();
  if (!template.questions?.length) throw new Error('Quiz has no questions');

  const pin = await allocateUniquePin();
  const division = QUIZ_DIVISIONS.includes(template.division) ? template.division : 'MX';

  const settings = normalizeQuizSettings(template.settings);
  const questions = prepareSessionQuestions(template.questions, settings);

  const sessionPayload = {
    pin,
    division,
    templateId,
    templateTitle: template.title || 'SCORA Challenge',
    templateTitleAr: template.titleAr || '',
    questions,
    settings,
    status: QUIZ_SESSION_STATUS.LOBBY,
    currentQuestionIndex: -1,
    questionStartedAt: null,
    prevRanks: {},
    hostUsername: hostUsername || 'admin',
    playerCount: 0,
    maxPlayers: QUIZ_MAX_PLAYERS,
    answerCount: 0,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };

  const ref = await addDoc(sessionsCol(), sessionPayload);
  await writeQuizLog({
    type: 'SESSION',
    action: 'started',
    actor: hostUsername,
    sessionId: ref.id,
    pin,
    division,
    details: { templateId, title: template.title },
  });
  return { sessionId: ref.id, pin, division };
}

export async function getQuizSessionByPin(pin) {
  const normalized = String(pin || '').replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH);
  if (normalized.length !== QUIZ_PIN_LENGTH) return null;
  const q = query(sessionsCol(), where('pin', '==', normalized), limit(10));
  const snap = await getDocs(q);
  const active = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.status !== QUIZ_SESSION_STATUS.FINISHED);
  return active[0] || null;
}

export async function getQuizSession(sessionId) {
  const snap = await getDoc(sessionRef(sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function subscribeQuizSession(sessionId, callback) {
  return onSnapshot(sessionRef(sessionId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() });
  });
}

export function subscribeQuizPlayers(sessionId, callback) {
  return onSnapshot(playersCol(sessionId), (snap) => {
    const players = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    players.sort((a, b) => (b.score || 0) - (a.score || 0));
    callback(players);
  });
}

export async function joinQuizSession(sessionId, nickname, { existingPlayerId = null } = {}) {
  const nick = String(nickname || '').trim().slice(0, 24);
  if (nick.length < 2) throw new Error('Nickname must be at least 2 characters');

  const sess = await getQuizSession(sessionId);
  if (!sess) throw new Error('Game not found');
  if (sess.status === QUIZ_SESSION_STATUS.FINISHED) throw new Error('This game has ended');

  // Reconnect: if this device already joined the session, reuse the same player
  // instead of creating a duplicate.
  if (existingPlayerId) {
    const existingSnap = await getDoc(doc(db, QUIZ_COLLECTIONS.sessions, sessionId, 'players', existingPlayerId));
    if (existingSnap.exists()) {
      return {
        playerId: existingPlayerId,
        session: sess,
        reconnected: true,
        nickname: String(existingSnap.data()?.nickname || nick),
      };
    }
  }

  if ((sess.playerCount || 0) >= (sess.maxPlayers || QUIZ_MAX_PLAYERS)) {
    throw new Error('Game is full (200 players max)');
  }

  const playersSnap = await getDocs(playersCol(sessionId));
  const nickTaken = playersSnap.docs.some(
    (d) => String(d.data()?.nickname || '').trim().toLowerCase() === nick.toLowerCase()
  );
  if (nickTaken) {
    const err = new Error('This nickname is already taken in this game. Pick a different one.');
    err.code = 'NICKNAME_TAKEN';
    throw err;
  }

  const playerRef = await addDoc(playersCol(sessionId), {
    nickname: nick,
    score: 0,
    joinedAt: new Date().toISOString(),
    division: sess.division,
  });

  await updateDoc(sessionRef(sessionId), { playerCount: increment(1) });
  await writeQuizLog({
    type: 'PLAYER',
    action: 'joined',
    actor: nick,
    sessionId,
    pin: sess.pin,
    division: sess.division,
    details: { playerId: playerRef.id },
  });

  return { playerId: playerRef.id, session: sess };
}

async function callHostApi(sessionId, action, extra = {}) {
  const { authJson, getIdToken } = await import('../lib/auth/clientAuth');
  const token = await getIdToken();
  if (!token) {
    const err = new Error(
      'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
    );
    err.code = 'unauthenticated';
    err.status = 401;
    throw err;
  }
  return authJson('/api/quiz/host', { sessionId, action, ...extra });
}

export async function hostStartQuestion(sessionId, hostUsername) {
  try {
    await callHostApi(sessionId, 'next');
    return;
  } catch (err) {
    if (err?.code !== 'admin_not_configured' && err?.status !== 503) throw err;
  }
  // Legacy client path only when Admin SDK is not configured (dev). Prefer server.
  const { getIdToken } = await import('../lib/auth/clientAuth');
  if (!(await getIdToken())) {
    const err = new Error(
      'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
    );
    err.code = 'unauthenticated';
    err.status = 401;
    throw err;
  }
  try {
    const sess = await getQuizSession(sessionId);
    if (!sess) throw new Error('Session not found');
    const nextIndex = (sess.currentQuestionIndex ?? -1) + 1;
    if (nextIndex >= (sess.questions?.length || 0)) throw new Error('No more questions');

    const players = await getQuizSessionPlayers(sessionId);
    const prevRanks = buildRankMap(players);

    await updateDoc(sessionRef(sessionId), {
      status: QUIZ_SESSION_STATUS.QUESTION,
      currentQuestionIndex: nextIndex,
      questionStartedAt: new Date().toISOString(),
      revealStartedAt: null,
      answerCount: 0,
      prevRanks,
    });
    await writeQuizLog({
      type: 'HOST',
      action: 'question_started',
      actor: hostUsername,
      sessionId,
      pin: sess.pin,
      division: sess.division,
      details: { questionIndex: nextIndex, legacyClient: true },
    });
  } catch (err) {
    if (/insufficient permissions|permission-denied/i.test(String(err?.message || err?.code || ''))) {
      const e = new Error(
        'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
      );
      e.code = 'permission-denied';
      throw e;
    }
    throw err;
  }
}

export async function updateQuizSessionSettings(sessionId, settingsPatch, actor) {
  try {
    await callHostApi(sessionId, 'settings', { settings: settingsPatch || {} });
    const sess = await getQuizSession(sessionId);
    return normalizeQuizSettings(sess?.settings || settingsPatch);
  } catch (err) {
    if (err?.code !== 'admin_not_configured' && err?.status !== 503) throw err;
  }
  // Legacy client path only when Admin SDK is not configured (dev).
  const sess = await getQuizSession(sessionId);
  if (!sess) throw new Error('Session not found');
  if (sess.status === QUIZ_SESSION_STATUS.FINISHED) throw new Error('Game has ended');
  const settings = normalizeQuizSettings({ ...sess.settings, ...settingsPatch });

  const patch = { settings };
  const reshuffleKeys = ['randomizeQuestions', 'randomizeAnswers'];
  const needsReshuffle = reshuffleKeys.some((k) => Object.prototype.hasOwnProperty.call(settingsPatch, k));

  // Re-build the question list from the template while still in lobby so
  // randomize on/off takes effect before the first question starts.
  if (needsReshuffle && sess.status === QUIZ_SESSION_STATUS.LOBBY && sess.templateId) {
    const tSnap = await getDoc(doc(db, QUIZ_COLLECTIONS.templates, sess.templateId));
    if (tSnap.exists()) {
      const template = tSnap.data();
      patch.questions = prepareSessionQuestions(template.questions || [], settings);
    }
  } else if (needsReshuffle && sess.status !== QUIZ_SESSION_STATUS.LOBBY) {
    throw new Error('Question/answer order can only be changed in the lobby before the game starts.');
  }

  await updateDoc(sessionRef(sessionId), patch);
  await writeQuizLog({
    type: 'HOST',
    action: 'settings_updated',
    actor: actor || 'admin',
    sessionId,
    pin: sess.pin,
    division: sess.division,
    details: settingsPatch,
  });
  return settings;
}

export async function hostRevealQuestion(sessionId, hostUsername) {
  try {
    await callHostApi(sessionId, 'reveal');
    return;
  } catch (err) {
    if (err?.code !== 'admin_not_configured' && err?.status !== 503) throw err;
  }
  const { getIdToken } = await import('../lib/auth/clientAuth');
  if (!(await getIdToken())) {
    const err = new Error(
      'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
    );
    err.code = 'unauthenticated';
    err.status = 401;
    throw err;
  }
  try {
    const sess = await getQuizSession(sessionId);
    if (!sess) throw new Error('Session not found');
    await updateDoc(sessionRef(sessionId), {
      status: QUIZ_SESSION_STATUS.REVEAL,
      revealStartedAt: new Date().toISOString(),
    });
    await writeQuizLog({
      type: 'HOST',
      action: 'question_revealed',
      actor: hostUsername,
      sessionId,
      pin: sess.pin,
      division: sess.division,
      details: { questionIndex: sess.currentQuestionIndex, legacyClient: true },
    });
  } catch (err) {
    if (/insufficient permissions|permission-denied/i.test(String(err?.message || err?.code || ''))) {
      const e = new Error(
        'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
      );
      e.code = 'permission-denied';
      throw e;
    }
    throw err;
  }
}

export async function hostEndQuiz(sessionId, hostUsername) {
  try {
    await callHostApi(sessionId, 'end');
    return;
  } catch (err) {
    if (err?.code !== 'admin_not_configured' && err?.status !== 503) throw err;
  }
  const { getIdToken } = await import('../lib/auth/clientAuth');
  if (!(await getIdToken())) {
    const err = new Error(
      'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
    );
    err.code = 'unauthenticated';
    err.status = 401;
    throw err;
  }
  try {
    const sess = await getQuizSession(sessionId);
    if (!sess) throw new Error('Session not found');
    if (sess.status === QUIZ_SESSION_STATUS.FINISHED) return;
    await updateDoc(sessionRef(sessionId), {
      status: QUIZ_SESSION_STATUS.FINISHED,
      finishedAt: new Date().toISOString(),
    });
    await writeQuizLog({
      type: 'HOST',
      action: 'game_finished',
      actor: hostUsername,
      sessionId,
      pin: sess.pin,
      division: sess.division,
      details: { playerCount: sess.playerCount, legacyClient: true },
    });
  } catch (err) {
    if (/insufficient permissions|permission-denied/i.test(String(err?.message || err?.code || ''))) {
      const e = new Error(
        'Admin sign-in required to control this game. Sign in on the admin portal, then open the host screen again (same browser).',
      );
      e.code = 'permission-denied';
      throw e;
    }
    throw err;
  }
}

export async function hostKickPlayer(sessionId, playerId, reason = '') {
  return callHostApi(sessionId, 'kick', { playerId, reason });
}

export async function hostBanPlayer(sessionId, playerId, reason = '') {
  return callHostApi(sessionId, 'ban', { playerId, reason });
}

export async function adminEndQuizSession(sessionId, actor = 'admin') {
  const sess = await getQuizSession(sessionId);
  if (!sess) throw new Error('Session not found');
  if (sess.status === QUIZ_SESSION_STATUS.FINISHED) throw new Error('Game already ended');
  await updateDoc(sessionRef(sessionId), {
    status: QUIZ_SESSION_STATUS.FINISHED,
    finishedAt: new Date().toISOString(),
    endedFrom: 'portal',
    endedBy: actor,
  });
  await writeQuizLog({
    type: 'ADMIN',
    action: 'game_ended',
    actor,
    sessionId,
    pin: sess.pin,
    division: sess.division,
    details: {
      previousStatus: sess.status,
      playerCount: sess.playerCount || 0,
      templateTitle: sess.templateTitle,
    },
  });
}

async function submitQuizAnswerOnDevice({
  sessionId,
  playerId,
  nickname,
  answer,
}) {
  const sess = await getQuizSession(sessionId);
  if (!sess || sess.status !== QUIZ_SESSION_STATUS.QUESTION) {
    throw new Error('Not accepting answers right now');
  }

  const qIndex = sess.currentQuestionIndex ?? 0;
  const question = sess.questions?.[qIndex];
  if (!question) throw new Error('Invalid question');

  const existingRef = doc(db, QUIZ_COLLECTIONS.sessions, sessionId, 'answers', `${playerId}_q${qIndex}`);
  const existingSnap = await getDoc(existingRef);
  if (existingSnap.exists()) {
    return {
      correct: !!existingSnap.data()?.correct,
      points: Number(existingSnap.data()?.points) || 0,
      revealed: false,
      duplicate: true,
    };
  }

  const startedAt = sess.questionStartedAt ? new Date(sess.questionStartedAt).getTime() : Date.now();
  const responseTimeMs = Math.max(0, Date.now() - (Number.isFinite(startedAt) ? startedAt : Date.now()));
  const correct = checkQuizAnswer(question, answer);
  const timeLimitSec = getQuestionTimeLimit(sess, question);
  const scored = isScoredQuestionType(question.type);
  const points = scored && correct
    ? computeQuizPoints(question.points || 1000, timeLimitSec, responseTimeMs)
    : 0;
  const newAnswerCount = (sess.answerCount || 0) + 1;
  const settings = normalizeQuizSettings(sess.settings);
  const shouldReveal = settings.autoRevealWhenAllAnswered
    && newAnswerCount >= (sess.playerCount || 0)
    && (sess.playerCount || 0) > 0;

  try {
    await setDoc(existingRef, {
      playerId,
      nickname: nickname || 'Player',
      questionIndex: qIndex,
      questionType: question.type,
      answer: String(answer).slice(0, 2000),
      correct,
      points,
      responseTimeMs,
      answeredAt: new Date().toISOString(),
      division: sess.division || '',
    });

    if (points > 0) {
      await updateDoc(doc(db, QUIZ_COLLECTIONS.sessions, sessionId, 'players', playerId), {
        score: increment(points),
        lastAnswerAt: new Date().toISOString(),
      });
    }

    await updateDoc(sessionRef(sessionId), {
      answerCount: increment(1),
      ...(shouldReveal ? {
        status: QUIZ_SESSION_STATUS.REVEAL,
        revealStartedAt: new Date().toISOString(),
      } : {}),
    });
  } catch (err) {
    if (/permission-denied|insufficient permissions/i.test(String(err?.code || err?.message || ''))) {
      throw new Error('Answer was not saved. Game rules are blocking player responses.');
    }
    throw err;
  }

  return { correct, points, revealed: shouldReveal, duplicate: false };
}

export async function submitQuizAnswer({
  sessionId,
  playerId,
  nickname,
  answer,
}) {
  // Prefer server scoring. Production currently has no Admin SDK credential,
  // so fall back to a direct Firestore write or the tap is dropped.
  const res = await fetch('/api/quiz/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      playerId,
      nickname,
      answer,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return {
      correct: !!data.correct,
      points: Number(data.points) || 0,
      revealed: !!data.revealed,
      duplicate: !!data.duplicate,
    };
  }
  if (res.status === 503 || data?.code === 'admin_not_configured') {
    return submitQuizAnswerOnDevice({ sessionId, playerId, nickname, answer });
  }
  const err = new Error(data?.error || 'Answer submit failed');
  err.code = data?.code;
  err.status = res.status;
  throw err;
}

export async function getQuizSessionAnswers(sessionId) {
  const snap = await getDocs(answersCol(sessionId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getQuizSessionPlayers(sessionId) {
  const snap = await getDocs(playersCol(sessionId));
  const players = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return players.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export async function fetchQuizLogs(limitN = 100) {
  const snap = await getDocs(logsCol());
  return snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() ?? null,
    }))
    .sort((a, b) => {
      const ta = a.timestamp?.getTime?.() || 0;
      const tb = b.timestamp?.getTime?.() || 0;
      return tb - ta;
    })
    .slice(0, limitN);
}

export function getQuizJoinUrl(pin) {
  if (typeof window !== 'undefined') {
    return scoraChallengeJoinUrl(pin, window.location.origin);
  }
  return scoraChallengeJoinUrl(pin);
}

export function getQuizHostPath(sessionId) {
  return scoraChallengeHostPath(sessionId);
}

export function getQuizResultsPath(sessionId) {
  return scoraChallengeResultsPath(sessionId);
}
