/**
 * Server-authoritative SCORA answer scoring (Admin SDK + transactions).
 */
import { QUIZ_SESSION_STATUS } from '../../constants/quiz';
import { checkQuizAnswer, isScoredQuestionType } from '../quizAnswerCheck';
import { computeQuizPoints } from '../quizScoring';
import { getAdminDb } from '../auth/firebaseAdmin';
import { writeAuditLog } from '../audit/log';
import { normalizeQuizSettings, prepareSessionQuestions } from '../quizSessionHelpers';

function getQuestionTimeLimit(sess, question) {
  const q = Number(question?.timeLimitSec);
  if (Number.isFinite(q) && q > 0) return q;
  const s = Number(sess?.settings?.defaultTimeLimitSec);
  if (Number.isFinite(s) && s > 0) return s;
  return 20;
}

function normalizeSettings(settings = {}) {
  return {
    autoRevealWhenAllAnswered: settings.autoRevealWhenAllAnswered !== false,
    ...settings,
  };
}

/**
 * Authoritative answer submission.
 * Does NOT trust client score/correct/timing.
 */
export async function scoreAnswerServer({
  sessionId,
  playerId,
  answer,
  nickname = '',
}) {
  const db = getAdminDb();
  const admin = require('firebase-admin');
  const FieldValue = admin.firestore.FieldValue;

  const sessionRef = db.collection('quiz_live_sessions').doc(sessionId);
  const playerRef = sessionRef.collection('players').doc(playerId);

  const result = await db.runTransaction(async (tx) => {
    const sessSnap = await tx.get(sessionRef);
    if (!sessSnap.exists) {
      const err = new Error('Session not found');
      err.code = 'not_found';
      err.status = 404;
      throw err;
    }
    const sess = sessSnap.data();
    if (sess.status !== QUIZ_SESSION_STATUS.QUESTION) {
      const err = new Error('Not accepting answers right now');
      err.code = 'not_accepting';
      err.status = 409;
      throw err;
    }

    const playerSnap = await tx.get(playerRef);
    if (!playerSnap.exists) {
      const err = new Error('Player not in this session');
      err.code = 'not_member';
      err.status = 403;
      throw err;
    }
    const player = playerSnap.data() || {};
    if (player.banned === true) {
      const err = new Error('Player is banned from this session');
      err.code = 'banned';
      err.status = 403;
      throw err;
    }

    const qIndex = sess.currentQuestionIndex ?? 0;
    const question = sess.questions?.[qIndex];
    if (!question) {
      const err = new Error('Invalid question');
      err.code = 'invalid_question';
      err.status = 400;
      throw err;
    }

    const answerId = `${playerId}_q${qIndex}`;
    const answerRef = sessionRef.collection('answers').doc(answerId);
    const existing = await tx.get(answerRef);
    if (existing.exists) {
      const prev = existing.data();
      return {
        duplicate: true,
        correct: !!prev.correct,
        points: Number(prev.points) || 0,
        revealed: false,
        questionIndex: qIndex,
      };
    }

    const startedAt = sess.questionStartedAt ? new Date(sess.questionStartedAt).getTime() : Date.now();
    const now = Date.now();
    const timeLimitSec = getQuestionTimeLimit(sess, question);
    const graceMs = 1500;
    const deadline = startedAt + timeLimitSec * 1000 + graceMs;
    if (now > deadline) {
      const err = new Error('Answer submitted too late');
      err.code = 'late_answer';
      err.status = 409;
      throw err;
    }

    const responseTimeMs = Math.max(0, now - startedAt);
    const correct = checkQuizAnswer(question, answer);
    const scored = isScoredQuestionType(question.type);
    const points = scored && correct ? computeQuizPoints(question.points || 1000, timeLimitSec, responseTimeMs) : 0;

    tx.set(answerRef, {
      playerId,
      nickname: nickname || player.nickname || 'Player',
      questionIndex: qIndex,
      questionType: question.type,
      answer: String(answer).slice(0, 2000),
      correct,
      points,
      responseTimeMs,
      answeredAt: new Date(now).toISOString(),
      answeredAtMs: now,
      division: sess.division || '',
      serverAuthoritative: true,
    });

    if (points > 0) {
      tx.update(playerRef, {
        score: FieldValue.increment(points),
        lastAnswerAt: new Date(now).toISOString(),
      });
    }

    const newAnswerCount = (sess.answerCount || 0) + 1;
    const settings = normalizeSettings(sess.settings);
    const shouldReveal =
      settings.autoRevealWhenAllAnswered &&
      newAnswerCount >= (sess.playerCount || 0) &&
      (sess.playerCount || 0) > 0;

    tx.update(sessionRef, {
      answerCount: FieldValue.increment(1),
      ...(shouldReveal
        ? {
            status: QUIZ_SESSION_STATUS.REVEAL,
            revealStartedAt: new Date(now).toISOString(),
          }
        : {}),
    });

    return {
      duplicate: false,
      correct,
      points,
      revealed: shouldReveal,
      questionIndex: qIndex,
      responseTimeMs,
    };
  });

  return result;
}

export async function hostActionServer({
  sessionId,
  action,
  actorUid,
  actorRole,
  actorName = 'host',
  patch = {},
}) {
  const db = getAdminDb();
  const sessionRef = db.collection('quiz_live_sessions').doc(sessionId);
  const sessSnap = await sessionRef.get();
  if (!sessSnap.exists) {
    const err = new Error('Session not found');
    err.code = 'not_found';
    err.status = 404;
    throw err;
  }
  const sess = sessSnap.data();
  const nowIso = new Date().toISOString();

  if (action === 'start_question' || action === 'next') {
    const nextIndex = (sess.currentQuestionIndex ?? -1) + 1;
    if (nextIndex >= (sess.questions?.length || 0)) {
      const err = new Error('No more questions');
      err.code = 'no_more';
      err.status = 400;
      throw err;
    }
    const playersSnap = await sessionRef.collection('players').orderBy('score', 'desc').get();
    const prevRanks = {};
    playersSnap.docs.forEach((d, i) => {
      prevRanks[d.id] = i + 1;
    });
    await sessionRef.update({
      status: QUIZ_SESSION_STATUS.QUESTION,
      currentQuestionIndex: nextIndex,
      questionStartedAt: nowIso,
      revealStartedAt: null,
      answerCount: 0,
      prevRanks,
    });
  } else if (action === 'reveal') {
    await sessionRef.update({
      status: QUIZ_SESSION_STATUS.REVEAL,
      revealStartedAt: nowIso,
    });
  } else if (action === 'end') {
    await sessionRef.update({
      status: QUIZ_SESSION_STATUS.FINISHED,
      finishedAt: nowIso,
      endedBy: actorUid,
    });
  } else if (action === 'kick' || action === 'ban') {
    const playerId = String(patch.playerId || '');
    if (!playerId) {
      const err = new Error('playerId required');
      err.status = 400;
      throw err;
    }
    const pref = sessionRef.collection('players').doc(playerId);
    await pref.set(
      {
        kicked: action === 'kick',
        banned: action === 'ban',
        removedAt: nowIso,
        removedBy: actorUid,
      },
      { merge: true },
    );
    if (action === 'kick') {
      await sessionRef.update({
        playerCount: require('firebase-admin').firestore.FieldValue.increment(-1),
      });
    }
  } else if (action === 'settings') {
    if (sess.status === QUIZ_SESSION_STATUS.FINISHED) {
      const err = new Error('Game has ended');
      err.status = 400;
      throw err;
    }
    const settingsPatch = patch.settings && typeof patch.settings === 'object' ? patch.settings : {};
    const settings = normalizeQuizSettings({ ...sess.settings, ...settingsPatch });
    const update = { settings };
    const reshuffleKeys = ['randomizeQuestions', 'randomizeAnswers'];
    const needsReshuffle = reshuffleKeys.some((k) => Object.prototype.hasOwnProperty.call(settingsPatch, k));
    if (needsReshuffle && sess.status === QUIZ_SESSION_STATUS.LOBBY && sess.templateId) {
      const tSnap = await db.collection('quiz_templates').doc(sess.templateId).get();
      if (tSnap.exists) {
        const template = tSnap.data() || {};
        update.questions = prepareSessionQuestions(template.questions || [], settings);
      }
    } else if (needsReshuffle && sess.status !== QUIZ_SESSION_STATUS.LOBBY) {
      const err = new Error('Question/answer order can only be changed in the lobby before the game starts.');
      err.status = 400;
      throw err;
    }
    await sessionRef.update(update);
  } else if (action === 'pause') {
    await sessionRef.update({ status: 'PAUSED', pausedAt: nowIso });
  } else if (action === 'resume') {
    await sessionRef.update({
      status: QUIZ_SESSION_STATUS.QUESTION,
      questionStartedAt: nowIso,
      pausedAt: null,
    });
  } else {
    const err = new Error(`Unknown host action: ${action}`);
    err.status = 400;
    throw err;
  }

  await writeAuditLog({
    actorUid,
    actorRole,
    action: `quiz_host_${action}`,
    entityType: 'quiz_live_session',
    entityId: sessionId,
    newValue: { action, patch },
    reason: patch.reason || '',
    meta: { actorName, pin: sess.pin },
  });

  return { ok: true, action };
}
