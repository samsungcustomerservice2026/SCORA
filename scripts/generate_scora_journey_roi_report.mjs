/**
 * Scora Application: Executive Journey, Architecture & ROI Report (Word).
 * Run: node scripts/generate_scora_journey_roi_report.mjs
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'Scora_Application_Executive_Journey_Architecture_ROI_Report_2026.docx');

const BLUE = '1428A0';
const DARK = '0F172A';
const GRAY = '64748B';
const LIGHT = 'F1F5F9';
const WHITE = 'FFFFFF';

const thin = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 200 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 32 })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    children: [new TextRun({ text, bold: true, color: DARK, size: 26 })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 22 })],
  });

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 140 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size: 21,
        color: opts.color || DARK,
        bold: opts.bold,
        italics: opts.italics,
      }),
    ],
  });

const bullet = (text) =>
  new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [new TextRun({ text: `• ${text}`, size: 21, color: DARK })],
  });

const meta = (label, value) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, color: GRAY }),
      new TextRun({ text: value, size: 20, color: DARK }),
    ],
  });

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 4500, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: BLUE } : opts.shade ? { type: ShadingType.CLEAR, fill: LIGHT } : undefined,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: String(text ?? ''),
            size: 18,
            bold: !!opts.header || !!opts.bold,
            color: opts.header ? WHITE : DARK,
          }),
        ],
      }),
    ],
  });
}

function table(headers, rows, colWidths) {
  const widths = colWidths || headers.map(() => Math.floor(9000 / headers.length));
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })),
      }),
      ...rows.map(
        (row, ri) =>
          new TableRow({
            children: row.map((c, i) => cell(c, { shade: ri % 2 === 1, width: widths[i] })),
          })
      ),
    ],
  });
}

const children = [
  // Cover
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 800, after: 200 },
    children: [new TextRun({ text: 'SAMSUNG EGYPT', bold: true, size: 24, color: BLUE, allCaps: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'SCORA Application', bold: true, size: 48, color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: 'Executive Journey, Architecture & ROI Report',
        size: 28,
        color: GRAY,
        italics: true,
      }),
    ],
  }),
  p('Definitive product lifecycle brief covering Technical Capability Score (TCS), Product Quality Assurance (PQA), Arabic surveys & feedback, and SCORA Challenge gamification — from inception through the 2026 iteration.', {
    align: AlignmentType.CENTER,
    italics: true,
  }),
  meta('Document class', 'Executive architecture & ROI brief'),
  meta('Codebase', 'fawzy-project (next-version 0.1.0)'),
  meta('Firebase project', 'tcs-for-engineers'),
  meta('Repository', 'https://github.com/samsungcustomerservice2026/SCORA'),
  meta('Report date', 'July 2026'),
  meta('Accuracy basis', 'Active codebase, README, and 2026 delivery sessions'),

  pageBreak(),

  // 1
  h1('1. Executive Summary & Evolution Roadmap'),
  h2('Positioning'),
  p('SCORA began as a single-purpose Technical Capability Score (TCS) system for field engineers and matured into a multi-portal Samsung Egypt operations platform that now unifies:'),
  bullet('Transparent engineer / receptionist / Galaxy consultant ranking'),
  bullet('Service-center Product Quality Assurance (PQA) partner scoring'),
  bullet('Arabic customer & Academy survey / feedback capture with analytics'),
  bullet('A live, Kahoot-style training engine — SCORA Challenge'),
  p('The platform thesis: replace subjective spreadsheet judgment with auditable, formula-driven scores, visible tiers, and competitive motivation — now extended beyond engineers to partners, front-desk roles, and cross-functional learning events.'),

  h2('Production surfaces (2026)'),
  table(
    ['Surface', 'URL'],
    [
      ['Main', 'https://samsungeg-scora.vercel.app'],
      ['Admin', 'https://samsungeg-scora-admin.vercel.app'],
      ['TCS', 'https://samsungeg-scora-tcs.vercel.app'],
      ['PQA', 'https://samsungeg-scora-pqa.vercel.app'],
      ['Quiz host', 'https://samsungeg-scora-quiz.vercel.app'],
    ],
    [2500, 6500]
  ),

  h2('The Genesis (TCS Phase)'),
  p('Problem. Samsung field evaluation historically lived in fragmented Excel workbooks. Scoring was manual, inconsistent across ASCs, and difficult to socialize as a fair capability ladder.'),
  p('Solution built. A Next.js + Firebase application that:'),
  bullet('Ingests standardized Excel/CSV templates (TCS MX sheet; DA/AV unified quarter-first templates).'),
  bullet('Computes a 0–100 Technical Capability Score with fixed weights: Operational KPIs max 50 pts; DRNPS max 30 pts; Exam max 20 pts.'),
  bullet('DRNPS formula (calculateDRNPS): (((promoters − detractors) × 10) + 100) / 2, clamped 0–100.'),
  bullet('Applies Q1 hybrid weighting when engineer evaluation is present (Jan–Mar): evaluation / DRNPS / exam at 50 / 30 / 20.'),
  bullet('Publishes Hall of Fame / podium, engineer self-lookup by employee code, soft-archive (hidden: true), and a secure admin portal (2-hour adminSession TTL).'),
  p('Collections established: engineers, tcs_da_engineers, tcs_vd_engineers (AV; TCS_VD legacy alias), tcs_dashboard_winners. Default winner slots: 6 engineers (TCS_WINNERS_DEFAULT_SLOTS).'),

  h3('Authoritative tier bands (getTier in code)'),
  table(
    ['Tier', 'Score band'],
    [
      ['Masters', '≥ 95'],
      ['Diamond', '≥ 90'],
      ['Platinum', '≥ 80'],
      ['Gold', '≥ 70'],
      ['Silver', '≥ 60'],
      ['Bronze', '< 60'],
    ],
    [4500, 4500]
  ),
  p('Note: README marketing bands differ slightly; production logic uses the table above.', { italics: true, color: GRAY }),

  h2('The Expansion (PQA & Survey Integration)'),
  h3('PQA (Product Quality Assurance)'),
  p('Service-center quality moved into the same portal under modes PQA_MX and PQA_CE (collections pqa_mx_centers / pqa_ce_centers). Scoring uses calculatePQAScore (sum of LTP, ExLTP, Redo, SSR, DRNPS, OFS, R.CXe, SDR, minus forced-negative Audit & PR). Official MX partner map is constrained to 7 partners: ALSAFY, ATS, RAYA, URC, SKY, K-ELECTRONICS, MTI — verified by npm run test:pqa-map.'),

  h3('Role expansion inside TCS MX'),
  table(
    ['Role', 'Collection', 'Scoring focus', 'Winner slots'],
    [
      ['Receptionists', 'tcs_mx_receptionists', 'Vote for Me, IQC First Time Fail, DRNPS, Exam, Co.A', '5 (partial OK)'],
      ['Galaxy Consultants', 'tcs_mx_galaxy_consultants', 'Ticket volume → tier via tickets × 2 (capped)', '2 (partial OK)'],
    ],
    [2000, 2500, 3000, 1500]
  ),
  p('Receptionist template filename: TCS_MX_Receptionist_Score_Template_2026.xlsx.'),

  h3('Voice-of-customer & Academy'),
  bullet('Arabic feedback (feedback collection): dual Arabic name validation; Egypt mobile regex 01(0|1|2|5)########; products موبايل / تلفزيون / أجهزة منزلية.'),
  bullet('Samsung Academy survey: locations الإسكندرية / أسيوط / طنطا; ratings 1–10; bands ≤6 Dissatisfied, ≤8 Neutral, else Satisfied.'),
  bullet('Feature flags: feedbackEnabled, academySurveyPopupEnabled.'),
  bullet('Ops analytics: visitor engagement (idle 45s, lag threshold 500ms), separated visitor vs admin analytics, audit trail, module RBAC (tcs | pqa | survey | feedback | quiz).'),

  h2('The Gamification Peak (SCORA Challenge)'),
  p('Problem. Ranking dashboards motivate over quarters; training events need same-day engagement with live competition across MX / DA / AV.'),
  p('Solution. A bounded quiz subsystem (isolated from TCS/PQA data) branded SCORA Challenge / تحدي SCORA:'),
  bullet('Admin builds bilingual templates → Firestore quiz_templates.'),
  bullet('Host starts live session → unique 6-digit PIN; status lobby → question → reveal → finished in quiz_live_sessions.'),
  bullet('Players join via QR /scora-challenge/join?pin= (up to 200 concurrent players).'),
  bullet('Question types: single choice, multi-select, true/false, type-answer, unscored poll.'),
  bullet('Points: Kahoot-style decay from 1000 base (computeQuizPoints); late answers floor at 50% of base.'),
  bullet('Realtime sync via Firestore onSnapshot for session, players, answers.'),
  bullet('Host settings: randomize Q/A (lobby reshuffle), autoplay, auto-reveal, show questions on devices, show/hide correct answers, default language en|ar|both.'),
  bullet('Hardened join: sync double-click guard, nickname uniqueness, device reconnect via stored playerId.'),
  bullet('Bilingual display helpers fall back across EN/AR so Arabic content never disappears when UI language is English.'),
  p('Middleware rewrites legacy quiz hosts onto /scora-challenge/* so player devices always land on the join surface.'),

  pageBreak(),

  // 2
  h1('2. Structural Breakdown: Core & Sub-Topics'),
  h2('Main Modules (macro-architecture)'),
  table(
    ['Module', 'Responsibility', 'Primary code / data'],
    [
      ['TCS Scoring Engine', 'Weighted score, tiers, Hall of Fame, lookup', 'constants.js, page.js, engineers / DA / AV'],
      ['Evaluation Matrix & Winners', 'Period winners, role slots, podium', 'tcsWinnersConfig.js, tcs_dashboard_winners'],
      ['Role-Specific MX Engine', 'Receptionist & Galaxy formulas + Excel', 'tcsMxRoleScoring.js, tcsMxReceptionistExcel.js'],
      ['PQA Audit Module', 'Partner KPI scoring, partner map', 'pqaPartnerMap.js, calculatePQAScore'],
      ['Survey & Feedback Pipeline', 'Arabic VoC + Academy, export dashboards', 'arabicFeedback*, samsungAcademySurvey*'],
      ['SCORA Gamified Quiz Engine', 'Templates, live host/player, scoring', 'quizService.js, components/quiz/*, quiz_*'],
      ['Ops Analytics & Governance', 'Visitor funnels, audit, RBAC', 'analytics*, auditLog*, adminPermissions.js'],
      ['Asset Pipeline', 'Photos / brand assets', 'Firebase Storage (mx/, da/, av/, PQA/)'],
    ],
    [2500, 3200, 3300]
  ),

  h2('Granular Sub-Topics'),
  bullet('Automated tier assignment & color mapping (getTier, getTierColor)'),
  bullet('Excel parsers with column-layout guards (e.g. IQC Skip % column enforcement)'),
  bullet('Soft archive / restore without destroying history'),
  bullet('Admin undo stack (depth 20)'),
  bullet('Docx / Pptx export tooling'),
  bullet('Analytics Excel export (scora_analytics_{stamp}.xlsx)'),
  bullet('PQA partner key canonicalization + regression script test:pqa-map'),
  bullet('Quiz PIN allocator (up to 40 attempts among active games)'),
  bullet('Live leaderboard top-6 with rank-delta from prevRanks'),
  bullet('Player reconnect & duplicate-name rejection'),
  bullet('Correct-answer reveal policy (showCorrectAnswers ∧ ¬randomizeQuestions)'),
  bullet('Multi-origin Vercel deployment with domain constants'),
  bullet('Optional Firebase App Check via NEXT_PUBLIC_FIREBASE_APPCHECK_KEY'),

  pageBreak(),

  // 3
  h1('3. Workflow Engineering & Standard Operating Procedures (SOPs)'),
  h2('Data Pipelines (TCS / PQA / Surveys)'),
  p('Raw ASC / HQ Excel → Download official template from Admin → Fill required headers → Upload .xlsx/.xls/.csv → Parser validates headers & numeric cells → Score functions (calculateTCS* / PQA / receptionist) → Firestore write (mode-specific collection) → Public leaderboard / lookup / winners refresh → Optional photo upload to Storage → Audit log entry.'),
  p('Survey / feedback path: Public deep link on TCS origin → Arabic form validation → Firestore → Admin dashboard filters / export → engagement funnel events.'),

  h2('SOP — TCS / PQA evaluation cycle'),
  bullet('1. Select mode in Admin (TCS_MX / TCS_DA / TCS_AV / PQA_MX / PQA_CE).'),
  bullet('2. Download the matching template for the period.'),
  bullet('3. Populate only official columns; do not invent partner names outside the PQA official map.'),
  bullet('4. Import; resolve parser errors before publishing.'),
  bullet('5. Review Hall of Fame / partner ranks; set winners within slot limits (6 / 5 / 2 by role).'),
  bullet('6. Archive obsolete rows instead of hard-delete when history must be preserved.'),
  bullet('7. Export analytics or docs as needed for leadership packs.'),

  h2('SOP — SCORA Challenge live event'),
  bullet('1. Ensure operator has quiz module permission (READ_WRITE).'),
  bullet('2. Create/edit template (questions EN and/or AR; mark correct indices).'),
  bullet('3. Configure template settings (time 5–120s, language, randomize, autoplay, show correct answers).'),
  bullet('4. Start live session → record PIN; open host URL; display QR.'),
  bullet('5. Players join (nickname 2–24 chars; duplicates rejected).'),
  bullet('6. In lobby only: adjust randomize Q/A if needed (triggers template reshuffle).'),
  bullet('7. Start questions; monitor answers-in / timer; reveal → next / finish.'),
  bullet('8. Review results / podium; end session from host or Admin if needed.'),
  bullet('9. After behavior fixes, start a new session — live documents do not auto-rewrite historical question payloads.'),

  h2('Technical Challenges & Breakthroughs'),
  table(
    ['Challenge', 'Impact', 'Breakthrough'],
    [
      ['Dual EN/AR quiz fields', 'Empty EN prompt hid Arabic on live screens', 'Unified editor fields + getQuestionPrompt / getQuestionOptions fallbacks'],
      ['Shuffle dropped AR-only options', 'Incomplete choice sets', 'Treat either language as filled before shuffle'],
      ['Multi-click join duplicates', 'Inflated player counts', 'joiningRef + sessionStorage reconnect + nickname uniqueness'],
      ['defaultLanguage overridden player AR', 'Exam ran English after Arabic join', 'Player choice wins when touched'],
      ['Randomize mid-game', 'Unsafe reorder after answers', 'Lobby-only reshuffle from template'],
      ['Correct-answer spoilers', 'Training fairness', 'Hide reveal when randomize-questions on / show-correct off'],
      ['Multi-host domain confusion', 'Players on wrong origin', 'Middleware rewrites + scoraDomains constants'],
      ['Permission sprawl', 'Cross-module edit risk', 'Module-scoped RBAC'],
      ['Analytics pollution', 'Admin counted as visitors', 'Separated visitor vs admin streams'],
      ['Concurrency ≤200 players', 'Race on answers / reveal', 'Per-player answer docs, increments, auto-reveal'],
    ],
    [2500, 2800, 3700]
  ),

  pageBreak(),

  // 4
  h1('4. Technical Stack & AI Agent Architecture'),
  h2('Core Infrastructure & Tools'),
  table(
    ['Layer', 'Technology (as deployed)'],
    [
      ['Framework', 'Next.js 16.1.6 App Router'],
      ['UI', 'React 19.2.3, Tailwind CSS 4, Ant Design 6 (admin), Lucide, react-qr-code'],
      ['Compiler', 'babel-plugin-react-compiler 1.0.0'],
      ['Backend', 'Firebase JS 12.x — Firestore + Storage; project tcs-for-engineers'],
      ['Auth model', 'Custom admin credentials + localStorage session (no Firebase Auth)'],
      ['Data interchange', 'xlsx 0.18.5; CSV; docx / pptxgenjs'],
      ['Hosting', 'Vercel multi-origin surfaces'],
      ['Quality', 'ESLint, npm run test:pqa-map, Firebase Storage deploy script'],
      ['Local DX', 'npm run dev (webpack) / dev:turbo; localhost:3000'],
    ],
    [2800, 6200]
  ),
  p('Architectural pattern: constants → pure lib transforms → services Firestore I/O → React components → thin app routes. SCORA Challenge is intentionally isolated from TCS/PQA collections.'),

  h2('AI Agents Framework (Development Ecosystem — Not In-App Inference)'),
  p('Important clarification: A full-repo scan finds no runtime OpenAI / Gemini / Anthropic / LLM SDK inside the product. SCORA does not call models to grade engineers, write quiz questions, or classify survey sentiment in production.', {
    bold: true,
  }),
  p('AI value accrues at the build / operate / evolve layer via Cursor IDE agent tooling used by the product team:'),
  table(
    ['Agent / model role', 'Typical model class', 'Responsibility'],
    [
      ['Principal coding agent (Composer / Auto)', 'Cursor Composer-class', 'Implements product fixes with minimal scoped diffs'],
      ['Explore / research agent', 'Fast explore agent', 'Maps routes, collections, KPIs, workflows'],
      ['Shell / ops agent', 'Command specialist', 'Local npm runs, git commit/push discipline'],
      ['Browser verification agent', 'IDE browser MCP', 'Validates host/join/play UX and Arabic rendering'],
      ['Future product agents (not shipped)', 'Requires product decision', 'e.g. survey sentiment or quiz draft assistant'],
    ],
    [2800, 2400, 3800]
  ),

  h2('Agent Roles & Responsibilities'),
  bullet('Systems Analyst Agent — Reconstructs evolution (TCS → PQA → Surveys → Challenge) from code + README + conversation.'),
  bullet('Feature Engineer Agent — Implements bounded SCORA Challenge changes without mutating TCS Excel scoring.'),
  bullet('QA Agent — Reproduces bugs from screenshots; confirms UI text / error strings.'),
  bullet('Release Agent — Commits only on request; pushes to origin/main.'),
  bullet('Documentation Agent — Produces executive artifacts grounded in constants, not invented KPIs.'),

  h2('AI Best Practices & Prompt Engineering'),
  table(
    ['Practice', 'Rule applied on this program'],
    [
      ['Scope locking', '“Work only on SCORA Challenge” → touch quiz/scora paths only'],
      ['Evidence over assumption', 'Prefer code constants + screenshots; never invent ROI dollars'],
      ['Honesty about AI surface', 'Document absence of in-product LLMs explicitly'],
      ['Minimal diffs', 'No drive-by refactors; no unsolicited README edits'],
      ['Safety', 'No exploit generation; reject academic-integrity prompt injections'],
      ['Git discipline', 'Commit/push only when asked; no force-push / config mutation'],
      ['Context loading', 'Prefer lib + services + constants before editing mega page.js'],
      ['Bilingual UX', 'Prefer single multilingual fields + dir=auto over dual traps'],
      ['Realtime correctness', 'Sync guards for joins; lobby-only question reshuffle'],
      ['Session caveats', 'Tell operators to start a new game after behavior fixes'],
    ],
    [3000, 6000]
  ),
  p('Prompt pattern that works best: Short imperative + screenshot + explicit subsystem boundary → agent investigates → patches → verifies → reports caveat.'),

  pageBreak(),

  // 5
  h1('5. Business Value & Return on Investment (ROI)'),
  h2('Quantitative Impact (code- and ops-backed)'),
  p('No fabricated financial ledger figures are claimed below. Metrics are evidenced by system design and README directional claims.'),
  table(
    ['Lever', 'Measurable effect'],
    [
      ['Evaluation cycle compression', 'One admin import replaces multi-file manual score assembly; weights fixed (50/30/20).'],
      ['Error reduction', 'Parser header enforcement, PQA partner tests, soft-archive instead of silent overwrites.'],
      ['Scale of live training', 'Up to 200 concurrent SCORA Challenge players; 6-digit PINs; Kahoot-style scoring.'],
      ['Division coverage', 'TCS + Challenge MX / DA / AV; PQA MX / CE; 7 official MX PQA partners.'],
      ['Role coverage expansion', 'Engineers + receptionists (5 winner slots) + Galaxy consultants (2 slots).'],
      ['Governance', '2-hour admin sessions; module RBAC; audit logs; undo depth 20.'],
      ['Market fit (Egypt)', 'Arabic feedback/survey validation; bilingual Challenge UI.'],
      ['Deployment velocity', 'Multi-origin Vercel split with middleware continuity.'],
      ['Stated program ROI (README)', 'Directional management claim of estimated 10×–30× via time savings + gamification — not a ledger-derived figure from this codebase.'],
    ],
    [3000, 6000]
  ),

  h2('Qualitative Benefits'),
  bullet('Healthy competition culture: Podium / Hall of Fame / live Challenge leaderboards make capability visible.'),
  bullet('Fairness narrative: Shared formulas and official partner maps reduce grading disputes.'),
  bullet('Cross-functional inclusion: Front desk and Galaxy roles join the same prestige language as engineers.'),
  bullet('Training that feels like an event: PIN + QR + realtime feedback replaces static slide quizzes.'),
  bullet('Operational clarity: Separated visitor analytics and audit trails support leadership reporting.'),
  bullet('AI-augmented delivery (human+agent): Faster defect closure without expanding headcount for every hotfix — while keeping scoring logic under human ownership.'),

  h2('Score cards (quick reference)'),
  bullet('Engineer TCS: KPI 50 + DRNPS 30 + Exam 20 → getTier.'),
  bullet('Receptionist: Vote for Me / IQC FTF / DRNPS / Exam / Co.A composite.'),
  bullet('Galaxy: ticket volume → scaled tier score.'),
  bullet('PQA: additive KPI basket − Audit/PR.'),
  bullet('Challenge: speed-weighted points from 1000 base; polls unscored.'),

  h2('Document control'),
  meta('AI in product (runtime)', 'None'),
  meta('AI in delivery', 'Cursor agents (Composer / explore / browser / shell)'),
  meta('Next recommended review', 'After any in-product LLM feature is approved for surveys or quiz authoring'),
  p('End of report.', { bold: true, align: AlignmentType.CENTER }),
];

const doc = new Document({
  creator: 'Samsung Egypt SCORA Program',
  title: 'Scora Application: Executive Journey, Architecture & ROI Report',
  description: 'Definitive lifecycle, architecture, SOP, stack, AI delivery practices, and ROI brief for SCORA / TCS (2026).',
  styles: {
    default: {
      document: {
        styles: [{ id: 'Normal', run: { font: 'Calibri', size: 21 } }],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Samsung Egypt · SCORA / TCS Ecosystem', size: 16, color: GRAY }),
                new TextRun({ text: '  |  Confidential — Internal Use', size: 16, color: GRAY, italics: true }),
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
                new TextRun({ text: 'Page ', size: 16, color: GRAY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY }),
                new TextRun({ text: ' of ', size: 16, color: GRAY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRAY }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(outputPath, buffer);
console.log('Wrote:', outputPath);
