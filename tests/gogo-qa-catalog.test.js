import { describe, expect, it } from 'vitest';
import {
  isPublishedGoGoQa,
  matchAdminQaAnswer,
  normalizeGoGoQaEntry,
  validateGoGoQaEntry,
} from '../src/lib/gogoQaCatalog';
import { parseGoGoQaRows } from '../src/lib/gogoQaImport';
import { resolveGoGoAdminQaTurn } from '../src/lib/gogoRouter';

describe('gogoQaCatalog', () => {
  it('normalizes and validates bilingual entries', () => {
    const entry = normalizeGoGoQaEntry(
      {
        question_en: 'What is TCS?',
        answer_en: 'Technical Capability Score.',
        keywords: 'tcs, score',
        status: 'published',
      },
      { actor: 'tester' },
    );
    expect(entry.keywords).toEqual(['tcs', 'score']);
    expect(validateGoGoQaEntry(entry).ok).toBe(true);
    expect(isPublishedGoGoQa(entry)).toBe(true);
  });

  it('rejects empty Q&A', () => {
    const { ok, errors } = validateGoGoQaEntry(
      normalizeGoGoQaEntry({ question_en: '', answer_en: '' }),
    );
    expect(ok).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('matches published answers and skips draft/disabled', () => {
    const rows = [
      {
        id: 'draft1',
        question_en: 'How do I open TCS ladder?',
        answer_en: 'Draft answer',
        status: 'draft',
        keywords: ['tcs', 'ladder'],
      },
      {
        id: 'live1',
        question_en: 'How do I open the TCS ladder?',
        answer_en: 'Open TCS portal then Dashboard.',
        status: 'published',
        keywords: ['tcs', 'ladder', 'dashboard'],
        priority: 100,
      },
      {
        id: 'off1',
        question_en: 'How do I open the TCS ladder?',
        answer_en: 'Disabled',
        status: 'disabled',
        keywords: ['tcs', 'ladder'],
        priority: 200,
      },
    ];
    const hit = matchAdminQaAnswer(rows, 'open the tcs ladder please', 'en');
    expect(hit?.entry?.id).toBe('live1');
    expect(hit?.answer).toContain('Dashboard');
  });

  it('matches short phrases and keywords, not only the exact question', () => {
    const rows = [
      {
        id: 'scora',
        question_en: 'What is the SCORA app?',
        answer_en: 'Samsung Competitive Online Ranking & Assessment.',
        status: 'published',
        keywords: ['scora', 'app', 'application', 'سكورا'],
      },
    ];
    expect(matchAdminQaAnswer(rows, 'scora', 'en')?.answer).toContain('Competitive');
    expect(matchAdminQaAnswer(rows, 'scora app', 'en')?.answer).toContain('Competitive');
    expect(matchAdminQaAnswer(rows, 'What is SCORA?', 'en')?.answer).toContain('Competitive');
    expect(matchAdminQaAnswer(rows, 'What is SCORA app?', 'en')?.answer).toContain('Competitive');
  });

  it('prefers higher priority on equal overlap', () => {
    const rows = [
      {
        id: 'low',
        question_en: 'What is PQA?',
        answer_en: 'Low priority',
        status: 'published',
        keywords: ['pqa'],
        priority: 10,
      },
      {
        id: 'high',
        question_en: 'What is PQA?',
        answer_en: 'High priority',
        status: 'published',
        keywords: ['pqa'],
        priority: 200,
      },
    ];
    const hit = matchAdminQaAnswer(rows, 'What is PQA?', 'en');
    expect(hit?.entry?.id).toBe('high');
  });
});

describe('gogoQaImport', () => {
  it('parses Excel-style header rows', () => {
    const { entries, warnings } = parseGoGoQaRows([
      ['Question EN', 'Question AR', 'Answer EN', 'Answer AR', 'Keywords', 'Category', 'Status'],
      ['What is SCORA?', '', 'Samsung EG hub', '', 'scora, app', 'Overview', 'published'],
      ['', '', '', '', '', '', ''],
      ['Missing answer', '', '', '', 'x', 'General', 'published'],
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].question_en).toBe('What is SCORA?');
    expect(entries[0].category).toBe('Overview');
    expect(warnings.some((w) => /Missing answer|Add an answer/i.test(w))).toBe(true);
  });
});

describe('resolveGoGoAdminQaTurn', () => {
  it('returns admin_qa mode for a catalog hit', () => {
    const turn = resolveGoGoAdminQaTurn(
      'What is SCORA?',
      'en',
      [
        {
          id: 'scora',
          question_en: 'What is SCORA?',
          answer_en: 'Samsung Egypt service hub.',
          status: 'published',
          keywords: ['scora'],
        },
      ],
    );
    expect(turn?.mode).toBe('admin_qa');
    expect(turn?.source).toBe('admin_qa');
    expect(turn?.reply).toContain('Samsung');
  });

  it('returns null when nothing matches', () => {
    expect(resolveGoGoAdminQaTurn('zzzz unrelated', 'en', [])).toBeNull();
  });
});
