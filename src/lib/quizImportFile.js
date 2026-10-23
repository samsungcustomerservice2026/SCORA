/**
 * Browser-side readers for quiz import files. Parsing rules live in quizImport.js.
 */
import {
  parseQuizRows,
  parseQuizText,
  multiSelectAnswerChoices,
  QUIZ_IMPORT_TEMPLATE_ROWS,
  QUIZ_IMPORT_TYPE_LABELS,
  ARABIC_ANSWER_WORD,
} from './quizImport';
import { QUIZ_TIME_PRESETS } from '../constants/quizOptionStyles';

/** An answer line that extraction glued onto the previous line. */
const INLINE_ANSWER = new RegExp(`\\s+(?=(?:correct\\s+answers?|answers?|${ARABIC_ANSWER_WORD})\\s*[:：])`, 'gi');

export const QUIZ_IMPORT_ACCEPT = '.xlsx,.xls,.csv,.docx,.pdf,.txt';
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function extensionOf(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/** PDF text often arrives as long lines; put numbered questions and lettered options on their own lines. */
function splitRunOnText(text) {
  return String(text || '')
    .replace(/\s+(?=(?:q(?:uestion)?\s*)?\d{1,3}\s*[.)]\s+\S)/gi, '\n')
    .replace(/\s+(?=\(?[A-Fa-f]\s*[).]\s+\S)/g, '\n')
    .replace(INLINE_ANSWER, '\n');
}

function parseDocumentText(text) {
  const first = parseQuizText(text);
  if (first.questions.length) return first;
  return parseQuizText(splitRunOnText(text));
}

async function readSpreadsheet(file) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const questions = [];
  const warnings = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false });
    if (!rows.length) continue;
    const result = parseQuizRows(rows);
    questions.push(...result.questions);
    const prefix = wb.SheetNames.length > 1 ? `[${name}] ` : '';
    warnings.push(...result.warnings.map((w) => prefix + w));
  }
  return { questions, warnings };
}

async function readDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser');
  const lib = mammoth.default || mammoth;
  const { value } = await lib.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return parseDocumentText(value);
}

async function readPdf(file) {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  const raw = Array.isArray(text) ? text.join('\n') : String(text || '');
  return parseDocumentText(raw.normalize('NFKC').replace(INLINE_ANSWER, '\n'));
}

/**
 * Read a quiz file and return { questions, warnings, title }.
 * Throws with a readable message for unsupported or unreadable files.
 */
export async function readQuizImportFile(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 15 MB.');
  const ext = extensionOf(file.name);
  const title = String(file.name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

  let result;
  if (['xlsx', 'xls', 'csv'].includes(ext)) result = await readSpreadsheet(file);
  else if (ext === 'docx') result = await readDocx(file);
  else if (ext === 'pdf') result = await readPdf(file);
  else if (ext === 'txt') result = parseDocumentText(await file.text());
  else if (ext === 'doc') throw new Error('Old .doc files are not supported. In Word choose File → Save As → .docx, then upload again.');
  else throw new Error('Unsupported file. Use Excel (.xlsx, .xls, .csv), Word (.docx), PDF or .txt.');

  if (!result.questions.length) {
    const hint = ext === 'pdf'
      ? ' If the PDF is a scanned image, it has no readable text — export it from Word instead.'
      : '';
    const err = new Error(`No questions were recognised in this file.${hint}`);
    err.warnings = result.warnings;
    throw err;
  }
  return { ...result, title };
}

const TEMPLATE_ROWS = 300;
const COL = { type: 'B', correct: 'I', time: 'K' };

/**
 * Build the Excel template: Type and Time are dropdowns, and the Correct
 * dropdown follows the row's Type (A–F, letter combinations, True/False,
 * or empty for Type answer / Poll).
 */
export async function buildQuizImportTemplate() {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Quiz', { views: [{ state: 'frozen', ySplit: 1 }] });
  const lists = wb.addWorksheet('Lists', { state: 'veryHidden' });

  const listColumns = [
    ['L_Single', ['A', 'B', 'C', 'D', 'E', 'F']],
    ['L_Multi', multiSelectAnswerChoices()],
    ['L_TrueFalse', ['True', 'False']],
    ['L_None', ['']],
  ];
  listColumns.forEach(([name, values], i) => {
    const letter = String.fromCharCode(65 + i);
    values.forEach((v, r) => { lists.getCell(`${letter}${r + 1}`).value = v; });
    wb.definedNames.add(`Lists!$${letter}$1:$${letter}$${values.length}`, name);
  });

  QUIZ_IMPORT_TEMPLATE_ROWS.forEach((row) => ws.addRow(row));
  ws.columns.forEach((column, i) => {
    column.width = [52, 16, 18, 18, 18, 18, 18, 18, 14, 40, 12][i] || 16;
  });
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };

  const typeList = `"${QUIZ_IMPORT_TYPE_LABELS.join(',')}"`;
  const timeList = `"${QUIZ_TIME_PRESETS.join(',')}"`;
  for (let r = 2; r <= TEMPLATE_ROWS; r += 1) {
    ws.getCell(`${COL.type}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [typeList],
      showErrorMessage: true,
      errorTitle: 'Question type',
      error: 'Pick a type from the list.',
    };
    const t = `$${COL.type}${r}`;
    ws.getCell(`${COL.correct}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`INDIRECT(IF(${t}="Single choice","L_Single",IF(${t}="Multi-select","L_Multi",IF(${t}="True / False","L_TrueFalse","L_None"))))`],
      showErrorMessage: true,
      errorTitle: 'Correct answer',
      error: 'Single choice: A–F. Multi-select: a combination such as "A, B" or All. True / False: True or False. Type answer and Poll: leave empty.',
      showInputMessage: true,
      promptTitle: 'Correct answer',
      prompt: 'Choose the Type first, then pick from this list.',
    };
    ws.getCell(`${COL.time}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [timeList],
      showErrorMessage: true,
      errorTitle: 'Time limit',
      error: 'Pick a time in seconds from the list.',
    };
  }
  return wb.xlsx.writeBuffer();
}

export async function downloadQuizImportTemplate() {
  const buffer = await buildQuizImportTemplate();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SCORA_Challenge_Quiz_Template.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
