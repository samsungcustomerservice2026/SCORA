/**
 * Build the AX Award submission deck for RHQ top management.
 * Run: node scripts/build-ax-award-pptx.mjs
 *
 * Editorial rules for this deck:
 *  - Prior practice is described neutrally. SCORA extends the established
 *    programs; it does not correct them.
 *  - No external AI product is named. Approved AI tooling is referred to generically.
 *  - Every slide uses a distinct layout. Exactly one table in the whole deck.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Superseded by build-ax-award-pptx.mjs (5-slide executive deck). Retained as a
// long-form appendix deck; writes to its own file so the two never collide.
const OUT = path.join(ROOT, 'docs', 'SCORA_AX_Award_Appendix_Detailed.pptx');
const DIAGRAM = path.join(ROOT, 'docs', 'assets', 'scora-workflow.png');

const BLUE = '1428A0';
const DARK = '0B1F3A';
const NAVY = '132A4D';
const TEXT = '1A1A1A';
const MUTED = '5A6472';
const CYAN = '00A9E0';
const GOLD = 'C9A227';
const LIGHT = 'F2F5FA';
const LINE = 'C9D2DD';
const FONT = 'Segoe UI';
const TODAY = new Date().toISOString().slice(0, 10);

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Samsung Electronics Egypt — Customer Service';
pptx.company = 'Samsung Electronics Egypt';
pptx.title = 'SCORA — AX Award Submission (RHQ)';

const X = 0.45;
const W = 9.1;

/* ── chrome ──────────────────────────────────────────────────────────────── */

function footer(slide, { dark = false } = {}) {
  slide.addText('SCORA  ·  AX Award Submission  ·  Confidential — Internal Use Only', {
    x: X,
    y: 5.18,
    w: W,
    h: 0.26,
    fontSize: 7.5,
    color: dark ? '5B6B82' : MUTED,
    fontFace: FONT,
  });
}

/** Section tag + title + hairline. Returns the y where content may start. */
function frame(slide, { tag, step, title, lead }) {
  if (tag) {
    slide.addText(
      [
        { text: step ? `${step} ` : '', options: { bold: true, color: CYAN } },
        { text: tag, options: { bold: true, color: BLUE } },
      ],
      { x: X, y: 0.3, w: W, h: 0.26, fontSize: 9, fontFace: FONT, charSpacing: 1.5 },
    );
  }
  slide.addText(title, {
    x: X,
    y: 0.58,
    w: W,
    h: 0.48,
    fontSize: 23,
    bold: true,
    color: DARK,
    fontFace: FONT,
  });
  let y = 1.16;
  if (lead) {
    slide.addText(lead, {
      x: X,
      y: 1.1,
      w: W,
      h: 0.34,
      fontSize: 11,
      color: MUTED,
      fontFace: FONT,
    });
    y = 1.54;
  }
  slide.addShape(pptx.ShapeType.rect, {
    x: X,
    y: y - 0.12,
    w: W,
    h: 0.012,
    fill: { color: LINE },
    line: { width: 0 },
  });
  footer(slide);
  return y + 0.1;
}

/* ── 1 · HERO ────────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  s.background = { color: DARK };
  // Diagonal accent block
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: 5.63, fill: { color: BLUE }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: 6.9, y: 0, w: 3.1, h: 5.63, fill: { color: NAVY }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: 6.9, y: 0, w: 0.03, h: 5.63, fill: { color: CYAN }, line: { width: 0 } });

  s.addText('SAMSUNG ELECTRONICS EGYPT  ·  CUSTOMER SERVICE', {
    x: 0.62, y: 0.8, w: 6.0, h: 0.3, fontSize: 10, color: CYAN, fontFace: FONT, charSpacing: 2,
  });
  s.addText('SCORA', {
    x: 0.6, y: 1.35, w: 6.0, h: 1.15, fontSize: 66, bold: true, color: 'FFFFFF', fontFace: FONT,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.64, y: 2.5, w: 1.3, h: 0.05, fill: { color: CYAN }, line: { width: 0 } });
  s.addText('Service Competency & Operational Readiness Application', {
    x: 0.6, y: 2.7, w: 6.0, h: 0.6, fontSize: 15, bold: true, color: 'FFFFFF', fontFace: FONT,
  });
  s.addText(
    'One platform that turns service performance data into visible, self-service capability development for every engineer, front-desk colleague and service partner.',
    { x: 0.6, y: 3.35, w: 6.0, h: 0.9, fontSize: 11.5, color: 'AEBDD0', fontFace: FONT },
  );
  s.addText('AI TRANSFORMATION (AX) AWARD', {
    x: 0.6, y: 4.4, w: 6.0, h: 0.28, fontSize: 10.5, bold: true, color: 'FFFFFF', fontFace: FONT, charSpacing: 1.5,
  });
  s.addText(`Prepared for RHQ Top Management  ·  ${TODAY}`, {
    x: 0.6, y: 4.7, w: 6.0, h: 0.28, fontSize: 9.5, color: '7E90A8', fontFace: FONT,
  });

  // Right rail: the seven phases as a vertical ladder
  s.addText('SEVEN DELIVERY PHASES', {
    x: 7.15, y: 0.8, w: 2.6, h: 0.26, fontSize: 8.5, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.2,
  });
  const rail = [
    'Engineer results portal',
    'Ranking & tier system',
    'PQA partner tracking',
    'Front desk & consultants',
    'SCORA Challenge',
    'GoGo AI assistant',
    'Knowledge Base & feedback',
  ];
  rail.forEach((label, i) => {
    const y = 1.28 + i * 0.5;
    s.addShape(pptx.ShapeType.ellipse, {
      x: 7.15, y, w: 0.26, h: 0.26,
      fill: { color: i === rail.length - 1 ? CYAN : 'FFFFFF' },
      line: { width: 0 },
    });
    s.addText(String(i + 1), {
      x: 7.15, y, w: 0.26, h: 0.26, fontSize: 9, bold: true,
      color: i === rail.length - 1 ? DARK : BLUE, align: 'center', valign: 'middle', fontFace: FONT,
    });
    s.addText(label, {
      x: 7.5, y: y - 0.02, w: 2.35, h: 0.3, fontSize: 9.5, color: 'D6E0EC', valign: 'middle', fontFace: FONT,
    });
    if (i < rail.length - 1) {
      s.addShape(pptx.ShapeType.rect, {
        x: 7.275, y: y + 0.26, w: 0.012, h: 0.24, fill: { color: '35507A' }, line: { width: 0 },
      });
    }
  });
}

/* ── 2 · AT A GLANCE ─────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'AT A GLANCE',
    title: 'The platform in numbers',
    lead: 'Scope of what is live today across the Customer Service organisation.',
  });
  const tiles = [
    { v: '3', l: 'Products covered', d: 'MX · DA · AV' },
    { v: '4', l: 'Populations served', d: 'Engineers · Front desk · Consultants · Partners' },
    { v: '6', l: 'Recognition tiers', d: 'Masters through Bronze' },
    { v: '7', l: 'Delivery phases', d: 'Released over 7 months' },
    { v: '200', l: 'Live quiz participants', d: 'Per onsite session' },
    { v: '2', l: 'Languages', d: 'English · Egyptian Arabic, with voice' },
  ];
  const cw = (W - 2 * 0.16) / 3;
  const ch = 1.48;
  tiles.forEach((t, i) => {
    const cx = X + (i % 3) * (cw + 0.16);
    const cy = y0 + Math.floor(i / 3) * (ch + 0.18);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: ch, fill: { color: LIGHT }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cw, h: 0.045, fill: { color: i < 3 ? BLUE : CYAN }, line: { width: 0 } });
    s.addText(t.v, { x: cx + 0.16, y: cy + 0.16, w: cw - 0.32, h: 0.6, fontSize: 34, bold: true, color: BLUE, fontFace: FONT });
    s.addText(t.l, { x: cx + 0.16, y: cy + 0.75, w: cw - 0.32, h: 0.26, fontSize: 11, bold: true, color: DARK, fontFace: FONT });
    s.addText(t.d, { x: cx + 0.16, y: cy + 1.0, w: cw - 0.32, h: 0.4, fontSize: 8.5, color: MUTED, fontFace: FONT });
  });
}

/* ── 3 · JOURNEY ─────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'DELIVERY JOURNEY',
    title: 'Seven phases, each released before the next began',
    lead: 'Value accumulated continuously rather than arriving in one launch.',
  });
  const phases = [
    { t: 'Engineer results portal', d: 'Individual performance and KPI detail across MX, DA and AV.' },
    { t: 'Ranking & tier system', d: 'Masters to Bronze — recognition beyond evaluation points alone.' },
    { t: 'PQA module', d: 'Monthly announcement; partner and branch tracking.' },
    { t: 'Front desk & consultants', d: 'Same tier model for receptionists and Galaxy Consultants.' },
    { t: 'SCORA Challenge', d: 'Live quiz platform brought in-house for onsite sessions.' },
    { t: 'GoGo AI assistant', d: 'Guidance, KPI answers and new-content notifications.' },
    { t: 'Knowledge Base & feedback', d: 'Verified training completion and a standing survey.' },
  ];
  const gap = 0.1;
  const cw = (W - gap * (phases.length - 1)) / phases.length;
  const cy = y0 + 0.34;
  const ch = 2.5;
  // progression rail
  s.addShape(pptx.ShapeType.rect, { x: X, y: y0 + 0.12, w: W - 0.3, h: 0.02, fill: { color: LINE }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rightArrow, {
    x: X + W - 0.34, y: y0 + 0.04, w: 0.34, h: 0.18, fill: { color: CYAN }, line: { width: 0 },
  });
  phases.forEach((ph, i) => {
    const cx = X + i * (cw + gap);
    const shade = i / (phases.length - 1);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: ch, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, {
      x: cx, y: cy, w: cw, h: 0.05, fill: { color: shade > 0.66 ? CYAN : shade > 0.33 ? '0E5FB5' : BLUE }, line: { width: 0 },
    });
    s.addShape(pptx.ShapeType.ellipse, {
      x: cx + cw / 2 - 0.16, y: cy + 0.18, w: 0.32, h: 0.32, fill: { color: BLUE }, line: { width: 0 },
    });
    s.addText(String(i + 1), {
      x: cx + cw / 2 - 0.16, y: cy + 0.18, w: 0.32, h: 0.32, fontSize: 10, bold: true,
      color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: FONT,
    });
    s.addText(ph.t, {
      x: cx + 0.07, y: cy + 0.58, w: cw - 0.14, h: 0.62, fontSize: 8.8, bold: true,
      color: DARK, align: 'center', valign: 'top', fontFace: FONT,
    });
    s.addText(ph.d, {
      x: cx + 0.07, y: cy + 1.22, w: cw - 0.14, h: 1.14, fontSize: 7.4, color: MUTED,
      align: 'center', valign: 'top', fontFace: FONT,
    });
  });
}

/* ── 4 · CURRENT SITUATION ───────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'CURRENT SITUATION',
    step: '01',
    title: 'Established programs, and where more value was available',
  });
  // context band
  s.addShape(pptx.ShapeType.rect, { x: X, y: y0, w: W, h: 0.86, fill: { color: LIGHT }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: X, y: y0, w: 0.05, h: 0.86, fill: { color: BLUE }, line: { width: 0 } });
  s.addText(
    'The engineer evaluation program and the Partner Quality Assessment program are mature, governed and continue to run through their official channels. SCORA does not alter either program — it extends how far their results travel.',
    { x: X + 0.2, y: y0 + 0.05, w: W - 0.4, h: 0.76, fontSize: 11, color: DARK, valign: 'middle', fontFace: FONT },
  );

  s.addText('OPPORTUNITIES IDENTIFIED', {
    x: X, y: y0 + 1.02, w: W, h: 0.24, fontSize: 8.5, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
  });

  const cards = [
    { t: 'Visibility beyond the winners', d: 'Colleagues outside the winning group had limited means to view their own standing and the KPI areas to progress next.' },
    { t: 'KPI familiarity', d: 'Understanding of KPI definitions and their weight in the overall result varied between populations.' },
    { t: 'Partner engagement', d: 'Partners wanted to follow PQA outcomes closely — by partner and by branch, monthly and accumulated.' },
    { t: 'Verified knowledge transfer', d: 'The opportunity was to evidence comprehension for each participant, not participation alone.' },
  ];
  const cw = (W - 3 * 0.14) / 4;
  const cy = y0 + 1.32;
  cards.forEach((c, i) => {
    const cx = X + i * (cw + 0.14);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: 1.86, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx + 0.14, y: cy + 0.2, w: 0.3, h: 0.035, fill: { color: CYAN }, line: { width: 0 } });
    s.addText(c.t, { x: cx + 0.14, y: cy + 0.34, w: cw - 0.28, h: 0.5, fontSize: 10.5, bold: true, color: DARK, fontFace: FONT });
    s.addText(c.d, { x: cx + 0.14, y: cy + 0.86, w: cw - 0.28, h: 0.9, fontSize: 8.3, color: MUTED, fontFace: FONT });
  });
}

/* ── 5 · PROBLEM DEFINITION ──────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  s.background = { color: DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: 5.63, fill: { color: CYAN }, line: { width: 0 } });
  s.addText('01  PROBLEM DEFINITION', {
    x: 0.7, y: 0.85, w: 8.6, h: 0.28, fontSize: 9, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.5,
  });
  s.addText(
    'The data existed and was trusted. What was missing was a real-time, individual channel that returned it to each colleague and partner in a form they could act on.',
    { x: 0.7, y: 1.35, w: 8.6, h: 1.5, fontSize: 26, bold: true, color: 'FFFFFF', fontFace: FONT },
  );
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 3.05, w: 1.3, h: 0.05, fill: { color: CYAN }, line: { width: 0 } });
  s.addText(
    'The objective followed directly: keep the established programs exactly as they are, and build a digital layer that delivers the same official outcomes to every participant in real time, links each outcome to the knowledge that improves it, and sustains that momentum continuously rather than once per cycle.',
    { x: 0.7, y: 3.3, w: 8.0, h: 1.2, fontSize: 12.5, color: 'AEBDD0', fontFace: FONT },
  );
  footer(s, { dark: true });
}

/* ── 6 · GOALS ───────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'IMPROVEMENT GOALS',
    step: '02',
    title: 'Six goals, each with a measure',
  });
  const goals = [
    { k: 'G1', t: 'Individual visibility', d: 'Own result and KPI detail on demand.', m: 'Share of population accessing own record.' },
    { k: 'G2', t: 'Recognition at every level', d: 'Tiers recognise standing across the whole population.', m: 'Tier movement cycle on cycle.' },
    { k: 'G3', t: 'KPI capability', d: 'Colleagues can interpret and act on their own numbers.', m: 'Assistant usage and challenge scores on KPI content.' },
    { k: 'G4', t: 'Verified knowledge transfer', d: 'Completion evidenced, not assumed.', m: 'Verified completions per published item.' },
    { k: 'G5', t: 'Partner engagement', d: 'Self-service PQA tracking by partner and branch.', m: 'Views consulted per announcement.' },
    { k: 'G6', t: 'Voice of the employee', d: 'Standing channel for feedback and feature requests.', m: 'Requests converted into releases.' },
  ];
  const cw = (W - 2 * 0.16) / 3;
  const ch = 1.55;
  goals.forEach((g, i) => {
    const cx = X + (i % 3) * (cw + 0.16);
    const cy = y0 + Math.floor(i / 3) * (ch + 0.2);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: ch, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: 0.045, h: ch, fill: { color: BLUE }, line: { width: 0 } });
    s.addText(g.k, { x: cx + 0.16, y: cy + 0.12, w: 0.6, h: 0.26, fontSize: 10, bold: true, color: CYAN, fontFace: FONT });
    s.addText(g.t, { x: cx + 0.16, y: cy + 0.36, w: cw - 0.32, h: 0.5, fontSize: 11, bold: true, color: DARK, fontFace: FONT });
    s.addText(g.d, { x: cx + 0.16, y: cy + 0.82, w: cw - 0.32, h: 0.38, fontSize: 8.4, color: TEXT, fontFace: FONT });
    s.addText(`Measure:  ${g.m}`, {
      x: cx + 0.16, y: cy + 1.18, w: cw - 0.32, h: 0.32, fontSize: 7.6, italic: true, color: MUTED, fontFace: FONT,
    });
  });
}

/* ── 7 · KEY IMPROVEMENT ITEMS ───────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'KEY IMPROVEMENT ITEMS',
    step: '02',
    title: 'What each phase delivered',
  });
  const items = [
    ['1', 'Engineer results portal', 'Authenticated individual access to own performance and KPI detail across MX, DA and AV.'],
    ['2', 'Ranking and tier system', 'Six tiers from Masters to Bronze in addition to evaluation points, creating positive competition across the entire population rather than at the top only.'],
    ['3', 'PQA module', 'Monthly announcement in the app. Each partner tracks quarterly and accumulated results; each branch tracks its own monthly and accumulated data.'],
    ['4', 'Front desk and Galaxy Consultants', 'The same ranking and tier model extended to receptionists and Galaxy Consultants, aligning recognition across all customer-facing roles.'],
    ['5', 'SCORA Challenge', 'Live competency quiz brought in-house, replacing the external tool previously used. Onsite sessions for up to 200 concurrent participants.'],
    ['6', 'GoGo AI assistant', 'Explains and guides colleagues through the application, answers KPI questions in English and Egyptian Arabic, and notifies users of newly published technical content.'],
    ['7', 'Knowledge Base and feedback', 'Employee self-registration, completion verified on three signals, and a standing survey capturing experience and requested future features.'],
  ];
  const rh = 0.47;
  items.forEach((it, i) => {
    const cy = y0 + i * (rh + 0.055);
    if (i % 2 === 0) {
      s.addShape(pptx.ShapeType.rect, { x: X, y: cy, w: W, h: rh, fill: { color: LIGHT }, line: { width: 0 } });
    }
    s.addShape(pptx.ShapeType.ellipse, {
      x: X + 0.1, y: cy + rh / 2 - 0.14, w: 0.28, h: 0.28, fill: { color: BLUE }, line: { width: 0 },
    });
    s.addText(it[0], {
      x: X + 0.1, y: cy + rh / 2 - 0.14, w: 0.28, h: 0.28, fontSize: 9, bold: true,
      color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: FONT,
    });
    s.addText(it[1], {
      x: X + 0.5, y: cy, w: 2.3, h: rh, fontSize: 9.6, bold: true, color: DARK, valign: 'middle', fontFace: FONT,
    });
    s.addText(it[2], {
      x: X + 2.88, y: cy, w: W - 3.0, h: rh, fontSize: 8.5, color: TEXT, valign: 'middle', fontFace: FONT,
    });
  });
}

/* ── 8 · WORKFLOW ────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'WORKFLOW',
    step: '03',
    title: 'The cycle is unchanged. The delivery layer is new.',
    lead: 'SCORA consumes the same official results, then extends how they reach each individual.',
  });

  const panelW = 4.05;
  const arrowW = 0.62;
  const leftX = X;
  const rightX = X + panelW + arrowW + 0.14;

  const panels = [
    {
      x: leftX,
      label: 'ESTABLISHED PRACTICE',
      color: NAVY,
      rows: [
        'Programs compile and announce official results each cycle.',
        'Results delivered through official announcement channels.',
        'Top performers recognised each cycle.',
        'KPI understanding built through briefings and training.',
        'PQA outcomes shared with partners each cycle.',
        'Training reinforcement using an external quiz tool.',
        'Participation recorded.',
      ],
    },
    {
      x: rightX,
      label: 'EXTENDED WITH SCORA',
      color: BLUE,
      rows: [
        'Unchanged — the same official results feed the platform.',
        'Additionally on demand per individual, with full KPI breakdown and history.',
        'Six tiers recognise standing across the whole population, continuously.',
        'Additionally explained on demand by the assistant, linked to knowledge items.',
        'Self-service partner and branch views, monthly and accumulated.',
        'Delivered in-house on SCORA Challenge; results retained internally.',
        'Completion verified by presence, on-screen interaction and a closing quiz.',
      ],
    },
  ];

  panels.forEach((pn) => {
    s.addShape(pptx.ShapeType.rect, { x: pn.x, y: y0, w: panelW, h: 0.36, fill: { color: pn.color }, line: { width: 0 } });
    s.addText(pn.label, {
      x: pn.x + 0.14, y: y0, w: panelW - 0.28, h: 0.36, fontSize: 9, bold: true,
      color: 'FFFFFF', valign: 'middle', fontFace: FONT, charSpacing: 1.2,
    });
    pn.rows.forEach((row, i) => {
      const ry = y0 + 0.44 + i * 0.42;
      s.addShape(pptx.ShapeType.rect, {
        x: pn.x, y: ry, w: panelW, h: 0.39,
        fill: { color: i % 2 === 0 ? 'FFFFFF' : LIGHT },
        line: { color: LINE, width: 0.4 },
      });
      s.addText(row, {
        x: pn.x + 0.12, y: ry, w: panelW - 0.24, h: 0.39, fontSize: 7.9, color: TEXT, valign: 'middle', fontFace: FONT,
      });
    });
  });

  s.addShape(pptx.ShapeType.rightArrow, {
    x: leftX + panelW + 0.09, y: y0 + 1.45, w: arrowW, h: 0.44, fill: { color: CYAN }, line: { width: 0 },
  });

  s.addShape(pptx.ShapeType.rect, { x: X, y: 4.62, w: W, h: 0.42, fill: { color: LIGHT }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: X, y: 4.62, w: 0.05, h: 0.42, fill: { color: CYAN }, line: { width: 0 } });
  s.addText(
    'Net effect: the same trusted data now reaches every individual continuously instead of once per cycle, and arrives with the means to act on it.',
    { x: X + 0.18, y: 4.62, w: W - 0.36, h: 0.42, fontSize: 10, bold: true, color: DARK, valign: 'middle', fontFace: FONT },
  );
}

/* ── 8b · WORKFLOW DIAGRAM (full bleed) ──────────────────────────────────── */
{
  const s = pptx.addSlide();
  s.background = { color: '071224' };
  s.addImage({ path: DIAGRAM, x: 0, y: 0, w: 10, h: 5.63 });
  footer(s, { dark: true });
}

/* ── 9 · SCOPE ───────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, { tag: 'SCOPE OF IMPLEMENTATION', step: '04', title: 'Who and what the platform covers' });

  // Products
  s.addText('PRODUCTS', { x: X, y: y0, w: 2.0, h: 0.24, fontSize: 8.5, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2 });
  ['Mobile Experience (MX)', 'Digital Appliances (DA)', 'Audio-Visual (AV)'].forEach((t, i) => {
    const cw = (W - 2 * 0.14) / 3;
    const cx = X + i * (cw + 0.14);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: y0 + 0.28, w: cw, h: 0.52, fill: { color: NAVY }, line: { width: 0 }, rectRadius: 0.05,
    });
    s.addText(t, {
      x: cx, y: y0 + 0.28, w: cw, h: 0.52, fontSize: 11, bold: true,
      color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: FONT,
    });
  });

  // Populations
  s.addText('POPULATIONS SERVED', {
    x: X, y: y0 + 0.96, w: 3.0, h: 0.24, fontSize: 8.5, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
  });
  const pops = [
    { t: 'Field service engineers', d: 'Performance, KPI detail and tier standing across all three products.' },
    { t: 'Front desk receptionists', d: 'Evaluated and ranked on the same tier model.' },
    { t: 'Galaxy Consultants', d: 'Evaluated and ranked on the same tier model.' },
    { t: 'Authorised service partners', d: 'PQA results by partner and by branch.' },
  ];
  const pw = (W - 3 * 0.14) / 4;
  pops.forEach((pp, i) => {
    const cx = X + i * (pw + 0.14);
    const cy = y0 + 1.26;
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: pw, h: 1.5, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: pw, h: 0.045, fill: { color: CYAN }, line: { width: 0 } });
    s.addText(pp.t, { x: cx + 0.14, y: cy + 0.2, w: pw - 0.28, h: 0.52, fontSize: 10.5, bold: true, color: DARK, fontFace: FONT });
    s.addText(pp.d, { x: cx + 0.14, y: cy + 0.74, w: pw - 0.28, h: 0.66, fontSize: 8.2, color: MUTED, fontFace: FONT });
  });

  // Footer chips
  const chips = [
    'Cycles: monthly · quarterly · accumulated',
    'Recognition: Masters → Bronze (6 tiers)',
    'Languages: English · Egyptian Arabic',
    'Out of scope: payroll · HR master data · customer records',
  ];
  const chw = (W - 3 * 0.12) / 4;
  chips.forEach((c, i) => {
    const cx = X + i * (chw + 0.12);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: 4.42, w: chw, h: 0.56, fill: { color: LIGHT }, line: { color: LINE, width: 0.5 }, rectRadius: 0.06,
    });
    s.addText(c, {
      x: cx + 0.1, y: 4.42, w: chw - 0.2, h: 0.56, fontSize: 8, color: DARK, valign: 'middle', fontFace: FONT,
    });
  });
}

/* ── 10 · KEY FUNCTIONS A ────────────────────────────────────────────────── */
function functionSlide(step, title, lead, groups) {
  const s = pptx.addSlide();
  const y0 = frame(s, { tag: 'KEY FUNCTION DETAILS', step, title, lead });
  const gw = (W - (groups.length - 1) * 0.16) / groups.length;
  groups.forEach((g, i) => {
    const cx = X + i * (gw + 0.16);
    s.addShape(pptx.ShapeType.rect, { x: cx, y: y0, w: gw, h: 0.42, fill: { color: BLUE }, line: { width: 0 } });
    s.addText(g.title, {
      x: cx + 0.14, y: y0, w: gw - 0.28, h: 0.42, fontSize: 10.5, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: FONT,
    });
    s.addShape(pptx.ShapeType.rect, {
      x: cx, y: y0 + 0.42, w: gw, h: 2.9, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 },
    });
    s.addText(
      g.points.map((pt) => ({
        text: pt,
        options: { bullet: { indent: 14 }, breakLine: true, fontSize: 8.6, color: TEXT },
      })),
      { x: cx + 0.14, y: y0 + 0.56, w: gw - 0.28, h: 2.66, fontFace: FONT, paraSpaceAfter: 5, valign: 'top' },
    );
  });
  return s;
}

functionSlide('04', 'Performance, quality and recognition', 'How results reach each individual and each partner.', [
  {
    title: 'Engineer & front-desk performance',
    points: [
      'Individual result card with KPI-level detail, cycle history and tier standing.',
      'Ranking across MX, DA and AV, with the same tier model applied to receptionists and Galaxy Consultants.',
      'Official evaluation workbooks imported and validated before any figure is published.',
      'Monthly and quarterly views with accumulated comparison.',
    ],
  },
  {
    title: 'PQA partner quality',
    points: [
      'Monthly announcement published inside the app.',
      'Partner view: quarterly and accumulated results.',
      'Branch view: each branch tracks its own monthly and accumulated data.',
      'Ranking by partner and by centre.',
    ],
  },
  {
    title: 'Recognition model',
    points: [
      'Six tiers: Masters, Diamond, Platinum, Gold, Silver, Bronze.',
      'Applied consistently to engineers, receptionists and Galaxy Consultants.',
      'Recognises progress at every level, not first place only.',
      'Standing is visible continuously, not once per announcement.',
    ],
  },
]);

/* ── 11 · KEY FUNCTIONS B ────────────────────────────────────────────────── */
functionSlide('04', 'Capability, guidance and voice', 'How colleagues build and evidence capability.', [
  {
    title: 'SCORA Challenge',
    points: [
      'Live sessions joined by PIN or QR code, up to 200 concurrent participants.',
      'Five question formats with product-specific question banks.',
      'Scoring calculated on the server, so results are authoritative and cannot be altered from a device.',
      'Live leaderboard and podium for onsite sessions, with results retained for analysis.',
    ],
  },
  {
    title: 'GoGo AI assistant',
    points: [
      'Explains the application and guides colleagues through each portal.',
      'Answers KPI definition and process questions in English and Egyptian Arabic.',
      'Voice input and spoken response for hands-busy field use.',
      'Notifies users when new technical consultant content is published and routes them to it.',
    ],
  },
  {
    title: 'Knowledge Base & feedback',
    points: [
      'Employees self-register; content targeted by product line and role.',
      'Completion verified on three signals: presence time, on-screen interaction, and a closing quiz that must be passed.',
      'Items can be marked mandatory, with draft, published and archived control.',
      'Standing survey captures training experience and requested future features.',
    ],
  },
]);

/* ── 12 · AI UTILISATION ─────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'AI UTILISATION',
    step: '05',
    title: 'AI applied at two distinct levels',
    lead: 'The separation between build time and runtime is deliberate, and it is what keeps the data position clean.',
  });

  // Level 1
  s.addShape(pptx.ShapeType.rect, { x: X, y: y0, w: W, h: 1.42, fill: { color: NAVY }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: X, y: y0, w: 0.05, h: 1.42, fill: { color: CYAN }, line: { width: 0 } });
  s.addText('LEVEL 1  ·  AI AS THE DELIVERY ENGINE  (BUILD TIME)', {
    x: X + 0.2, y: y0 + 0.12, w: W - 0.4, h: 0.26, fontSize: 9, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.2,
  });
  s.addText(
    'SCORA was designed, built and refined using enterprise-approved AI assistants under the internal tooling policy. This is the substance of the AX contribution: AI did not add a feature to an existing system — AI is what made a platform of this scope deliverable by one business owner in seven months, with no external development vendor and no software licence cost.',
    { x: X + 0.2, y: y0 + 0.4, w: 5.6, h: 0.95, fontSize: 9.6, color: 'D6E0EC', fontFace: FONT },
  );
  ['Full application architecture and implementation', 'Ranking, tier and scoring logic', 'Bilingual content with no translation cost', 'Question bank and knowledge structuring'].forEach(
    (t, i) => {
      s.addText(`▸  ${t}`, {
        x: 6.1, y: y0 + 0.4 + i * 0.24, w: 3.35, h: 0.24, fontSize: 8.4, color: 'FFFFFF', fontFace: FONT,
      });
    },
  );

  // Level 2
  const y2 = y0 + 1.58;
  s.addShape(pptx.ShapeType.rect, { x: X, y: y2, w: W, h: 1.42, fill: { color: LIGHT }, line: { color: LINE, width: 0.5 } });
  s.addShape(pptx.ShapeType.rect, { x: X, y: y2, w: 0.05, h: 1.42, fill: { color: BLUE }, line: { width: 0 } });
  s.addText('LEVEL 2  ·  AI INSIDE THE RUNNING APPLICATION  (RUNTIME)', {
    x: X + 0.2, y: y2 + 0.12, w: W - 0.4, h: 0.26, fontSize: 9, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
  });
  s.addText(
    'The GoGo assistant answers from curated internal content through a guided, deterministic model. Because every answer originates from a verified internal item, it is attributable and auditable — an answer can be traced to its source and corrected there.',
    { x: X + 0.2, y: y2 + 0.4, w: 5.6, h: 0.95, fontSize: 9.6, color: TEXT, fontFace: FONT },
  );
  ['Guidance and navigation', 'KPI explanation from the verified definition set', 'Knowledge Base retrieval', 'New-content notification', 'Bilingual answers with voice'].forEach((t, i) => {
    s.addText(`▸  ${t}`, {
      x: 6.1, y: y2 + 0.36 + i * 0.2, w: 3.35, h: 0.2, fontSize: 8.2, color: DARK, fontFace: FONT,
    });
  });

  // Governance strip
  s.addShape(pptx.ShapeType.rect, { x: X, y: 4.62, w: W, h: 0.42, fill: { color: DARK }, line: { width: 0 } });
  s.addText(
    'No employee, evaluation or partner record is transmitted to an external AI provider at runtime. All processing stays inside the Samsung-controlled environment.',
    { x: X + 0.18, y: 4.62, w: W - 0.36, h: 0.42, fontSize: 9.6, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: FONT },
  );
}

/* ── 13 · DATA UTILISATION (the one table) ───────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, { tag: 'DATA UTILISATION', step: '05', title: 'Data domains, purpose and access' });
  const headers = ['Data domain', 'Purpose', 'Access'];
  const rows = [
    ['Evaluation results and KPI detail', 'Individual disclosure, ranking and tier assignment, management reporting.', 'Each colleague sees only their own record; administrators by product and role.'],
    ['PQA quality results', 'Monthly announcement; partner and branch tracking.', 'Partner and branch views; administrative access for publication.'],
    ['Knowledge Base content and progress', 'Capability building and verified completion.', 'Read for registered employees; publication restricted to editors and above.'],
    ['Challenge results', 'Measuring knowledge retention and training effectiveness.', 'Scored server-side; analysis for administrators.'],
    ['Feedback and survey responses', 'Training improvement and the future feature roadmap.', 'Aggregated analysis for administrators.'],
    ['Usage analytics', 'Adoption measurement and engagement analysis.', 'Administrative reporting only.'],
  ];
  s.addTable(
    [
      headers.map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: BLUE }, fontSize: 9.5 } })),
      ...rows.map((r, i) =>
        r.map((c) => ({ text: c, options: { color: TEXT, fill: { color: i % 2 ? LIGHT : 'FFFFFF' }, fontSize: 8.6 } })),
      ),
    ],
    {
      x: X, y: y0, w: W, colW: [2.5, 3.3, 3.3],
      border: { type: 'solid', color: LINE, pt: 0.5 },
      fontFace: FONT, valign: 'middle', margin: 5, autoPage: false,
    },
  );

  const gov = [
    'Authentication through Samsung Firebase Authentication for employees and administrators.',
    'Server-side authorisation on every privileged request.',
    'Deny-by-default data access with least-privilege grants per domain.',
    'Score-bearing operations computed server-side only.',
    'Every administrative action recorded in an immutable audit log.',
  ];
  s.addText('GOVERNANCE', {
    x: X, y: 3.92, w: 2.0, h: 0.24, fontSize: 8.5, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
  });
  s.addText(
    gov.map((g) => ({ text: g, options: { bullet: { indent: 14 }, breakLine: true, fontSize: 8.4, color: TEXT } })),
    { x: X + 0.05, y: 4.16, w: W - 0.1, h: 0.9, fontFace: FONT, paraSpaceAfter: 3, valign: 'top' },
  );
}

/* ── 14 · IMPACT — DEMAND SIGNALS ────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, {
    tag: 'IMPACT',
    step: '06',
    title: 'Engagement is now pulled by the users, not pushed to them',
    lead: 'The strongest evidence of impact is that colleagues and partners actively seek the platform out.',
  });

  const heroes = [
    {
      k: 'SIGNAL 01  ·  PARTNERS',
      t: 'Partners seek out the platform',
      d: 'Service partners now anticipate their onsite visit to Head Office specifically in order to use the application and review their own PQA standing. The quality programme has become something partners actively pursue rather than simply receive.',
    },
    {
      k: 'SIGNAL 02  ·  COLLEAGUES',
      t: 'Colleagues request more training',
      d: 'Engineers and front-desk colleagues ask for additional training sessions at the office so they can compete in SCORA Challenge and climb the ranking ladder. Training demand is now generated by the population itself rather than scheduled onto it.',
    },
  ];
  const hw = (W - 0.18) / 2;
  heroes.forEach((h, i) => {
    const cx = X + i * (hw + 0.18);
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: y0, w: hw, h: 1.72, fill: { color: LIGHT }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: y0, w: 0.055, h: 1.72, fill: { color: CYAN }, line: { width: 0 } });
    s.addText(h.k, {
      x: cx + 0.2, y: y0 + 0.12, w: hw - 0.4, h: 0.24, fontSize: 8, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
    });
    s.addText(h.t, { x: cx + 0.2, y: y0 + 0.36, w: hw - 0.4, h: 0.34, fontSize: 14, bold: true, color: DARK, fontFace: FONT });
    s.addText(h.d, { x: cx + 0.2, y: y0 + 0.74, w: hw - 0.4, h: 0.9, fontSize: 9, color: TEXT, fontFace: FONT });
  });

  s.addText('SUPPORTING SIGNALS', {
    x: X, y: y0 + 1.86, w: 3.0, h: 0.22, fontSize: 8.5, bold: true, color: BLUE, fontFace: FONT, charSpacing: 1.2,
  });
  const chips = [
    { t: 'Standing is a shared conversation', d: 'Tier position is discussed between peers, so improvement targets are increasingly self-set.' },
    { t: 'Review time shifts to improvement', d: 'Colleagues arrive already knowing their KPI position, so discussion moves to how to improve.' },
    { t: 'New content reaches its audience', d: 'The assistant notifies users on publication, without a separate distribution effort.' },
    { t: 'The roadmap is field-driven', d: 'Requested features arrive continuously through the in-app survey.' },
  ];
  const cw = (W - 3 * 0.12) / 4;
  chips.forEach((c, i) => {
    const cx = X + i * (cw + 0.12);
    const cy = y0 + 2.12;
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: 1.1, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 }, rectRadius: 0.05,
    });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cw, h: 0.04, fill: { color: BLUE }, line: { width: 0 } });
    s.addText(c.t, { x: cx + 0.12, y: cy + 0.14, w: cw - 0.24, h: 0.42, fontSize: 9.4, bold: true, color: DARK, fontFace: FONT });
    s.addText(c.d, { x: cx + 0.12, y: cy + 0.56, w: cw - 0.24, h: 0.5, fontSize: 7.6, color: MUTED, fontFace: FONT });
  });
}

/* ── 15 · RETURN ON INVESTMENT ───────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  const y0 = frame(s, { tag: 'RETURN ON INVESTMENT', step: '06', title: 'Economic, operational and strategic return' });

  const cols = [
    {
      title: 'Economic',
      tint: NAVY,
      points: [
        'No software licence cost.',
        'No external development vendor — delivered by one business owner with approved AI assistance.',
        'External quiz platform subscription no longer required; capability brought in-house.',
        'No external translation cost — bilingual content produced internally.',
        'No additional infrastructure procurement.',
      ],
    },
    {
      title: 'Operational',
      tint: BLUE,
      points: [
        'Official results reach every individual continuously instead of once per cycle.',
        'Training investment becomes measurable, because completion is evidenced.',
        'Knowledge is standardised and retained through staff rotation.',
        'Partner quality results are self-service, reducing distribution effort.',
        'All administrative activity is auditable.',
      ],
    },
    {
      title: 'Strategic',
      tint: '0E5FB5',
      points: [
        'Recognition operates across the whole population, extending motivation beyond the winners.',
        'Configuration-driven by product and role, so reuse carries negligible marginal cost.',
        'Establishes an internal reference model for innovation delivered through approved AI.',
        'Creates a common basis for comparing impact across subsidiaries.',
      ],
    },
  ];
  const cw = (W - 2 * 0.16) / 3;
  cols.forEach((c, i) => {
    const cx = X + i * (cw + 0.16);
    s.addShape(pptx.ShapeType.rect, { x: cx, y: y0, w: cw, h: 0.42, fill: { color: c.tint }, line: { width: 0 } });
    s.addText(c.title, {
      x: cx + 0.14, y: y0, w: cw - 0.28, h: 0.42, fontSize: 11.5, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: FONT,
    });
    s.addShape(pptx.ShapeType.rect, {
      x: cx, y: y0 + 0.42, w: cw, h: 2.32, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 0.5 },
    });
    s.addText(
      c.points.map((pt) => ({
        text: pt,
        options: { bullet: { indent: 14 }, breakLine: true, fontSize: 8.5, color: TEXT },
      })),
      { x: cx + 0.14, y: y0 + 0.56, w: cw - 0.28, h: 2.1, fontFace: FONT, paraSpaceAfter: 5, valign: 'top' },
    );
  });

  s.addShape(pptx.ShapeType.rect, { x: X, y: 4.42, w: W, h: 0.6, fill: { color: LIGHT }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: X, y: 4.42, w: 0.05, h: 0.6, fill: { color: GOLD }, line: { width: 0 } });
  s.addText('INDICATORS TO QUANTIFY', {
    x: X + 0.18, y: 4.48, w: 2.4, h: 0.2, fontSize: 8, bold: true, color: DARK, fontFace: FONT, charSpacing: 1.1,
  });
  s.addText(
    'Share of population accessing own result  ·  tier movement between cycles  ·  verified training completions per item  ·  challenge sessions and score trend  ·  partner and branch views per announcement  ·  feature requests released',
    { x: X + 0.18, y: 4.68, w: W - 0.4, h: 0.3, fontSize: 8.2, color: TEXT, fontFace: FONT },
  );
}

/* ── 16 · FUTURE PLAN & EXPANSION ────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  s.background = { color: DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: 5.63, fill: { color: CYAN }, line: { width: 0 } });
  s.addText('07  FUTURE PLAN AND EXPANSION', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.28, fontSize: 9, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.5,
  });
  s.addText('Three expansion tracks, each building on capability already in the platform', {
    x: 0.7, y: 0.94, w: 8.6, h: 0.5, fontSize: 21, bold: true, color: 'FFFFFF', fontFace: FONT,
  });

  const tracks = [
    {
      n: '01',
      t: 'Go live externally',
      s: 'Live interaction beyond the office',
      d: 'Publish on a Samsung-governed server so partners and colleagues can interact in real time from partner premises, branches and the field — not only on the internal network.',
      f: 'Mobile installation and notification are already built and activate with go-live.',
    },
    {
      n: '02',
      t: 'Generative AI alongside GoGo',
      s: 'Broader question coverage',
      d: 'Integrate an approved generative AI service (for example Gemini) to answer free-form questions where the curated knowledge base holds no entry yet.',
      f: 'GoGo keeps KPI definitions, navigation and internal content, so official answers stay verified. Subject to RHQ approval of the endpoint.',
    },
    {
      n: '03',
      t: 'Expand to subsidiaries',
      s: 'Regional reuse and comparison',
      d: 'Extend to additional subsidiaries in the region. Product, role, KPI and tier models are configuration-driven, so onboarding is configuration rather than redevelopment.',
      f: 'Enables comparative ROI and impact measurement across subsidiaries at negligible marginal cost.',
    },
  ];
  const cw = (8.6 - 2 * 0.18) / 3;
  tracks.forEach((tr, i) => {
    const cx = 0.7 + i * (cw + 0.18);
    s.addShape(pptx.ShapeType.rect, { x: cx, y: 1.66, w: cw, h: 2.62, fill: { color: NAVY }, line: { width: 0 } });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: 1.66, w: cw, h: 0.05, fill: { color: CYAN }, line: { width: 0 } });
    s.addText(tr.n, { x: cx + 0.16, y: 1.78, w: 0.8, h: 0.34, fontSize: 17, bold: true, color: CYAN, fontFace: FONT });
    s.addText(tr.t, { x: cx + 0.16, y: 2.14, w: cw - 0.32, h: 0.34, fontSize: 12.5, bold: true, color: 'FFFFFF', fontFace: FONT });
    s.addText(tr.s, { x: cx + 0.16, y: 2.48, w: cw - 0.32, h: 0.22, fontSize: 8, italic: true, color: CYAN, fontFace: FONT });
    s.addText(tr.d, { x: cx + 0.16, y: 2.74, w: cw - 0.32, h: 0.86, fontSize: 8.4, color: 'D6E0EC', fontFace: FONT });
    s.addShape(pptx.ShapeType.rect, { x: cx + 0.16, y: 3.64, w: cw - 0.32, h: 0.012, fill: { color: '35507A' }, line: { width: 0 } });
    s.addText(tr.f, { x: cx + 0.16, y: 3.7, w: cw - 0.32, h: 0.52, fontSize: 7.6, color: '9FB1C7', fontFace: FONT });
  });

  s.addText('SEQUENCING', {
    x: 0.7, y: 4.42, w: 1.6, h: 0.22, fontSize: 8, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.1,
  });
  const seq = ['Complete adoption', 'External go-live', 'Generative AI alongside GoGo', 'Predictive early indication', 'Subsidiary onboarding'];
  const sw = (8.6 - 4 * 0.1) / 5;
  seq.forEach((st, i) => {
    const cx = 0.7 + i * (sw + 0.1);
    s.addShape(pptx.ShapeType.rect, { x: cx, y: 4.66, w: sw, h: 0.36, fill: { color: '1B3760' }, line: { width: 0 } });
    s.addText(`${i + 1}.  ${st}`, {
      x: cx + 0.08, y: 4.66, w: sw - 0.16, h: 0.36, fontSize: 7.6, color: 'D6E0EC', valign: 'middle', fontFace: FONT,
    });
  });
  footer(s, { dark: true });
}

/* ── 17 · CLOSING ────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  s.background = { color: DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: 5.63, fill: { color: BLUE }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: 6.9, y: 0, w: 3.1, h: 5.63, fill: { color: NAVY }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.rect, { x: 6.9, y: 0, w: 0.03, h: 5.63, fill: { color: CYAN }, line: { width: 0 } });

  s.addText('IN SUMMARY', {
    x: 0.7, y: 1.15, w: 5.9, h: 0.28, fontSize: 9, bold: true, color: CYAN, fontFace: FONT, charSpacing: 1.5,
  });
  s.addText('The same trusted data, now working for everyone who generates it.', {
    x: 0.7, y: 1.5, w: 5.9, h: 1.2, fontSize: 26, bold: true, color: 'FFFFFF', fontFace: FONT,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 2.85, w: 1.3, h: 0.05, fill: { color: GOLD }, line: { width: 0 } });
  s.addText(
    'SCORA establishes an internal reference model for innovation delivered through approved AI: a production platform serving three products and four populations, built inside policy, at no licence or vendor cost — and now pulled forward by the very people it was built for.',
    { x: 0.7, y: 3.08, w: 5.9, h: 1.3, fontSize: 12.5, color: 'AEBDD0', fontFace: FONT },
  );

  const pillars = [
    { v: '3', l: 'Products' },
    { v: '4', l: 'Populations' },
    { v: '7', l: 'Delivery phases' },
    { v: '3', l: 'Expansion tracks' },
  ];
  pillars.forEach((p2, i) => {
    const cy = 1.15 + i * 0.86;
    s.addText(p2.v, { x: 7.2, y: cy, w: 0.8, h: 0.5, fontSize: 30, bold: true, color: CYAN, fontFace: FONT });
    s.addText(p2.l, { x: 7.95, y: cy + 0.14, w: 1.9, h: 0.3, fontSize: 10, color: 'D6E0EC', valign: 'middle', fontFace: FONT });
  });
  footer(s, { dark: true });
}

/* ── write ───────────────────────────────────────────────────────────────── */

await pptx.writeFile({ fileName: OUT });
console.log('Wrote', OUT);
