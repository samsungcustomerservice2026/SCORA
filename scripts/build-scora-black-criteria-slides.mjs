/**
 * Two SCORA executive slides — dark “black criteria” modular format
 * (cyan frames, ROI bar) inspired by Parts Alternative Bank layout.
 *
 * Run: node scripts/build-scora-black-criteria-slides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'SCORA_Black_Criteria_Two_Slides.pptx');

const C = {
  bg: '05070D',
  panel: '0A101C',
  card: '0E1524',
  cyan: '00D4FF',
  cyanDim: '1A3A4A',
  white: 'FFFFFF',
  soft: 'B8C5D6',
  mute: '7A8BA3',
  gold: 'EAB308',
  orange: 'F97316',
  blue: '3B82F6',
};

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE_HD', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE_HD';
pptx.author = 'Samsung EG · SCORA';
pptx.title = 'SCORA — Black Criteria Executive Slides';
pptx.company = 'Samsung Customer Service Egypt';

function frame(slide) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.22,
    y: 0.2,
    w: 12.9,
    h: 7.1,
    rectRadius: 0.06,
    fill: { color: C.panel },
    line: { color: C.cyan, pt: 1.5 },
  });
}

function box(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.04,
    fill: { color: opts.fill || C.card },
    line: { color: opts.line || C.cyanDim, pt: opts.linePt || 1 },
  });
}

function hLabel(slide, x, y, w, text, color = C.cyan) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 11,
    bold: true,
    color,
    charSpacing: 1.2,
  });
}

function body(slide, x, y, w, h, text, size = 11) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: 'Segoe UI',
    fontSize: size,
    color: C.soft,
    valign: 'top',
  });
}

function logoPath(name) {
  const p = path.join(ROOT, 'public', name);
  return fs.existsSync(p) ? p : null;
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — SCORA PLATFORM (system overview + how it works + ROI)
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  frame(s);

  s.addText('SCORA PLATFORM', {
    x: 0.45,
    y: 0.38,
    w: 8.5,
    h: 0.42,
    fontFace: 'Segoe UI',
    fontSize: 28,
    bold: true,
    color: C.white,
    charSpacing: 1.4,
  });
  s.addText('One gateway for service performance — fair, visible, and personal.', {
    x: 0.45,
    y: 0.82,
    w: 8.2,
    h: 0.32,
    fontFace: 'Segoe UI',
    fontSize: 13,
    color: C.mute,
  });

  s.addText('SAMSUNG EG  ·  CUSTOMER SERVICE', {
    x: 8.6,
    y: 0.45,
    w: 4.2,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color: C.cyan,
    align: 'right',
    charSpacing: 1,
  });

  // Left visual panel
  box(s, 0.45, 1.3, 4.35, 3.55, { line: C.cyan, linePt: 1.25 });
  const challengeLogo = logoPath('scora_challenge_logo.jpg');
  const tcsLogo = logoPath('fawzy-logo.png');
  const pqaLogo = logoPath('pqa_logo.png');
  if (challengeLogo) {
    s.addImage({ path: challengeLogo, x: 0.7, y: 1.5, w: 3.85, h: 1.85 });
  } else {
    s.addText('SCORA', {
      x: 0.7,
      y: 1.9,
      w: 3.85,
      h: 0.8,
      fontFace: 'Segoe UI',
      fontSize: 36,
      bold: true,
      color: C.gold,
      align: 'center',
    });
  }
  if (tcsLogo) s.addImage({ path: tcsLogo, x: 0.85, y: 3.5, w: 0.95, h: 0.95 });
  if (pqaLogo) s.addImage({ path: pqaLogo, x: 2.05, y: 3.5, w: 0.95, h: 0.95 });
  s.addText('TCS  ·  PQA  ·  CHALLENGE  ·  GOGO', {
    x: 0.7,
    y: 4.5,
    w: 3.85,
    h: 0.25,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color: C.cyan,
    align: 'center',
    charSpacing: 0.8,
  });

  // WHY WE BUILT IT
  box(s, 0.45, 5.0, 4.35, 1.05);
  hLabel(s, 0.6, 5.1, 4, 'WHY WE BUILT IT');
  body(
    s,
    0.6,
    5.4,
    4.05,
    0.55,
    'Results existed each cycle — but rarely reached the individual with the KPI story behind the rank. SCORA carries performance the last mile.',
    10,
  );

  // HOW IT WORKS — 3 columns
  hLabel(s, 5.05, 1.28, 7.5, 'HOW IT WORKS');
  const how = [
    { n: '01', t: 'INGEST & RANK', d: 'Excel / workbook import into TCS & PQA. Scores, tiers and ladders refresh by division and period.' },
    { n: '02', t: 'PERSONAL PROOF', d: 'Engineer or centre code unlocks a live dossier — rank, KPIs, history — not a static announcement.' },
    { n: '03', t: 'COACH & COMPETE', d: 'GoGo explains KPIs in EN/AR. SCORA Challenge runs live quizzes with a shared game PIN.' },
  ];
  how.forEach((col, i) => {
    const x = 5.05 + i * 2.55;
    box(s, x, 1.6, 2.4, 1.85);
    s.addText(col.n, {
      x: x + 0.14,
      y: 1.72,
      w: 2.1,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 14,
      bold: true,
      color: C.cyan,
    });
    s.addText(col.t, {
      x: x + 0.14,
      y: 2.05,
      w: 2.1,
      h: 0.35,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: C.white,
    });
    body(s, x + 0.14, 2.45, 2.1, 0.85, col.d, 10);
  });

  // PLATFORM BENEFITS
  hLabel(s, 5.05, 3.6, 7.5, 'PLATFORM BENEFITS');
  const bens = [
    { t: 'TRANSPARENCY', d: 'Same rules for MX · DA · AV and PQA MX · CE. Visible tiers and podiums.' },
    { t: 'SPEED', d: 'Self-serve lookup replaces chase-the-Excel and group-chat screenshots.' },
    { t: 'ENGAGEMENT', d: 'Challenge + GoGo keep learning inside SCORA — not an external tool.' },
  ];
  bens.forEach((col, i) => {
    const x = 5.05 + i * 2.55;
    box(s, x, 3.92, 2.4, 1.35);
    s.addText(col.t, {
      x: x + 0.14,
      y: 4.05,
      w: 2.1,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 11,
      bold: true,
      color: C.cyan,
    });
    body(s, x + 0.14, 4.4, 2.1, 0.75, col.d, 10);
  });

  // APPLICABLE FOR
  box(s, 5.05, 5.4, 7.5, 0.65, { line: C.cyan, linePt: 1 });
  s.addText(
    [
      { text: 'APPLICABLE FOR   ', options: { bold: true, color: C.cyan } },
      {
        text: 'Field engineers  ·  Receptionists  ·  Galaxy Consultants  ·  Authorised partners  ·  CS Head Office',
        options: { color: C.soft },
      },
    ],
    {
      x: 5.2,
      y: 5.55,
      w: 7.2,
      h: 0.35,
      fontFace: 'Segoe UI',
      fontSize: 11,
    },
  );

  // ROI BAR
  box(s, 0.45, 6.2, 12.4, 0.9, { fill: '071018', line: C.cyan, linePt: 1.25 });
  hLabel(s, 0.6, 6.28, 3, 'SCORA VALUE SIGNALS', C.cyan);
  const rois1 = [
    { v: '4', l: 'PORTALS\nTCS · PQA · Challenge · Admin' },
    { v: '3+2', l: 'DIVISIONS\nTCS MX/DA/AV · PQA MX/CE' },
    { v: '1 CODE', l: 'PERSONAL ACCESS\nDossier on demand' },
    { v: 'LIVE PIN', l: 'SCORA CHALLENGE\nHosted quiz in-house' },
    { v: 'EN + AR', l: 'GOGO ASSISTANT\nGuide · KPIs · voice' },
  ];
  rois1.forEach((r, i) => {
    const x = 0.55 + i * 2.45;
    s.addText(r.v, {
      x,
      y: 6.52,
      w: 2.3,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 16,
      bold: true,
      color: C.white,
    });
    s.addText(r.l, {
      x,
      y: 6.78,
      w: 2.3,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 8,
      color: C.mute,
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — JOURNEY & IMPACT (different type: before/after + flow)
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  frame(s);

  s.addText('SCORA JOURNEY & IMPACT', {
    x: 0.45,
    y: 0.38,
    w: 9,
    h: 0.42,
    fontFace: 'Segoe UI',
    fontSize: 26,
    bold: true,
    color: C.white,
    charSpacing: 1.2,
  });
  s.addText('From fragmented files to a governed performance experience.', {
    x: 0.45,
    y: 0.82,
    w: 9,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 13,
    color: C.mute,
  });
  s.addText('EARN YOUR TIER  ·  OWN YOUR TITLE', {
    x: 8.3,
    y: 0.45,
    w: 4.5,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color: C.gold,
    align: 'right',
    charSpacing: 1,
  });

  // USER PATH
  hLabel(s, 0.45, 1.25, 8, 'USER PATH');
  const steps = [
    { n: '1', t: 'GATEWAY', d: 'Pick TCS, PQA or SCORA Challenge' },
    { n: '2', t: 'DIVISION', d: 'MX · DA · AV  or  PQA MX · CE' },
    { n: '3', t: 'LADDER', d: 'Podium + full ranking by period' },
    { n: '4', t: 'VERIFY', d: 'Code unlocks personal dossier' },
    { n: '5', t: 'LEARN', d: 'GoGo tips · Challenge PIN game' },
  ];
  steps.forEach((st, i) => {
    const x = 0.45 + i * 2.5;
    box(s, x, 1.55, 2.35, 1.35, { line: C.cyan, linePt: 1 });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.14,
      y: 1.68,
      w: 0.34,
      h: 0.34,
      fill: { color: C.cyan },
      line: { color: C.cyan, pt: 0 },
    });
    s.addText(st.n, {
      x: x + 0.14,
      y: 1.7,
      w: 0.34,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: C.bg,
      align: 'center',
    });
    s.addText(st.t, {
      x: x + 0.55,
      y: 1.7,
      w: 1.65,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: C.white,
    });
    body(s, x + 0.14, 2.2, 2.05, 0.55, st.d, 10);
  });

  // AS WAS vs AS IS
  hLabel(s, 0.45, 3.1, 6, 'OPERATING SHIFT');
  box(s, 0.45, 3.4, 6.1, 2.0);
  s.addText('AS WAS', {
    x: 0.65,
    y: 3.55,
    w: 2.6,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 12,
    bold: true,
    color: C.mute,
  });
  s.addText('AS IS — SCORA', {
    x: 3.55,
    y: 3.55,
    w: 2.8,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 12,
    bold: true,
    color: C.cyan,
  });
  const shifts = [
    ['Excel / chat screenshots', 'Live ladder + personal dossier'],
    ['KPI meaning in briefings only', 'GoGo explains on demand (EN/AR)'],
    ['External quiz tooling', 'In-house Challenge with game PIN'],
    ['Hard to prove own result', 'Code verification · transparent tier'],
  ];
  shifts.forEach((row, i) => {
    const y = 3.95 + i * 0.32;
    s.addText(row[0], {
      x: 0.65,
      y,
      w: 2.7,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 10,
      color: C.mute,
    });
    s.addText('→', {
      x: 3.3,
      y,
      w: 0.25,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 10,
      color: C.cyan,
    });
    s.addText(row[1], {
      x: 3.55,
      y,
      w: 2.8,
      h: 0.3,
      fontFace: 'Segoe UI',
      fontSize: 10,
      color: C.soft,
    });
  });

  // RIGHT: CAPABILITIES STACK
  hLabel(s, 6.8, 3.1, 5.8, 'CAPABILITY STACK');
  const caps = [
    { t: 'TCS ENGINE', d: 'Engineer ranking · tiers · winners by division', c: C.blue },
    { t: 'PQA AUDIT', d: 'Partner & service-centre quality ladder', c: C.gold },
    { t: 'SCORA CHALLENGE', d: 'Live host · PIN join · podium results', c: C.orange },
    { t: 'GOGO + KNOWLEDGE', d: 'Guided help · taught Q&A · consultants', c: C.cyan },
  ];
  caps.forEach((cap, i) => {
    const y = 3.4 + i * 0.5;
    box(s, 6.8, y, 5.95, 0.45);
    s.addShape(pptx.ShapeType.rect, {
      x: 6.8,
      y,
      w: 0.08,
      h: 0.45,
      fill: { color: cap.c },
      line: { color: cap.c, pt: 0 },
    });
    s.addText(cap.t, {
      x: 7.05,
      y: y + 0.04,
      w: 2.6,
      h: 0.35,
      fontFace: 'Segoe UI',
      fontSize: 11,
      bold: true,
      color: C.white,
      valign: 'middle',
    });
    s.addText(cap.d, {
      x: 9.6,
      y: y + 0.04,
      w: 2.95,
      h: 0.35,
      fontFace: 'Segoe UI',
      fontSize: 10,
      color: C.soft,
      valign: 'middle',
    });
  });

  // ROI / IMPACT BAR
  box(s, 0.45, 5.6, 12.4, 1.5, { fill: '071018', line: C.cyan, linePt: 1.25 });
  hLabel(s, 0.6, 5.72, 4, 'OBSERVED IMPACT');
  const rois2 = [
    { v: 'SELF-SERVE', l: 'Individuals check own rank\nwithout ops chase' },
    { v: 'ONE APP', l: 'TCS + PQA + Challenge\n+ surveys in one hub' },
    { v: 'FAIR RULES', l: 'Division KPI models\nheld per period' },
    { v: 'DEMAND', l: 'Partners ask for SCORA\non HO visits' },
    { v: 'READY', l: 'Governed Firebase\n· Vercel · admin ACL' },
  ];
  rois2.forEach((r, i) => {
    const x = 0.6 + i * 2.45;
    s.addText(r.v, {
      x,
      y: 6.1,
      w: 2.3,
      h: 0.32,
      fontFace: 'Segoe UI',
      fontSize: 14,
      bold: true,
      color: C.cyan,
    });
    s.addText(r.l, {
      x,
      y: 6.45,
      w: 2.3,
      h: 0.5,
      fontFace: 'Segoe UI',
      fontSize: 10,
      color: C.soft,
    });
  });
}

await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${OUT}`);
