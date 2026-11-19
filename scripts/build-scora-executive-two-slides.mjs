/**
 * Professional 2-slide SCORA executive deck — black background.
 * Run: node scripts/build-scora-executive-two-slides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'SCORA_Executive_Two_Slides_v2.pptx');

const C = {
  bg: '000000',
  card: '121212',
  line: '2A2A2A',
  cyan: '00D4FF',
  gold: 'EAB308',
  orange: 'F97316',
  blue: '3B82F6',
  green: '22C55E',
  purple: 'A855F7',
  white: 'FFFFFF',
  soft: 'C8C8C8',
  mute: '888888',
  redSoft: 'F87171',
};

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE_HD', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE_HD';
pptx.author = 'Samsung EG · SCORA';
pptx.title = 'SCORA — Executive Overview (2 slides)';
pptx.company = 'Samsung Customer Service Egypt';

function asset(name) {
  const p = path.join(ROOT, 'public', name);
  return fs.existsSync(p) ? p : null;
}

function box(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: opts.r ?? 0.06,
    fill: { color: opts.fill || C.card },
    line: { color: opts.line || C.line, pt: opts.pt ?? 1 },
  });
}

function accentBar(slide, x, y, h, color = C.cyan) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.07,
    h,
    fill: { color },
    line: { color, pt: 0 },
  });
}

function label(slide, x, y, w, text, color = C.cyan) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.26,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color,
    charSpacing: 1.4,
  });
}

const scoraLogo = asset('scora_logo.jpg');
const tcsLogo = asset('fawzy-logo.png');
const pqaLogo = asset('pqa_logo.png');
const challengeLogo = asset('scora_challenge_logo.jpg');

// ═══════════════════════════════════════════════════════════
// SLIDE 1 — SCORA meaning + ranking features + service stack
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };

  // Header
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 1.2,
    fill: { color: '080808' },
    line: { color: '080808', pt: 0 },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 1.2,
    w: 13.333,
    h: 0.03,
    fill: { color: C.cyan },
    line: { color: C.cyan, pt: 0 },
  });

  if (scoraLogo) {
    s.addImage({ path: scoraLogo, x: 0.35, y: 0.12, w: 2.5, h: 0.95 });
  } else {
    s.addText('SCORA', {
      x: 0.45,
      y: 0.3,
      w: 2.4,
      h: 0.55,
      fontFace: 'Segoe UI',
      fontSize: 28,
      bold: true,
      color: C.gold,
    });
  }

  s.addText('SAMSUNG COMPETITIVE ONLINE RANKING & ASSESSMENT', {
    x: 3.05,
    y: 0.28,
    w: 9.8,
    h: 0.38,
    fontFace: 'Segoe UI',
    fontSize: 16,
    bold: true,
    color: C.white,
    charSpacing: 0.6,
  });
  s.addText('Samsung Egypt service performance hub — ranking, competition, learning and employee voice in one app.', {
    x: 3.05,
    y: 0.7,
    w: 9.6,
    h: 0.32,
    fontFace: 'Segoe UI',
    fontSize: 12,
    color: C.soft,
  });

  // Meaning strip (once only)
  box(s, 0.35, 1.4, 12.65, 0.48, { fill: '0D0D0D', line: C.cyan, pt: 1.1 });
  s.addText(
    [
      { text: 'SCORA  =  ', options: { bold: true, color: C.cyan } },
      { text: 'S', options: { bold: true, color: C.white } },
      { text: 'amsung · ', options: { color: C.soft } },
      { text: 'C', options: { bold: true, color: C.white } },
      { text: 'ompetitive · ', options: { color: C.soft } },
      { text: 'O', options: { bold: true, color: C.white } },
      { text: 'nline · ', options: { color: C.soft } },
      { text: 'R', options: { bold: true, color: C.white } },
      { text: 'anking & ', options: { color: C.soft } },
      { text: 'A', options: { bold: true, color: C.white } },
      { text: 'ssessment', options: { color: C.soft } },
    ],
    {
      x: 0.5,
      y: 1.48,
      w: 12.35,
      h: 0.32,
      fontFace: 'Segoe UI',
      fontSize: 13,
      align: 'center',
    },
  );

  // LEFT — Feature 01 with 3 logos including Challenge
  label(s, 0.35, 2.05, 7, 'FEATURE 01  ·  TCS · PQA · SCORA CHALLENGE');
  box(s, 0.35, 2.35, 7.35, 4.7);

  // Three logos row
  if (tcsLogo) s.addImage({ path: tcsLogo, x: 0.55, y: 2.5, w: 0.85, h: 0.85 });
  if (pqaLogo) s.addImage({ path: pqaLogo, x: 1.55, y: 2.5, w: 0.85, h: 0.85 });
  if (challengeLogo) {
    s.addImage({ path: challengeLogo, x: 2.55, y: 2.55, w: 1.55, h: 0.75 });
  }

  s.addText('Engineer & Partner Evaluation + Live Competition', {
    x: 4.3,
    y: 2.55,
    w: 3.2,
    h: 0.35,
    fontFace: 'Segoe UI',
    fontSize: 12,
    bold: true,
    color: C.white,
  });
  s.addText('TCS: Quarterly  ·  PQA: Monthly  ·  Challenge: Live PIN games', {
    x: 4.3,
    y: 2.95,
    w: 3.2,
    h: 0.3,
    fontFace: 'Segoe UI',
    fontSize: 10,
    color: C.cyan,
  });

  s.addText(
    'Search by engineer code or ASC / service-centre code to view personal KPIs or branch KPIs — privately and on demand.\n\nRanking tiers Bronze → Masters ignite competition so every person can close the gap, not only podium winners.',
    {
      x: 0.55,
      y: 3.5,
      w: 6.95,
      h: 1.05,
      fontFace: 'Segoe UI',
      fontSize: 12,
      color: C.soft,
    },
  );

  // Challenge explain block inside left card
  box(s, 0.55, 4.65, 6.95, 1.0, { fill: '1A1208', line: C.orange, pt: 1 });
  s.addText('SCORA CHALLENGE', {
    x: 0.7,
    y: 4.75,
    w: 6.6,
    h: 0.25,
    fontFace: 'Segoe UI',
    fontSize: 11,
    bold: true,
    color: C.orange,
  });
  s.addText(
    'Fully organized live quiz system for all employees — speed and focus. Hosted with a shared game code. Already in use across products.',
    {
      x: 0.7,
      y: 5.05,
      w: 6.6,
      h: 0.5,
      fontFace: 'Segoe UI',
      fontSize: 11,
      color: C.soft,
    },
  );

  // As was / As is
  box(s, 0.55, 5.8, 3.3, 1.05, { fill: '1A1010', line: '4A2020' });
  s.addText('AS WAS', {
    x: 0.7,
    y: 5.9,
    w: 3.0,
    h: 0.22,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color: C.redSoft,
  });
  s.addText('Focus on winners only. Others never knew how close they were.', {
    x: 0.7,
    y: 6.2,
    w: 3.0,
    h: 0.5,
    fontFace: 'Segoe UI',
    fontSize: 11,
    color: C.soft,
  });

  box(s, 4.05, 5.8, 3.45, 1.05, { fill: '0A1A12', line: '1A4A30' });
  s.addText('AS IS', {
    x: 4.2,
    y: 5.9,
    w: 3.1,
    h: 0.22,
    fontFace: 'Segoe UI',
    fontSize: 10,
    bold: true,
    color: C.green,
  });
  s.addText('Every engineer sees his evaluation — improve, compete, rise.', {
    x: 4.2,
    y: 6.2,
    w: 3.1,
    h: 0.5,
    fontFace: 'Segoe UI',
    fontSize: 11,
    color: C.soft,
  });

  // RIGHT — service stack (Challenge removed → E-Learning)
  label(s, 7.95, 2.05, 5, 'ONE PLATFORM  ·  FULL SERVICE STACK');
  const feats = [
    {
      t: 'E-LEARNING FOR ENGINEERS',
      d: 'Knowledge base for engineers to keep up with the wave — technical tips, consultants and continuous learning.',
      c: C.purple,
    },
    {
      t: 'SURVEYS & FEEDBACK',
      d: 'Employee VOCs — opinions and points of view on trainings and service quality.',
      c: C.blue,
    },
    {
      t: 'ASK GOGO',
      d: 'AI assistant trained to help employees across SCORA usage — ongoing learning companion.',
      c: C.cyan,
    },
    {
      t: 'ADMIN PORTAL',
      d: 'All services controlled from one UI — ranking data, Challenge, surveys, knowledge and accounts.',
      c: C.gold,
    },
  ];
  feats.forEach((f, i) => {
    const y = 2.35 + i * 1.15;
    box(s, 7.95, y, 5.0, 1.05);
    accentBar(s, 7.95, y, 1.05, f.c);
    s.addText(f.t, {
      x: 8.2,
      y: y + 0.12,
      w: 4.55,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: C.white,
    });
    s.addText(f.d, {
      x: 8.2,
      y: y + 0.44,
      w: 4.55,
      h: 0.5,
      fontFace: 'Segoe UI',
      fontSize: 11,
      color: C.soft,
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 2 — Impact, ROI, Direct / Indirect, feedback, +5% once
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 1.05,
    fill: { color: '080808' },
    line: { color: '080808', pt: 0 },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 1.05,
    w: 13.333,
    h: 0.03,
    fill: { color: C.gold },
    line: { color: C.gold, pt: 0 },
  });

  if (scoraLogo) {
    s.addImage({ path: scoraLogo, x: 0.3, y: 0.12, w: 2.1, h: 0.8 });
  }

  s.addText('EXPECTED BUSINESS IMPACT  ·  ROI', {
    x: 2.6,
    y: 0.22,
    w: 10.2,
    h: 0.35,
    fontFace: 'Segoe UI',
    fontSize: 20,
    bold: true,
    color: C.white,
    charSpacing: 1,
  });
  s.addText('Measurable performance lift, cost & time savings, and stronger employee engagement.', {
    x: 2.6,
    y: 0.6,
    w: 10,
    h: 0.28,
    fontFace: 'Segoe UI',
    fontSize: 12,
    color: C.soft,
  });

  // Hero +5% once
  box(s, 0.35, 1.25, 3.55, 2.15, { fill: '0A1510', line: C.green, pt: 1.4 });
  label(s, 0.5, 1.38, 3.2, 'ENGINEER IMPROVE RATE', C.green);
  s.addText('+5%', {
    x: 0.5,
    y: 1.7,
    w: 3.2,
    h: 0.75,
    fontFace: 'Segoe UI',
    fontSize: 48,
    bold: true,
    color: C.white,
  });
  s.addText('Q2 vs Q1 — engineers know their weakness points and close the gap.', {
    x: 0.5,
    y: 2.55,
    w: 3.2,
    h: 0.65,
    fontFace: 'Segoe UI',
    fontSize: 12,
    color: C.soft,
  });

  // ROI / cost & time savings
  label(s, 4.15, 1.25, 5, 'ROI  ·  COST & TIME SAVINGS');
  const rois = [
    { t: 'Self-serve lookup', d: 'Less ops time chasing Excel / chat screenshots for “where am I?”' },
    { t: 'Faster feedback loop', d: 'Personal KPIs between announcement cycles — act before next quarter.' },
    { t: 'In-house Challenge', d: 'No external quiz tooling cost — already live for all products.' },
    { t: 'One Admin UI', d: 'Ranking, quizzes, VOCs, knowledge and access from a single portal.' },
  ];
  rois.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 4.15 + col * 4.5;
    const y = 1.55 + row * 0.9;
    box(s, x, y, 4.35, 0.8);
    accentBar(s, x, y, 0.8, C.cyan);
    s.addText(r.t, {
      x: x + 0.25,
      y: y + 0.1,
      w: 3.95,
      h: 0.25,
      fontFace: 'Segoe UI',
      fontSize: 12,
      bold: true,
      color: C.white,
    });
    s.addText(r.d, {
      x: x + 0.25,
      y: y + 0.38,
      w: 3.95,
      h: 0.35,
      fontFace: 'Segoe UI',
      fontSize: 11,
      color: C.soft,
    });
  });

  // Direct / Indirect impact (from reference image)
  label(s, 0.35, 3.55, 6, 'EXPECTED BUSINESS IMPACT');

  // Direct column
  box(s, 0.35, 3.85, 6.2, 2.85);
  box(s, 0.55, 4.0, 5.8, 0.45, { fill: '1A1A1A' });
  s.addText('DIRECT  ·  APP', {
    x: 0.55,
    y: 4.08,
    w: 5.8,
    h: 0.3,
    fontFace: 'Segoe UI',
    fontSize: 13,
    bold: true,
    color: C.white,
    align: 'center',
  });

  const direct = [
    { t: 'Improved and more stable RNPS scores.', d: '' },
    { t: 'Measurable performance improvement.', d: 'Competitive mode & upscale.' },
    { t: 'Prohibit any multiple use of same account.', d: 'Get genuine results.' },
  ];
  direct.forEach((item, i) => {
    const y = 4.6 + i * 0.65;
    s.addShape(pptx.ShapeType.ellipse, {
      x: 0.7,
      y: y + 0.05,
      w: 0.16,
      h: 0.16,
      fill: { type: 'none' },
      line: { color: C.cyan, pt: 1.2 },
    });
    s.addText(item.t, {
      x: 1.05,
      y,
      w: 5.2,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 13,
      bold: true,
      color: C.white,
    });
    if (item.d) {
      s.addText(item.d, {
        x: 1.05,
        y: y + 0.28,
        w: 5.2,
        h: 0.25,
        fontFace: 'Segoe UI',
        fontSize: 11,
        color: C.mute,
      });
    }
  });

  // Indirect column
  box(s, 6.8, 3.85, 6.15, 2.85);
  box(s, 7.0, 4.0, 5.75, 0.45, { fill: '1A1A1A' });
  s.addText('IN-DIRECT  ·  PROJECT', {
    x: 7.0,
    y: 4.08,
    w: 5.75,
    h: 0.3,
    fontFace: 'Segoe UI',
    fontSize: 13,
    bold: true,
    color: C.white,
    align: 'center',
  });

  const indirect = [
    { t: 'Cost reduction.', d: 'Core parts & multi-parts used more effectively.' },
    { t: 'Decrease return cases.', d: 'Improve in repair quality & result.' },
    { t: 'Stronger engagement.', d: 'Partners ask for SCORA on HO visits; more Challenge demand.' },
  ];
  indirect.forEach((item, i) => {
    const y = 4.6 + i * 0.65;
    s.addShape(pptx.ShapeType.ellipse, {
      x: 7.15,
      y: y + 0.05,
      w: 0.16,
      h: 0.16,
      fill: { type: 'none' },
      line: { color: C.gold, pt: 1.2 },
    });
    s.addText(item.t, {
      x: 7.5,
      y,
      w: 5.2,
      h: 0.28,
      fontFace: 'Segoe UI',
      fontSize: 13,
      bold: true,
      color: C.white,
    });
    s.addText(item.d, {
      x: 7.5,
      y: y + 0.28,
      w: 5.2,
      h: 0.25,
      fontFace: 'Segoe UI',
      fontSize: 11,
      color: C.mute,
    });
  });

  s.addText('Samsung EG Customer Service  ·  SCORA', {
    x: 0.35,
    y: 7.15,
    w: 12.6,
    h: 0.22,
    fontFace: 'Segoe UI',
    fontSize: 10,
    color: C.mute,
  });
}

await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${OUT}`);
