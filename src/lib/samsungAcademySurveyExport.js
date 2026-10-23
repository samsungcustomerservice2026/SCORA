import * as XLSX from 'xlsx';
import {
  surveyRateBandEn,
  buildSamsungAcademySurveyAnalytics,
  buildSurveyReportSchema,
  describeSurveyFilters,
  resolveAcademyGeo,
  responseSurveyId,
  responseValue,
} from './samsungAcademySurveyAnalytics';

/** json_to_sheet keys must be unique; survey labels can repeat across forms. */
function uniqueHeader(used, label) {
  const base = String(label || '').trim() || 'Column';
  let name = base;
  let n = 2;
  while (used.has(name)) name = `${base} (${n++})`;
  used.add(name);
  return name;
}

/** Excel sheet names: ≤31 chars, no []:*?/\ and unique within the workbook. */
function sheetName(wb, label) {
  const base = String(label || 'Sheet').replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 28) || 'Sheet';
  let name = base;
  let n = 2;
  while (wb.SheetNames.includes(name)) name = `${base.slice(0, 26)} ${n++}`;
  return name;
}

function appendSheet(wb, label, rows) {
  if (!rows.length) return;
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName(wb, label));
}

function buildResponseRows(surveys, schema, surveyNames) {
  const used = new Set(['#', 'Survey']);
  const fieldCols = schema.profileFields.map((f) => ({ field: f, header: uniqueHeader(used, f.label) }));
  const geoCols = schema.hasLocation
    ? ['Location (EN)', 'Egypt Region', 'Country', 'Lat', 'Lng'].map((h) => uniqueHeader(used, h))
    : [];
  const questionCols = schema.questions.map((q) => ({
    q,
    header: uniqueHeader(used, q.label),
    bandHeader: q.type === 'rating' ? uniqueHeader(used, `${q.label} · Band`) : null,
  }));
  const avgHeader = schema.ratingFields.length ? uniqueHeader(used, `Overall Avg (${schema.ratingFields.length} Q)`) : null;
  const notesHeader = schema.notesEnabled ? uniqueHeader(used, 'Notes') : null;
  const submittedHeader = uniqueHeader(used, 'Submitted At');
  const modeHeader = uniqueHeader(used, 'Source App Mode');

  return surveys
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .map((item, idx) => {
      const row = {
        '#': idx + 1,
        Survey: surveyNames.get(responseSurveyId(item)) || item.surveyName || responseSurveyId(item),
      };
      for (const { field, header } of fieldCols) row[header] = responseValue(item, field.id);
      if (geoCols.length) {
        const geo = resolveAcademyGeo(responseValue(item, 'academyLocation'));
        [row[geoCols[0]], row[geoCols[1]], row[geoCols[2]], row[geoCols[3]], row[geoCols[4]]] = [
          geo?.en || '',
          geo?.regionEn || '',
          geo ? 'Egypt' : '',
          geo?.lat ?? '',
          geo?.lng ?? '',
        ];
      }
      const ratings = [];
      for (const { q, header, bandHeader } of questionCols) {
        const val = responseValue(item, q.key);
        row[header] = val;
        if (bandHeader) {
          row[bandHeader] = surveyRateBandEn(val) || '';
          const n = parseInt(val, 10);
          if (Number.isFinite(n)) ratings.push(n);
        }
      }
      if (avgHeader) {
        row[avgHeader] = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : '';
      }
      if (notesHeader) row[notesHeader] = item.notes || '';
      row[submittedHeader] = item.createdAt || '';
      row[modeHeader] = item.appMode || '';
      return row;
    });
}

function buildAnalysisSummaryRows(filters, analytics, totalLoaded, schema) {
  const rows = [
    { Metric: 'Export generated', Value: new Date().toISOString() },
    { Metric: 'Survey', Value: schema.surveyName },
    { Metric: 'Filters applied', Value: describeSurveyFilters(filters, schema.surveyName) },
    { Metric: 'Total in database', Value: totalLoaded },
    { Metric: 'Matching filters', Value: analytics.total },
  ];
  if (analytics.hasRatings) {
    rows.push(
      { Metric: 'Overall average score (1–10)', Value: analytics.overallAverage ?? '—' },
      { Metric: 'Fully satisfied rate (%)', Value: analytics.satisfiedRate },
      { Metric: '', Value: '' },
      { Metric: 'Rating question', Value: 'Average' },
      ...analytics.questionStats.map((q) => ({ Metric: q.label, Value: q.average ?? '—' })),
    );
  }
  if (analytics.choiceStats.length) {
    rows.push({ Metric: '', Value: '' }, { Metric: 'Single choice question', Value: 'Top answer' });
    for (const q of analytics.choiceStats) {
      const top = q.options.slice().sort((a, b) => b.count - a.count)[0];
      rows.push({ Metric: q.label, Value: top && top.count ? `${top.name} (${top.share}%)` : '—' });
    }
  }
  return rows;
}

/**
 * Build multi-sheet workbook aligned with dashboard analysis.
 * @returns {{ wb: import('xlsx').WorkBook, fileName: string, count: number }}
 */
export function buildSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded, options = {}) {
  const schema = options.schema || buildSurveyReportSchema(options.definitions, filters?.surveyId || 'ALL');
  const surveyNames = new Map((options.surveyChoices || []).map((s) => [s.id, s.name]));
  const analytics = buildSamsungAcademySurveyAnalytics(surveys, schema);
  const wb = XLSX.utils.book_new();

  appendSheet(wb, 'Analysis Summary', buildAnalysisSummaryRows(filters, analytics, totalLoaded, schema));

  appendSheet(wb, 'Rating Breakdown', analytics.questionStats.map((q) => ({
    Question: q.label,
    Average: q.average ?? '—',
    Dissatisfied: q.bands.Dissatisfied,
    Neutral: q.bands.Neutral,
    Satisfied: q.bands.Satisfied,
    Answered: q.answered,
  })));

  appendSheet(wb, 'Choice Breakdown', analytics.choiceStats.flatMap((q) => q.options.map((o) => ({
    Question: q.label,
    Answer: o.name,
    Count: o.count,
    'Share (%)': o.share,
    Answered: q.answered,
  }))));

  if (schema.hasLocation) {
    appendSheet(wb, 'By Location', analytics.byLocation.map((i) => ({ Location: i.name, Count: i.count })));
    appendSheet(wb, 'Egypt Geo', analytics.geo.pins.map((p) => ({
      Country: 'Egypt',
      City_EN: p.en,
      City_AR: p.ar,
      Region: p.regionEn,
      Lat: p.lat,
      Lng: p.lng,
      Responses: p.count,
      Avg_Score: p.average ?? '',
    })));
  }

  for (const b of analytics.fieldBreakdowns) {
    appendSheet(wb, `By ${b.label}`, b.items.map((i) => ({ [b.label]: i.name, Count: i.count })));
  }

  appendSheet(wb, 'By Date', analytics.byDay.map((d) => ({ Date: d.day, Submissions: d.count })));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildResponseRows(surveys, schema, surveyNames)), sheetName(wb, 'Responses'));

  const stamp = new Date().toISOString().slice(0, 10);
  const filterBits = [];
  if (filters.surveyId && filters.surveyId !== 'ALL') filterBits.push(String(filters.surveyId).replace(/[^\w-]+/g, '').slice(0, 24));
  if (filters.dateFrom) filterBits.push(`from-${filters.dateFrom}`);
  if (filters.dateTo) filterBits.push(`to-${filters.dateTo}`);
  if (filters.location && filters.location !== 'ALL') filterBits.push('loc');
  if (filters.product && filters.product !== 'ALL') filterBits.push('prod');
  const suffix = filterBits.filter(Boolean).length ? `_${filterBits.filter(Boolean).join('_')}` : '';
  const fileName = `samsung_academy_survey_${stamp}${suffix}.xlsx`;

  return { wb, fileName, count: surveys.length, analytics };
}

export function downloadSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded, options = {}) {
  const { wb, fileName, count, analytics } = buildSamsungAcademySurveyWorkbook(surveys, filters, totalLoaded, options);
  XLSX.writeFile(wb, fileName);
  return { fileName, count, analytics };
}
