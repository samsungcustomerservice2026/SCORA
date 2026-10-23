import { QUIZ_DEFAULT_TIME_SEC, QUIZ_QUESTION_TYPES, DEFAULT_QUIZ_SETTINGS } from '../constants/quiz';

export { DEFAULT_QUIZ_SETTINGS };

export const SCORA_CHALLENGE_NAME = 'SCORA Challenge';
export const SCORA_CHALLENGE_NAME_AR = 'تحدي SCORA';

export function normalizeQuizSettings(raw = {}) {
  return {
    ...DEFAULT_QUIZ_SETTINGS,
    ...raw,
    defaultTimeSec: Math.min(120, Math.max(5, parseInt(raw.defaultTimeSec, 10) || QUIZ_DEFAULT_TIME_SEC)),
    revealDelaySec: Math.min(30, Math.max(2, parseInt(raw.revealDelaySec, 10) || 5)),
    showQuestionsOnDevices: raw.showQuestionsOnDevices !== false,
    showCorrectAnswers: raw.showCorrectAnswers !== false,
    reactions: raw.reactions !== false,
    highContrast: !!raw.highContrast,
    unlimitedTime: !!raw.unlimitedTime,
    nicknameGenerator: !!raw.nicknameGenerator,
    twoStepJoin: !!raw.twoStepJoin,
    autoRevealWhenAllAnswered: raw.autoRevealWhenAllAnswered !== false,
    autoPlay: raw.autoPlay !== false,
    randomizeQuestions: !!raw.randomizeQuestions,
    randomizeAnswers: raw.randomizeAnswers !== false,
    defaultLanguage: ['en', 'ar', 'both'].includes(raw.defaultLanguage) ? raw.defaultLanguage : 'en',
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Question text/options may be written in either the EN or AR field (or both).
 * These helpers always return whichever language has content, preferring the
 * requested language, so text is never invisible on any screen.
 */
export function getQuestionPrompt(question, lang = 'en') {
  if (!question) return '';
  const en = String(question.prompt || '').trim();
  const ar = String(question.promptAr || '').trim();
  return lang === 'ar' ? (ar || en) : (en || ar);
}

export function getQuestionOptions(question, lang = 'en') {
  if (!question) return [];
  const len = Math.max(question.options?.length || 0, question.optionsAr?.length || 0);
  return Array.from({ length: len }, (_, i) => {
    const en = String(question.options?.[i] || '').trim();
    const ar = String(question.optionsAr?.[i] || '').trim();
    return lang === 'ar' ? (ar || en) : (en || ar);
  });
}

// An option slot counts as filled when either language has text.
function getFilledOptionIndices(q) {
  const len = Math.max(q.options?.length || 0, q.optionsAr?.length || 0);
  return Array.from({ length: len }, (_, i) => i)
    .filter((i) => String(q.options?.[i] || '').trim() || String(q.optionsAr?.[i] || '').trim());
}

function shuffleOptionsForQuestion(q) {
  const indices = getFilledOptionIndices(q);
  if (!indices.length) return { ...q };

  const shuffled = shuffleArray(indices);
  const newOptions = shuffled.map((i) => q.options?.[i] || q.optionsAr?.[i] || '');
  const newOptionsAr = shuffled.map((i) => q.optionsAr?.[i] || q.options?.[i] || '');

  if (q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    const newCorrectIndices = (q.correctIndices || [])
      .map((ci) => shuffled.indexOf(ci))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    return { ...q, options: newOptions, optionsAr: newOptionsAr, correctIndices: newCorrectIndices };
  }

  const newCorrectIndex = Math.max(0, shuffled.indexOf(q.correctIndex ?? 0));
  return { ...q, options: newOptions, optionsAr: newOptionsAr, correctIndex: newCorrectIndex };
}

export function prepareSessionQuestions(questions, settings) {
  const s = normalizeQuizSettings(settings);
  let ordered = [...(questions || [])];

  if (s.randomizeQuestions) ordered = shuffleArray(ordered);

  if (s.randomizeAnswers) {
    ordered = ordered.map((q) => {
      if (q.type === QUIZ_QUESTION_TYPES.CHOICE || q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
        return shuffleOptionsForQuestion(q);
      }
      if (q.type === QUIZ_QUESTION_TYPES.POLL) {
        return shuffleOptionsForQuestion({ ...q, correctIndex: 0, correctIndices: [] });
      }
      return { ...q };
    });
  }

  return ordered.map((q) => ({
    ...q,
    timeLimitSec: q.timeLimitSec || s.defaultTimeSec,
  }));
}

export function getQuestionTimeLimit(session, question) {
  const settings = normalizeQuizSettings(session?.settings);
  return question?.timeLimitSec || settings.defaultTimeSec;
}

export function getTimerRemainingMs(session, question) {
  if (!session?.questionStartedAt) return null;
  const limitMs = getQuestionTimeLimit(session, question) * 1000;
  const elapsed = Date.now() - new Date(session.questionStartedAt).getTime();
  return Math.max(0, limitMs - elapsed);
}

export function buildRankMap(players) {
  const map = {};
  (players || []).forEach((p, i) => { map[p.id] = i + 1; });
  return map;
}

export function playersWithRankDelta(players, prevRanks = {}) {
  return (players || []).map((p, i) => {
    const rank = i + 1;
    const prev = prevRanks[p.id];
    const rankDelta = prev != null ? prev - rank : 0;
    return { ...p, rank, rankDelta };
  });
}

export function getCorrectAnswerLabel(question, lang = 'en') {
  if (!question) return '—';
  if (question.type === QUIZ_QUESTION_TYPES.POLL) {
    return lang === 'ar' ? 'استطلاع' : 'Poll';
  }
  if (question.type === QUIZ_QUESTION_TYPES.TRUE_FALSE) {
    const isTrue = (question.correctIndex ?? 0) === 0;
    return lang === 'ar' ? (isTrue ? 'صح' : 'خطأ') : (isTrue ? 'True' : 'False');
  }
  if (question.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER) {
    const answers = [...(question.acceptedAnswers || []), ...(question.acceptedAnswersAr || [])].filter(Boolean);
    return answers[0] || '—';
  }
  const opts = getQuestionOptions(question, lang);
  if (question.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    const labels = (question.correctIndices || []).map((i) => opts?.[i]).filter(Boolean);
    return labels.length ? labels.join(', ') : '—';
  }
  return opts?.[question.correctIndex ?? 0] || '—';
}
