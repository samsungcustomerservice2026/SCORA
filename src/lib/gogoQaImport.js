/**
 * Excel / CSV import for GoGo admin Q&A catalog.
 */
import {
  GOGO_QA_STATUSES,
  normalizeGoGoQaEntry,
  normalizeGoGoQaStatus,
  validateGoGoQaEntry,
} from './gogoQaCatalog';

export const GOGO_QA_IMPORT_ACCEPT = '.xlsx,.xls,.csv';
export const GOGO_QA_IMPORT_HEADERS = [
  'Question EN',
  'Question AR',
  'Answer EN',
  'Answer AR',
  'Keywords',
  'Category',
  'Status',
];

export const GOGO_QA_IMPORT_TEMPLATE_ROWS = [
  GOGO_QA_IMPORT_HEADERS,
  [
    'How do I open the TCS ladder?',
    'ازاي أفتح ترتيب TCS؟',
    'Open the TCS portal, pick your division, then use Dashboard for the ladder.',
    'افتح بوابة TCS، اختار القسم، وبعدين استخدم لوحة الترتيب.',
    'tcs, ladder, dashboard, ترتيب',
    'TCS',
    'published',
  ],
  [
    'What is PQA?',
    'إيه هو PQA؟',
    'PQA ranks partner and service-center quality. Use the PQA portal and Dashboard.',
    'PQA بيرتب جودة الشركاء ومراكز الخدمة. استخدم بوابة PQA ولوحة الترتيب.',
    'pqa, partner, quality',
    'PQA',
    'published',
  ],
];

const HEADER_ALIASES = {
  question_en: ['question en', 'question_en', 'question', 'q_en', 'q en'],
  question_ar: ['question ar', 'question_ar', 'q_ar', 'q ar'],
  answer_en: ['answer en', 'answer_en', 'answer', 'a_en', 'a en'],
  answer_ar: ['answer ar', 'answer_ar', 'a_ar', 'a ar'],
  keywords: ['keywords', 'keyword', 'tags', 'keys'],
  category: ['category', 'cat', 'topic'],
  status: ['status', 'state', 'publish'],
};

function normHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function mapHeaderRow(row) {
  const cells = (Array.isArray(row) ? row : []).map(normHeader);
  const map = {};
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const idx = cells.findIndex((c) => aliases.includes(c));
    if (idx >= 0) map[field] = idx;
  });
  return map;
}

function rowToEntry(row, map, rowNumber) {
  const get = (field) => {
    const idx = map[field];
    if (idx == null) return '';
    return row[idx];
  };
  const statusRaw = get('status');
  const status = normalizeGoGoQaStatus(statusRaw);
  const entry = normalizeGoGoQaEntry(
    {
      question_en: get('question_en'),
      question_ar: get('question_ar'),
      answer_en: get('answer_en'),
      answer_ar: get('answer_ar'),
      keywords: get('keywords'),
      category: get('category'),
      status: status || 'published',
      source: 'excel_import',
    },
    { source: 'excel_import' },
  );
  const { ok, errors } = validateGoGoQaEntry(entry);
  if (!ok) {
    return { entry: null, warning: `Row ${rowNumber}: ${errors.join(' ')}` };
  }
  if (statusRaw && !status) {
    return {
      entry: { ...entry, status: 'draft' },
      warning: `Row ${rowNumber}: unknown status "${statusRaw}" — saved as draft.`,
    };
  }
  return { entry, warning: null };
}

/**
 * Parse spreadsheet-style rows (array of arrays). First matching header row wins.
 */
export function parseGoGoQaRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const warnings = [];
  const entries = [];
  let headerIndex = -1;
  let map = null;

  for (let i = 0; i < Math.min(list.length, 20); i += 1) {
    const candidate = mapHeaderRow(list[i]);
    if (candidate.question_en != null || candidate.question_ar != null) {
      if (candidate.answer_en != null || candidate.answer_ar != null) {
        headerIndex = i;
        map = candidate;
        break;
      }
    }
  }

  if (!map) {
    return { entries: [], warnings: ['No header row found. Use Question EN / Answer EN columns.'] };
  }

  for (let i = headerIndex + 1; i < list.length; i += 1) {
    const row = list[i];
    if (!Array.isArray(row) || row.every((c) => String(c || '').trim() === '')) continue;
    const { entry, warning } = rowToEntry(row, map, i + 1);
    if (warning) warnings.push(warning);
    if (entry) entries.push(entry);
  }

  return { entries, warnings };
}

export async function readGoGoQaImportFile(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > 10 * 1024 * 1024) throw new Error('File is larger than 10 MB.');
  const name = String(file.name || '').toLowerCase();

  if (name.endsWith('.csv')) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.text(), { type: 'string' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    return parseGoGoQaRows(rows);
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const entries = [];
    const warnings = [];
    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false });
      if (!rows.length) continue;
      const result = parseGoGoQaRows(rows);
      entries.push(...result.entries);
      const prefix = wb.SheetNames.length > 1 ? `[${sheetName}] ` : '';
      warnings.push(...result.warnings.map((w) => prefix + w));
    }
    return { entries, warnings };
  }

  throw new Error('Use an Excel (.xlsx) or CSV file.');
}

export async function buildGoGoQaImportTemplate() {
  const ExcelJS = await import('exceljs');
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const wb = new Workbook();
  const sheet = wb.addWorksheet('GoGo Q&A');
  sheet.addRows(GOGO_QA_IMPORT_TEMPLATE_ROWS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = GOGO_QA_IMPORT_HEADERS.map(() => ({ width: 28 }));

  // Status dropdown for template rows.
  for (let r = 2; r <= 300; r += 1) {
    sheet.getCell(r, 7).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${GOGO_QA_STATUSES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Status',
      error: 'Pick published, draft, or disabled.',
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

export async function downloadGoGoQaImportTemplate() {
  const buffer = await buildGoGoQaImportTemplate();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gogo-qa-template.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
