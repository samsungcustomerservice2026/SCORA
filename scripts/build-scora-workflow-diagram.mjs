/**
 * Render the SCORA workflow diagram (hub-and-spoke circuit style) to PNG.
 *
 * Two variants are produced from one definition:
 *   scora-workflow.png       cyan/navy — used by the Word submission
 *   scora-workflow-mono.png  greyscale — used by the black & white deck
 *
 * Run: node scripts/build-scora-workflow-diagram.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'assets');

const W = 1600;
const H = 900;
const FONT = "'Segoe UI','Tahoma',Arial,sans-serif";

/* Hub geometry */
const HX = 800;
const HY = 330;
const HR = 104;

/* Panels: one input at top, two at hub level, three across the bottom. */
const INPUT = { x: 570, y: 40, w: 460, h: 74 };

const SIDE_Y = 240;
const SIDE_H = 180;
const LEFT = { x: 56, y: SIDE_Y, w: 420, h: SIDE_H };
const RIGHT = { x: 1124, y: SIDE_Y, w: 420, h: SIDE_H };

const BOT_Y = 580;
const BOT_H = 180;
const BOT_W = 452;
const BOT = [
  { x: 56, y: BOT_Y, w: BOT_W, h: BOT_H },
  { x: 574, y: BOT_Y, w: BOT_W, h: BOT_H },
  { x: 1092, y: BOT_Y, w: BOT_W, h: BOT_H },
];

/* Palettes ----------------------------------------------------------------- */

const COLOUR = {
  file: 'scora-workflow.png',
  bg: ['#0A1730', '#071224', '#040C1A'],
  halo: '#1B5C99',
  hub: ['#134B7E', '#08182C'],
  trace: '#00C8F0',
  panelFill: '#0B1B33',
  title: '#FFFFFF',
  body: '#9FB6D1',
  accents: ['#00C8F0', '#F0A030', '#4FD1A5', '#00C8F0', '#9B8CFF'],
  input: '#2C7BE5',
  hubLabel: '#00C8F0',
};

/** Ink-on-paper variant for the white Word template. Glows are suppressed. */
const PAPER = {
  file: 'scora-workflow-paper.png',
  flat: true,
  bg: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
  halo: '#FFFFFF',
  hub: ['#1A1A1A', '#111111'],
  trace: '#4A4A4A',
  panelFill: '#F4F4F4',
  title: '#111111',
  body: '#5A5A5A',
  accents: ['#111111', '#111111', '#111111', '#111111', '#111111'],
  input: '#111111',
  hubLabel: '#CFCFCF',
  hubTitle: '#FFFFFF',
};

const MONO = {
  file: 'scora-workflow-mono.png',
  bg: ['#151515', '#0D0D0D', '#080808'],
  halo: '#4A4A4A',
  hub: ['#3A3A3A', '#101010'],
  trace: '#D8D8D8',
  panelFill: '#151515',
  title: '#FFFFFF',
  body: '#9A9A9A',
  accents: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
  input: '#FFFFFF',
  hubLabel: '#C8C8C8',
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Content ------------------------------------------------------------------ */

const CONTENT = [
  {
    b: LEFT,
    title: 'INDIVIDUAL RESULTS & KPI DETAIL',
    lines: [
      'Own result, KPI breakdown, cycle history',
      'Engineers · Front desk · Galaxy Consultants',
      'Mobile Experience · Digital Appliances · AV',
    ],
    badge: { label: 'KPI', cx: LEFT.x + LEFT.w, cy: SIDE_Y + SIDE_H / 2 },
  },
  {
    b: RIGHT,
    title: 'PQA PARTNER QUALITY',
    lines: [
      'Monthly announcement inside the app',
      'Partner: quarterly and accumulated',
      'Branch: own monthly and accumulated data',
    ],
    badge: { label: 'PQA', cx: RIGHT.x, cy: SIDE_Y + SIDE_H / 2 },
  },
  {
    b: BOT[0],
    title: 'RANKING & RECOGNITION',
    lines: [
      'Six tiers, Masters through Bronze',
      'Applied across all customer-facing roles',
      'Standing visible continuously, not per cycle',
    ],
    badge: { label: 'TIER', cx: BOT[0].x + 74, cy: BOT_Y },
  },
  {
    b: BOT[1],
    title: 'GOGO AI ASSISTANT',
    lines: [
      'Guides and explains the platform',
      'KPI answers in English and Egyptian Arabic',
      'Notifies users of new technical content',
    ],
    badge: { label: 'AI', cx: BOT[1].x + 74, cy: BOT_Y },
  },
  {
    b: BOT[2],
    title: 'CAPABILITY & VOICE',
    lines: [
      'SCORA Challenge — live quiz, up to 200',
      'Knowledge Base — verified completion',
      'Standing survey for experience and requests',
    ],
    badge: { label: 'KB', cx: BOT[2].x + 74, cy: BOT_Y },
  },
];

/* Renderer ----------------------------------------------------------------- */

function buildSvg(P) {
  const flat = P.flat === true;

  const panel = (b, accent) => `
    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="14"
          fill="${P.panelFill}" fill-opacity="${flat ? 1 : 0.55}" stroke="${accent}" stroke-opacity="0.85" stroke-width="${flat ? 1.6 : 2}"/>
    ${flat ? '' : `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="14"
          fill="none" stroke="${accent}" stroke-opacity="0.24" stroke-width="7" filter="url(#soft)"/>`}`;

  const boxText = (b, title, lines, accent) => {
    const tx = b.x + 26;
    let out = `<text x="${tx}" y="${b.y + 36}" font-family="${FONT}" font-size="19"
        font-weight="700" fill="${accent}" letter-spacing="0.8">${esc(title)}</text>`;
    lines.forEach((ln, i) => {
      out += `<text x="${tx}" y="${b.y + 68 + i * 26}" font-family="${FONT}" font-size="14.5"
          fill="${P.body}">${esc(ln)}</text>`;
    });
    return out;
  };

  const badge = (cx, cy, label, accent) => `
    ${flat ? '' : `<circle cx="${cx}" cy="${cy}" r="26" fill="${accent}" fill-opacity="0.20" filter="url(#soft)"/>`}
    <circle cx="${cx}" cy="${cy}" r="21" fill="${P.bg[2]}" stroke="${accent}" stroke-width="2.2"/>
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="${FONT}"
          font-size="${label.length > 3 ? 10.5 : 12}" font-weight="700" fill="${accent}">${esc(label)}</text>`;

  const trace = (points, dots = []) => {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
    let out = `${flat ? '' : `<path d="${d}" fill="none" stroke="${P.trace}" stroke-opacity="0.28" stroke-width="6" filter="url(#soft)"/>`}
               <path d="${d}" fill="none" stroke="${P.trace}" stroke-opacity="0.9" stroke-width="1.8"/>`;
    dots.forEach(([x, y]) => {
      out += `<circle cx="${x}" cy="${y}" r="4.5" fill="${P.trace}"/>`;
    });
    return out;
  };

  const midY = SIDE_Y + SIDE_H / 2;
  const busY = 492;

  const traces = [
    trace([[HX, INPUT.y + INPUT.h], [HX, HY - HR]], [[HX, INPUT.y + INPUT.h + 2]]),
    trace([[HX - HR, midY], [LEFT.x + LEFT.w + 26, midY]], [[HX - HR - 14, midY]]),
    trace([[HX + HR, midY], [RIGHT.x - 26, midY]], [[HX + HR + 14, midY]]),
    trace([[HX, HY + HR], [HX, busY]]),
    trace([[BOT[0].x + 74, busY], [BOT[2].x + 74, busY]], [
      [BOT[0].x + 74, busY],
      [BOT[1].x + 74, busY],
      [BOT[2].x + 74, busY],
    ]),
    trace([[BOT[0].x + 74, busY], [BOT[0].x + 74, BOT_Y - 26]]),
    trace([[BOT[1].x + 74, busY], [BOT[1].x + 74, BOT_Y - 26]]),
    trace([[BOT[2].x + 74, busY], [BOT[2].x + 74, BOT_Y - 26]]),
  ];

  // Node ring hugging the inner edge, so it never crosses the hub label.
  const ring = 86;
  const pts = [26, 52, 78, 102, 128, 154, 206, 232, 258, 282, 308, 334].map((a) => {
    const r = (a * Math.PI) / 180;
    return [HX + Math.cos(r) * ring, HY + Math.sin(r) * ring];
  });
  // Inside the hub the plate is dark in every palette, so the motif is drawn light.
  const hubInk = flat ? '#FFFFFF' : P.trace;
  let motif = '';
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length];
    motif += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"
                stroke="${hubInk}" stroke-opacity="0.30" stroke-width="1.1"/>`;
  });
  pts.forEach(([x, y]) => {
    motif += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${hubInk}" fill-opacity="0.9"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${P.bg[0]}"/>
      <stop offset="55%" stop-color="${P.bg[1]}"/>
      <stop offset="100%" stop-color="${P.bg[2]}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="37%" r="46%">
      <stop offset="0%" stop-color="${P.halo}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${P.bg[0]}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hubFill" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${P.hub[0]}"/>
      <stop offset="100%" stop-color="${P.hub[1]}"/>
    </radialGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <filter id="bigGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="24"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${flat ? '' : `<rect width="${W}" height="${H}" fill="url(#halo)"/>`}

  <text x="56" y="54" font-family="${FONT}" font-size="27" font-weight="700" fill="${P.title}">HOW SCORA WORKS</text>
  <text x="56" y="82" font-family="${FONT}" font-size="14" fill="${P.body}">Established programs feed the platform.</text>
  <text x="56" y="104" font-family="${FONT}" font-size="14" fill="${P.body}">The platform delivers to every individual and every partner.</text>

  ${panel(INPUT, P.input)}
  <text x="${INPUT.x + INPUT.w / 2}" y="${INPUT.y + 30}" text-anchor="middle"
        font-family="${FONT}" font-size="15.5" font-weight="700" fill="${P.title}" letter-spacing="0.6">
    OFFICIAL EVALUATION &amp; PQA RESULTS
  </text>
  <text x="${INPUT.x + INPUT.w / 2}" y="${INPUT.y + 54}" text-anchor="middle"
        font-family="${FONT}" font-size="13" fill="${P.body}">
    Imported and validated each cycle — the programs themselves are unchanged
  </text>

  ${traces.join('\n')}

  ${flat ? '' : `<circle cx="${HX}" cy="${HY}" r="${HR + 30}" fill="${P.trace}" fill-opacity="0.10" filter="url(#bigGlow)"/>`}
  <circle cx="${HX}" cy="${HY}" r="${HR}" fill="url(#hubFill)" stroke="${P.trace}" stroke-width="2.6"/>
  <circle cx="${HX}" cy="${HY}" r="${HR - 12}" fill="none" stroke="${flat ? '#FFFFFF' : P.trace}" stroke-opacity="0.28" stroke-width="1"/>
  ${motif}
  <text x="${HX}" y="${HY + 8}" text-anchor="middle" font-family="${FONT}"
        font-size="42" font-weight="700" fill="${P.hubTitle ?? P.title}">SCORA</text>
  <text x="${HX}" y="${HY + 34}" text-anchor="middle" font-family="${FONT}"
        font-size="12.5" font-weight="600" fill="${P.hubLabel}" letter-spacing="2.2">AI-ENABLED CORE</text>

  ${CONTENT.map((c, i) => panel(c.b, P.accents[i])).join('\n')}
  ${CONTENT.map((c, i) => boxText(c.b, c.title, c.lines, P.accents[i])).join('\n')}
  ${CONTENT.map((c, i) => badge(c.badge.cx, c.badge.cy, c.badge.label, P.accents[i])).join('\n')}

  <text x="${W - 56}" y="${H - 34}" text-anchor="end" font-family="${FONT}" font-size="12.5" fill="${P.body}">
    Samsung Electronics Egypt · Customer Service · SCORA
  </text>
</svg>`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const palette of [COLOUR, MONO, PAPER]) {
  const out = path.join(OUT_DIR, palette.file);
  await sharp(Buffer.from(buildSvg(palette)), { density: 200 })
    .resize({ width: 2400 })
    .png()
    .toFile(out);
  console.log('Wrote', out);
}
