/**
 * Monochrome (ink-on-paper) figures for SCORA_APP_Overview.docx.
 *
 * The overview document carries almost no tables: each workflow, list and
 * matrix is rendered here as a figure instead, in the same black-and-white
 * language as the RHQ deck.
 *
 * Run: node scripts/build-scora-diagrams.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'assets', 'diagrams');

/* ── tokens ──────────────────────────────────────────────────────────────── */

const PAPER = '#FFFFFF';
const INK = '#111111';
const INK2 = '#3F3F3F';
const GREY = '#6E6E6E';
const SOFT = '#F6F6F6';
const SOFT2 = '#EAEAEA';
const HAIR = '#C6C6C6';
const F = "'Segoe UI','Tahoma',Arial,sans-serif";

const W = 1320;
const PAD = 36;
const CW = W - 2 * PAD;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── primitives ──────────────────────────────────────────────────────────── */

function txt(x, y, s, o = {}) {
  const {
    size = 15, weight = 400, fill = INK, anchor = 'start', spacing = 0, italic = false,
  } = o;
  return `<text x="${x}" y="${y}" font-family="${F}" font-size="${size}" font-weight="${weight}"
    fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}"
    ${italic ? 'font-style="italic"' : ''}>${esc(s)}</text>`;
}

/** Stack of pre-wrapped lines. Copy is authored to fit; no auto-wrapping. */
function lines(x, y, arr, o = {}) {
  const { size = 13, gap = 19, fill = GREY, anchor = 'start', weight = 400 } = o;
  return arr.map((l, i) => txt(x, y + i * gap, l, { size, fill, anchor, weight })).join('\n');
}

function box(x, y, w, h, o = {}) {
  const { fill = PAPER, stroke = HAIR, sw = 1.4, rx = 8 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
    fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

/** Black title bar across the top of every figure. */
function titleBar(label, h = 52) {
  return `${box(0, 0, W, h, { fill: INK, stroke: INK, rx: 0 })}
    ${txt(PAD, h / 2 + 6, label, { size: 18, weight: 700, fill: PAPER, spacing: 2.2 })}`;
}

/** Small caps label chip. `solid` inverts to white-on-black. */
function chip(x, y, w, h, label, o = {}) {
  const { solid = false, size = 12.5, fill } = o;
  const bg = solid ? INK : (fill ?? SOFT2);
  const fg = solid ? PAPER : INK;
  return `${box(x, y, w, h, { fill: bg, stroke: solid ? INK : HAIR, rx: h / 2 })}
    ${txt(x + w / 2, y + h / 2 + size * 0.36, label, {
      size, weight: 700, fill: fg, anchor: 'middle', spacing: 1.4,
    })}`;
}

function arrowR(x, y, len) {
  const head = 9;
  return `<line x1="${x}" y1="${y}" x2="${x + len - head}" y2="${y}" stroke="${INK2}" stroke-width="1.6"/>
    <polygon points="${x + len},${y} ${x + len - head},${y - 5} ${x + len - head},${y + 5}" fill="${INK2}"/>`;
}

function arrowD(x, y, len) {
  const head = 9;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + len - head}" stroke="${INK2}" stroke-width="1.6"/>
    <polygon points="${x},${y + len} ${x - 5},${y + len - head} ${x + 5},${y + len - head}" fill="${INK2}"/>`;
}

/** Grey band with a black rule on the left edge — used for closing statements. */
function band(x, y, w, h, label, body, o = {}) {
  const { bodySize = 14 } = o;
  return `${box(x, y, w, h, { fill: SOFT, stroke: HAIR })}
    ${box(x, y, 4, h, { fill: INK, stroke: INK, rx: 0 })}
    ${label ? txt(x + 20, y + 22, label, { size: 11.5, weight: 700, fill: INK, spacing: 1.6 }) : ''}
    ${txt(x + 20, y + (label ? 44 : h / 2 + 5), body, { size: bodySize, fill: INK2 })}`;
}

const FIGS = [];
function fig(name, height, body) {
  FIGS.push({ name, height, body });
}

/* ══ before / after workflow ═════════════════════════════════════════════ */
{
  const BEFORE = [
    ['Cycle closes', ['Programs compile the', 'official results.']],
    ['Announcement', ['Results published through', 'official channels.']],
    ['Recognition', ['Top performers recognized', 'for the cycle.']],
    ['Reinforcement', ['Briefings and training,', 'with an external quiz tool.']],
  ];
  const AFTER = [
    ['Same source ingested', ['Loaded and validated', 'once per cycle. The', 'programs are unchanged.']],
    ['Personal dossier', ['Own result, full KPI', 'breakdown and cycle', 'history, on demand.']],
    ['Tier standing', ['Six tiers across the', 'whole population,', 'visible continuously.']],
    ['Explain and learn', ['The assistant explains', 'the KPI and links the', 'knowledge item.']],
    ['Verify and listen', ['In-house Challenge,', 'verified completion,', 'standing survey.']],
  ];

  const aW = (CW - 3 * 44) / 4;
  const bW = (CW - 4 * 30) / 5;
  let s = titleBar('WORKFLOW  ·  BEFORE AND AFTER IMPROVEMENT');

  s += chip(PAD, 74, 210, 26, 'ESTABLISHED CYCLE');
  BEFORE.forEach(([t, body], i) => {
    const x = PAD + i * (aW + 44);
    s += box(x, 112, aW, 100, { fill: PAPER });
    s += txt(x + 16, 138, t, { size: 15, weight: 700 });
    s += lines(x + 16, 162, body, { size: 12.5, gap: 17 });
    if (i < BEFORE.length - 1) s += arrowR(x + aW + 8, 162, 28);
  });

  s += band(PAD, 232, CW, 42, null,
    'The cycle itself is unchanged. SCORA adds a real-time individual delivery layer over the same official results.');

  s += chip(PAD, 292, 230, 26, 'EXTENDED WITH SCORA', { solid: true });
  AFTER.forEach(([t, body], i) => {
    const x = PAD + i * (bW + 30);
    s += box(x, 330, bW, 126, { fill: SOFT });
    s += box(x, 330, bW, 3, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 14, 358, t, { size: 14, weight: 700 });
    s += lines(x + 14, 382, body, { size: 12, gap: 17 });
    if (i < AFTER.length - 1) s += arrowR(x + bW + 4, 393, 22);
  });

  s += band(PAD, 476, CW, 46, 'NET EFFECT',
    'The same trusted data now reaches every individual continuously instead of once per cycle, and arrives with the means to act on it.');

  fig('workflow-before-after', 546, s);
}

/* ══ seven delivery phases ═══════════════════════════════════════════════ */
{
  // Titles are authored as two lines each so no column ever needs truncating.
  const P = [
    [['Engineer results', 'portal'], ['Authenticated access to', 'own result and KPI detail', 'across MX, DA and AV.']],
    [['Ranking and', 'tier system'], ['Six tiers, Masters to', 'Bronze, alongside', 'evaluation points.']],
    [['PQA', 'module'], ['Monthly announcement;', 'partner and branch views,', 'monthly and accumulated.']],
    [['Front desk and', 'consultants'], ['Same tier model extended', 'to receptionists and', 'Galaxy Consultants.']],
    [['SCORA', 'Challenge'], ['Live quiz brought', 'in-house; onsite sessions', 'up to 200 participants.']],
    [['GoGo AI', 'assistant'], ['Explains the app, answers', 'KPI questions bilingually,', 'flags new content.']],
    [['Knowledge Base', 'and voice'], ['Self-registration, verified', 'completion, standing', 'feedback survey.']],
  ];
  const colW = CW / 7;
  let s = titleBar('DELIVERY  ·  SEVEN PHASES ACROSS SEVEN MONTHS');

  const cy = 122;
  s += `<line x1="${PAD + colW * 0.5}" y1="${cy}" x2="${PAD + colW * 6.5}" y2="${cy}"
    stroke="${HAIR}" stroke-width="2"/>`;

  P.forEach(([title, body], i) => {
    const cx = PAD + colW * (i + 0.5);
    s += `<circle cx="${cx}" cy="${cy}" r="21" fill="${INK}"/>`;
    s += txt(cx, cy + 6, String(i + 1), { size: 16, weight: 700, fill: PAPER, anchor: 'middle' });
    s += lines(cx, cy + 46, title, { size: 12.5, gap: 17, anchor: 'middle', weight: 700, fill: INK });
    s += lines(cx, cy + 96, body, { size: 10.5, gap: 15, anchor: 'middle' });
  });

  s += band(PAD, 288, CW, 42, null,
    'Each phase was released to users before the next began, so value accumulated continuously across the delivery.');

  fig('delivery-phases', 354, s);
}

/* ══ improvement goals ═══════════════════════════════════════════════════ */
{
  const G = [
    ['G1', 'Individual visibility', ['Every participant sees their own result and', 'KPI detail on demand, in real time.'], 'Share of population accessing their own record each cycle'],
    ['G2', 'Recognition at every level', ['A tier structure that recognizes standing', 'across the whole population.'], 'Movement between tiers cycle on cycle'],
    ['G3', 'KPI capability', ['Raise KPI understanding so each colleague', 'can interpret and act on their numbers.'], 'Assistant usage on KPI topics; Challenge scores'],
    ['G4', 'Verified knowledge transfer', ['Completion evidenced by presence,', 'interaction and comprehension.'], 'Verified completions per published item'],
    ['G5', 'Partner engagement', ['Self-service PQA tracking at partner and', 'branch level, monthly and accumulated.'], 'Partner and branch views consulted per announcement'],
    ['G6', 'Standing voice of the employee', ['A continuous channel for feedback and', 'future feature requests.'], 'Requests received and converted into releases'],
  ];
  const cW = (CW - 2 * 22) / 3;
  let s = titleBar('IMPROVEMENT GOALS  ·  DEFINITION AND MEASURE');

  G.forEach(([id, title, body, measure], i) => {
    const x = PAD + (i % 3) * (cW + 22);
    const y = 76 + Math.floor(i / 3) * 186;
    s += box(x, y, cW, 168, { fill: PAPER });
    s += box(x, y, cW, 3, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 18, y + 42, id, { size: 26, weight: 700, fill: SOFT2 });
    s += txt(x + 68, y + 40, title, { size: 14.5, weight: 700 });
    s += lines(x + 18, y + 72, body, { size: 12.5, gap: 18 });
    s += `<line x1="${x + 18}" y1="${y + 110}" x2="${x + cW - 18}" y2="${y + 110}" stroke="${HAIR}" stroke-width="1"/>`;
    s += txt(x + 18, y + 130, 'MEASURE', { size: 10, weight: 700, fill: INK, spacing: 1.6 });
    s += lines(x + 18, y + 148, [measure], { size: 11.5, gap: 15, fill: INK2 });
  });

  fig('improvement-goals', 452, s);
}

/* ══ scope of implementation ═════════════════════════════════════════════ */
{
  const A = [
    ['PRODUCTS', ['Mobile Experience (MX)', 'Digital Appliances (DA)', 'Audio-Visual (AV)']],
    ['POPULATIONS', ['Field service engineers', 'Front desk receptionists', 'Galaxy Consultants', 'Authorized service partners']],
    ['CYCLES', ['Monthly and quarterly views', 'Accumulated totals', 'Multi-quarter comparison']],
    ['PQA GRANULARITY', ['Partner level', 'Branch level', 'Monthly and accumulated']],
  ];
  const B = [
    ['RECOGNITION', ['Six tiers: Masters · Diamond · Platinum · Gold · Silver · Bronze']],
    ['LANGUAGES', ['English and Egyptian Arabic, including voice input and spoken response']],
    ['DEPLOYMENT', ['Internal Samsung network, with external go-live proposed']],
  ];
  const aW = (CW - 3 * 20) / 4;
  const bW = (CW - 2 * 20) / 3;
  let s = titleBar('SCOPE OF IMPLEMENTATION');

  A.forEach(([label, body], i) => {
    const x = PAD + i * (aW + 20);
    s += box(x, 76, aW, 132, { fill: PAPER });
    s += box(x, 76, aW, 26, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 12, 94, label, { size: 11, weight: 700, fill: PAPER, spacing: 1.5 });
    s += lines(x + 12, 126, body, { size: 12.5, gap: 19, fill: INK2 });
  });

  B.forEach(([label, body], i) => {
    const x = PAD + i * (bW + 20);
    s += box(x, 226, bW, 92, { fill: SOFT });
    s += txt(x + 14, 250, label, { size: 11, weight: 700, fill: INK, spacing: 1.5 });
    s += lines(x + 14, 276, body, { size: 12, gap: 17, fill: INK2 });
  });

  fig('scope', 344, s);
}

/* ══ key functions ═══════════════════════════════════════════════════════ */
{
  // Each module is a list of items; an item is its own array of wrapped lines,
  // so the bullet always sits on the item's first line regardless of length.
  const M = [
    ['ENGINEER & FRONT-DESK PERFORMANCE', [
      ['Individual result card with KPI-level detail,', 'cycle history and tier standing.'],
      ['Ranking across MX, DA and AV; the same tier', 'model applied to receptionists and consultants.'],
      ['Official workbooks imported and validated', 'before any figure is published.'],
    ]],
    ['PQA PARTNER QUALITY', [
      ['Monthly announcement published in the app.'],
      ['Partner view: quarterly and accumulated.'],
      ['Branch view: each branch tracks its own', 'monthly and accumulated data.'],
    ]],
    ['SCORA CHALLENGE', [
      ['Sessions joined by PIN or QR code, up to', '200 concurrent participants.'],
      ['Five question formats, division-specific', 'banks, host-controlled pacing.'],
      ['Scored server-side, so results cannot be', 'altered from a device.'],
    ]],
    ['GOGO AI ASSISTANT', [
      ['Explains the application and guides', 'colleagues through each portal.'],
      ['Answers KPI and process questions in English', 'and Egyptian Arabic, with voice.'],
      ['Notifies users when new technical content is', 'published and routes them to it.'],
    ]],
    ['KNOWLEDGE BASE', [
      ['Employees self-register; content targeted by', 'product line and role.'],
      ['Completion verified on presence time,', 'on-screen interaction and a closing quiz.'],
      ['Mandatory flag with draft, published and', 'archived editorial control.'],
    ]],
    ['ADMINISTRATION & CONTROL', [
      ['Role-based access with module-level', 'permissions by product and function.'],
      ['Every administrative action written to an', 'immutable audit log.'],
      ['Management reporting with controlled export.'],
    ]],
  ];
  const cW = (CW - 2 * 22) / 3;
  let s = titleBar('KEY FUNCTION DETAILS');

  M.forEach(([label, items], i) => {
    const x = PAD + (i % 3) * (cW + 22);
    const y = 76 + Math.floor(i / 3) * 216;
    s += box(x, y, cW, 198, { fill: PAPER });
    s += box(x, y, cW, 28, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 12, y + 19, label, { size: 10.5, weight: 700, fill: PAPER, spacing: 1.3 });
    let ly = y + 56;
    items.forEach((item) => {
      s += `<circle cx="${x + 16}" cy="${ly - 4}" r="2.6" fill="${INK}"/>`;
      s += lines(x + 28, ly, item, { size: 12, gap: 20, fill: INK2 });
      ly += item.length * 20 + 8;
    });
  });

  fig('key-functions', 512, s);
}

/* ══ data utilization ════════════════════════════════════════════════════ */
{
  const SOURCES = [
    'Evaluation results and KPI detail',
    'PQA quality results',
    'Knowledge Base content and progress',
    'Challenge results',
    'Feedback and survey responses',
    'Usage analytics',
  ];
  const CONSUMERS = [
    ['Each colleague', 'Own record only'],
    ['Partners', 'Own partner view'],
    ['Branches', 'Own branch monthly and accumulated'],
    ['Administrators', 'Scoped by product and role'],
    ['Management', 'Reporting with controlled export'],
  ];
  const STAGES = ['Validate on import', 'Store once, single source', 'Authorize every request', 'Disclose to the right holder'];

  const colW = 348;
  const midW = 300;
  const rx = PAD + colW + 96;
  const cx3 = rx + midW + 96;

  let s = titleBar('DATA UTILIZATION  ·  ONE SOURCE, SCOPED DISCLOSURE');

  // Six domains against five consumers: tighter pitch so both columns end level
  // with the platform box at y=360, clear of the boundary band.
  s += txt(PAD, 88, 'DATA DOMAINS', { size: 11, weight: 700, spacing: 1.6 });
  SOURCES.forEach((t, i) => {
    const y = 102 + i * 44;
    s += box(PAD, y, colW, 36, { fill: SOFT });
    s += txt(PAD + 14, y + 23, t, { size: 12.5, fill: INK2 });
  });

  s += txt(rx, 88, 'PLATFORM', { size: 11, weight: 700, spacing: 1.6 });
  s += box(rx, 102, midW, 258, { fill: PAPER, stroke: INK, sw: 1.8 });
  s += box(rx, 102, midW, 30, { fill: INK, stroke: INK, rx: 0 });
  s += txt(rx + midW / 2, 122, 'SCORA', { size: 13, weight: 700, fill: PAPER, anchor: 'middle', spacing: 2.4 });
  STAGES.forEach((t, i) => {
    const y = 152 + i * 50;
    s += box(rx + 16, y, midW - 32, 38, { fill: SOFT2, stroke: HAIR });
    s += txt(rx + midW / 2, y + 24, t, { size: 12, weight: 600, fill: INK, anchor: 'middle' });
    if (i < STAGES.length - 1) s += arrowD(rx + midW / 2, y + 38, 12);
  });

  s += txt(cx3, 88, 'DISCLOSED TO', { size: 11, weight: 700, spacing: 1.6 });
  CONSUMERS.forEach(([t, d], i) => {
    const y = 102 + i * 54;
    s += box(cx3, y, colW, 42, { fill: PAPER });
    s += txt(cx3 + 14, y + 19, t, { size: 12.5, weight: 700 });
    s += txt(cx3 + 14, y + 34, d, { size: 11, fill: GREY });
  });

  s += arrowR(PAD + colW + 18, 230, 60);
  s += arrowR(rx + midW + 18, 230, 60);

  s += band(PAD, 386, CW, 46, 'BOUNDARY',
    'No employee, evaluation or partner record is transmitted to an external AI provider in the current runtime configuration.');

  fig('data-utilization', 456, s);
}

/* ══ recognition tiers ═══════════════════════════════════════════════════ */
{
  const TIERS = [
    ['Bronze', '#FBFBFB', INK],
    ['Silver', '#EDEDED', INK],
    ['Gold', '#D6D6D6', INK],
    ['Platinum', '#B0B0B0', INK],
    ['Diamond', '#5E5E5E', PAPER],
    ['Masters', INK, PAPER],
  ];
  const tW = (CW - 5 * 18) / 6;
  let s = titleBar('RECOGNITION  ·  SIX TIERS ACROSS THE WHOLE POPULATION');

  TIERS.forEach(([label, fill, fg], i) => {
    const x = PAD + i * (tW + 18);
    s += box(x, 92, tW, 72, { fill, stroke: i >= 4 ? INK : HAIR });
    s += txt(x + tW / 2, 126, label.toUpperCase(), {
      size: 14, weight: 700, fill: fg, anchor: 'middle', spacing: 1.6,
    });
    s += txt(x + tW / 2, 148, `TIER ${6 - i}`, {
      size: 9.5, weight: 700, fill: i >= 4 ? '#BFBFBF' : GREY, anchor: 'middle', spacing: 1.4,
    });
    if (i < TIERS.length - 1) s += arrowR(x + tW + 3, 128, 12);
  });

  s += band(PAD, 186, CW, 44, null,
    'Applied identically to field service engineers, front desk receptionists and Galaxy Consultants, so recognition is comparable across every customer-facing role.');

  fig('recognition-tiers', 254, s);
}

/* ══ KPI model ═══════════════════════════════════════════════════════════ */
{
  const Q1 = ['SSR', 'RRR90', 'IQC Skip', 'Core Parts', 'Core Parts Score', 'MPU', 'DRNPS', 'Exam'];
  const Q2 = ['LCD-OCTA', 'PBA', 'Multi Parts', 'RRR30', 'Maintenance', 'OQC'];
  const pW = (CW - 28) / 2;
  let s = titleBar('KPI MODEL  ·  HELD SEPARATELY PER QUARTER');

  [['Q1 EVALUATION SET', Q1, PAD], ['Q2 EVALUATION SET', Q2, PAD + pW + 28]].forEach(([label, set, x]) => {
    s += box(x, 78, pW, 196, { fill: PAPER });
    s += box(x, 78, pW, 28, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 14, 97, label, { size: 11, weight: 700, fill: PAPER, spacing: 1.5 });
    const per = 4;
    const kW = (pW - 28 - (per - 1) * 10) / per;
    set.forEach((k, i) => {
      const kx = x + 14 + (i % per) * (kW + 10);
      const ky = 124 + Math.floor(i / per) * 44;
      s += chip(kx, ky, kW, 34, k, { size: 11.5, fill: SOFT });
    });
    s += txt(x + 14, 252, `${set.length} indicators, each with its own weight`, { size: 11.5, fill: GREY, italic: true });
  });

  s += band(PAD, 292, CW, 44, null,
    'The final result is the average of the available quarterly results, so a colleague sees both the components and the outcome.');

  fig('kpi-model', 360, s);
}

/* ══ economic position ═══════════════════════════════════════════════════ */
{
  const ROWS = [
    ['Software license', 'NONE REQUIRED'],
    ['External development vendor', 'NONE ENGAGED'],
    ['External quiz platform', 'SUBSCRIPTION RETIRED'],
    ['Translation and bilingual content', 'PRODUCED IN-HOUSE'],
    ['Infrastructure', 'NO PROCUREMENT'],
  ];
  let s = titleBar('ECONOMIC POSITION');

  ROWS.forEach(([label, value], i) => {
    const y = 80 + i * 50;
    s += box(PAD, y, CW, 40, { fill: i % 2 ? PAPER : SOFT });
    s += txt(PAD + 18, y + 26, label, { size: 13.5, weight: 600, fill: INK });
    s += chip(PAD + CW - 254, y + 5, 236, 30, value, { solid: true, size: 11 });
  });

  s += band(PAD, 336, CW, 46, 'DELIVERY',
    'Seven functional phases released across seven months, by the project owners with approved AI assistance and no external vendor.');

  fig('economic-position', 406, s);
}

/* ══ sequencing / roadmap ════════════════════════════════════════════════ */
{
  const STAGES = [
    ['STAGE 1', ['Complete adoption across all', 'populations and establish the', 'disclosure rhythm each cycle.'], ['Every colleague informed of', 'their own standing continuously.']],
    ['STAGE 2', ['External go-live on a', 'Samsung-governed server,', 'activating mobile and', 'notification reach.'], ['Live interaction for partners', 'and colleagues outside the', 'office.']],
    ['STAGE 3', ['Integrate the approved', 'generative AI service alongside', 'GoGo, subject to RHQ', 'approval.'], ['Broader assistant coverage', 'with governance preserved.']],
    ['STAGE 4', ['Correlate knowledge', 'consumption with KPI', 'movement, then add', 'trend-based early indication.'], ['Preventive coaching rather', 'than retrospective review.']],
    ['STAGE 5', ['Onboard additional', 'subsidiaries by configuration.'], ['Regional reuse and', 'comparative impact', 'measurement.']],
  ];
  const sW = (CW - 4 * 22) / 5;
  let s = titleBar('SEQUENCING  ·  FIVE STAGES, EACH BUILDING ON WHAT EXISTS');

  STAGES.forEach(([label, action, outcome], i) => {
    const x = PAD + i * (sW + 22);
    s += box(x, 80, sW, 230, { fill: PAPER });
    s += box(x, 80, sW, 26, { fill: INK, stroke: INK, rx: 0 });
    s += txt(x + 12, 98, label, { size: 11, weight: 700, fill: PAPER, spacing: 1.6 });
    s += lines(x + 14, 130, action, { size: 12, gap: 17, fill: INK });
    const oy = 130 + action.length * 17 + 14;
    s += `<line x1="${x + 14}" y1="${oy}" x2="${x + sW - 14}" y2="${oy}" stroke="${HAIR}" stroke-width="1"/>`;
    s += txt(x + 14, oy + 20, 'OUTCOME', { size: 9.5, weight: 700, fill: INK, spacing: 1.5 });
    s += lines(x + 14, oy + 38, outcome, { size: 11.5, gap: 16, fill: GREY });
    if (i < STAGES.length - 1) s += arrowR(x + sW + 4, 195, 14);
  });

  fig('sequencing', 336, s);
}

/* ── render ──────────────────────────────────────────────────────────────── */

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const { name, height, body } of FIGS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}">
    <rect width="${W}" height="${height}" fill="${PAPER}"/>
    ${body}
  </svg>`;
  const out = path.join(OUT_DIR, `${name}.png`);
  await sharp(Buffer.from(svg), { density: 200 }).resize({ width: 2200 }).png().toFile(out);
  console.log(`${name}.png  ${W}x${height}  ratio ${(W / height).toFixed(3)}`);
}
console.log(`\n${FIGS.length} figures written to ${OUT_DIR}`);
