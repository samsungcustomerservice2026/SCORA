/**
 * Turns quiz questions written in a spreadsheet or a document into SCORA
 * Challenge questions. Pure functions — file reading lives in quizImportFile.js.
 *
 * Document format (Word / PDF / text), one block per question:
 *   1. Question text
 *   A) option        (or a. / (a) / أ) …)
 *   B) option *      (*, ✓ or "(correct)" marks a correct option)
 *   Answer: B        (letters, numbers, option text, True/False; "A, C" = multi-select)
 *   Time: 30         (optional, seconds)
 */
import { QUIZ_QUESTION_TYPES, QUIZ_DEFAULT_TIME_SEC, EMPTY_QUIZ_QUESTION } from '../constants/quiz';
import { QUIZ_MAX_OPTIONS, QUIZ_TIME_PRESETS } from '../constants/quizOptionStyles';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ARABIC_OPTION_LETTERS = { 'أ': 0, 'ا': 0, 'ب': 1, 'ج': 2, 'د': 3, 'ه': 4, 'هـ': 4, 'و': 5 };
const LATIN_OPTION_LETTERS = 'abcdef';

const ALL_ANSWER_WORDS = new Set(['all', 'all of them', 'all of the above', 'الكل', 'كل ما سبق', 'جميع ما سبق']);
const TRUE_WORDS = new Set(['true', 't', 'yes', 'صح', 'صحيح', 'نعم']);
const FALSE_WORDS = new Set(['false', 'f', 'no', 'خطأ', 'خطا', 'غلط', 'لا']);

const CORRECT_MARK = /\s*(?:\*+|✓|✔|☑|\((?:correct|right|صح|صحيح)\)|\[(?:correct|x)\])\s*/i;

const QUESTION_LINE = /^(?:(?:q(?:uestion)?|س(?:ؤال)?)\s*)?(\d{1,3})\s*[).:\-–]\s*(.+)$/i;
const QUESTION_LABEL_LINE = /^(?:q(?:uestion)?|س(?:ؤال)?)\s*(\d{1,3})?\s*[:\-–]\s*(.+)$/i;
const OPTION_LINE = /^(?:\(\s*([a-f]|أ|ا|ب|ج|د|هـ|ه|و)\s*\)|([a-f]|أ|ا|ب|ج|د|هـ|ه|و)\s*[).:\-–])\s*(.+)$/i;
const BULLET_LINE = /^[•●○▪■\-–]\s+(.+)$/;
// PDF extraction can reorder the lam-alef ligature, so "الإجابة" may arrive as "اإلجابة".
export const ARABIC_ANSWER_WORD = '(?:الإجابة|الاجابة|اإلجابة|االجابة)';
export const ANSWER_KEYWORD_SOURCE = `(?:correct\\s+answers?|right\\s+answers?|answers?|correct|ans|key|${ARABIC_ANSWER_WORD}(?:\\s+الصحيحة)?|الحل)`;
const ANSWER_LINE = new RegExp(`^${ANSWER_KEYWORD_SOURCE}\\s*[:\\-–=]\\s*(.+)$`, 'i');
const TIME_LINE = /^(?:time(?:\s*limit)?|timer|seconds|الوقت|الزمن)\s*[:\-–=]\s*(\d{1,3})/i;
const TYPE_LINE = /^(?:type|question\s+type|النوع)\s*[:\-–=]\s*(.+)$/i;

export function normalizeDigits(text) {
  return String(text ?? '').replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

function clean(text) {
  return normalizeDigits(text).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function snapTime(raw) {
  const sec = parseInt(normalizeDigits(raw), 10);
  if (!Number.isFinite(sec) || sec <= 0) return QUIZ_DEFAULT_TIME_SEC;
  return QUIZ_TIME_PRESETS.reduce((best, p) => (Math.abs(p - sec) < Math.abs(best - sec) ? p : best), QUIZ_TIME_PRESETS[0]);
}

function parseTypeHint(raw) {
  const t = clean(raw).toLowerCase();
  if (!t) return null;
  if (/multi|multiple|checkbox|متعدد/.test(t)) return QUIZ_QUESTION_TYPES.MULTI_CHOICE;
  if (/true|t\/f|tf|صح|صواب/.test(t)) return QUIZ_QUESTION_TYPES.TRUE_FALSE;
  if (/type|text|open|written|short|كتاب|مقالي/.test(t)) return QUIZ_QUESTION_TYPES.TYPE_ANSWER;
  if (/poll|survey|استطلاع/.test(t)) return QUIZ_QUESTION_TYPES.POLL;
  if (/single|choice|mcq|اختيار/.test(t)) return QUIZ_QUESTION_TYPES.CHOICE;
  return null;
}

function stripCorrectMark(text) {
  const raw = String(text ?? '');
  if (!CORRECT_MARK.test(raw)) return { text: clean(raw), marked: false };
  return { text: clean(raw.replace(CORRECT_MARK, ' ')), marked: true };
}

function tfIndex(token) {
  const t = clean(token).toLowerCase();
  if (TRUE_WORDS.has(t)) return 0;
  if (FALSE_WORDS.has(t)) return 1;
  return null;
}

function isTrueFalsePair(options) {
  return options.length === 2 && tfIndex(options[0]) === 0 && tfIndex(options[1]) === 1;
}

/** Map an answer cell / line to option indexes. */
export function resolveCorrectIndices(raw, options) {
  const text = clean(raw);
  if (!text) return [];
  const lowerOptions = options.map((o) => clean(o).toLowerCase());
  const whole = lowerOptions.indexOf(text.toLowerCase());
  if (whole >= 0) return [whole];
  if (ALL_ANSWER_WORDS.has(text.toLowerCase())) return options.map((_, i) => i);
  const lettered = text.match(/^\(?\s*([a-f]|أ|ا|ب|ج|د|هـ|ه|و)\s*[).:\-–]\s+\S/i);
  if (lettered) {
    const key = lettered[1].toLowerCase();
    const idx = key in ARABIC_OPTION_LETTERS ? ARABIC_OPTION_LETTERS[key] : LATIN_OPTION_LETTERS.indexOf(key);
    if (idx >= 0 && idx < options.length) return [idx];
  }

  const out = new Set();
  for (const part of text.split(/\s*[,;|،/&]\s*|\s+and\s+|\s+و\s+/i)) {
    const token = clean(part).replace(/^[([]|[)\].:]$/g, '').trim();
    if (!token) continue;
    const lower = token.toLowerCase();
    const byText = lowerOptions.indexOf(lower);
    if (byText >= 0) { out.add(byText); continue; }
    if (lower.length === 1 && LATIN_OPTION_LETTERS.includes(lower)) {
      const idx = LATIN_OPTION_LETTERS.indexOf(lower);
      if (idx < options.length) out.add(idx);
      continue;
    }
    if (token in ARABIC_OPTION_LETTERS) {
      const idx = ARABIC_OPTION_LETTERS[token];
      if (idx < options.length) out.add(idx);
      continue;
    }
    if (/^\d{1,2}$/.test(token)) {
      const idx = parseInt(token, 10) - 1;
      if (idx >= 0 && idx < options.length) out.add(idx);
    }
  }
  return [...out].sort((a, b) => a - b);
}

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `q-${Date.now()}-${idCounter}`;
}

/**
 * Build one quiz question from loosely structured parts.
 * Returns { question } or { error } (with a reason the admin can act on).
 */
export function buildQuizQuestion({ prompt, options = [], markedIndices = [], answer = '', type = '', time = '' }, label) {
  const promptText = clean(prompt);
  if (!promptText) return { error: `${label}: question text is empty — skipped.` };

  const notes = [];
  let opts = options.map(clean).filter(Boolean);
  if (opts.length > QUIZ_MAX_OPTIONS) {
    notes.push(`${label}: only the first ${QUIZ_MAX_OPTIONS} options were kept.`);
    opts = opts.slice(0, QUIZ_MAX_OPTIONS);
  }
  const hint = parseTypeHint(type);
  const timeLimitSec = time ? snapTime(time) : QUIZ_DEFAULT_TIME_SEC;
  const base = {
    ...EMPTY_QUIZ_QUESTION,
    id: newId(),
    prompt: promptText,
    promptAr: '',
    timeLimitSec,
    correctIndices: [],
    acceptedAnswers: [],
    acceptedAnswersAr: [],
  };

  const answerText = clean(answer);
  const tfFromAnswer = tfIndex(answerText);
  const looksTrueFalse =
    hint === QUIZ_QUESTION_TYPES.TRUE_FALSE ||
    isTrueFalsePair(opts) ||
    (!opts.length && tfFromAnswer !== null && hint !== QUIZ_QUESTION_TYPES.TYPE_ANSWER);

  if (looksTrueFalse) {
    let correctIndex = tfFromAnswer;
    if (correctIndex === null && opts.length) {
      const idx = resolveCorrectIndices(answerText, opts)[0] ?? markedIndices[0];
      if (idx !== undefined) correctIndex = tfIndex(opts[idx]) ?? idx;
    }
    if (correctIndex === null || correctIndex === undefined) {
      notes.push(`${label}: no True/False answer given — set to True, please check.`);
      correctIndex = 0;
    }
    return {
      question: { ...base, type: QUIZ_QUESTION_TYPES.TRUE_FALSE, options: ['', '', '', ''], optionsAr: ['', '', '', ''], correctIndex: correctIndex === 1 ? 1 : 0 },
      notes,
    };
  }

  if (!opts.length || hint === QUIZ_QUESTION_TYPES.TYPE_ANSWER) {
    const accepted = answerText.split(/\s*[|,;،]\s*/).map(clean).filter(Boolean);
    if (!accepted.length) return { error: `${label}: no options and no answer — skipped.` };
    return {
      question: { ...base, type: QUIZ_QUESTION_TYPES.TYPE_ANSWER, options: ['', '', '', ''], optionsAr: ['', '', '', ''], acceptedAnswers: accepted, correctIndex: 0 },
      notes,
    };
  }

  if (opts.length < 2) return { error: `${label}: needs at least 2 options — skipped.` };

  const optionsAr = opts.map(() => '');
  if (hint === QUIZ_QUESTION_TYPES.POLL) {
    return { question: { ...base, type: QUIZ_QUESTION_TYPES.POLL, options: opts, optionsAr, correctIndex: 0 }, notes };
  }

  const fromAnswer = resolveCorrectIndices(answerText, opts);
  if (answerText && !fromAnswer.length) notes.push(`${label}: answer "${answerText}" did not match any option.`);
  const correct = [...new Set([...fromAnswer, ...markedIndices.filter((i) => i < opts.length)])].sort((a, b) => a - b);

  if (!correct.length) {
    notes.push(`${label}: no correct answer marked — set to option A, please check.`);
    return { question: { ...base, type: QUIZ_QUESTION_TYPES.CHOICE, options: opts, optionsAr, correctIndex: 0 }, notes };
  }
  if (correct.length > 1 || hint === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    return {
      question: { ...base, type: QUIZ_QUESTION_TYPES.MULTI_CHOICE, options: opts, optionsAr, correctIndex: correct[0], correctIndices: correct },
      notes,
    };
  }
  return { question: { ...base, type: QUIZ_QUESTION_TYPES.CHOICE, options: opts, optionsAr, correctIndex: correct[0] }, notes };
}

function collect(drafts) {
  const questions = [];
  const warnings = [];
  drafts.forEach((draft, i) => {
    const { question, error, notes = [] } = buildQuizQuestion(draft, draft.label || `Question ${i + 1}`);
    if (error) warnings.push(error);
    if (question) questions.push(question);
    warnings.push(...notes);
  });
  return { questions, warnings };
}

/** Parse plain text extracted from Word / PDF / .txt. */
export function parseQuizText(text) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((l) => clean(l))
    .filter(Boolean);

  const drafts = [];
  let current = null;
  const start = (promptText, number) => {
    current = { prompt: promptText, options: [], markedIndices: [], answer: '', type: '', time: '', label: `Question ${number || drafts.length + 1}` };
    drafts.push(current);
  };
  const addOption = (raw) => {
    const { text: optText, marked } = stripCorrectMark(raw);
    if (!optText) return;
    if (marked) current.markedIndices.push(current.options.length);
    current.options.push(optText);
  };

  for (const line of lines) {
    const answer = line.match(ANSWER_LINE);
    if (answer && current) { current.answer = answer[1]; continue; }
    const time = line.match(TIME_LINE);
    if (time && current) { current.time = time[1]; continue; }
    const type = line.match(TYPE_LINE);
    if (type && current) { current.type = type[1]; continue; }

    const option = line.match(OPTION_LINE);
    if (option && current) {
      addOption(option[3]);
      continue;
    }
    const question = line.match(QUESTION_LINE) || line.match(QUESTION_LABEL_LINE);
    if (question) { start(question[2], question[1]); continue; }

    const bullet = line.match(BULLET_LINE);
    if (bullet && current) { addOption(bullet[1]); continue; }

    if (!current) continue;
    if (current.options.length) {
      const last = current.options.length - 1;
      const { text: extra, marked } = stripCorrectMark(line);
      current.options[last] = clean(`${current.options[last]} ${extra}`);
      if (marked && !current.markedIndices.includes(last)) current.markedIndices.push(last);
    } else if (!current.answer) {
      current.prompt = clean(`${current.prompt} ${line}`);
    }
  }
  return collect(drafts);
}

const HEADER_PATTERNS = {
  prompt: /^(question|questions|q|prompt|السؤال|الأسئلة|سؤال)( text)?$/i,
  option: /^(?:option|choice|answer|ans|خيار|اختيار)\s*([1-6a-f])$|^([a-f])$/i,
  accepted: /^(accepted|typed answers?|written answers?|الإجابات المقبولة)/i,
  answer: /^(correct|correct answers?|right answers?|answers?|key|الإجابة|الاجابة|الإجابة الصحيحة|الاجابة الصحيحة|الحل)$/i,
  type: /^(type|question type|النوع)$/i,
  time: /^(time|timer|seconds|sec|الوقت|الزمن)/i,
};

function headerMap(row) {
  const map = { prompt: -1, answer: -1, accepted: -1, type: -1, time: -1, options: [] };
  row.forEach((cell, col) => {
    const h = clean(cell).toLowerCase().replace(/[()]/g, '').replace(/\s*#\s*/, ' ');
    if (!h) return;
    const opt = h.match(HEADER_PATTERNS.option);
    if (opt) {
      const key = (opt[1] || opt[2]).toLowerCase();
      const order = /\d/.test(key) ? parseInt(key, 10) - 1 : LATIN_OPTION_LETTERS.indexOf(key);
      map.options.push({ col, order });
      return;
    }
    if (map.prompt < 0 && HEADER_PATTERNS.prompt.test(h)) map.prompt = col;
    else if (map.accepted < 0 && HEADER_PATTERNS.accepted.test(h)) map.accepted = col;
    else if (map.answer < 0 && HEADER_PATTERNS.answer.test(h)) map.answer = col;
    else if (map.type < 0 && HEADER_PATTERNS.type.test(h)) map.type = col;
    else if (map.time < 0 && HEADER_PATTERNS.time.test(h)) map.time = col;
  });
  map.options.sort((a, b) => a.order - b.order);
  return map;
}

/**
 * Parse spreadsheet rows (array of arrays). Looks for a header row with a
 * "Question" column; sheets without one are read as document text instead.
 */
export function parseQuizRows(rows) {
  const table = (rows || []).map((r) => (Array.isArray(r) ? r : []));
  const headerIndex = table.findIndex((r) => r.some((c) => HEADER_PATTERNS.prompt.test(clean(c))));
  if (headerIndex < 0) {
    return parseQuizText(table.map((r) => r.map(clean).filter(Boolean).join(' ')).join('\n'));
  }
  const map = headerMap(table[headerIndex]);
  const drafts = [];
  table.slice(headerIndex + 1).forEach((row, i) => {
    const cell = (col) => (col >= 0 ? row[col] : '');
    const prompt = clean(cell(map.prompt));
    if (!prompt && !map.options.some(({ col }) => clean(row[col]))) return;
    const markedIndices = [];
    const options = [];
    map.options.forEach(({ col }) => {
      const { text: optText, marked } = stripCorrectMark(row[col]);
      if (!optText) return;
      if (marked) markedIndices.push(options.length);
      options.push(optText);
    });
    const typed = parseTypeHint(cell(map.type)) === QUIZ_QUESTION_TYPES.TYPE_ANSWER || !options.length;
    const correct = clean(cell(map.answer));
    const accepted = clean(cell(map.accepted));
    drafts.push({
      prompt,
      options,
      markedIndices,
      answer: typed ? accepted || correct : correct,
      type: cell(map.type),
      time: cell(map.time),
      label: `Row ${headerIndex + i + 2}`,
    });
  });
  return collect(drafts);
}

/** Labels offered in the template's Type dropdown (each maps through parseTypeHint). */
export const QUIZ_IMPORT_TYPE_LABELS = ['Single choice', 'Multi-select', 'True / False', 'Type answer', 'Poll'];

/** Every combination of two or more option letters, smallest first, then "All". */
export function multiSelectAnswerChoices(letters = 'ABCDEF') {
  const chars = letters.split('');
  const combos = [];
  for (let mask = 1; mask < 1 << chars.length; mask += 1) {
    const picked = chars.filter((_, i) => mask & (1 << i));
    if (picked.length >= 2) combos.push(picked);
  }
  combos.sort((a, b) => a.length - b.length || a.join('').localeCompare(b.join('')));
  return [...combos.map((c) => c.join(', ')), 'All'];
}

/** Header + example rows for the downloadable Excel template. */
export const QUIZ_IMPORT_TEMPLATE_ROWS = [
  ['Question', 'Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F', 'Correct', 'Accepted answers (Type answer only)', 'Time (sec)'],
  ['Which Galaxy series has the S Pen built in?', 'Single choice', 'Galaxy A', 'Galaxy S Ultra', 'Galaxy M', 'Galaxy F', '', '', 'B', '', 20],
  ['Which of these are Samsung apps?', 'Multi-select', 'Samsung Health', 'Bixby', 'Siri', 'SmartThings', '', '', 'A, B, D', '', 30],
  ['One UI is Samsung\'s Android interface.', 'True / False', '', '', '', '', '', '', 'True', '', 10],
  ['What does "OLED" stand for?', 'Type answer', '', '', '', '', '', '', '', 'Organic Light Emitting Diode | Organic LED', 30],
  ['Which product line do you service most?', 'Poll', 'MX', 'DA', 'AV', '', '', '', '', '', 20],
];
