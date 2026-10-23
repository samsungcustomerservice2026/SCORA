import { describe, it, expect } from 'vitest';
import {
  parseQuizText,
  parseQuizRows,
  resolveCorrectIndices,
  multiSelectAnswerChoices,
  QUIZ_IMPORT_TEMPLATE_ROWS,
} from '../src/lib/quizImport.js';
import { buildQuizImportTemplate } from '../src/lib/quizImportFile.js';

describe('quiz import — document text', () => {
  it('reads numbered questions, lettered options and answer lines', () => {
    const { questions, warnings } = parseQuizText(`
      1. Which series has the S Pen built in?
      A) Galaxy A
      B) Galaxy S Ultra
      C) Galaxy M
      Answer: B

      2) Which are Samsung apps?
      a. Samsung Health
      b. Siri
      c. SmartThings
      Correct answer: A, C
      Time: 30
    `);
    expect(warnings).toEqual([]);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ type: 'choice', prompt: 'Which series has the S Pen built in?', correctIndex: 1 });
    expect(questions[0].options).toEqual(['Galaxy A', 'Galaxy S Ultra', 'Galaxy M']);
    expect(questions[1]).toMatchObject({ type: 'multi_choice', correctIndices: [0, 2], timeLimitSec: 30 });
  });

  it('accepts * marks, true/false and typed answers', () => {
    const { questions } = parseQuizText(`
      Q1: One UI is Samsung's Android interface.
      Answer: True
      Q2: Pick the foldable
      A) Galaxy Z Fold *
      B) Galaxy A15
      Q3: What does OLED stand for?
      Answer: Organic Light Emitting Diode | Organic LED
    `);
    expect(questions.map((q) => q.type)).toEqual(['true_false', 'choice', 'type_answer']);
    expect(questions[0].correctIndex).toBe(0);
    expect(questions[1].correctIndex).toBe(0);
    expect(questions[1].options[0]).toBe('Galaxy Z Fold');
    expect(questions[2].acceptedAnswers).toEqual(['Organic Light Emitting Diode', 'Organic LED']);
  });

  it('reads Arabic questions with Arabic letters and digits', () => {
    const { questions } = parseQuizText(`
      ١- ما هي الشاشة المستخدمة في هواتف جالاكسي؟
      أ) LCD
      ب) AMOLED
      الإجابة: ب
    `);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ type: 'choice', correctIndex: 1 });
  });

  it('accepts the answer word as PDF extraction reorders it', () => {
    const { questions } = parseQuizText('1. سؤال؟\nأ) LCD\nب) AMOLED\nاإلجابة: ب');
    expect(questions[0].correctIndex).toBe(1);
  });

  it('warns when no correct answer is marked', () => {
    const { questions, warnings } = parseQuizText('1. Q?\nA) x\nB) y');
    expect(questions[0].correctIndex).toBe(0);
    expect(warnings[0]).toMatch(/no correct answer/);
  });
});

describe('quiz import — spreadsheet rows', () => {
  it('reads the downloadable template', () => {
    const { questions, warnings } = parseQuizRows(QUIZ_IMPORT_TEMPLATE_ROWS);
    expect(warnings).toEqual([]);
    expect(questions.map((q) => q.type)).toEqual(['choice', 'multi_choice', 'true_false', 'type_answer', 'poll']);
    expect(questions[0].correctIndex).toBe(1);
    expect(questions[1].correctIndices).toEqual([0, 1, 3]);
    expect(questions[3].acceptedAnswers).toEqual(['Organic Light Emitting Diode', 'Organic LED']);
    expect(questions[4].options).toEqual(['MX', 'DA', 'AV']);
  });

  it('builds a template with Type / Correct / Time dropdowns that imports cleanly', async () => {
    const buffer = await buildQuizImportTemplate();
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.getWorksheet('Quiz');
    expect(ws.getCell('B2').dataValidation.formulae[0]).toContain('Single choice');
    expect(ws.getCell('I5').dataValidation.formulae[0]).toContain('INDIRECT');
    expect(ws.getCell('K300').dataValidation.formulae[0]).toContain('20');

    const XLSX = await import('xlsx');
    const sheet = XLSX.read(buffer, { type: 'buffer' }).Sheets.Quiz;
    const { questions, warnings } = parseQuizRows(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }));
    expect(warnings).toEqual([]);
    expect(questions).toHaveLength(5);
  }, 30000);

  it('reads typed answers from the Accepted answers column and "All" for multi-select', () => {
    const { questions } = parseQuizRows([
      ['Question', 'Type', 'Option A', 'Option B', 'Option C', 'Correct', 'Accepted answers (Type answer only)'],
      ['Pick all', 'Multi-select', 'x', 'y', 'z', 'All', ''],
      ['Spell it', 'Type answer', '', '', '', '', 'OLED | Organic LED'],
    ]);
    expect(questions[0]).toMatchObject({ type: 'multi_choice', correctIndices: [0, 1, 2] });
    expect(questions[1]).toMatchObject({ type: 'type_answer', acceptedAnswers: ['OLED', 'Organic LED'] });
  });

  it('offers every multi-select letter combination', () => {
    const choices = multiSelectAnswerChoices();
    expect(choices).toHaveLength(58);
    expect(choices.slice(0, 2)).toEqual(['A, B', 'A, C']);
    expect(choices).toContain('A, B, C, D');
    expect(choices.at(-1)).toBe('All');
  });

  it('matches the answer by option text', () => {
    expect(resolveCorrectIndices('Galaxy S Ultra', ['Galaxy A', 'Galaxy S Ultra'])).toEqual([1]);
    expect(resolveCorrectIndices('B) Galaxy S Ultra', ['Galaxy A', 'Galaxy S Ultra'])).toEqual([1]);
    expect(resolveCorrectIndices('2', ['x', 'y', 'z'])).toEqual([1]);
  });
});
