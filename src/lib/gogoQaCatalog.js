/**
 * GoGo admin Q&A catalog helpers — normalize, match published answers, statuses.
 */
import { normalizeGoGoQuestion, scoreQuestionOverlap } from './gogoLearning';

export const GOGO_QA_STATUSES = ['published', 'draft', 'disabled'];

export const GOGO_QA_STATUS_LABELS = {
  published: 'Published',
  draft: 'Draft',
  disabled: 'Disabled',
};

export function normalizeGoGoQaStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'draft') return 'draft';
  if (raw === 'disabled' || raw === 'off' || raw === 'inactive') return 'disabled';
  if (raw === 'published' || raw === 'live' || raw === 'active' || raw === '') return 'published';
  return null;
}

export function parseGoGoQaKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((k) => String(k || '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  return String(value || '')
    .split(/[|;,]/)
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export function normalizeGoGoQaEntry(raw = {}, { actor = '', source = 'admin' } = {}) {
  const question_en = String(raw.question_en || raw.question || '').trim().slice(0, 500);
  const question_ar = String(raw.question_ar || '').trim().slice(0, 500);
  const answer_en = String(raw.answer_en || raw.answer || '').trim().slice(0, 4000);
  const answer_ar = String(raw.answer_ar || '').trim().slice(0, 4000);
  const status = normalizeGoGoQaStatus(raw.status) || 'published';
  const category = String(raw.category || 'General').trim().slice(0, 80) || 'General';
  const keywords = parseGoGoQaKeywords(raw.keywords);
  const priority = Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 100;
  const id = String(raw.id || '').trim() || undefined;
  const now = new Date().toISOString();

  return {
    ...(id ? { id } : {}),
    question_en,
    question_ar,
    answer_en,
    answer_ar,
    keywords,
    category,
    status,
    priority,
    source: String(raw.source || source || 'admin').slice(0, 40),
    updatedAt: now,
    updatedBy: String(actor || raw.updatedBy || '').slice(0, 80),
    createdAt: raw.createdAt || now,
  };
}

export function validateGoGoQaEntry(entry) {
  const errors = [];
  if (!entry?.question_en && !entry?.question_ar) {
    errors.push('Add a question in English or Arabic.');
  }
  if (!entry?.answer_en && !entry?.answer_ar) {
    errors.push('Add an answer in English or Arabic.');
  }
  if (!normalizeGoGoQaStatus(entry?.status)) {
    errors.push('Status must be published, draft, or disabled.');
  }
  return { ok: errors.length === 0, errors };
}

export function isPublishedGoGoQa(entry) {
  const status = normalizeGoGoQaStatus(entry?.status);
  return status === 'published' || status === null;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sentence / phrase similarity (not only exact question text). */
export function scoreAdminQaPhrase(question, candidate) {
  const q = normalizeGoGoQuestion(question);
  const c = normalizeGoGoQuestion(candidate);
  if (!q || !c) return 0;
  let score = scoreQuestionOverlap(q, c);
  if (q === c) return 1;
  // Contained phrase: "scora app" inside "what is the scora app"
  if (c.length >= 3 && (q.includes(c) || c.includes(q))) {
    score = Math.max(score, 0.88);
  }
  return score;
}

/** Keyword / short-intent hit: "scora", "tcs", "pqa ladder", etc. */
export function scoreAdminQaKeyword(question, keyword) {
  const q = normalizeGoGoQuestion(question);
  const k = normalizeGoGoQuestion(keyword);
  if (!q || !k || k.length < 2) return 0;
  if (q === k) return 1;
  const wordRe = new RegExp(`(?:^|\\s)${escapeRegExp(k)}(?:\\s|$)`, 'i');
  if (wordRe.test(q)) return k.length <= 5 ? 0.92 : 0.96;
  if (k.length >= 4 && q.includes(k)) return 0.86;
  return scoreQuestionOverlap(q, k);
}

/**
 * Best published catalog hit for free-text / chip labels.
 * Matches full sentences, partial phrases, and keywords — not only the exact question.
 */
export function matchAdminQaAnswer(entries, question, lang = 'en') {
  const list = Array.isArray(entries) ? entries : [];
  const L = lang === 'ar' ? 'ar' : 'en';
  const qNorm = normalizeGoGoQuestion(question);
  if (!qNorm) return null;

  let best = null;
  let bestScore = 0;
  let bestPriority = -Infinity;
  let bestKeywordHit = false;

  for (const row of list) {
    if (!isPublishedGoGoQa(row)) continue;
    const questions = [row.question_en, row.question_ar, row.question].filter(Boolean).map(String);
    const keywords = Array.isArray(row.keywords) ? row.keywords.map(String) : [];

    let score = 0;
    questions.forEach((c) => {
      score = Math.max(score, scoreAdminQaPhrase(qNorm, c));
    });

    let keywordHit = false;
    let keywordScore = 0;
    keywords.forEach((k) => {
      const ks = scoreAdminQaKeyword(qNorm, k);
      if (ks >= 0.86) keywordHit = true;
      keywordScore = Math.max(keywordScore, ks);
    });
    score = Math.max(score, keywordScore);

    // Short user text like "scora" / "scora app": if every token hits question or keywords, boost.
    const qTokens = qNorm.split(' ').filter((t) => t.length >= 2);
    if (qTokens.length > 0 && qTokens.length <= 4) {
      const pool = new Set();
      questions.forEach((c) => {
        normalizeGoGoQuestion(c)
          .split(' ')
          .filter((t) => t.length >= 2)
          .forEach((t) => pool.add(t));
      });
      keywords.forEach((k) => {
        normalizeGoGoQuestion(k)
          .split(' ')
          .filter((t) => t.length >= 2)
          .forEach((t) => pool.add(t));
      });
      const covered = qTokens.filter((t) => pool.has(t)).length;
      if (covered === qTokens.length) {
        score = Math.max(score, 0.9);
        keywordHit = true;
      } else if (covered > 0 && covered / qTokens.length >= 0.5) {
        score = Math.max(score, 0.72);
      }
    }

    const priority = Number.isFinite(Number(row.priority)) ? Number(row.priority) : 100;
    if (score > bestScore || (score === bestScore && score > 0 && priority > bestPriority)) {
      bestScore = score;
      bestPriority = priority;
      best = row;
      bestKeywordHit = keywordHit;
    }
  }

  const threshold = bestKeywordHit ? 0.45 : 0.55;
  if (!best || bestScore < threshold) return null;

  const answer =
    L === 'ar'
      ? String(best.answer_ar || best.answer_en || best.answer || '').trim()
      : String(best.answer_en || best.answer_ar || best.answer || '').trim();
  if (!answer) return null;

  return {
    entry: best,
    answer,
    matchScore: bestScore,
    priority: bestPriority,
  };
}

export function goGoQaMergeKey(entry) {
  const en = normalizeGoGoQuestion(entry?.question_en || entry?.question || '');
  if (en) return `en:${en}`;
  const ar = normalizeGoGoQuestion(entry?.question_ar || '');
  if (ar) return `ar:${ar}`;
  return '';
}
