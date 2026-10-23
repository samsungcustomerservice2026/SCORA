/**
 * SCORA — AX Award submission deck for RHQ. Five slides, black and white,
 * screenshot-led, every claim carried by a figure read off the live platform.
 *
 * Run: node scripts/build-ax-award-pptx.mjs
 *
 * Editorial rules:
 *  - Prior practice is described neutrally. SCORA extends the established
 *    programs; it does not correct them.
 *  - No external AI product is named except in the forward roadmap, where it is
 *    explicitly conditional on RHQ approval.
 *  - Strictly monochrome chrome. Product screenshots stay as captured.
 *
 * Layout note: the slide is 10 x 5.63 in with content from y=1.06 (no lead) or
 * y=1.44 (with lead) down to y=5.25. Every block below is budgeted against that
 * so nothing overlaps the footer rule at y=5.30.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'SCORA_AX_Award_Submission_RHQ.pptx');
const SHOTS = path.join(ROOT, 'docs', 'assets', 'screens');

/* ── monochrome tokens ───────────────────────────────────────────────────── */

const BG = '0A0A0A';
const PANEL = '151515';
const PANEL2 = '1E1E1E';
const LINE = '333333';
const LINE2 = '4E4E4E';
const WHITE = 'FFFFFF';
const MUTED = '9C9C9C';
const DIM = '6A6A6A';
const FONT = 'Segoe UI';
const MONO = 'Consolas';

const M = 0.45;
const CW = 10 - 2 * M;
const FLOOR = 5.25;

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Samsung Electronics Egypt — Customer Service';
pptx.company = 'Samsung Electronics Egypt';
pptx.title = 'SCORA — AX Award Submission (RHQ)';

const rect = () => pptx.ShapeType.rect;

/* ── screenshot helpers ──────────────────────────────────────────────────── */

/** Aspect ratios of the captured screens, measured from the files. */
const AR = {
  '01-portal-select.png': 2.111,
  '02-division-select.png': 1.753,
  '03-tcs-leaderboard.png': 1.29,
  '04-admin-registry.png': 2.0,
  '05-kpi-dossier.png': 1.25,
  '06-profile-knowledge.png': 2.032,
  '07-pqa-accumulated.png': 2.024,
  '08-survey-analysis.png': 2.024,
  '09-challenge-report.png': 1.585,
  '10-insights-studio.png': 1.803,
};

/** Largest rect of ratio `ar` that fits inside `box`, centred. */
function fit(box, ar) {
  let w = box.w;
  let h = w / ar;
  if (h > box.h) {
    h = box.h;
    w = h * ar;
  }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

/** Screenshot letterboxed on a black plate inside a hairline frame. */
function shot(s, file, box) {
  const p = path.join(SHOTS, file);
  if (!fs.existsSync(p)) throw new Error(`Missing screenshot: ${file}`);
  if (box.y + box.h > FLOOR + 0.02) {
    throw new Error(`${file} overruns the content floor (${(box.y + box.h).toFixed(2)}in)`);
  }
  s.addShape(rect(), { ...box, fill: { color: '000000' }, line: { color: LINE, width: 0.75 } });
  s.addImage({ path: p, ...fit({ x: box.x + 0.03, y: box.y + 0.03, w: box.w - 0.06, h: box.h - 0.06 }, AR[file]) });
}

/** Monospace micro-label above a figure or block. */
function eyebrow(s, text, x, y, w, color = WHITE) {
  s.addText(text, { x, y, w, h: 0.18, fontSize: 7.5, bold: true, color, fontFace: MONO, charSpacing: 1.6 });
}

/** Caption under a screenshot: what it is, then the live figures. */
function caption(s, x, y, w, title, detail, detailH = 0.44) {
  s.addText(title, { x, y, w, h: 0.19, fontSize: 8.5, bold: true, color: WHITE, fontFace: FONT, charSpacing: 0.6 });
  s.addText(detail, {
    x, y: y + 0.18, w, h: detailH, fontSize: 7.3, color: MUTED, fontFace: FONT, lineSpacing: 9.5,
  });
}

/* ── slide chrome ────────────────────────────────────────────────────────── */

/** Node chain down the right margin — the only decorative motif in the deck. */
function nodeRail(s) {
  const x = 9.76;
  s.addShape(rect(), { x, y: 0.6, w: 0.008, h: 4.2, fill: { color: LINE }, line: { width: 0 } });
  for (let i = 0; i < 8; i += 1) {
    const y = 0.6 + i * 0.6;
    const big = i % 3 === 0;
    const r = big ? 0.049 : 0.032;
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.004 - r, y: y - r, w: r * 2, h: r * 2,
      fill: { color: big ? WHITE : DIM }, line: { width: 0 },
    });
  }
}

function head(s, { step, tag, title, lead }) {
  s.background = { color: BG };
  nodeRail(s);

  s.addText('SAMSUNG', {
    x: M, y: 0.08, w: 1.9, h: 0.22, fontSize: 10.5, bold: true, color: WHITE, fontFace: FONT, charSpacing: 3.4,
  });
  s.addText(tag, {
    x: M + 2.0, y: 0.1, w: 5.4, h: 0.2, fontSize: 8, color: MUTED, fontFace: MONO, charSpacing: 1.8,
  });
  s.addText(`${step} / 05`, {
    x: M + CW - 1.3, y: 0.1, w: 1.3, h: 0.2, fontSize: 8, color: WHITE, align: 'right', fontFace: MONO, charSpacing: 1.4,
  });
  s.addShape(rect(), { x: M, y: 0.34, w: CW, h: 0.01, fill: { color: LINE2 }, line: { width: 0 } });

  s.addText(title, { x: M, y: 0.44, w: CW, h: 0.46, fontSize: 24, bold: true, color: WHITE, fontFace: FONT });

  let y = 1.06;
  if (lead) {
    s.addText(lead, {
      x: M, y: 0.94, w: CW * 0.86, h: 0.44, fontSize: 10, color: MUTED, fontFace: FONT, lineSpacing: 13,
    });
    y = 1.44;
  }

  s.addShape(rect(), { x: M, y: 5.3, w: CW, h: 0.008, fill: { color: LINE }, line: { width: 0 } });
  s.addText('SCORA  ·  AX Award Submission  ·  Samsung Electronics Egypt — Customer Service  ·  Confidential, internal use only', {
    x: M, y: 5.35, w: CW, h: 0.2, fontSize: 6.8, color: DIM, fontFace: FONT,
  });
  return y;
}

/** Row of figure tiles carrying values read from the live platform. */
function tiles(s, y, items, h = 0.78) {
  const gap = 0.12;
  const w = (CW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = M + i * (w + gap);
    s.addShape(rect(), { x, y, w, h, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } });
    s.addShape(rect(), { x, y, w, h: 0.022, fill: { color: WHITE }, line: { width: 0 } });
    s.addText(it[0], {
      x: x + 0.1, y: y + 0.13, w: w - 0.2, h: 0.34, fontSize: 16, bold: true, color: WHITE, fontFace: FONT,
    });
    s.addText(it[1], {
      x: x + 0.1, y: y + 0.48, w: w - 0.2, h: 0.24, fontSize: 6.6, color: MUTED, fontFace: MONO, charSpacing: 0.7,
    });
  });
}

/* ══ 01 · OVERVIEW & SCOPE ═══════════════════════════════════════════════ */
{
  const s = pptx.addSlide();
  const y0 = head(s, {
    step: '01',
    tag: 'PLATFORM OVERVIEW  ·  SCOPE OF IMPLEMENTATION',
    title: 'SCORA — Service Competency & Operational Readiness',
    lead: 'An in-house platform that turns official service performance data into visible, self-service capability development for every colleague and every service partner.',
  });

  const lw = 3.9;
  eyebrow(s, 'SCOPE', M, y0, 2.0);
  [
    ['PRODUCTS', 'Mobile Experience (MX)  ·  Digital Appliances (DA)  ·  Audio-Visual (AV)'],
    ['POPULATIONS', 'Field service engineers  ·  Front desk receptionists  ·  Galaxy Consultants  ·  Authorised service partners'],
    ['ENVIRONMENTS', 'TCS MX  ·  TCS DA  ·  TCS AV  ·  PQA MX Division  ·  PQA CE Division'],
  ].forEach((row, i) => {
    const y = y0 + 0.26 + i * 0.7;
    s.addShape(rect(), { x: M, y, w: 0.022, h: 0.6, fill: { color: LINE2 }, line: { width: 0 } });
    s.addText(row[0], {
      x: M + 0.14, y, w: lw - 0.14, h: 0.18, fontSize: 7.5, bold: true, color: WHITE, fontFace: MONO, charSpacing: 1.4,
    });
    s.addText(row[1], {
      x: M + 0.14, y: y + 0.18, w: lw - 0.14, h: 0.42, fontSize: 8.3, color: MUTED, fontFace: FONT, lineSpacing: 11,
    });
  });

  const rx = M + lw + 0.35;
  const rw = CW - lw - 0.35;
  const cellW = (rw - 0.16) / 2;
  eyebrow(s, 'TWO PORTALS  ·  THREE DIVISIONS', rx, y0, rw);
  shot(s, '01-portal-select.png', { x: rx, y: y0 + 0.26, w: cellW, h: 1.3 });
  shot(s, '02-division-select.png', { x: rx + cellW + 0.16, y: y0 + 0.26, w: cellW, h: 1.3 });
  caption(s, rx, y0 + 1.62, cellW, 'PORTAL GATEWAY', 'TCS portal for engineers, PQA portal for service centres.');
  caption(s, rx + cellW + 0.16, y0 + 1.62, cellW, 'DIVISION GATEWAY', 'MX, DA and AV each with their own KPI model.');

  eyebrow(s, 'LIVE PLATFORM TELEMETRY', M, 4.14, 3.0);
  tiles(s, 4.36, [
    ['300', 'ACTIVE RECORDS'],
    ['3,393', 'VISITOR SESSIONS'],
    ['5,297', 'SCREEN INTERACTIONS'],
    ['56m 22s', 'AVG SESSION'],
    ['155', 'ADMIN LOGINS'],
  ]);
}

/* ══ 02 · SITUATION & IMPROVEMENT GOALS ══════════════════════════════════ */
{
  const s = pptx.addSlide();
  const y0 = head(s, {
    step: '02',
    tag: 'CURRENT SITUATION  ·  IMPROVEMENT GOALS',
    title: 'From cycle announcement to continuous, personal visibility',
    lead: 'The evaluation and PQA programs already produce trusted results each cycle. The opportunity was to carry them the last mile — to each individual, with the KPI detail behind them.',
  });

  const lw = 5.05;
  eyebrow(s, 'IMPROVEMENT GOALS  ·  KEY IMPROVEMENT ITEMS', M, y0, 4.4);

  [
    ['01', 'Personal result on demand', 'Own score, full KPI breakdown and cycle history, per individual.'],
    ['02', 'Continuous standing', 'Six tiers, Masters through Bronze, across the whole population.'],
    ['03', 'Partner self-service', 'PQA by partner and by branch, monthly and accumulated.'],
    ['04', 'Capability built in-house', 'Live competency quiz plus a knowledge base with verified completion.'],
    ['05', 'A standing channel for voice', 'In-app survey feeding the improvement backlog directly.'],
  ].forEach((g, i) => {
    const y = y0 + 0.26 + i * 0.55;
    s.addShape(rect(), { x: M, y, w: lw, h: 0.5, fill: { color: i % 2 ? BG : PANEL }, line: { width: 0 } });
    s.addText(g[0], {
      x: M + 0.06, y: y + 0.03, w: 0.42, h: 0.44, fontSize: 14, bold: true, color: LINE2,
      fontFace: MONO, valign: 'middle',
    });
    s.addText(g[1], {
      x: M + 0.54, y: y + 0.03, w: lw - 0.64, h: 0.2, fontSize: 9.4, bold: true, color: WHITE, fontFace: FONT,
    });
    s.addText(g[2], {
      x: M + 0.54, y: y + 0.24, w: lw - 0.64, h: 0.22, fontSize: 7.6, color: MUTED, fontFace: FONT,
    });
  });

  // KPI model band, left column only
  const by = y0 + 0.26 + 5 * 0.55 + 0.14;
  s.addShape(rect(), { x: M, y: by, w: lw, h: 0.68, fill: { color: PANEL2 }, line: { color: LINE, width: 0.75 } });
  s.addShape(rect(), { x: M, y: by, w: 0.03, h: 0.68, fill: { color: WHITE }, line: { width: 0 } });
  s.addText('KPI MODEL HELD PER QUARTER', {
    x: M + 0.14, y: by + 0.05, w: lw - 0.28, h: 0.16, fontSize: 7.2, bold: true, color: WHITE, fontFace: MONO, charSpacing: 1.3,
  });
  s.addText(
    'Q1 — SSR · RRR90 · IQC Skip · Core Parts · MPU · DRNPS · Exam\nQ2 — LCD-OCTA · PBA · Multi Parts · RRR30 · Maintenance · OQC',
    { x: M + 0.14, y: by + 0.22, w: lw - 0.28, h: 0.42, fontSize: 8, color: MUTED, fontFace: FONT, lineSpacing: 11 },
  );

  const rx = M + lw + 0.32;
  const rw = CW - lw - 0.32;
  eyebrow(s, 'EVIDENCE  ·  ENGINEER DOSSIER', rx, y0, rw);
  shot(s, '05-kpi-dossier.png', { x: rx, y: y0 + 0.26, w: rw, h: 2.58 });
  caption(s, rx, y0 + 2.94, rw, 'VERIFICATION BY CODE — KPI SNAPSHOT',
    'GSPN.AMR_OSAM20 · Khalafallah Electronics · engineer code 7886002511 · TCS Rank 109.9 · tier MASTERS · Q1 verified.', 0.58);
}

/* ══ 03 · WORKFLOW BEFORE & AFTER ════════════════════════════════════════ */
{
  const s = pptx.addSlide();
  const y0 = head(s, {
    step: '03',
    tag: 'WORKFLOW BEFORE AND AFTER IMPROVEMENT',
    title: 'The cycle is unchanged. The delivery layer is new.',
    lead: 'SCORA consumes the same official results, then extends how far they travel. Nothing in the established evaluation or PQA process was replaced.',
  });

  const colW = 4.14;
  const lx = M;
  const rx = M + colW + 0.52;

  [[lx, 'ESTABLISHED CYCLE', PANEL2], [rx, 'EXTENDED WITH SCORA', WHITE]].forEach(([x, label, bg]) => {
    const inverted = bg === WHITE;
    s.addShape(rect(), { x, y: y0, w: colW, h: 0.28, fill: { color: bg }, line: { color: LINE, width: 0.75 } });
    s.addText(label, {
      x: x + 0.12, y: y0, w: colW - 0.24, h: 0.28, fontSize: 8, bold: true,
      color: inverted ? '000000' : WHITE, valign: 'middle', fontFace: MONO, charSpacing: 1.6,
    });
  });

  const rows = [
    ['Official results compiled and announced each cycle.', 'Unchanged — the same validated results feed the platform.'],
    ['Result reaches the individual through announcement.', 'Personal dossier on demand, with the full KPI breakdown.'],
    ['Top performers recognised each cycle.', 'Six tiers recognise the whole population, continuously.'],
    ['KPI meaning conveyed in briefings and training.', 'Explained on demand by the assistant, linked to the knowledge item.'],
    ['PQA outcomes shared with partners each cycle.', 'Self-service partner and branch views, monthly and accumulated.'],
    ['Reinforcement on an external quiz tool; participation recorded.', 'In-house on SCORA Challenge; completion verified by presence, interaction and a closing quiz.'],
  ];
  rows.forEach((r, i) => {
    const y = y0 + 0.34 + i * 0.36;
    s.addShape(rect(), { x: lx, y, w: colW, h: 0.36, fill: { color: i % 2 ? BG : PANEL }, line: { width: 0 } });
    s.addText(r[0], {
      x: lx + 0.12, y, w: colW - 0.24, h: 0.36, fontSize: 7.9, color: MUTED, valign: 'middle', fontFace: FONT,
    });
    s.addText('→', {
      x: lx + colW + 0.06, y, w: 0.4, h: 0.36, fontSize: 11, color: LINE2, align: 'center', valign: 'middle', fontFace: FONT,
    });
    s.addShape(rect(), { x: rx, y, w: colW, h: 0.36, fill: { color: i % 2 ? BG : PANEL }, line: { width: 0 } });
    s.addText(r[1], {
      x: rx + 0.12, y, w: colW - 0.24, h: 0.36, fontSize: 7.9, color: WHITE, valign: 'middle', fontFace: FONT,
    });
  });

  const by = y0 + 0.34 + rows.length * 0.36 + 0.14;
  shot(s, '04-admin-registry.png', { x: M, y: by, w: 2.3, h: 1.1 });
  const tx = M + 2.46;
  const tw = CW - 2.46;
  eyebrow(s, 'SINGLE INGESTION POINT', tx, by, 3.0);
  s.addText(
    'One administrative surface holds all five environments — TCS MX, TCS DA, TCS AV, PQA MX and PQA CE — over 300 active records. Results are loaded and validated once per cycle, then read by every downstream view, so no figure is re-keyed and every view reconciles to the same source.',
    { x: tx, y: by + 0.2, w: tw, h: 0.6, fontSize: 8.3, color: MUTED, fontFace: FONT, lineSpacing: 11 },
  );
  s.addText(
    'Net effect: the same trusted data now reaches every individual continuously instead of once per cycle, and arrives with the means to act on it.',
    { x: tx, y: by + 0.84, w: tw, h: 0.26, fontSize: 9, bold: true, color: WHITE, fontFace: FONT },
  );
}

/* ══ 04 · KEY FUNCTION DETAILS ═══════════════════════════════════════════ */
{
  const s = pptx.addSlide();
  const y0 = head(s, {
    step: '04',
    tag: 'KEY FUNCTION DETAILS  ·  READ FROM LIVE DATA',
    title: 'Four functions, each already carrying real results',
  });

  const gap = 0.26;
  const cw = (CW - gap) / 2;
  const pitch = 2.09;

  [
    {
      file: '03-tcs-leaderboard.png',
      label: 'RANKING & RECOGNITION',
      title: 'TCS ranking — six tiers, Masters to Bronze',
      detail: '#1 GSPN.HESHAM.KAMAL1 (Raya · Bani Swaif) · #2 GSPN.MOHAMED.GOMAAMTI2024 · #3 GSPN.ALIELSHERBINY (SKY · Damietta). Ranked continuously across MX, DA and AV.',
    },
    {
      file: '07-pqa-accumulated.png',
      label: 'PARTNER QUALITY',
      title: 'PQA — partner and branch, self-service',
      detail: 'Accumulated 2026 year to date: Raya Mansoura 858.0 · Raya Cairo 853.8 · Tiba 843.2 · Electra Giza 840.2. Monthly and accumulated views on the same data.',
    },
    {
      file: '09-challenge-report.png',
      label: 'SCORA CHALLENGE',
      title: 'Competency quiz delivered in-house',
      detail: 'Session report: 17 players · top score 5,459 · best question 88% · hardest 80%. Winners Sherif Ashraf 5,459 · Sara 4,944 · Enjy 4,813. Results retained internally.',
    },
    {
      file: '06-profile-knowledge.png',
      label: 'KNOWLEDGE BASE',
      title: 'Training completion verified, not assumed',
      detail: 'Per-colleague pass state on mandatory items with a required reading time (5 min, 3 min) and a closing quiz. Presence, on-screen interaction and the quiz together prove completion.',
    },
  ].forEach((c, i) => {
    const cx = M + (i % 2) * (cw + gap);
    const cy = y0 + Math.floor(i / 2) * pitch;
    eyebrow(s, c.label, cx, cy, cw);
    shot(s, c.file, { x: cx, y: cy + 0.2, w: cw, h: 1.14 });
    caption(s, cx, cy + 1.4, cw, c.title, c.detail, 0.44);
  });
}

/* ══ 05 · AI / DATA, RETURN & EXPANSION ══════════════════════════════════ */
{
  const s = pptx.addSlide();
  const y0 = head(s, {
    step: '05',
    tag: 'AI / DATA UTILISATION  ·  RETURN  ·  EXPANSION',
    title: 'AI and data utilisation, return, and where it goes next',
  });

  const lw = 5.0;
  eyebrow(s, 'AI & DATA UTILISATION PLAN', M, y0, 3.4);

  [
    ['GoGo AI assistant', 'Guides colleagues through the platform, explains what each KPI means, answers in English and Egyptian Arabic with neural voice, and alerts users when new technical content is published.'],
    ['One validated source, measured continuously', 'Official results are ingested once per cycle and fanned out to individual, tier, partner and branch views. Engagement and completion telemetry then drives the roadmap: 5,297 interactions · 240 lab events.'],
    ['Governance', 'No employee, evaluation or partner record is transmitted to an external AI provider in the current runtime configuration.'],
  ].forEach((a, i) => {
    const y = y0 + 0.24 + i * 0.72;
    s.addShape(pptx.ShapeType.ellipse, {
      x: M + 0.02, y: y + 0.05, w: 0.075, h: 0.075, fill: { color: WHITE }, line: { width: 0 },
    });
    s.addShape(rect(), { x: M + 0.054, y: y + 0.13, w: 0.008, h: 0.5, fill: { color: LINE }, line: { width: 0 } });
    s.addText(a[0], {
      x: M + 0.22, y, w: lw - 0.22, h: 0.2, fontSize: 9.3, bold: true, color: WHITE, fontFace: FONT,
    });
    s.addText(a[1], {
      x: M + 0.22, y: y + 0.19, w: lw - 0.22, h: 0.5, fontSize: 7.7, color: MUTED, fontFace: FONT, lineSpacing: 10.5,
    });
  });

  // Impact / return / expansion, stacked under the AI plan
  const by = y0 + 0.24 + 3 * 0.72 + 0.1;
  s.addShape(rect(), { x: M, y: by, w: lw, h: 1.5, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } });
  [
    ['OBSERVED IMPACT', 'Partners now ask for the platform during onsite visits to Head Office; colleagues request extra sessions to raise their Challenge standing.'],
    ['ECONOMIC RETURN', 'No external quiz licence, no vendor build, no translation cost — designed, built and operated by the same in-house team.'],
    ['EXPANSION', 'External go-live on a Samsung-governed server; an approved generative API alongside GoGo, subject to RHQ review; configuration-driven reuse across subsidiaries.'],
  ].forEach((b, i) => {
    const y = by + 0.08 + i * 0.46;
    s.addText(b[0], {
      x: M + 0.14, y, w: lw - 0.28, h: 0.16, fontSize: 7.2, bold: true, color: WHITE, fontFace: MONO, charSpacing: 1.3,
    });
    s.addText(b[1], {
      x: M + 0.14, y: y + 0.16, w: lw - 0.28, h: 0.28, fontSize: 7.2, color: MUTED, fontFace: FONT, lineSpacing: 9.5,
    });
  });

  const rx = M + lw + 0.3;
  const rw = CW - lw - 0.3;
  eyebrow(s, 'MEASURED, NOT ASSERTED', rx, y0, rw);
  shot(s, '08-survey-analysis.png', { x: rx, y: y0 + 0.24, w: rw, h: 1.1 });
  caption(s, rx, y0 + 1.4, rw, 'ACADEMY SURVEY — 79 RESPONSES',
    'Average 9.72 · 79% fully satisfied · Tanta 46, Assiut 31, Alexandria 2. Trainer 9.85 · content 9.81 · more sessions requested 9.92.', 0.48);
  shot(s, '10-insights-studio.png', { x: rx, y: y0 + 2.16, w: rw, h: 1.1 });
  caption(s, rx, y0 + 3.32, rw, 'INSIGHTS STUDIO',
    'Visitor and admin waves over 14 days, click depth and funnel completion — 3,393 sessions, 56m 22s average, 155 admin logins.', 0.48);
}

await pptx.writeFile({ fileName: OUT });
console.log('Wrote', OUT, '— 5 slides');
