import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildSamsungAcademySurveyAnalytics,
  buildSurveyReportSchema,
  filterSamsungAcademySurveys,
  getSurveyChoices,
} from '../src/lib/samsungAcademySurveyAnalytics.js';
import { buildSamsungAcademySurveyWorkbook } from '../src/lib/samsungAcademySurveyExport.js';
import { buildSurveyResponsePayload, normalizeSurveyDefinition, validateSurveyAnswers } from '../src/lib/surveyDefinitions.js';

const defs = [{
  id: 'new1',
  name: 'Survey B',
  language: 'en',
  profileFields: [
    { id: 'fullName', type: 'text', label: 'Full name' },
    { id: 'dept', type: 'select', label: 'Department', options: ['A', 'B'] },
  ],
  ratingQuestions: [
    { id: 'r1', type: 'rating', label: 'Overall' },
    { id: 'c1', type: 'single', label: 'Recommend?', options: ['Yes', 'No', 'Maybe'] },
  ],
}];

const rows = [
  { id: '1', fullName: 'Old One', academyLocation: 'القاهرة', product: 'موبايل', contentValue: '9', trainerClarity: '10', needMoreSessions: '9', periodSuitable: '9', placeAccommodation: '9', createdAt: '2026-10-20T10:00:00Z' },
  { id: '2', surveyId: 'new1', surveyName: 'Survey B', fullName: 'New A', dept: 'A', r1: '7', c1: 'Yes', createdAt: '2026-10-23T10:00:00Z' },
  { id: '3', surveyId: 'new1', fullName: 'New B', dept: 'B', r1: '10', c1: 'No', createdAt: '2026-10-23T11:00:00Z' },
  { id: '4', surveyId: 'gone', surveyName: 'Deleted One', fullName: 'X', createdAt: '2026-10-22T11:00:00Z' },
];

describe('survey report', () => {
  it('lists every survey with response counts; untagged responses belong to the original form', () => {
    const choices = getSurveyChoices(defs, rows);
    expect(choices.find((s) => s.id === 'academy-default').count).toBe(1);
    expect(choices.find((s) => s.id === 'new1').count).toBe(2);
    expect(choices.find((s) => s.id === 'gone')).toMatchObject({ name: 'Deleted One', deleted: true, count: 1 });
  });

  it('builds analytics from the selected survey questions', () => {
    const schema = buildSurveyReportSchema(defs, 'new1');
    const filtered = filterSamsungAcademySurveys(rows, { surveyId: 'new1' });
    const a = buildSamsungAcademySurveyAnalytics(filtered, schema);
    expect(filtered).toHaveLength(2);
    expect(schema.hasLocation).toBe(false);
    expect(a.overallAverage).toBe(8.5);
    expect(a.satisfiedRate).toBe(50);
    expect(a.choiceStats[0].options).toEqual([
      { name: 'Yes', count: 1, share: 50 },
      { name: 'No', count: 1, share: 50 },
      { name: 'Maybe', count: 0, share: 0 },
    ]);
    expect(a.fieldBreakdowns.map((b) => b.label)).toEqual(['Department']);
  });

  it('keeps the original five rating questions and Egypt geo for the Academy survey', () => {
    const schema = buildSurveyReportSchema(defs, 'academy-default');
    const a = buildSamsungAcademySurveyAnalytics(filterSamsungAcademySurveys(rows, { surveyId: 'academy-default' }), schema);
    expect(schema.hasLocation).toBe(true);
    expect(a.questionStats).toHaveLength(5);
    expect(a.overallAverage).toBe(9.2);
    expect(a.geo.pins.find((p) => p.id === 'cairo').count).toBe(1);
  });

  it('exports columns and sheets that match the survey content', () => {
    const schema = buildSurveyReportSchema(defs, 'new1');
    const { wb } = buildSamsungAcademySurveyWorkbook(
      filterSamsungAcademySurveys(rows, { surveyId: 'new1' }),
      { surveyId: 'new1' },
      rows.length,
      { schema, surveyChoices: getSurveyChoices(defs, rows) },
    );
    expect(wb.SheetNames).toEqual(['Analysis Summary', 'Rating Breakdown', 'Choice Breakdown', 'By Department', 'By Date', 'Responses']);
    const first = XLSX.utils.sheet_to_json(wb.Sheets.Responses)[0];
    expect(first).toMatchObject({ Survey: 'Survey B', 'Full name': 'New B', Department: 'B', Overall: '10', 'Overall · Band': 'Satisfied', 'Recommend?': 'No' });
    expect(first).not.toHaveProperty('Content Valuable');
  });
});

describe('single choice questions', () => {
  it('requires an answer and stores it under choices, not ratings', () => {
    const def = normalizeSurveyDefinition(defs[0]);
    const base = { fullName: 'Ali Hassan', dept: 'A' };
    expect(validateSurveyAnswers(def, { ...base, r1: '9' })).toBe('Please choose an answer for every question.');
    const payload = buildSurveyResponsePayload(def, { ...base, r1: '9', c1: 'Maybe' });
    expect(payload.ratings).toEqual({ r1: '9' });
    expect(payload.choices).toEqual({ c1: 'Maybe' });
    expect(payload.c1).toBe('Maybe');
  });
});
