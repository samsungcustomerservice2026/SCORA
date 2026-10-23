import {
  DEFAULT_ACADEMY_SURVEY,
  DEFAULT_SURVEY_ID,
  displaySurveyName,
  normalizeSurveyDefinition,
} from './surveyDefinitions';

/** Known academy locations / products (survey form options). */
export const SAMSUNG_ACADEMY_LOCATIONS = ['القاهرة', 'الإسكندرية', 'أسيوط', 'طنطا'];
export const ACADEMY_PRODUCTS = ['موبايل', 'تلفزيون', 'أجهزة منزلية'];

/**
 * Egypt geo pins for Samsung Academy survey reports.
 * Pins are projected from lat/lng onto the full Egypt map frame.
 */
export const SAMSUNG_ACADEMY_GEO = Object.freeze([
  {
    id: 'cairo',
    ar: 'القاهرة',
    en: 'Cairo',
    regionEn: 'Greater Cairo · Egypt',
    lat: 30.0444,
    lng: 31.2357,
  },
  {
    id: 'alexandria',
    ar: 'الإسكندرية',
    en: 'Alexandria',
    regionEn: 'North Coast · Egypt',
    lat: 31.2001,
    lng: 29.9187,
  },
  {
    id: 'tanta',
    ar: 'طنطا',
    en: 'Tanta',
    regionEn: 'Nile Delta · Egypt',
    lat: 30.7865,
    lng: 31.0004,
  },
  {
    id: 'assiut',
    ar: 'أسيوط',
    en: 'Assiut',
    regionEn: 'Upper Egypt',
    lat: 27.1809,
    lng: 31.1837,
  },
]);

const GEO_ALIASES = {
  القاهرة: 'cairo',
  القاهره: 'cairo',
  cairo: 'cairo',
  'greater cairo': 'cairo',
  الإسكندرية: 'alexandria',
  الاسكندرية: 'alexandria',
  alexandria: 'alexandria',
  alex: 'alexandria',
  أسيوط: 'assiut',
  اسيوط: 'assiut',
  assiut: 'assiut',
  asyut: 'assiut',
  طنطا: 'tanta',
  tanta: 'tanta',
};

export function resolveAcademyGeo(locationName) {
  const raw = String(locationName || '').trim();
  if (!raw) return null;
  const key = GEO_ALIASES[raw] || GEO_ALIASES[raw.toLowerCase()];
  if (key) return SAMSUNG_ACADEMY_GEO.find((g) => g.id === key) || null;
  return (
    SAMSUNG_ACADEMY_GEO.find(
      (g) => g.ar === raw || g.en.toLowerCase() === raw.toLowerCase() || g.id === raw.toLowerCase(),
    ) || null
  );
}

/** @typedef {{ dateFrom?: string, dateTo?: string, location?: string, product?: string, surveyId?: string }} SurveyFilters */

/** Rating fields on the original Samsung Academy survey (1–10 scale). */
export const SURVEY_RATING_FIELDS = [
  { key: 'contentValue', label: 'Content valuable' },
  { key: 'trainerClarity', label: 'Trainer clear & effective' },
  { key: 'needMoreSessions', label: 'Need more sessions' },
  { key: 'periodSuitable', label: 'Training period suitable' },
  { key: 'placeAccommodation', label: 'Place & accommodation' },
];

const LOCATION_FIELD = 'academyLocation';
const PRODUCT_FIELD = 'product';

/** Responses saved before multi-survey support have no surveyId — they belong to the original form. */
export function responseSurveyId(row) {
  return String(row?.surveyId || '').trim() || DEFAULT_SURVEY_ID;
}

export function responseValue(row, key) {
  const v = row?.[key] ?? row?.answers?.[key];
  return v == null ? '' : String(v).trim();
}

export function surveyRateBandEn(value) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n <= 6) return 'Dissatisfied';
  if (n <= 8) return 'Neutral';
  return 'Satisfied';
}

function parseRating(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
}

function countBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const k = keyFn(item);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function rowRatingAverage(row, ratingFields) {
  return avg(ratingFields.map((f) => parseRating(responseValue(row, f.key))).filter((n) => n != null));
}

/** Group submissions by calendar day (YYYY-MM-DD). */
function submissionsByDay(rows) {
  const map = new Map();
  for (const r of rows) {
    const day = surveyDayKey(r.createdAt);
    if (!day) continue;
    map.set(day, (map.get(day) || 0) + 1);
  }
  return [...map.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function surveyDayKey(createdAt) {
  const day = String(createdAt || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';
}

/* ── Report schema: what to chart / export, derived from survey definitions ── */

const LEGACY_DEFINITION = normalizeSurveyDefinition(DEFAULT_ACADEMY_SURVEY);

function definitionsFor(definitions, surveyId) {
  const defs = (Array.isArray(definitions) ? definitions : []).map(normalizeSurveyDefinition);
  if (!defs.some((d) => d.id === DEFAULT_SURVEY_ID)) defs.unshift({ ...LEGACY_DEFINITION, id: DEFAULT_SURVEY_ID });
  if (!surveyId || surveyId === 'ALL') return defs;
  const match = defs.find((d) => d.id === surveyId);
  return match ? [match] : [];
}

/**
 * Columns/questions for the selected survey (or the union of all surveys).
 * Responses for a deleted survey fall back to the original Academy layout.
 */
export function buildSurveyReportSchema(definitions, surveyId = 'ALL') {
  const defs = definitionsFor(definitions, surveyId);
  const source = defs.length ? defs : [LEGACY_DEFINITION];
  const profileFields = [];
  const questions = [];
  const seenFields = new Set();
  const seenQuestions = new Set();
  for (const def of source) {
    for (const f of def.profileFields || []) {
      if (seenFields.has(f.id)) continue;
      seenFields.add(f.id);
      profileFields.push(f);
    }
    for (const q of def.ratingQuestions || []) {
      if (seenQuestions.has(q.id)) continue;
      seenQuestions.add(q.id);
      questions.push({ key: q.id, label: q.label, type: q.type === 'single' ? 'single' : 'rating', options: q.options || [] });
    }
  }
  return {
    surveyId: surveyId || 'ALL',
    surveyName: surveyId && surveyId !== 'ALL' ? displaySurveyName(source[0]) : 'All surveys',
    language: source.length === 1 ? source[0].language : 'mixed',
    profileFields,
    questions,
    ratingFields: questions.filter((q) => q.type === 'rating'),
    choiceFields: questions.filter((q) => q.type === 'single'),
    selectFields: profileFields.filter((f) => f.type === 'select'),
    hasLocation: seenFields.has(LOCATION_FIELD),
    hasProduct: seenFields.has(PRODUCT_FIELD),
    notesEnabled: source.some((d) => d.notesEnabled !== false),
  };
}

const LEGACY_SCHEMA = buildSurveyReportSchema([], DEFAULT_SURVEY_ID);

/** Survey dropdown: every definition plus any survey seen only in responses (e.g. deleted). */
export function getSurveyChoices(definitions, surveys) {
  const out = new Map();
  for (const def of definitionsFor(definitions, 'ALL')) {
    out.set(def.id, { id: def.id, name: displaySurveyName(def), language: def.language, count: 0 });
  }
  for (const r of Array.isArray(surveys) ? surveys : []) {
    const id = responseSurveyId(r);
    if (!out.has(id)) out.set(id, { id, name: String(r.surveyName || id), language: r.language || '', count: 0, deleted: true });
    out.get(id).count += 1;
  }
  return [...out.values()];
}

/** Unique non-empty values from loaded surveys (plus authored form options). */
export function getSurveyFilterOptions(surveys, schema = LEGACY_SCHEMA) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const fieldOptions = (id, fallback) => {
    const f = schema.profileFields.find((x) => x.id === id);
    return f?.options?.length ? f.options : fallback;
  };
  const locSet = new Set(schema.hasLocation ? fieldOptions(LOCATION_FIELD, SAMSUNG_ACADEMY_LOCATIONS) : []);
  const prodSet = new Set(schema.hasProduct ? fieldOptions(PRODUCT_FIELD, ACADEMY_PRODUCTS) : []);
  for (const r of rows) {
    const loc = responseValue(r, LOCATION_FIELD);
    const prod = responseValue(r, PRODUCT_FIELD);
    if (loc) locSet.add(loc);
    if (prod) prodSet.add(prod);
  }
  const dates = [];
  for (const r of rows) {
    const day = surveyDayKey(r.createdAt);
    if (day) dates.push(day);
  }
  const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));

  // Prefer canonical order: Cairo first, then known list, then extras
  const ordered = [];
  for (const loc of SAMSUNG_ACADEMY_LOCATIONS) {
    if (locSet.has(loc)) {
      ordered.push(loc);
      locSet.delete(loc);
    }
  }
  ordered.push(...[...locSet].sort((a, b) => a.localeCompare(b, 'ar')));

  return {
    locations: ordered,
    products: [...prodSet],
    dates: uniqueDates,
  };
}

/** Format YYYY-MM-DD for dropdown labels (English). */
export function formatSurveyDateLabel(isoDay) {
  if (!isoDay || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay || '';
  const [y, m, d] = isoDay.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDay;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function filterSamsungAcademySurveys(surveys, filters = {}) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  const location = String(filters.location || 'ALL').trim();
  const product = String(filters.product || 'ALL').trim();
  const surveyId = String(filters.surveyId || 'ALL').trim();

  return rows.filter((r) => {
    if (surveyId && surveyId !== 'ALL' && responseSurveyId(r) !== surveyId) return false;
    const day = surveyDayKey(r.createdAt);
    if (dateFrom || dateTo) {
      if (!day) return false;
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
    }
    if (location && location !== 'ALL') {
      if (responseValue(r, LOCATION_FIELD) !== location) return false;
    }
    if (product && product !== 'ALL') {
      if (responseValue(r, PRODUCT_FIELD) !== product) return false;
    }
    return true;
  });
}

export function describeSurveyFilters(filters = {}, surveyName = '') {
  const parts = [];
  if (filters.surveyId && filters.surveyId !== 'ALL') {
    parts.push(`Survey: ${surveyName || filters.surveyId}`);
  }
  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  if (dateFrom || dateTo) {
    parts.push(
      `Date: ${dateFrom ? formatSurveyDateLabel(dateFrom) : '…'} → ${dateTo ? formatSurveyDateLabel(dateTo) : '…'}`,
    );
  }
  if (filters.location && filters.location !== 'ALL') {
    const geo = resolveAcademyGeo(filters.location);
    parts.push(`Location: ${geo ? `${geo.en} (${filters.location})` : filters.location}`);
  }
  if (filters.product && filters.product !== 'ALL') {
    parts.push(`Product: ${filters.product}`);
  }
  return parts.length ? parts.join(' | ') : 'All responses (no filters)';
}

/** Build geo pins + counts for Egypt map (always includes known cities). */
export function buildAcademyGeoBreakdown(surveys, ratingFields = SURVEY_RATING_FIELDS) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const counts = new Map();
  for (const r of rows) {
    const geo = resolveAcademyGeo(responseValue(r, LOCATION_FIELD));
    const id = geo?.id || 'other';
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const pins = SAMSUNG_ACADEMY_GEO.map((g) => {
    const cityRows = rows.filter((r) => resolveAcademyGeo(responseValue(r, LOCATION_FIELD))?.id === g.id);
    const scores = cityRows.map((r) => rowRatingAverage(r, ratingFields)).filter((n) => n != null);
    const cityAvg = avg(scores);
    return {
      ...g,
      count: counts.get(g.id) || 0,
      average: cityAvg != null ? Number(cityAvg.toFixed(2)) : null,
    };
  });

  const other = counts.get('other') || 0;
  const totalMapped = pins.reduce((s, p) => s + p.count, 0);

  return {
    country: 'Egypt',
    countryCode: 'EG',
    pins,
    other,
    totalMapped,
    total: rows.length,
  };
}

export function buildSamsungAcademySurveyAnalytics(surveys, schema = LEGACY_SCHEMA) {
  const rows = Array.isArray(surveys) ? surveys : [];
  const total = rows.length;
  const { ratingFields, choiceFields, selectFields } = schema;

  const questionStats = ratingFields.map((f) => {
    const vals = rows.map((r) => parseRating(responseValue(r, f.key))).filter((n) => n != null);
    const bands = { Dissatisfied: 0, Neutral: 0, Satisfied: 0 };
    for (const n of vals) bands[surveyRateBandEn(n)] += 1;
    const average = avg(vals);
    return {
      ...f,
      average: average != null ? Number(average.toFixed(2)) : null,
      bands,
      answered: vals.length,
    };
  });

  const choiceStats = choiceFields.map((q) => {
    const counts = new Map((q.options || []).map((o) => [o, 0]));
    let answered = 0;
    for (const r of rows) {
      const v = responseValue(r, q.key);
      if (!v) continue;
      answered += 1;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return {
      ...q,
      answered,
      options: [...counts.entries()].map(([name, count]) => ({
        name,
        count,
        share: answered ? Number(((count / answered) * 100).toFixed(1)) : 0,
      })),
    };
  });

  const overallScores = rows.map((r) => rowRatingAverage(r, ratingFields)).filter((n) => n != null);
  const overallAvg = avg(overallScores);

  const ratedRows = rows.filter((r) => ratingFields.some((f) => surveyRateBandEn(responseValue(r, f.key))));
  const satisfiedCount = ratedRows.filter((r) => {
    const bands = ratingFields.map((f) => surveyRateBandEn(responseValue(r, f.key))).filter(Boolean);
    return bands.every((b) => b === 'Satisfied');
  }).length;

  const geo = buildAcademyGeoBreakdown(rows, ratingFields);

  return {
    total,
    hasRatings: ratingFields.length > 0,
    overallAverage: overallAvg != null ? Number(overallAvg.toFixed(2)) : null,
    satisfiedRate: ratedRows.length > 0 ? Number(((satisfiedCount / ratedRows.length) * 100).toFixed(1)) : 0,
    questionStats,
    choiceStats,
    fieldBreakdowns: selectFields
      .filter((f) => f.id !== LOCATION_FIELD)
      .map((f) => ({ key: f.id, label: f.label, items: countBy(rows, (r) => responseValue(r, f.id) || 'Unknown') })),
    byLocation: countBy(rows, (r) => responseValue(r, LOCATION_FIELD) || 'Unknown'),
    byLocationEn: geo.pins
      .map((p) => ({ name: p.en, count: p.count, ar: p.ar, regionEn: p.regionEn }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count),
    geo,
    byProduct: countBy(rows, (r) => responseValue(r, PRODUCT_FIELD) || 'Unknown'),
    byCompany: countBy(rows, (r) => responseValue(r, 'company') || 'Unknown').slice(0, 12),
    byDay: submissionsByDay(rows),
    recent: rows
      .slice()
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 15),
  };
}
