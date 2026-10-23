/**
 * SCORA — Application Overview (Word), black and white, figure-led.
 * Run: node scripts/build-scora-app-overview.mjs
 *
 * Prerequisites (run these first if the figures are missing):
 *   node scripts/build-scora-workflow-diagram.mjs   → scora-workflow-paper.png
 *   node scripts/build-scora-diagrams.mjs           → docs/assets/diagrams/*.png
 *
 * Editorial rules carried over from the reviewed AX submission:
 *  - Prior practice is described neutrally. SCORA extends the established
 *    programs; it does not correct them.
 *  - US spelling, per the owners' edits.
 *  - No two-level AI split and no standalone governance section; the control
 *    facts live in one compact technical block instead.
 *  - Every workflow, matrix and comparison is a figure, not a table. The only
 *    table in the document is the identity block on the cover.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'SCORA_APP_Overview.docx');
const ASSETS = path.join(ROOT, 'docs', 'assets');
const DIAGRAMS = path.join(ASSETS, 'diagrams');

/* ── black & white tokens, matching the RHQ deck ─────────────────────────── */

const INK = '111111';
const INK2 = '3F3F3F';
const GREY = '6E6E6E';
const HAIR = 'C6C6C6';
const SOFT = 'F4F4F4';

const FIG_WIDTH = 672; // px at 96 dpi, inside 7.31in of live text width

/* ── blocks ──────────────────────────────────────────────────────────────── */

const h1 = (num, text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 150 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: INK, space: 6 } },
    children: [
      new TextRun({ text: num ? `${num}   ` : '', bold: true, color: GREY, size: 28 }),
      new TextRun({ text, bold: true, color: INK, size: 28 }),
    ],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 90 },
    children: [new TextRun({ text, bold: true, color: INK, size: 22 })],
  });

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 130, line: 288 },
    alignment: o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size: o.size ?? 20,
        color: o.muted ? GREY : INK2,
        italics: o.italics ?? false,
        bold: o.bold ?? false,
      }),
    ],
  });

const bullet = (lead, rest) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 70, line: 276 },
    children: [
      ...(lead ? [new TextRun({ text: `${lead} — `, bold: true, color: INK, size: 19 })] : []),
      new TextRun({ text: rest, size: 19, color: INK2 }),
    ],
  });

const spacer = (after = 120) =>
  new Paragraph({ spacing: { after }, children: [new TextRun({ text: '' })] });

const pageBreak = () => new Paragraph({ pageBreakBefore: true, children: [] });

/** Grey statement band with a black rule on the left edge. */
const band = (label, text) => [
  new Paragraph({
    spacing: { before: 100, after: 0 },
    shading: { type: ShadingType.CLEAR, fill: SOFT },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
      left: { style: BorderStyle.SINGLE, size: 18, color: INK },
      right: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
    },
    indent: { left: 120, right: 120 },
    children: [
      new TextRun({ text: label, bold: true, color: INK, size: 15, characterSpacing: 20 }),
    ],
  }),
  new Paragraph({
    spacing: { before: 40, after: 180 },
    shading: { type: ShadingType.CLEAR, fill: SOFT },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
      left: { style: BorderStyle.SINGLE, size: 18, color: INK },
      right: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
    },
    indent: { left: 120, right: 120 },
    children: [new TextRun({ text, size: 19, color: INK2 })],
  }),
];

/** Two-column identity table — the only table in the document. */
const identity = (rows) => {
  const cell = (text, { header = false, bold = false, w } = {}) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 130, right: 130 },
      shading: header ? { type: ShadingType.CLEAR, fill: INK } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
        left: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
        right: { style: BorderStyle.SINGLE, size: 4, color: HAIR },
      },
      children: [
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({
              text,
              bold: header || bold,
              color: header ? 'FFFFFF' : INK2,
              size: header ? 17 : 19,
              characterSpacing: header ? 18 : 0,
            }),
          ],
        }),
      ],
    });

  return new Table({
    width: { size: 10520, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [cell('ITEM', { header: true, w: 3000 }), cell('DETAIL', { header: true, w: 7520 })],
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: [cell(r[0], { bold: true, w: 3000 }), cell(r[1], { w: 7520 })],
          }),
      ),
    ],
  });
};

/**
 * Full-width figure with a numbered caption. Height is derived from the file's
 * real pixel ratio so no figure is ever stretched.
 */
let figureNo = 0;
async function figure(file, caption) {
  const abs = path.isAbsolute(file) ? file : path.join(DIAGRAMS, file);
  if (!fs.existsSync(abs)) throw new Error(`Missing figure: ${abs}`);
  const { width, height } = await sharp(abs).metadata();
  figureNo += 1;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 130, after: 50 },
      children: [
        new ImageRun({
          type: 'png',
          data: fs.readFileSync(abs),
          transformation: {
            width: FIG_WIDTH,
            height: Math.round((FIG_WIDTH * height) / width),
          },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Figure ${figureNo} — `, bold: true, color: INK, size: 16 }),
        new TextRun({ text: caption, italics: true, color: GREY, size: 16 }),
      ],
    }),
  ];
}

/* ── document body ───────────────────────────────────────────────────────── */

const body = [];

/* Cover */
body.push(
  new Paragraph({
    spacing: { before: 240, after: 0 },
    children: [new TextRun({ text: 'SCORA', bold: true, color: INK, size: 72, characterSpacing: 40 })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: INK, space: 8 } },
    children: [
      new TextRun({ text: 'APPLICATION OVERVIEW', bold: true, color: GREY, size: 24, characterSpacing: 60 }),
    ],
  }),
  new Paragraph({
    spacing: { before: 160, after: 100 },
    children: [
      new TextRun({
        text: 'Service Competency & Operational Readiness Application',
        bold: true,
        color: INK,
        size: 26,
      }),
    ],
  }),
  p(
    'One platform that turns official service performance data into visible, self-service capability development for every engineer, front-desk colleague and service partner.',
    { size: 21, after: 240 },
  ),
  identity([
    ['Project', 'SCORA — Service Competency & Operational Readiness Application'],
    ['Entity', 'Samsung Electronics Egypt — Customer Service Division'],
    ['Project owners', 'Fawzy Maher, George Samir'],
    ['Category', 'AI Transformation (AX) — innovation delivered through AI'],
    ['Coverage', 'Mobile Experience (MX), Digital Appliances (DA), Audio-Visual (AV)'],
    ['Populations served', 'Field engineers · Front desk · Galaxy Consultants · Service partners'],
    ['Delivery', 'Seven phases over seven months, continuous release'],
    ['Status', 'Operational on the internal network'],
    ['Document', 'Application overview — figures replace tabular detail throughout'],
    ['Date', new Date().toISOString().slice(0, 10)],
  ]),
);

/* 01 — purpose */
body.push(
  pageBreak(),
  h1('01', 'Purpose and Problem Definition'),
  p(
    'Samsung Electronics Egypt operates an established engineer evaluation program across Mobile Experience, Digital Appliances and Audio-Visual, alongside the Partner Quality Assessment (PQA) program for authorized service partners. Both programs are mature, governed, and continue to run through their official channels. SCORA does not alter either program — it extends how far their results travel.',
  ),
  p(
    'Performance and quality data existed and was trusted. What was missing was a real-time, individual channel that returned that data to each engineer, front-desk colleague and partner in a form they could act on, together with the knowledge required to improve the specific KPI behind their result.',
  ),
  p(
    'The objective followed directly: keep the established programs exactly as they are, and add a digital layer that delivers the same official outcomes to every participant in real time, links each outcome to the knowledge that improves it, and sustains that momentum continuously rather than once per cycle.',
  ),
);

/* 02 — improvement goals */
body.push(
  h1('02', 'Improvement Goals'),
  p(
    'Six goals define the platform. Each carries a measure that the platform itself can report, so progress is observable rather than asserted.',
    { muted: true },
  ),
);

/* 03 — delivery */
body.push(
  h1('03', 'Delivery'),
  p(
    'The platform was delivered in seven functional phases across seven months. Each phase was released to users before the next began.',
    { muted: true },
  ),
);

/* 04 — workflow */
body.push(
  h1('04', 'Workflow Before and After Improvement'),
  p(
    'The evaluation and PQA cycles are unchanged. The figures below describe what has been added, not what has been replaced: the same validated results enter once per cycle, then fan out to every population and partner at the same time.',
  ),
);

/* 05 — scope */
body.push(
  h1('05', 'Scope of Implementation'),
  p(
    'Scope is defined by product, population, cycle and granularity. Recognition applies identically to every customer-facing role.',
    { muted: true },
  ),
);

/* 06 — functions */
body.push(
  h1('06', 'Key Function Details'),
  p(
    'Six functional modules make up the application. The KPI model is held separately per quarter, so a colleague sees both the components of their result and the outcome.',
    { muted: true },
  ),
);

/* 07 — AI and data */
body.push(
  h1('07', 'AI and Data Utilization'),
  p(
    'SCORA was designed, built and refined using enterprise-approved AI assistants, within the internal tooling policy. This is the substance of the AX contribution: AI did not add a feature to an existing system — AI is what made a platform of this scope deliverable by the project owners in seven months, with no external development vendor and no software license cost. All generated output was reviewed, tested and released under the owners’ control.',
  ),
  p(
    'Inside the running application, the GoGo assistant answers from curated internal content through a guided model. Because every answer originates from a verified internal item, it is attributable and auditable — an answer can be traced to its source and corrected there. This is a functional advantage, not only a control.',
  ),
);

/* 08 — return and impact */
body.push(
  h1('08', 'Return and Impact'),
  p(
    'The clearest evidence of impact is that engagement is now pulled by the population rather than pushed to it. Colleagues and partners actively seek the platform out.',
  ),
  bullet('Partners seek out the platform', 'service partners now anticipate their onsite visit to Head Office specifically in order to review their own PQA standing.'),
  bullet('Colleagues request more training', 'engineers and front-desk colleagues ask for additional sessions so they can compete in SCORA Challenge and climb the ranking.'),
  bullet('Standing is a shared conversation', 'tier position is discussed between peers, so improvement targets are increasingly self-set rather than assigned.'),
  bullet('Review time goes to improvement', 'colleagues arrive at briefings already knowing their KPI position, so discussion moves directly to how to improve.'),
  bullet('New technical content is consumed quickly', 'because the assistant flags publication, newly issued material reaches its audience without a separate distribution effort.'),
  bullet('The roadmap is field-driven', 'requested features arrive continuously through the in-app survey, so priorities come from the people doing the work.'),
);

/* 09 — future plan */
body.push(
  h1('09', 'Future Plan and Expansion'),
  p(
    'Three tracks are proposed. Each builds on capability already present in the platform, so none requires rebuilding what exists.',
    { muted: true },
  ),
  h2('Track 1 — External go-live for live interaction'),
  p(
    'Publish the platform beyond the internal network onto a Samsung-governed server, so partners and colleagues can interact with it in real time from partner premises, at branches and in the field. Mobile installation and notification capability are already built and would activate with the external go-live, under the same authentication, role-based access and audit controls already in place.',
  ),
  h2('Track 2 — Generative AI capability alongside GoGo'),
  p(
    'Integrate an approved generative AI service (for example Gemini) to operate alongside the existing GoGo assistant, so free-form questions can be answered where the curated knowledge base does not yet hold an entry. GoGo retains ownership of KPI definitions, navigation and all internal content, which keeps those answers verified and attributable; the generative layer handles open-ended language understanding only. Introduction is conditional on RHQ approval of the endpoint and on preserving the principle that employee, evaluation and partner records are not exposed to an external provider.',
  ),
  h2('Track 3 — Expansion to other subsidiaries'),
  p(
    'Extend the platform to additional subsidiaries in the region. Product, role, KPI and tier models are configuration-driven, so a new subsidiary is onboarded through configuration rather than redevelopment. Each addition carries negligible marginal cost, improves the return on the original investment, and establishes a shared regional standard for competency visibility and partner quality engagement.',
  ),
);

/* ── figure insertion ─────────────────────────────────────────────────────── */

/**
 * Figures are appended after their section heading. Insertion is done by
 * locating the section paragraph, so the prose above stays readable as source.
 */
const PLAN = [
  ['01', path.join(ASSETS, 'scora-workflow-paper.png'), 'How SCORA works — one validated source, five simultaneous delivery streams.'],
  ['02', 'improvement-goals.png', 'The six improvement goals, each with the measure the platform reports.'],
  ['03', 'delivery-phases.png', 'Seven delivery phases, each released to users before the next began.'],
  ['04', 'workflow-before-after.png', 'Workflow before and after improvement. The established cycle is unchanged.'],
  ['05', 'scope.png', 'Scope of implementation by product, population, cycle and granularity.'],
  ['05', 'recognition-tiers.png', 'Six recognition tiers, applied identically across every customer-facing role.'],
  ['06', 'key-functions.png', 'The six functional modules of the application.'],
  ['06', 'kpi-model.png', 'The KPI model, held separately for each quarter.'],
  ['07', 'data-utilization.png', 'Data utilization — one source, scoped disclosure, and the external boundary.'],
  ['08', 'economic-position.png', 'Economic position: no license, no vendor, no procurement.'],
  ['09', 'sequencing.png', 'Five-stage sequencing, each stage building on what already exists.'],
];

const TECH_NOTES = [
  ['Authentication', 'Firebase Authentication for both employees and administrators.'],
  ['Authorization', 'every privileged request is validated server-side against the caller’s verified identity and role.'],
  ['Access model', 'deny-by-default, with explicit least-privilege grants per data domain.'],
  ['Challenge scoring', 'computed server-side, so a result cannot be altered from a participant device.'],
  ['Audit', 'every administrative action is written to an immutable log.'],
  ['External exposure', 'employee, evaluation and partner records are not transmitted to an external AI provider in the current runtime configuration.'],
];

const INDICATORS = [
  ['Share of population accessing their own result each cycle', 'reach of the transparency objective.'],
  ['Tier movement between cycles', 'whether visibility translates into performance improvement.'],
  ['Verified completions per published item', 'effectiveness of knowledge transfer.'],
  ['Challenge sessions and average score trend', 'retention and capability growth over time.'],
  ['Partner and branch views per announcement', 'partner engagement with quality outcomes.'],
  ['Feature requests received and released', 'responsiveness of the platform to the field.'],
];

/** Index of the paragraph that opens a numbered section. */
function sectionEnd(num) {
  const idx = body.findIndex(
    (el) =>
      el instanceof Paragraph &&
      JSON.stringify(el).includes(`"${num}   "`),
  );
  if (idx === -1) throw new Error(`Section ${num} not found`);
  let end = idx + 1;
  while (end < body.length && !JSON.stringify(body[end]).match(/"\d\d   "/)) end += 1;
  return end;
}

// Build figure blocks first, then splice from the last section backwards so
// earlier indices stay valid.
const blocks = [];
for (const [section, file, caption] of PLAN) {
  blocks.push({ section, nodes: await figure(file, caption) });
}

// Extra prose blocks that belong after their section's figures.
const EXTRA = {
  '07': [
    h2('Technical and control notes'),
    ...TECH_NOTES.map(([k, v]) => bullet(k, v)),
  ],
  '08': [
    h2('Indicators available for periodic reporting'),
    ...INDICATORS.map(([k, v]) => bullet(k, v)),
  ],
  '09': [
    ...band(
      'IN SUMMARY',
      'The established programs are untouched. SCORA carries their results the last mile — to every individual and every partner, continuously, with the knowledge required to act on them.',
    ),
  ],
};

for (const section of ['09', '08', '07', '06', '05', '04', '03', '02', '01']) {
  const at = sectionEnd(section);
  const figs = blocks.filter((b) => b.section === section).flatMap((b) => b.nodes);
  const extra = EXTRA[section] ?? [];
  body.splice(at, 0, ...figs, ...extra, spacer(80));
}

/* ── assemble ────────────────────────────────────────────────────────────── */

const doc = new Document({
  creator: 'Samsung Electronics Egypt — Customer Service',
  title: 'SCORA — Application Overview',
  description: 'Black and white application overview, figure-led.',
  styles: {
    default: {
      document: { run: { font: 'Segoe UI', size: 20, color: INK2 } },
    },
  },
  sections: [
    {
      properties: { page: { margin: { top: 900, right: 860, bottom: 860, left: 860 } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: HAIR, space: 4 } },
              children: [
                new TextRun({
                  text: 'SCORA — Application Overview   ·   Samsung Electronics Egypt, Customer Service',
                  size: 15,
                  color: GREY,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Confidential — internal use only   ·   Page ', size: 14, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 14, color: GREY }),
                new TextRun({ text: ' of ', size: 14, color: GREY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: GREY }),
              ],
            }),
          ],
        }),
      },
      children: body,
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);

const candidates = [OUT, OUT.replace(/\.docx$/, `_${Date.now()}.docx`)];
let written = false;
for (const target of candidates) {
  try {
    fs.writeFileSync(target, buffer);
    console.log(target === OUT ? `Wrote ${target}` : `Target locked in Word. Wrote ${target}`);
    written = true;
    break;
  } catch (err) {
    if (err?.code !== 'EBUSY' && err?.code !== 'EPERM') throw err;
  }
}
if (!written) throw new Error('Could not write the document — close it in Word and re-run.');
console.log(`${figureNo} figures embedded.`);
