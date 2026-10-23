/**
 * Build the AX Award submission report (Word) for RHQ top management.
 * Run: node scripts/build-ax-award-submission.mjs
 *
 * Editorial rules for this document:
 *  - Describe prior practice neutrally. SCORA extends the established programs;
 *    it does not correct them. No negative characterisation of past operations.
 *  - Do not name any external AI product. Refer to approved AI tooling only.
 *  - Keep it short. Five required sections, no filler.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
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
const OUT = path.join(ROOT, 'docs', 'SCORA_AX_Award_Submission_RHQ.docx');
const DIAGRAM = path.join(ROOT, 'docs', 'assets', 'scora-workflow.png');

const BLUE = '1428A0';
const DARK = '0B1F3A';
const MUTED = '5A6472';
const CYAN = '00A9E0';
const TODAY = new Date().toISOString().slice(0, 10);

/* ── blocks ──────────────────────────────────────────────────────────────── */

const h1 = (num, text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 340, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 6 } },
    children: [
      new TextRun({ text: num ? `${num}   ` : '', bold: true, color: CYAN, size: 30 }),
      new TextRun({ text, bold: true, color: DARK, size: 30 }),
    ],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 24 })],
  });

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        size: opts.size ?? 22,
        bold: !!opts.bold,
        italics: !!opts.italics,
        color: opts.muted ? MUTED : '1A1A1A',
      }),
    ],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: 'ax-b', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })],
  });

const labeled = (label, text) =>
  new Paragraph({
    numbering: { reference: 'ax-b', level: 0 },
    spacing: { after: 70 },
    children: [
      new TextRun({ text: `${label} — `, bold: true, size: 21, color: DARK }),
      new TextRun({ text, size: 21 }),
    ],
  });

const spacer = (after = 140) => new Paragraph({ spacing: { after }, children: [new TextRun({ text: '' })] });

const pageBreak = () => new Paragraph({ pageBreakBefore: true, children: [] });

/** Full-width figure. The same asset is used in the deck so both stay identical. */
const figure = (file, caption, width = 690) =>
  [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data: fs.readFileSync(file),
          transformation: { width, height: Math.round((width * 900) / 1600) },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, size: 17, italics: true, color: MUTED })],
    }),
  ];

const callout = (text) =>
  new Paragraph({
    spacing: { before: 60, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: 'F2F5FA' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
      left: { style: BorderStyle.SINGLE, size: 18, color: CYAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
    },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK })],
  });

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.w || 2340, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD' },
    },
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: BLUE }
      : opts.zebra
        ? { type: ShadingType.CLEAR, fill: 'F7F9FC' }
        : undefined,
    children: String(text ?? '')
      .split('\n')
      .map(
        (line) =>
          new Paragraph({
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: line,
                bold: !!opts.header || !!opts.bold,
                size: 18,
                color: opts.header ? 'FFFFFF' : '1A1A1A',
              }),
            ],
          }),
      ),
  });
}

function table(headers, rows, widths) {
  const colW = widths || headers.map(() => Math.floor(9360 / headers.length));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((head, i) => cell(head, { header: true, w: colW[i] })),
      }),
      ...rows.map(
        (r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { w: colW[i], zebra: ri % 2 === 1 })) }),
      ),
    ],
  });
}

/* ── body ────────────────────────────────────────────────────────────────── */

const body = [];

/* COVER */
body.push(
  spacer(520),
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: 'SAMSUNG ELECTRONICS EGYPT  ·  CUSTOMER SERVICE', bold: true, color: BLUE, size: 20 })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: 'AI TRANSFORMATION (AX) AWARD — PROJECT SUBMISSION', size: 18, color: MUTED })],
  }),
  new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: 'SCORA', bold: true, color: DARK, size: 80 })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: 'Service Competency & Operational Readiness Application', bold: true, color: BLUE, size: 26 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 340 },
    children: [
      new TextRun({
        text: 'One platform that turns service performance data into visible, self-service capability development for every engineer, front-desk colleague and service partner.',
        size: 22,
        italics: true,
        color: MUTED,
      }),
    ],
  }),
  table(
    ['Item', 'Detail'],
    [
      ['Project', 'SCORA — Service Competency & Operational Readiness Application'],
      ['Entity', 'Samsung Electronics Egypt — Customer Service Division'],
      ['Project owner', '[Name / GSPN ID / Title]'],
      ['Category', 'AI Transformation (AX) — innovation delivered through AI'],
      ['Coverage', 'Mobile Experience (MX), Digital Appliances (DA), Audio-Visual (AV)'],
      ['Populations served', 'Field engineers · Front desk · Galaxy Consultants · Service partners'],
      ['Delivery', '7 phases over 7 months, continuous release'],
      ['Status', 'Operational on the internal network'],
      ['Date', TODAY],
    ],
    [2300, 7060],
  ),
  spacer(180),
  p('Population and volume figures are to be inserted by the Customer Service Division prior to submission.', {
    muted: true,
    italics: true,
    size: 18,
  }),
);

/* 1. CURRENT SITUATION */
body.push(
  pageBreak(),
  h1('01', 'Current Situation and Problem Definition'),
  p(
    'Samsung Electronics Egypt operates an established engineer evaluation program across Mobile Experience, Digital Appliances and Audio-Visual, alongside the Partner Quality Assessment (PQA) program for authorised service partners. Both programs are mature, governed, and continue to run through their official channels. SCORA does not alter either program — it extends how far their results travel.',
  ),
  p(
    'As participation grew across all three products, three opportunities were identified to increase the value the same performance data returns to the field.',
  ),
  h2('1.1 Opportunities identified'),
  labeled(
    'Individual visibility beyond the winners',
    'Recognition programs naturally highlight top performers. Colleagues outside the winning group had limited means to view their own standing and the specific KPI areas in which they could progress next cycle.',
  ),
  labeled(
    'KPI familiarity',
    'Understanding of individual KPI definitions — and of how each one contributes to the overall result — varied between populations, which limited self-directed improvement.',
  ),
  labeled(
    'Partner engagement with quality outcomes',
    'Service partners expressed interest in following their PQA outcomes more closely: at partner level and at individual branch level, across both monthly and accumulated views.',
  ),
  labeled(
    'Verified knowledge transfer',
    'Training was delivered continuously; the opportunity was to confirm and evidence comprehension for each participant, not only participation.',
  ),
  h2('1.2 Problem definition'),
  callout(
    'Performance and quality data existed and was trusted. What was missing was a real-time, individual channel that returned that data to each engineer, front-desk colleague and partner in a form they could act on — together with the knowledge required to improve the specific KPI behind their result.',
  ),
  p(
    'The objective followed directly: keep the established programs exactly as they are, and build a digital layer that delivers the same official outcomes to every participant in real time, links each outcome to the knowledge that improves it, and sustains that momentum continuously rather than once per cycle.',
  ),
);

/* 2. GOALS & ITEMS */
body.push(
  pageBreak(),
  h1('02', 'Improvement Goals and Key Improvement Items'),
  h2('2.1 Improvement goals'),
  table(
    ['Goal', 'Definition', 'Measure'],
    [
      [
        'G1  Individual visibility',
        'Every participant can see their own result and KPI detail on demand, in real time.',
        'Share of population accessing their own record each cycle.',
      ],
      [
        'G2  Recognition at every level',
        'A tier structure that recognises standing across the whole population, not only first place.',
        'Movement between tiers cycle on cycle.',
      ],
      [
        'G3  KPI capability',
        'Raise KPI understanding so each colleague can interpret and act on their own numbers.',
        'Assistant usage on KPI topics; challenge scores on KPI content.',
      ],
      [
        'G4  Verified knowledge transfer',
        'Training completion evidenced by presence, interaction and comprehension.',
        'Verified completions per published item.',
      ],
      [
        'G5  Partner engagement',
        'Self-service PQA tracking at partner and branch level, monthly and accumulated.',
        'Partner and branch views consulted per announcement.',
      ],
      [
        'G6  Standing voice of the employee',
        'A continuous channel for training feedback and future feature requests.',
        'Responses received and requests converted into releases.',
      ],
    ],
    [2100, 4030, 3230],
  ),
  h2('2.2 Key improvement items — delivered in seven phases'),
  p(
    'Each phase was released to users before the next began, so value accumulated continuously across the seven-month delivery.',
  ),
  table(
    ['Phase', 'Key improvement item', 'What it delivers'],
    [
      [
        '1',
        'Engineer results portal',
        'Individual, authenticated access to own performance and KPI detail across MX, DA and AV.',
      ],
      [
        '2',
        'Ranking and tier system',
        'Six recognition tiers from Masters to Bronze, in addition to evaluation points — creating positive competition across the entire population rather than at the top only.',
      ],
      [
        '3',
        'PQA module',
        'Monthly announcement inside the app; each partner tracks results quarterly and accumulated, and each branch tracks its own monthly and accumulated data.',
      ],
      [
        '4',
        'Front desk and Galaxy Consultant evaluation',
        'The same ranking and tier model extended to receptionists and Galaxy Consultants, aligning recognition across all customer-facing roles.',
      ],
      [
        '5',
        'SCORA Challenge',
        'Live competency quiz platform brought in-house, replacing the external tool previously used. Onsite sessions run for up to 200 concurrent participants with strong engagement.',
      ],
      [
        '6',
        'GoGo AI assistant',
        'In-app assistant that explains the application, guides colleagues through it, answers KPI questions in English and Egyptian Arabic, and notifies users when new technical consultant content is published.',
      ],
      [
        '7',
        'Knowledge Base and employee feedback',
        'Self-registration for every employee, verified training completion, and a standing survey capturing training experience and requested future features.',
      ],
    ],
    [700, 2600, 6060],
  ),
);

/* 3. WORKFLOW */
body.push(
  pageBreak(),
  h1('03', 'Workflow Before and After Improvement'),
  p(
    'The evaluation and PQA cycles themselves are unchanged. SCORA consumes the same official results and adds a real-time individual delivery layer on top of them. The comparison below therefore describes what has been added, not what has been replaced.',
  ),

  h2('3.1 Workflow after improvement'),
  p(
    'The official results enter the platform once per cycle. From that single source, the platform delivers to every population and every partner at the same time, and the AI-enabled core carries the explanation and capability layer alongside it.',
    { muted: true },
  ),
  ...figure(DIAGRAM, 'Figure 1 — SCORA workflow: one validated source, five simultaneous delivery streams.'),

  h2('3.2 Step-by-step comparison'),
  table(
    ['Process step', 'Established practice', 'Extended with SCORA'],
    [
      [
        'Evaluation and PQA cycle',
        'Programs compile and announce official results each cycle.',
        'Unchanged. SCORA consumes the same official results.',
      ],
      [
        'Access to own result',
        'Delivered through official announcement channels.',
        'Additionally available on demand per individual, with full KPI breakdown and history.',
      ],
      [
        'Standing and recognition',
        'Top performers recognised each cycle.',
        'Six tiers from Masters to Bronze recognise standing across the whole population, visible continuously.',
      ],
      [
        'KPI understanding',
        'Communicated through briefings and training.',
        'Additionally explained on demand by the in-app assistant and linked to the relevant knowledge item.',
      ],
      [
        'PQA partner view',
        'Outcomes shared with partners each cycle.',
        'Self-service partner and branch views, monthly and accumulated, inside the app.',
      ],
      [
        'Training reinforcement',
        'Delivered using an external quiz tool.',
        'Delivered in-house on SCORA Challenge; content and results retained internally.',
      ],
      [
        'Training completion',
        'Participation recorded.',
        'Completion verified by presence time, on-screen interaction and a closing quiz.',
      ],
      [
        'Employee input',
        'Collected through existing channels.',
        'Additionally through a standing in-app survey, including requests for future features.',
      ],
    ],
    [2200, 3400, 3760],
  ),
  spacer(150),
  callout(
    'Net effect: the same trusted data now reaches every individual continuously instead of once per cycle, and arrives together with the means to act on it.',
  ),
);

/* 4. SCOPE & FUNCTIONS */
body.push(
  pageBreak(),
  h1('04', 'Scope of Implementation and Key Function Details'),
  h2('4.1 Scope'),
  table(
    ['Dimension', 'In scope'],
    [
      ['Products', 'Mobile Experience (MX) · Digital Appliances (DA) · Audio-Visual (AV)'],
      ['Populations', 'Field service engineers · Front desk receptionists · Galaxy Consultants · Authorised service partners'],
      ['Cycles', 'Monthly and quarterly views, with accumulated and multi-quarter comparison'],
      ['PQA granularity', 'Partner level and branch level; monthly and accumulated'],
      ['Recognition', 'Six tiers: Masters · Diamond · Platinum · Gold · Silver · Bronze'],
      ['Languages', 'English and Egyptian Arabic, including voice'],
      ['Deployment', 'Internal Samsung network'],
      ['Out of scope', 'Payroll, HR master data, customer-identifiable service records'],
    ],
    [2300, 7060],
  ),
  h2('4.2 Key function details'),

  p('Engineer and front-desk performance', { bold: true, after: 60 }),
  bullet('Individual result card with KPI-level detail, cycle history and tier standing.'),
  bullet('Ranking across MX, DA and AV, with the same tier model applied to receptionists and Galaxy Consultants.'),
  bullet('Official evaluation workbooks are imported and validated before any figure is published.'),

  p('PQA partner quality', { bold: true, after: 60 }),
  bullet('Monthly announcement published in the app.'),
  bullet('Partner view: quarterly and accumulated results.'),
  bullet('Branch view: each branch tracks its own monthly and accumulated data.'),

  p('SCORA Challenge', { bold: true, after: 60 }),
  bullet('Live sessions joined by PIN or QR code, up to 200 concurrent participants.'),
  bullet('Five question formats, division-specific question banks, host-controlled pacing.'),
  bullet('Scoring is calculated on the server, so results are authoritative and cannot be altered from a device.'),
  bullet('Live leaderboard and podium for onsite sessions; results retained for analysis.'),

  p('GoGo AI assistant', { bold: true, after: 60 }),
  bullet('Explains the application and guides colleagues through each portal.'),
  bullet('Answers KPI definition and process questions in English and Egyptian Arabic, with voice input and spoken response.'),
  bullet('Notifies users when new technical consultant content is published and routes them to it.'),

  p('Knowledge Base', { bold: true, after: 60 }),
  bullet('Employees self-register; content is targeted by product line and role.'),
  bullet('Completion is verified on three signals: presence time on the material, on-screen interaction, and a closing quiz that must be passed.'),
  bullet('Items can be marked mandatory, with draft, published and archived editorial control.'),

  p('Employee feedback', { bold: true, after: 60 }),
  bullet('Standing in-app survey covering training experience and the application itself.'),
  bullet('Captures requested future features, feeding the release roadmap directly.'),

  p('Administration and governance', { bold: true, after: 60 }),
  bullet('Role-based access with module-level permissions by product and function.'),
  bullet('Every administrative action is written to an immutable audit log.'),
  bullet('Management reporting with controlled export.'),
);

/* 5. AI / DATA */
body.push(
  pageBreak(),
  h1('05', 'AI and Data Utilisation Plan'),
  p('AI is applied at two distinct levels, and the separation between them is deliberate.'),

  h2('5.1 Level 1 — AI as the delivery engine'),
  p(
    'SCORA was designed, built and refined using enterprise-approved AI assistants, within the internal tooling policy. This is the substance of the AX contribution: AI did not add a feature to an existing system — AI is what made a platform of this scope deliverable by a single business owner, in seven months, with no external development vendor and no software licence cost.',
  ),
  bullet('Architecture, implementation and refactoring of the full application.'),
  bullet('Formulation of the ranking, tier and scoring logic.'),
  bullet('Bilingual English / Egyptian Arabic content preparation, with no external translation cost.'),
  bullet('Question bank and knowledge content structuring.'),
  p(
    'All generated output was reviewed, tested and released under the owner\u2019s control. No tooling outside the approved internal policy was used at any stage.',
    { muted: true, italics: true },
  ),

  h2('5.2 Level 2 — AI inside the running application'),
  p(
    'The GoGo assistant answers from curated internal content through a guided, deterministic model. Employee, evaluation and partner data are not transmitted to any external AI provider at runtime.',
  ),
  table(
    ['Capability', 'How it works', 'Data leaving the environment'],
    [
      ['Guidance and navigation', 'Guided intent routing authored internally.', 'None.'],
      ['KPI explanation', 'Retrieval over the verified internal KPI definition set.', 'None.'],
      ['Knowledge answering', 'Retrieval over the curated Knowledge Base.', 'None.'],
      ['New content notification', 'Triggered by internal publication events.', 'None.'],
      ['Arabic and English', 'Curated bilingual content with a controlled phrasing layer.', 'None.'],
      ['Voice', 'Device-native speech input; speech output applied to approved answer text only.', 'Answer text only.'],
    ],
    [2200, 4400, 2760],
  ),
  spacer(140),
  callout(
    'Because every answer originates from a verified internal item, it is attributable and auditable — an answer can be traced to its source and corrected there. This is a functional advantage, not only a control.',
  ),

  h2('5.3 Data utilisation'),
  table(
    ['Data domain', 'Purpose', 'Access'],
    [
      [
        'Evaluation results and KPI detail',
        'Individual disclosure, ranking and tier assignment, management reporting.',
        'Each colleague sees only their own record; administrators by product and role.',
      ],
      [
        'PQA quality results',
        'Monthly announcement; partner and branch tracking.',
        'Partner and branch views; administrative access for publication.',
      ],
      [
        'Knowledge Base content and progress',
        'Capability building and verified completion.',
        'Read for registered employees; publication restricted to editors and above.',
      ],
      [
        'Challenge results',
        'Measuring knowledge retention and training effectiveness.',
        'Scored server-side; analysis for administrators.',
      ],
      [
        'Feedback and survey responses',
        'Training improvement and the future feature roadmap.',
        'Aggregated analysis for administrators.',
      ],
      ['Usage analytics', 'Adoption measurement and engagement analysis.', 'Administrative reporting only.'],
    ],
    [2400, 3600, 3360],
  ),
  spacer(140),

  h2('5.4 Governance'),
  bullet('Authentication through Samsung Firebase Authentication for employees and administrators.'),
  bullet('Server-side authorisation validates every privileged request against the caller\u2019s verified identity and role.'),
  bullet('Data access follows a deny-by-default model with explicit, least-privilege grants per domain.'),
  bullet('Score-bearing operations are computed server-side only, so results cannot be influenced from a device.'),
  bullet('Every administrative action is recorded in an immutable audit log.'),
  bullet('No employee, evaluation or partner record is transmitted to an external AI provider in the current runtime configuration.'),
);

/* 6. ROI & IMPACT */
body.push(
  pageBreak(),
  h1('06', 'Return on Investment and Impact'),
  p(
    'The clearest evidence of impact is that engagement is now pulled by the population rather than pushed to it. Colleagues and partners actively seek the platform out.',
  ),

  h2('6.1 Observed impact — demand generated by the users themselves'),
  labeled(
    'Partners seek out the platform',
    'Service partners now anticipate their onsite visit to Head Office specifically in order to use the application and review their own PQA standing. The quality programme has become something partners actively pursue rather than simply receive.',
  ),
  labeled(
    'Colleagues request more training',
    'Engineers and front-desk colleagues ask for additional training sessions at the office so they can compete in SCORA Challenge and climb the ranking ladder. Training demand is now generated by the population itself rather than scheduled onto it.',
  ),
  labeled(
    'Standing has become a shared conversation',
    'Tier position is discussed between peers, so improvement targets are increasingly self-set rather than assigned.',
  ),
  labeled(
    'Review time is spent on improvement',
    'Colleagues arrive at briefings already knowing their own KPI position, so discussion moves directly to how to improve rather than to what the numbers are.',
  ),
  labeled(
    'New technical content is consumed quickly',
    'Because the assistant notifies users when content is published, newly issued technical material reaches its audience without a separate distribution effort.',
  ),
  labeled(
    'The roadmap is field-driven',
    'Requested features arrive continuously through the in-app survey, so development priorities come from the people doing the work.',
  ),

  h2('6.2 Economic return'),
  table(
    ['Element', 'Position'],
    [
      ['Software licence', 'None required.'],
      ['External development vendor', 'None engaged. Delivered by one business owner with approved AI assistance.'],
      ['External quiz platform', 'Subscription no longer required — capability brought in-house as SCORA Challenge.'],
      ['Translation and bilingual content', 'No external service required; bilingual content produced in-house.'],
      ['Infrastructure', 'No additional procurement — deployed on the internal network.'],
      ['Delivery time', 'Seven functional phases released across seven months.'],
    ],
    [2800, 6560],
  ),

  h2('6.3 Operational and strategic return'),
  bullet('The same official results now reach every individual continuously instead of once per cycle.'),
  bullet('Training investment becomes measurable, because completion is evidenced rather than assumed.'),
  bullet('Technical and front-desk knowledge is standardised and retained through staff rotation.'),
  bullet('Recognition operates across the whole population, extending the motivational effect well beyond the winners.'),
  bullet('Partner quality results are self-service, reducing the effort required to distribute and explain them.'),
  bullet('All administrative activity is auditable, strengthening internal control.'),
  bullet('The platform is configuration-driven by product and role, so reuse elsewhere carries negligible marginal cost.'),

  h2('6.4 Indicators to quantify'),
  p(
    'The following indicators are available from the platform and are recommended for periodic reporting to management.',
    { muted: true },
  ),
  table(
    ['Indicator', 'What it demonstrates'],
    [
      ['Share of population accessing their own result each cycle', 'Reach of the transparency objective.'],
      ['Tier movement between cycles', 'Whether visibility translates into performance improvement.'],
      ['Verified training completions per published item', 'Effectiveness of knowledge transfer.'],
      ['Challenge sessions delivered and average score trend', 'Retention and capability growth over time.'],
      ['Partner and branch views consulted per announcement', 'Partner engagement with quality outcomes.'],
      ['Feature requests received and released', 'Responsiveness of the platform to the field.'],
    ],
    [4200, 5160],
  ),
);

/* 7. FUTURE PLAN & EXPANSION */
body.push(
  pageBreak(),
  h1('07', 'Future Plan and Expansion'),
  p(
    'Three expansion tracks are proposed. Each builds on capability already present in the platform, so none requires rebuilding what exists.',
  ),

  h2('7.1 Track 1 — External go-live for live interaction'),
  p(
    'Publish the platform beyond the internal network onto a Samsung-governed server, so that partners and colleagues can interact with it in real time from outside the office — on partner premises, at branches and in the field — rather than only while connected internally.',
  ),
  bullet('Extends reach to partners and to colleagues working away from Head Office.'),
  bullet('Mobile installation and notification capability are already built and would activate with the external go-live.'),
  bullet('Removes the dependency on an onsite visit in order to review results.'),
  bullet('Delivered under the same authentication, role-based access and audit controls already in place.'),

  h2('7.2 Track 2 — Generative AI capability alongside GoGo'),
  p(
    'Integrate an approved generative AI service (for example Gemini) to operate alongside the existing GoGo assistant, so that free-form questions can be answered in cases where the curated knowledge base does not yet hold an entry.',
  ),
  bullet(
    'Division of responsibility: GoGo retains ownership of KPI definitions, navigation and all internal content, which keeps those answers verified and attributable. The generative layer handles open-ended language understanding only.',
  ),
  bullet(
    'Introduction is conditional on RHQ approval of the endpoint and on preserving the current principle that employee, evaluation and partner records are not exposed to an external provider.',
  ),
  bullet('Expected benefit: broader question coverage and a more natural conversation, without diluting the auditability of official content.'),

  h2('7.3 Track 3 — Expansion to other subsidiaries'),
  p(
    'Extend the platform to additional subsidiaries in the region. Product, role, KPI and tier models are configuration-driven, so a new subsidiary is onboarded through configuration rather than redevelopment.',
  ),
  bullet('Provides comparative ROI and impact measurement across subsidiaries on a common basis.'),
  bullet('Each additional subsidiary carries negligible marginal cost, improving the return on the original investment.'),
  bullet('Establishes a shared regional standard for competency visibility and partner quality engagement.'),

  h2('7.4 Sequencing'),
  table(
    ['Stage', 'Action', 'Outcome'],
    [
      ['Stage 1', 'Complete adoption across all populations and establish the disclosure rhythm each cycle.', 'Every colleague informed of their own standing continuously.'],
      ['Stage 2', 'External go-live on a Samsung-governed server, activating mobile and notification reach.', 'Live interaction for partners and colleagues outside the office.'],
      ['Stage 3', 'Integrate the approved generative AI service alongside GoGo, subject to RHQ approval.', 'Broader assistant coverage with governance preserved.'],
      ['Stage 4', 'Correlate knowledge consumption with KPI movement, then introduce trend-based early indication.', 'Preventive coaching rather than retrospective review.'],
      ['Stage 5', 'Onboard additional subsidiaries by configuration.', 'Regional reuse and comparative impact measurement.'],
    ],
    [1300, 4700, 3360],
  ),
);

/* ── assemble ────────────────────────────────────────────────────────────── */

const doc = new Document({
  creator: 'Samsung Electronics Egypt — Customer Service',
  title: 'SCORA — AX Award Submission (RHQ)',
  description: 'AI Transformation (AX) award submission for SCORA.',
  numbering: {
    config: [
      {
        reference: 'ax-b',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 400, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { styles: [{ id: 'Normal', name: 'Normal', run: { font: 'Calibri', size: 22 } }] } },
  },
  sections: [
    {
      properties: { page: { margin: { top: 880, right: 860, bottom: 840, left: 860 } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DD', space: 4 } },
              children: [
                new TextRun({ text: 'SCORA  ·  AX AWARD SUBMISSION  ·  ', size: 16, color: MUTED }),
                new TextRun({ text: 'SAMSUNG ELECTRONICS EGYPT', size: 16, bold: true, color: BLUE }),
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
                new TextRun({ text: 'Confidential — Internal Use Only   |   ', size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                new TextRun({ text: ' / ', size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
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

// Word keeps an exclusive handle on an open .docx, so fall forward through
// alternate names rather than losing the build.
const candidates = [
  OUT,
  OUT.replace(/\.docx$/, '_new.docx'),
  OUT.replace(/\.docx$/, `_${Date.now()}.docx`),
];
let written = false;
for (const target of candidates) {
  try {
    fs.writeFileSync(target, buffer);
    console.log(target === OUT ? `Wrote ${target}` : `Target locked (open in Word). Wrote ${target}`);
    written = true;
    break;
  } catch (err) {
    if (err?.code !== 'EBUSY' && err?.code !== 'EPERM') throw err;
  }
}
if (!written) throw new Error('Could not write the document — close it in Word and re-run.');
