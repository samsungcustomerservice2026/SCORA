"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { App, ConfigProvider, theme, message as antdMessage, Modal, Switch } from 'antd';
import {
  Users,
  ShieldCheck,
  Search,
  BarChart3,
  Plus,
  LogOut,
  ChevronRight,
  Settings,
  Activity,
  Award,
  X,
  Save,
  Edit2,
  Eye,
  Download,
  Upload,
  Calendar,
  Layers,
  Cpu,
  Monitor,
  UserPlus,
  UserCircle,
  Trash2,
  Camera,
  Trophy,
  TrendingUp,
  Clock,
  ChevronLeft,
  Star,
  Flame,
  Crown,
  Gem,
  BookOpen,
  MessageSquare,
  Send,
  CheckCircle,
  Info,
  RefreshCw,
  Building2,
  Shield,
  ExternalLink,
  Copy,
  Undo2,
  ClipboardList
} from 'lucide-react';

import SamsungAcademySurveyDashboard from '../components/admin/SamsungAcademySurveyDashboard';
import ArabicFeedbackDashboard from '../components/admin/ArabicFeedbackDashboard';
import QuizAdminPanel from '../components/quiz/QuizAdminPanel';
import AdminAccountsPanel, { EMPTY_ADMIN_FORM, SUPER_ADMIN_AUTHORITY } from '../components/admin/AdminAccountsPanel';
import AdminPortalShell from '../components/admin/AdminPortalShell';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MotionCard, MotionStage, usePortalLaunch } from '../components/transitions/PortalLaunch';
import LogTrafficPanel from '../components/admin/LogTrafficPanel';
import VisitorEngagementPanel from '../components/admin/VisitorEngagementPanel';
import { StudioStatGrid, StudioPanel, StudioWave } from '../components/admin/reportStudio/ReportStudio';
import { buildDailySeries } from '../lib/logAnalyticsHelpers';
import SamsungProductKbPanel from '../components/admin/SamsungProductKbPanel';
import TechnicalConsultantsPanel from '../components/admin/TechnicalConsultantsPanel';
import EmployeeAuthModal from '../components/employee/EmployeeAuthModal';
import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import ConsultantViewer from '../components/employee/ConsultantViewer';
import AddToHomeScreenSheet from '../components/pwa/AddToHomeScreenSheet';
import NotifyAlertsBanner from '../components/pwa/NotifyAlertsBanner';
import PublicLinkQr from '../components/admin/PublicLinkQr';
import { ADMIN_USERNAME_PATTERN, internalAdminEmail } from '../lib/auth/adminLoginId';
import { useVisitorEngagement } from '../hooks/useVisitorEngagement';
import { useEmployeeAuth } from '../hooks/useEmployeeAuth';
import { recordFunnelStep } from '../services/visitorEngagementService';
import { exportAnalyticsReport } from '../lib/exportAnalyticsReport';
import {
  DEFAULT_ACADEMY_SURVEY,
  DEFAULT_SURVEY_ID,
  buildSurveyResponsePayload,
  displaySurveyName,
  emptySurveyAnswers,
  surveyDir,
  surveyLangAttr,
  validateSurveyAnswers,
} from '../lib/surveyDefinitions';
import PublicSurveyForm from '../components/survey/PublicSurveyForm';
import SurveyDefinitionsPanel from '../components/admin/SurveyDefinitionsPanel';
import {
  canReadModule,
  canWriteModule,
  canAccessModule,
  canAccessTcsEnv,
  canAccessPqaEnv,
  buildPermissionsForSave,
  permissionsForForm,
  syncScopePermissions,
  DEFAULT_FORM_PERMISSIONS,
} from '../lib/adminPermissions';
import { cloneSnapshot, pushUndoEntry, popUndoEntry } from '../lib/adminUndo';

import {
  INITIAL_ENGINEERS,
  INITIAL_MX_RECEPTIONISTS,
  INITIAL_MX_GALAXY_CONSULTANTS,
  calculateDRNPS,
  getTier,
  getTierColor,
  calculatePQAScore,
  DEFAULT_ENGINEER_PHOTO_URL,
} from '../constants';
import dynamic from 'next/dynamic';
import { getEngineers, getHiddenEngineers, saveEngineer as saveEngineerToDb, archiveEngineer, deleteEngineerPermanent, getAdmins, createAdminAccount, saveAdmin as saveAdminToDb, deleteAdmin as deleteAdminFromDb, saveFeedback as saveFeedbackToDb, saveSamsungAcademySurvey as saveSamsungAcademySurveyToDb, getSamsungAcademySurveys as getSamsungAcademySurveysFromDb, getTcsDashboardWinners, saveTcsDashboardWinners, getAcademySurveySettings, saveAcademySurveySettings, getSurveyDefinitions } from '../services/firestoreService';
import { normalizePqaPartnerKey, mapPqaSheetPartnerKeyToOfficial, PQA_OFFICIAL_MX_PARTNERS } from '../lib/pqaPartnerMap.js';
import {
  parseTcsScoreSheetRows,
  pickBestTcsWorksheetRows,
  resolveMxIqcSkipForDisplay,
  TCS_MX_TEMPLATE_HEADERS,
  TCS_MX_TEMPLATE_SHEET_NAME,
} from '../lib/tcsExcelImport';
import {
  workbookHasEngineerWide,
  parseUnifiedEngineerWorkbook,
  downloadUnifiedEngineerTemplate,
  TCS_MX_UNIFIED_TEMPLATE_FILENAME,
  TCS_MX_UNIFIED_FORMAT,
  isUnifiedEngineerRecord,
  getUnifiedAverageFinalResult,
  getUnifiedQuarterFinalResult,
  engineerHasQuarter,
  flattenQuarterForDisplay,
  listPresentQuarters,
  monthNameToQuarter,
  QUARTER_END_MONTH,
  getUnifiedQuarterKpiCards,
  formatUnifiedKpiValue,
} from '../lib/tcsMxUnifiedExcel';
import {
  workbookHasDaAvQuarterlyResults,
  parseDaAvUnifiedWorkbook,
  downloadDaAvUnifiedTemplate,
  TCS_DA_AV_UNIFIED_TEMPLATE_FILENAME,
  TCS_DA_AV_UNIFIED_FORMAT,
  resolveDaAvDisplayName,
  getDaAvQuarterKpiCards,
  formatDaAvKpiValue,
  getDaAvQuarterFinal,
  getDaAvAverageFinal,
} from '../lib/tcsDaAvUnifiedExcel';
import {
  calculateReceptionistScore,
  calculateGalaxyConsultantScore,
  resolveMxRoleDashboardScore,
  resolveMxRoleTierScore,
  resolveReceptionistDrnps,
  getMxRoleLeaderboardScoreField,
  getMxRoleLeaderboardScoreLabel,
  buildMxRoleEditingDefaults,
} from '../lib/tcsMxRoleScoring';
import {
  buildTcsWinnersConfigMap,
  lookupTcsWinnersConfig,
  TCS_MX_WINNER_ROLES,
  getTcsWinnersSlotCount,
  validateTcsWinnersCodes,
  TCS_WINNERS_DEFAULT_SLOTS,
  resolveTcsWinnersConfig,
  isWinnersMapKeyForRole,
} from '../lib/tcsWinnersConfig';
import {
  TCS_MX_RECEPTIONIST_TEMPLATE_FILENAME,
  buildReceptionistTemplateArrayBuffer,
  parseReceptionistWorkbook,
  isEphemeralRegistryId,
} from '../lib/tcsMxReceptionistExcel';
const GoGoAssistant = dynamic(() => import('../components/gogo/GoGoAssistant'), {
  ssr: false,
  loading: () => null,
});
import {
  FEEDBACK_PRODUCT_OPTIONS,
  validateArabicFeedbackForm,
} from '../lib/arabicFeedbackValidation';
import {
  SCORA_ADMIN_EXTERNAL_LOGS_URL,
  SCORA_PUBLIC_FEEDBACK_URL,
  SCORA_PUBLIC_PATHS,
  SCORA_PUBLIC_SURVEY_URL,
} from '../constants/scoraDomains';

import {
  FIREBASE_STORAGE_RULES_CONSOLE_URL,
  FIREBASE_STORAGE_RULES_SNIPPET,
} from '../constants/firebaseStorageRules';
import { uploadPhoto, uploadTcsAllProductImagesFromPublic } from '../services/storageService';
import { recordVisit, recordVisitorModeSegment, recordAdminLogin, recordSessionEnd, getAnalyticsSummary } from '../services/analyticsService';
import { writeLog, fetchLogs } from '../services/auditLogService';
import {
  signInAdmin,
  signOutAdmin,
  subscribeAdminAuth,
  watchAdminProfile,
  clearAdminUiPrefs,
  readMigrationSession,
} from '../lib/auth/adminAuthClient';
/**
 * Super admins add admins from Manage Accounts (Firebase Auth + admins/{uid}).
 * Do NOT put passwords in NEXT_PUBLIC_* variables.
 */

// ─── Helper: Month name → quarter ────────────────────────────────────────────
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Year as stored in Excel/Firestore → 4-digit string for quarter keys (fixes Q1-undefined dropped by regex) */
const normalizeYearKey = (y) => {
  if (y === undefined || y === null || y === '') return null;
  const s = String(y).trim().replace(/,/g, '');
  if (/^\d{4}$/.test(s)) return s;
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1950 && n <= 2100) return String(n);
  if (/^\d{2}$/.test(s)) {
    const v = parseInt(s, 10);
    return (v >= 0 && v <= 99 ? (v < 50 ? `20${s.padStart(2, '0')}` : `19${s}`) : null);
  }
  return null;
};

/** Excel whole-day serial (~20000–60000) → calendar month/year */
const excelSerialToMonthYear = (raw) => {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(num) || num < 20000 || num > 60000) return null;
  const ms = (num - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return { month: MONTH_ORDER[d.getUTCMonth()], year: String(d.getUTCFullYear()) };
};

const getQuarter = (monthName) => {
  if (monthName === undefined || monthName === null || monthName === '') return null;
  if (typeof monthName === 'number' && monthName >= 1 && monthName <= 12) {
    return `Q${Math.floor((monthName - 1) / 3) + 1}`;
  }
  const mnTrim = String(monthName).trim();
  const asNum = parseInt(mnTrim, 10);
  if (/^\d{1,2}$/.test(mnTrim) && asNum >= 1 && asNum <= 12) {
    return `Q${Math.floor((asNum - 1) / 3) + 1}`;
  }
  const mn = mnTrim.toLowerCase();
  const idx = MONTH_ORDER.findIndex(m =>
    m.toLowerCase() === mn || (mn.length >= 3 && m.toLowerCase().startsWith(mn.slice(0, 3)))
  );
  if (idx < 0) return null;
  return `Q${Math.floor(idx / 3) + 1}`;
};

const UI_STATE_STORAGE_KEY_MAIN = 'tcs_ui_state_main_v1';
const UI_STATE_STORAGE_KEY_ADMIN = 'tcs_ui_state_admin_v1';
/** Tab-scoped flag: admin explicitly logged in this session (survives reload, cleared on logout). */
const ADMIN_SESSION_OK_KEY = 'adminSessionOk_v1';
const ADMIN_PROFILE_CACHE_KEY = 'adminSessionProfile_v1';
const ACADEMY_SURVEY_SETTINGS_CACHE_KEY = 'academySurveySettingsCache_v1';

/** Gold / silver / bronze numerals for the TCS and PQA top-three podium. */
const PODIUM_MEDAL_STYLES = {
  1: { gradient: 'from-yellow-200 via-yellow-400 to-amber-600', glow: 'drop-shadow-[0_0_14px_rgba(250,204,21,0.45)]' },
  2: { gradient: 'from-white via-zinc-300 to-zinc-500', glow: 'drop-shadow-[0_0_12px_rgba(212,212,216,0.35)]' },
  3: { gradient: 'from-orange-200 via-orange-500 to-amber-800', glow: 'drop-shadow-[0_0_12px_rgba(234,88,12,0.4)]' },
};

const ADMIN_RESTORABLE_VIEWS = new Set(['ADMIN_DASHBOARD', 'PROFILE_MGMT', 'EXTERNAL_LOGS']);

function readCachedAdminProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedAdminProfile(profile) {
  if (typeof window === 'undefined' || !profile) return;
  try {
    sessionStorage.setItem(ADMIN_PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

function clearCachedAdminProfile() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function readCachedAcademySurveySettings() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACADEMY_SURVEY_SETTINGS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedAcademySurveySettings(settings) {
  if (typeof window === 'undefined' || !settings) return;
  try {
    localStorage.setItem(ACADEMY_SURVEY_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function readAdminBootView() {
  if (typeof window === 'undefined') return 'ADMIN_LOGIN';
  try {
    if (sessionStorage.getItem(ADMIN_SESSION_OK_KEY) !== '1') return 'ADMIN_LOGIN';
    const raw = sessionStorage.getItem(UI_STATE_STORAGE_KEY_ADMIN);
    if (!raw) return 'ADMIN_DASHBOARD';
    const parsed = JSON.parse(raw);
    const restored = parsed?.view || 'ADMIN_DASHBOARD';
    return ADMIN_RESTORABLE_VIEWS.has(restored) ? restored : 'ADMIN_DASHBOARD';
  } catch {
    return 'ADMIN_DASHBOARD';
  }
}

/** Clean public paths — also work via query: ?survey=samsung-academy | ?feedback=1 */
const PUBLIC_SAMSUNG_ACADEMY_SURVEY_PATH = SCORA_PUBLIC_PATHS.survey;
const PUBLIC_FEEDBACK_PATH = SCORA_PUBLIC_PATHS.feedback;

const isDirectSurveyQuery = (value) => {
  const v = String(value || '').toLowerCase();
  return v === 'samsung-academy' || v === 'academy' || v === '1' || v === 'true';
};

const isDirectFeedbackQuery = (value) => {
  const v = String(value || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'feedback' || v === 'arabic';
};
const getMonthIndex = (monthName) => {
  if (monthName === undefined || monthName === null || monthName === '') return 0;
  if (typeof monthName === 'number' && monthName >= 1 && monthName <= 12) return monthName - 1;
  const mnTrim = String(monthName).trim();
  const asNum = parseInt(mnTrim, 10);
  if (/^\d{1,2}$/.test(mnTrim) && asNum >= 1 && asNum <= 12) return asNum - 1;
  const mn = mnTrim.toLowerCase();
  const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === mn || (mn.length >= 3 && m.toLowerCase().startsWith(mn.slice(0, 3))));
  return idx < 0 ? 0 : idx;
};

/** Split "March-2025" or "SKY - Port Said-2025" (month may contain hyphens) */
const parseMonthYearKey = (key) => {
  if (!key || typeof key !== 'string') return { month: '', year: '' };
  const lastDash = key.lastIndexOf('-');
  if (lastDash <= 0) return { month: '', year: '' };
  return { month: key.slice(0, lastDash).trim(), year: key.slice(lastDash + 1).trim() };
};

/** Firestore may store year as number or string — always compare coerced */
const sameCalendarYear = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

/** TCS MX role tabs — Engineers unchanged; Receptionists & Galaxy Consultants use separate collections. */
const TCS_MX_ROLE_TABS = [
  { key: 'engineers', label: 'Engineers' },
  { key: 'receptionists', label: 'Receptionists' },
  { key: 'galaxy_consultants', label: 'Galaxy Consultants' },
];

const TCS_MX_ROLE_COLLECTIONS = {
  engineers: 'engineers',
  receptionists: 'tcs_mx_receptionists',
  galaxy_consultants: 'tcs_mx_galaxy_consultants',
};

const getInitialDataForCollection = (collectionName) => {
  if (collectionName === TCS_MX_ROLE_COLLECTIONS.receptionists) return INITIAL_MX_RECEPTIONISTS;
  if (collectionName === TCS_MX_ROLE_COLLECTIONS.galaxy_consultants) return INITIAL_MX_GALAXY_CONSULTANTS;
  return INITIAL_ENGINEERS;
};

const getTcsMxRolePersonLabel = (mxRoleTab) => {
  if (mxRoleTab === 'receptionists') return 'Receptionist';
  if (mxRoleTab === 'galaxy_consultants') return 'Galaxy Consultant';
  return 'Engineer';
};

/** Firestore collection for app mode (TCS split by division: MX uses legacy `engineers`) */
const resolveFirestoreCollection = (mode, mxRoleTab = 'engineers') => {
  if (!mode) return TCS_MX_ROLE_COLLECTIONS.engineers;
  if (mode === 'PQA_MX') return 'pqa_mx_centers';
  if (mode === 'PQA_CE') return 'pqa_ce_centers';
  if (mode === 'TCS_DA') return 'tcs_da_engineers';
  if (mode === 'TCS_AV' || mode === 'TCS_VD') return 'tcs_vd_engineers';
  if (mode === 'TCS_MX') {
    return TCS_MX_ROLE_COLLECTIONS[mxRoleTab] || TCS_MX_ROLE_COLLECTIONS.engineers;
  }
  return 'engineers';
};

/** Default maxima for PQA KPI bars (override per sheet via header “SSR (20)”). MX vs CE can diverge here. */
const PQA_KPI_DEFAULTS_MX = {
  ltp: 10, exLtp: 10, redo: 10, ssr: 20, dRnps: 10, ofs: 10, rCxe: 10, sdr: 10, audit: 5, pr: 5, coa: 50,
};
const PQA_KPI_DEFAULTS_CE = {
  ltp: 10, exLtp: 10, redo: 10, ssr: 20, dRnps: 10, ofs: 10, rCxe: 10, sdr: 10, audit: 5, pr: 5, coa: 50,
};

/** Normalize any month label to full MONTH_ORDER name so Firestore keys stay consistent. */
function canonicalPqaMonthName(raw) {
  if (!raw) return MONTH_ORDER[0];
  const s = String(raw).trim();
  const idx = MONTH_ORDER.findIndex(
    (m) =>
      m.toLowerCase() === s.toLowerCase() ||
      (s.length >= 3 && m.toLowerCase().startsWith(s.toLowerCase().slice(0, 3)))
  );
  return idx >= 0 ? MONTH_ORDER[idx] : MONTH_ORDER[0];
}

/** Must match Partner Ranking / Monthly Average map keys: `CODE` + `_jan_` + `2026` (3-letter month, lower). */
function pqaPartnerMapMonthToken(monthLabel) {
  return canonicalPqaMonthName(monthLabel).slice(0, 3).toLowerCase();
}

/** Display month like Partner sheet: Jan, Feb, Mar… */
function pqaShortMonthDisplayName(monthLabel) {
  const full = canonicalPqaMonthName(monthLabel);
  return full.charAt(0).toUpperCase() + full.slice(1, 3).toLowerCase();
}

/**
 * Parse numeric Excel cells (European decimals, thousands, typed numbers).
 * Used by ★Evaluation point and ★Partner Ranking (accumulated D/E).
 */
function parseExcelNumericCell(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  let s = String(v ?? '').trim();
  if (!s) return 0;
  if (s.startsWith('=')) s = s.replace(/^=/, '').trim();
  s = s.replace(/[^0-9,.-]/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && !hasDot) {
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma && hasDot) {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** PQA display score (0–100): KPI-derived, Excel cap, partner/monthly fallbacks — shared by registry + dossier. */
function resolvePqaTcsScorePure(e) {
  if (!e) return 0;
  const k = calculatePQAScore({
    ltp: e.ltp || 0,
    exLtp: e.exLtp || 0,
    redo: e.redo || 0,
    ssr: e.ssr || 0,
    dRnps: e.dRnps || 0,
    ofs: e.ofs || 0,
    rCxe: e.rCxe || 0,
    sdr: e.sdr || 0,
    audit: e.audit || 0,
    pr: e.pr || 0,
  });
  const raw = parseFloat(e.tcsScore);
  if (Number.isFinite(raw) && raw > 0 && raw <= 100) return Number(raw.toFixed(1));
  if (Number.isFinite(raw) && raw > 100) return k;
  if (k > 0) return k;
  const fallback = parseFloat(e.partnerScore ?? e.monthlyScore ?? e.centerMonthlyScore ?? '');
  if (Number.isFinite(fallback) && fallback > 0 && fallback <= 100) return Number(fallback.toFixed(1));
  return k;
}

/** Merge Evaluation-point fields from all Firestore rows for the same service center (same upload/division). */
function mergePqaKpiFromRecordsPure(primary, sameCodeRecords) {
  const keys = ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'coa', 'switching', 'tc', 'sdr', 'audit', 'pr', 'owRnps'];
  const kpiMagSum = (e) => keys.reduce((s, x) => s + Math.abs(parseFloat(e[x] || 0)), 0);
  const siblings = sameCodeRecords.filter((r) => !primary.id || !r.id || String(primary.id) !== String(r.id));
  const pool = [primary, ...siblings].sort((a, b) => kpiMagSum(b) - kpiMagSum(a));
  const out = { ...primary };
  for (const x of keys) {
    const cur = parseFloat(out[x] || 0);
    if (cur !== 0) continue;
    for (const r of pool) {
      const nv = parseFloat(r[x] || 0);
      if (nv !== 0) {
        out[x] = r[x];
        break;
      }
    }
  }
  if (!out.pqaKpiCaps) {
    for (const r of pool) {
      if (r.pqaKpiCaps) {
        out.pqaKpiCaps = r.pqaKpiCaps;
        break;
      }
    }
  }
  if (!(parseFloat(out.evalMonthlyScore) > 0)) {
    const src = pool.find((r) => parseFloat(r.evalMonthlyScore) > 0);
    if (src) out.evalMonthlyScore = src.evalMonthlyScore;
  }
  if (!(parseInt(String(out.monthlyEvalRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.monthlyEvalRank ?? 0), 10) > 0);
    if (src) out.monthlyEvalRank = src.monthlyEvalRank;
  }
  if (!(parseInt(String(out.monthlyRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.monthlyRank ?? 0), 10) > 0);
    if (src) out.monthlyRank = src.monthlyRank;
  }
  if (!(parseInt(String(out.ytdRank ?? 0), 10) > 0)) {
    const src = pool.find((r) => parseInt(String(r.ytdRank ?? 0), 10) > 0 || parseInt(String(r.centerYtdRank ?? 0), 10) > 0);
    if (src) {
      out.ytdRank = src.ytdRank || out.ytdRank;
      out.centerYtdRank = src.centerYtdRank || out.centerYtdRank;
    }
  }
  // Preserve partner identity from any sibling month row (needed for partner accumulated dashboard grouping).
  const outPartnerNorm = normalizePqaPartnerKey(out.partnerName || '');
  const outPartnerMapped = mapPqaSheetPartnerKeyToOfficial(outPartnerNorm);
  if (!outPartnerMapped) {
    const src = pool.find((r) => mapPqaSheetPartnerKeyToOfficial(r.partnerName || ''));
    if (src?.partnerName) out.partnerName = src.partnerName;
  }
  const yn = (v) => parseFloat(v ?? 0) || 0;
  let bestScore = Math.max(yn(out.ytdScore), yn(out.accumulatedScore), yn(out.centerYtdScore));
  let bestRec = null;
  for (const r of pool) {
    const s = Math.max(yn(r.ytdScore), yn(r.accumulatedScore), yn(r.centerYtdScore));
    if (s > bestScore) {
      bestScore = s;
      bestRec = r;
    }
  }
  if (bestRec && bestScore > 0) {
    if (yn(bestRec.accumulatedScore) > 0) out.accumulatedScore = bestRec.accumulatedScore;
    if (parseInt(String(bestRec.accumulatedRank ?? 0), 10) > 0) out.accumulatedRank = bestRec.accumulatedRank;
    if (yn(bestRec.ytdScore) > 0) out.ytdScore = bestRec.ytdScore;
    else if (yn(bestRec.accumulatedScore) > 0) out.ytdScore = bestRec.accumulatedScore;
    if (parseInt(String(bestRec.ytdRank ?? 0), 10) > 0) out.ytdRank = bestRec.ytdRank;
    if (yn(bestRec.centerYtdScore) > 0) out.centerYtdScore = bestRec.centerYtdScore;
    if (parseInt(String(bestRec.centerYtdRank ?? 0), 10) > 0) out.centerYtdRank = bestRec.centerYtdRank;
  }
  out.tcsScore = resolvePqaTcsScorePure(out);
  return out;
}

/**
 * Parse ★Evaluation point / Evaluation point sheet (PQA MX & CE).
 * — Column B (typical): ASC Code; row pairs: month bands (Jan-20…) + KPI sub-row (LTP, SSR…).
 * — Emits map keys `CODE_monthlower_YEAR` compatible with existing merge.
 */
function parsePqaEvaluationPointRows(evalRows, appMode) {
  const partnerPatches = {};
  const ytdPatches = {};
  const baseCaps = appMode === 'PQA_CE' ? { ...PQA_KPI_DEFAULTS_CE } : { ...PQA_KPI_DEFAULTS_MX };

  const normHeader = (x) => String(x ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const capFromCell = (cell) => {
    const m = String(cell ?? '').match(/\((-?\d+)\)/);
    return m ? Math.abs(parseInt(m[1], 10)) : null;
  };
  /** Headers often include point caps, e.g. "SSR (20.0)" → norm "ssr200" — match by prefix / substring. */
  const kpiKeyFromCell = (cell) => {
    const raw = String(cell ?? '').trim();
    const v = normHeader(raw);
    if (!v) return null;
    if (v.includes('total') && v.includes('point')) return null;
    if (v === 'rank' || v === 'ranking' || v === 'rank' || v.endsWith('rank')) return null;
    if (v.includes('partner') && (v.includes('score') || v.includes('rank'))) return null;
    if (appMode === 'PQA_CE') {
      if (v.includes('ltp') && v.includes('vd')) return 'ltpVd';
      if (v.includes('ltp') && v.includes('da')) return 'ltpDa';
      if (v.includes('redo') && v.includes('vd')) return 'redoVd';
      if (v.includes('redo') && v.includes('da')) return 'redoDa';
      if (v.includes('appoint')) return 'appointments';
      if (v.includes('nps') && (v.includes('dr') || v.includes('dn'))) return 'npsDr';
      if (v === 'nps' || (v.includes('nps') && !v.includes('dr') && !v.includes('dn'))) return 'nps';
    }
    if (v.startsWith('ex') && v.includes('ltp')) return 'exLtp';
    if (v.startsWith('ltp')) return 'ltp';
    if (v.startsWith('redo')) return 'redo';
    if (v.startsWith('ssr') || v.includes('ssr')) return 'ssr';
    if (v.includes('drnps')) return 'dRnps';
    if (appMode === 'PQA_CE' && v.includes('nps')) return 'dRnps';
    if (v.includes('ow') && v.includes('rnps')) return 'owRnps';
    if (v.startsWith('ofs')) return 'ofs';
    if (v.includes('cxe') || v.startsWith('rcxe')) return 'rCxe';
    if (v.includes('coa')) return 'coa';
    if (v.includes('switch')) return 'switching';
    if (v === 'tc' || v.startsWith('tc')) return 'tc';
    if (v.startsWith('sdr')) return 'sdr';
    if (v.startsWith('audit')) return 'audit';
    if (v === 'pr' || (v.startsWith('pr') && v.length <= 6 && !v.includes('partner'))) return 'pr';
    return null;
  };

  const monthHdr =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s._'\/]*((?:20)?\d{2,4})?/i;
  const monthNumericHdr = /^'?\s*((?:20)?\d{2,4})[.\-\s/]+(\d{1,2})\s*$/i; // e.g. '26.03, '26. 01, 2026-03

  let codeRowIdx = -1;
  let codeCol = -1;
  for (let i = 0; i < Math.min(evalRows.length, 120); i++) {
    const r = evalRows[i] || [];
    for (let j = 0; j < r.length; j++) {
      if (String(r[j] ?? '').trim().toUpperCase() === 'ASC CODE') {
        codeRowIdx = i;
        codeCol = j;
        break;
      }
    }
    if (codeRowIdx !== -1) break;
  }
  if (codeRowIdx === -1) {
    for (let i = 0; i < Math.min(evalRows.length, 120); i++) {
      const r = evalRows[i] || [];
      for (let j = 0; j < r.length; j++) {
        const nv = normHeader(r[j]);
        if (nv === 'asccode' || (nv.includes('code') && (nv.includes('asc') || nv.includes('center')))) {
          codeRowIdx = i;
          codeCol = j;
          break;
        }
      }
      if (codeRowIdx !== -1) break;
    }
  }
  if (codeRowIdx === -1 || codeCol < 0) return { partnerPatches, ytdPatches };

  const hdr = evalRows[codeRowIdx] || [];
  let regionCol = -1;
  let nameCol = -1;
  let partnerCol = -1;
  let ytdScoreCol = -1;
  let ytdRankCol = -1;
  for (let j = 0; j < hdr.length; j++) {
    const nv = normHeader(hdr[j]);
    const low = String(hdr[j] ?? '').toLowerCase();
    if (j === codeCol) continue;
    if (low.includes('region')) regionCol = j;
    if (nv === 'ascname' || (nv.includes('name') && (nv.includes('asc') || nv.includes('center')))) nameCol = j;
    if (nv.includes('partner') && !nv.includes('rank')) partnerCol = j;
    const accLike = (low.includes('acc') || low.includes('accum')) && (low.includes('ave') || low.includes('avg') || low.includes('average'));
    if (accLike && low.includes('score')) ytdScoreCol = j;
    if (accLike && (low.includes('rank') || nv.includes('ranking'))) ytdRankCol = j;
  }
  if (nameCol < 0) nameCol = codeCol + 1;
  // Samsung template: "Score (100)" under Acc Average may omit "Acc" in the same cell (row 7).
  if (ytdScoreCol < 0) {
    for (let j = 0; j < hdr.length; j++) {
      const low = String(hdr[j] ?? '').toLowerCase().trim();
      const nv = normHeader(hdr[j]);
      if (j === codeCol) continue;
      if (low.includes('score') && (low.includes('100') || /\bacc\b/i.test(String(hdr[j] ?? '')))) {
        ytdScoreCol = j;
        break;
      }
      if (nv === 'score' || (low.includes('score') && !low.includes('ratio') && !low.includes('partner') && !low.includes('point'))) {
        ytdScoreCol = j;
        break;
      }
    }
  }
  // In MX template, accumulated rank is usually the next column after accumulated score (e.g. column E).
  if (ytdRankCol < 0 && ytdScoreCol > -1) {
    const cand = ytdScoreCol + 1;
    if (cand < hdr.length) ytdRankCol = cand;
  }

  /** KPI labels are often on the SAME row as "ASC Code" (row 7); previously we only scanned below and missed them. */
  let kpiRowIdx = codeRowIdx;
  let bestKpiScore = -1;
  for (let di = 0; di <= 8; di++) {
    const row = evalRows[codeRowIdx + di] || [];
    let score = 0;
    for (let c = 0; c < row.length; c++) {
      const k = kpiKeyFromCell(row[c]);
      if (k && k !== 'pr') score += 1;
    }
    if (score > bestKpiScore) {
      bestKpiScore = score;
      kpiRowIdx = codeRowIdx + di;
    }
  }
  if (bestKpiScore <= 0) kpiRowIdx = codeRowIdx;
  const kpiRow = evalRows[kpiRowIdx] || [];

  const monthBlocks = [];
  for (let r = 0; r <= codeRowIdx; r++) {
    const row = evalRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const raw = String(row[c] ?? '').trim();
      const m = raw.match(monthHdr);
      if (m) {
        const mon = canonicalPqaMonthName(m[1]);
        let yr = '2026';
        if (m[2]) {
          const d = String(m[2]).replace(/\D/g, '');
          if (d.length === 2) yr = `20${d}`;
          else if (d.length >= 4) yr = d.slice(0, 4);
        }
        monthBlocks.push({ startCol: c, month: mon, year: yr, label: raw });
        continue;
      }
      const mn = raw.match(monthNumericHdr);
      if (mn) {
        let yy = String(mn[1]).replace(/\D/g, '');
        const mm = parseInt(String(mn[2]).replace(/\D/g, ''), 10);
        if (!Number.isFinite(mm) || mm < 1 || mm > 12) continue;
        if (yy.length === 2) yy = `20${yy}`;
        if (yy.length > 4) yy = yy.slice(0, 4);
        const mon = MONTH_ORDER[mm - 1];
        monthBlocks.push({ startCol: c, month: mon, year: yy || '2026', label: raw });
      }
    }
  }
  monthBlocks.sort((a, b) => a.startCol - b.startCol);

  const inferBlocksFromLtp = () => {
    const out = [];
    let mi = 0;
    for (let c = 0; c < kpiRow.length; c++) {
      if (kpiKeyFromCell(kpiRow[c]) === 'ltp') {
        out.push({
          startCol: c,
          month: canonicalPqaMonthName(MONTH_ORDER[mi % 12]),
          year: '2026',
          label: 'inferred-ltp',
        });
        mi += 1;
      }
    }
    return out;
  };

  let blocks = monthBlocks;
  if (blocks.length === 0) {
    const inf = inferBlocksFromLtp();
    if (inf.length > 0) blocks = inf;
  }
  if (blocks.length === 0) {
    let fallbackMonth = MONTH_ORDER[0];
    let fallbackYear = '2026';
    for (let r = 0; r <= Math.min(codeRowIdx + 1, 12); r++) {
      const row = evalRows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const raw = String(row[c] ?? '').trim();
        const m = raw.match(monthHdr);
        if (m) {
          fallbackMonth = canonicalPqaMonthName(m[1]);
          if (m[2]) {
            const d = String(m[2]).replace(/\D/g, '');
            if (d.length === 2) fallbackYear = `20${d}`;
            else if (d.length >= 4) fallbackYear = d.slice(0, 4);
          }
          break;
        }
      }
    }
    let startK = -1;
    for (let c = codeCol + 1; c < kpiRow.length; c++) {
      if (kpiKeyFromCell(kpiRow[c])) {
        startK = c;
        break;
      }
    }
    if (startK < 0) startK = codeCol + 3;
    blocks = [{ startCol: startK, month: fallbackMonth, year: fallbackYear, label: 'fallback' }];
  }

  /** "Total" band under each month (before LTP…): Σ(point)(100) = official MX PQA monthly total score. */
  const isMonthTotalPointCol = (cell) => {
    const raw = String(cell ?? '').trim();
    if (!raw || kpiKeyFromCell(cell)) return false;
    const low = raw.toLowerCase();
    const nv = normHeader(raw);
    if (nv.includes('point') && (nv.includes('100') || raw.includes('Σ') || raw.includes('σ'))) return true;
    if ((low.includes('σ') || low.includes('∑') || low.includes('sigma')) && low.includes('point')) return true;
    if (nv === 'point100' || /^point\(/.test(low)) return true;
    return false;
  };

  const colMaps = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const endCol = bi + 1 < blocks.length ? blocks[bi + 1].startCol - 1 : Math.max(kpiRow.length, hdr.length) + 5;
    const caps = { ...baseCaps };
    const colToKey = {};
    for (let c = Math.max(0, b.startCol); c <= endCol && c < kpiRow.length; c++) {
      const key = kpiKeyFromCell(kpiRow[c]);
      if (!key) continue;
      const cap = capFromCell(kpiRow[c]);
      if (cap != null && key in caps) caps[key] = cap;
      colToKey[c] = key;
    }
    const kpiCols = Object.keys(colToKey).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n));
    const firstKpiCol = kpiCols.length ? Math.min(...kpiCols) : b.startCol + 24;
    let evalMonthlyScoreCol = -1;
    let monthlyTotalRankCol = -1;
    for (let c = b.startCol; c < firstKpiCol && c <= endCol && c < kpiRow.length; c++) {
      const cell = kpiRow[c];
      if (isMonthTotalPointCol(cell)) evalMonthlyScoreCol = c;
      else {
        const low = String(cell ?? '').toLowerCase();
        const nv = normHeader(cell);
        if ((low.includes('rank') || nv === 'rank') && !kpiKeyFromCell(cell)) monthlyTotalRankCol = c;
      }
    }
    // In some sheets (incl. MX PQA), inferred month block starts at LTP while Total(Σpoint)/(Rank) sit a few columns to the left.
    // Look back up to 8 columns from first KPI to capture Score/Rank reliably (e.g. F/S/AF).
    if (firstKpiCol > 0) {
      const backStart = Math.max(0, firstKpiCol - 8);
      let nearestScoreCol = -1;
      let nearestRankCol = -1;
      // Scan right-to-left so we pick the score/rank closest to this month's KPI block (not accumulated score further left).
      for (let c = Math.min(firstKpiCol - 1, kpiRow.length - 1); c >= backStart; c--) {
        const low = String(kpiRow[c] ?? '').toLowerCase();
        const nv = normHeader(kpiRow[c]);
        if (nearestScoreCol < 0 && (isMonthTotalPointCol(kpiRow[c]) || nv === 'score' || low.includes('point'))) {
          nearestScoreCol = c;
        }
        if (nearestRankCol < 0 && (nv === 'rank' || low.includes('rank'))) {
          nearestRankCol = c;
        }
      }
      if (nearestScoreCol >= 0) evalMonthlyScoreCol = nearestScoreCol;
      if (nearestRankCol >= 0) monthlyTotalRankCol = nearestRankCol;
    }
    if (evalMonthlyScoreCol < 0 && firstKpiCol > b.startCol) {
      // Fallback: assume monthly total sits two columns before first KPI (Total score + rank + then LTP).
      evalMonthlyScoreCol = Math.max(0, firstKpiCol - 2);
      if (monthlyTotalRankCol < 0) monthlyTotalRankCol = Math.max(0, firstKpiCol - 1);
    }
    if (appMode === 'PQA_CE') {
      // CE templates keep monthly total/rank immediately before KPI sequence.
      if (evalMonthlyScoreCol < 0) evalMonthlyScoreCol = Math.max(0, firstKpiCol - 2);
      if (monthlyTotalRankCol < 0) monthlyTotalRankCol = Math.max(0, firstKpiCol - 1);
      // CE fallback: month title can be merged/shifted; locate nearest LTP VD header around this band.
      const ceOrder = ['ltpVd', 'ltpDa', 'exLtp', 'redoDa', 'redoVd', 'ssr', 'nps', 'npsDr', 'ofs', 'appointments', 'rCxe', 'audit'];
      const winStart = Math.max(0, b.startCol - 12);
      const winEnd = Math.min(kpiRow.length - 1, endCol + 12);
      let ceLtpVdCol = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let c = winStart; c <= winEnd; c++) {
        if (kpiKeyFromCell(kpiRow[c]) === 'ltpVd') {
          const d = Math.abs(c - b.startCol);
          if (d < bestDist) {
            bestDist = d;
            ceLtpVdCol = c;
          }
        }
      }
      const ceStart = ceLtpVdCol > -1 ? ceLtpVdCol : (evalMonthlyScoreCol + 2);
      if (ceLtpVdCol > -1) {
        evalMonthlyScoreCol = Math.max(0, ceLtpVdCol - 2);
        monthlyTotalRankCol = Math.max(0, ceLtpVdCol - 1);
      }
      ceOrder.forEach((k, idx) => {
        const col = ceStart + idx;
        if (col <= endCol && col < kpiRow.length) colToKey[col] = k;
      });
    }
    colMaps.push({ ...b, endCol, colToKey, caps, evalMonthlyScoreCol, monthlyTotalRankCol });
  }

  const sub1 = evalRows[codeRowIdx + 1] || [];
  if (sub1.length && ytdScoreCol < 0) {
    for (let j = 0; j < Math.min(sub1.length, 12); j++) {
      const sv = String(sub1[j] ?? '').toLowerCase().trim();
      if (sv === 'score' || sv.includes('point')) ytdScoreCol = j;
      if (sv === '(rank)' || sv === 'rank') ytdRankCol = j;
    }
  }
  if (ytdRankCol < 0 && ytdScoreCol > -1) {
    const cand = ytdScoreCol + 1;
    if (cand < Math.max(hdr.length, sub1.length)) ytdRankCol = cand;
  }

  /** Data starts after KPI header row; merged ASC Code cells repeat visually as blank — carry forward. */
  const dataStart = kpiRowIdx + 1;
  let lastAscCode = '';
  let lastAscName = '';

  for (let i = dataStart; i < evalRows.length; i++) {
    const rw = evalRows[i] || [];
    const rawCode = rw[codeCol];
    const rawStr = rawCode === undefined || rawCode === null ? '' : String(rawCode).trim();
    let pCode;
    if (!rawStr) {
      if (!lastAscCode) continue;
      pCode = lastAscCode;
    } else {
      const up = rawStr.toUpperCase();
      if (up === 'ASC CODE' || up === 'TOTAL') continue;
      pCode = (typeof rawCode === 'number' && Number.isFinite(rawCode)
        ? String(Math.round(rawCode))
        : String(rawCode)
      ).replace(/[\s,]/g, '').trim().toUpperCase();
      if (!pCode) continue;
      lastAscCode = pCode;
    }

    const region = regionCol > -1 ? String(rw[regionCol] ?? '').trim() : '';
    let pName;
    if (nameCol > -1) {
      const rawNm = rw[nameCol];
      const ns = rawNm === undefined || rawNm === null ? '' : String(rawNm).trim();
      if (ns) {
        pName = ns;
        lastAscName = ns;
      } else {
        pName = lastAscName || pCode;
      }
    } else {
      pName = lastAscName || String(pCode);
    }
    const partnerN = partnerCol > -1 ? String(rw[partnerCol] ?? '').trim() : '';

    if (ytdScoreCol > -1) {
      const ys = parseExcelNumericCell(rw[ytdScoreCol]);
      const yr = ytdRankCol > -1 ? parseInt(String(rw[ytdRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0 : 0;
      if (ys > 0 || yr > 0) {
        ytdPatches[pCode] = { ...(ytdPatches[pCode] || {}), ytdScore: ys, ytdRank: yr };
      }
    }

    // CE fixed extraction path (★Evaluation point): Jan F..T, Feb W..AK, Mar AM..BB.
    // This bypasses dynamic month-block detection that can drift with merged headers.
    if (appMode === 'PQA_CE') {
      const ceMonths = [
        { month: 'January', scoreCol: 5, rankCol: 6, kpiStart: 7 },   // F,G,H...
        { month: 'February', scoreCol: 22, rankCol: 23, kpiStart: 24 }, // W,X,Y...
        { month: 'March', scoreCol: 38, rankCol: 39, kpiStart: 40 },   // AM,AN,AO...
      ];
      for (const cm of ceMonths) {
        const hdrAt = (idx) => String(kpiRow[idx] ?? '').toLowerCase().replace(/\s/g, '');
        const hasL3 = hdrAt(cm.kpiStart + 9).includes('l3');
        const ltpVd = parseExcelNumericCell(rw[cm.kpiStart + 0]);
        const ltpDa = parseExcelNumericCell(rw[cm.kpiStart + 1]);
        const exLtp = parseExcelNumericCell(rw[cm.kpiStart + 2]);
        const redoDa = parseExcelNumericCell(rw[cm.kpiStart + 3]);
        const redoVd = parseExcelNumericCell(rw[cm.kpiStart + 4]);
        const ssr = parseExcelNumericCell(rw[cm.kpiStart + 5]);
        const nps = parseExcelNumericCell(rw[cm.kpiStart + 6]);
        const npsDr = parseExcelNumericCell(rw[cm.kpiStart + 7]);
        const ofs = parseExcelNumericCell(rw[cm.kpiStart + 8]);
        const appointments = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 10 : 9)]);
        const rCxe = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 11 : 10)]);
        const audit = parseExcelNumericCell(rw[cm.kpiStart + (hasL3 ? 12 : 11)]);
        const evalMonthlyScore = parseExcelNumericCell(rw[cm.scoreCol]);
        const monthlyEvalRank = parseInt(String(rw[cm.rankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
        const hasKpi =
          ltpVd || ltpDa || exLtp || redoDa || redoVd || ssr || nps || npsDr || ofs || appointments || rCxe || audit;
        if (!(hasKpi || evalMonthlyScore > 0 || monthlyEvalRank > 0)) continue;
        const mKey = `${pCode}_${pqaPartnerMapMonthToken(cm.month)}_2026`;
        const payload = {
          code: pCode,
          name: pName,
          partnerName: partnerN,
          region,
          mName: pqaShortMonthDisplayName(cm.month),
          year: '2026',
          pqaKpiCaps: { ...baseCaps },
          ltpVd,
          ltpDa,
          ltp: ltpVd + ltpDa,
          exLtp,
          redoDa,
          redoVd,
          redo: redoDa + redoVd,
          ssr,
          nps,
          npsDr,
          dRnps: nps + npsDr,
          ofs,
          appointments,
          rCxe,
          audit,
          evalMonthlyScore,
          monthlyEvalRank,
        };
        partnerPatches[mKey] = { ...(partnerPatches[mKey] || {}), ...payload };
      }
      continue;
    }

    for (const bm of colMaps) {
      const mKey = `${pCode}_${pqaPartnerMapMonthToken(bm.month)}_${bm.year}`;
      const payload = {
        code: pCode,
        name: pName,
        partnerName: partnerN,
        region,
        mName: pqaShortMonthDisplayName(bm.month),
        year: bm.year,
        pqaKpiCaps: bm.caps,
      };
      for (const [colStr, kpi] of Object.entries(bm.colToKey)) {
        const c = parseInt(colStr, 10);
        const val = parseExcelNumericCell(rw[c]);
        if (kpi === 'ltp') payload.ltp = val;
        else if (kpi === 'ltpVd') {
          payload.ltpVd = val;
          payload.ltp = parseFloat(payload.ltp || 0) + val;
        }
        else if (kpi === 'ltpDa') {
          payload.ltpDa = val;
          payload.ltp = parseFloat(payload.ltp || 0) + val;
        }
        else if (kpi === 'exLtp') payload.exLtp = val;
        else if (kpi === 'redo') payload.redo = val;
        else if (kpi === 'redoVd') {
          payload.redoVd = val;
          payload.redo = parseFloat(payload.redo || 0) + val;
        }
        else if (kpi === 'redoDa') {
          payload.redoDa = val;
          payload.redo = parseFloat(payload.redo || 0) + val;
        }
        else if (kpi === 'ssr') payload.ssr = val;
        else if (kpi === 'dRnps') payload.dRnps = val;
        else if (kpi === 'nps') {
          payload.nps = val;
          payload.dRnps = parseFloat(payload.dRnps || 0) + val;
        }
        else if (kpi === 'npsDr') {
          payload.npsDr = val;
          payload.dRnps = parseFloat(payload.dRnps || 0) + val;
        }
        else if (kpi === 'owRnps') payload.owRnps = val;
        else if (kpi === 'ofs') payload.ofs = val;
        else if (kpi === 'rCxe') payload.rCxe = val;
        else if (kpi === 'appointments') payload.appointments = val;
        else if (kpi === 'coa') payload.coa = val;
        else if (kpi === 'switching') payload.switching = val;
        else if (kpi === 'tc') payload.tc = val;
        else if (kpi === 'sdr') payload.sdr = val;
        else if (kpi === 'audit') payload.audit = val;
        else if (kpi === 'pr') payload.pr = val;
      }
      if (appMode === 'PQA_CE' && bm.evalMonthlyScoreCol > -1) {
        // CE fixed monthly layout by month block in ★Evaluation point:
        // Jan: F..T, Feb: W..AK, Mar: AM..BB (score/rank then KPIs).
        const ceFixedByMonth = {
          jan: { scoreCol: 5, rankCol: 6, kpiStart: 7 },
          feb: { scoreCol: 22, rankCol: 23, kpiStart: 24 },
          mar: { scoreCol: 38, rankCol: 39, kpiStart: 40 },
        };
        const mm = ceFixedByMonth[pqaPartnerMapMonthToken(bm.month)];
        const scoreCol = mm ? mm.scoreCol : bm.evalMonthlyScoreCol;
        const rankCol = mm ? mm.rankCol : bm.monthlyTotalRankCol;
        const ceStart = mm ? mm.kpiStart : (bm.evalMonthlyScoreCol + 2);
        const hdrAt = (idx) => String(kpiRow[idx] ?? '').toLowerCase().replace(/\s/g, '');
        const hasL3 = hdrAt(ceStart + 9).includes('l3');
        const ltpVd = parseExcelNumericCell(rw[ceStart + 0]);
        const ltpDa = parseExcelNumericCell(rw[ceStart + 1]);
        const exLtp = parseExcelNumericCell(rw[ceStart + 2]);
        const redoDa = parseExcelNumericCell(rw[ceStart + 3]);
        const redoVd = parseExcelNumericCell(rw[ceStart + 4]);
        const ssr = parseExcelNumericCell(rw[ceStart + 5]);
        const nps = parseExcelNumericCell(rw[ceStart + 6]);
        const npsDr = parseExcelNumericCell(rw[ceStart + 7]);
        const ofs = parseExcelNumericCell(rw[ceStart + 8]);
        const appointments = parseExcelNumericCell(rw[ceStart + (hasL3 ? 10 : 9)]);
        const rCxe = parseExcelNumericCell(rw[ceStart + (hasL3 ? 11 : 10)]);
        const audit = parseExcelNumericCell(rw[ceStart + (hasL3 ? 12 : 11)]);
        payload.ltpVd = ltpVd;
        payload.ltpDa = ltpDa;
        payload.ltp = ltpVd + ltpDa;
        payload.exLtp = exLtp;
        payload.redoDa = redoDa;
        payload.redoVd = redoVd;
        payload.redo = redoDa + redoVd;
        payload.ssr = ssr;
        payload.nps = nps;
        payload.npsDr = npsDr;
        payload.dRnps = nps + npsDr;
        payload.ofs = ofs;
        payload.appointments = appointments;
        payload.rCxe = rCxe;
        payload.audit = audit;
        payload.evalMonthlyScore = parseExcelNumericCell(rw[scoreCol]);
        payload.monthlyEvalRank = parseInt(String(rw[rankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
      }
      if (payload.owRnps && !payload.dRnps) payload.dRnps = payload.owRnps;
      if (bm.evalMonthlyScoreCol > -1) {
        payload.evalMonthlyScore = parseExcelNumericCell(rw[bm.evalMonthlyScoreCol]);
      }
      if (bm.monthlyTotalRankCol > -1) {
        payload.monthlyEvalRank = parseInt(String(rw[bm.monthlyTotalRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;
      }
      partnerPatches[mKey] = { ...(partnerPatches[mKey] || {}), ...payload };
    }
  }

  return { partnerPatches, ytdPatches };
}

// ─── Tier Badge Component ─────────────────────────────────────────────────────
const TIER_META = {
  Masters: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FMaster%201.png?alt=media&token=a8eb8d46-5351-4b02-9f4e-e16def338ce6', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/40' },
  Diamond: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FDiamond%202.png?alt=media&token=2310388b-3281-4357-b202-677788b29c25', border: 'border-blue-400', text: 'text-blue-200', glow: 'shadow-blue-400/40' },
  Platinum: { img: '/ranking-tiers/platinum.png?v=platinum-live-20260501', border: 'border-zinc-300', text: 'text-zinc-100', glow: 'shadow-zinc-300/30' },
  Gold: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FGold%202.png?alt=media&token=f153076b-6c3a-4a1a-8b46-b65c94c593bf', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/40' },
  Silver: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FSilver%202.png?alt=media&token=05ebda06-4011-4920-ac19-dd0b9fa9e3fb', border: 'border-zinc-400', text: 'text-zinc-300', glow: 'shadow-zinc-400/30' },
  Bronze: { img: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/Ranking%20Tiers%2FBronze%202.png?alt=media&token=ec56f9b5-f567-4778-b0b2-4df15fe0a840', border: 'border-orange-600', text: 'text-orange-400', glow: 'shadow-orange-600/30' },
};

const PQA_SERVICE_CENTER_PHOTO = 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers.png?alt=media';
/** Local fallbacks if a file is missing under `PQA/Service centers/` in Firebase Storage. */
const PARTNER_LOGOS = {
  RAYA: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FRAYA%20LOGO.jpg?alt=media&token=04676d80-fda6-45b7-a733-e231f4097d54',
  SKY: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FSKY%20LOGO.jpg?alt=media&token=88e1d9dd-f889-4ad6-bf50-11749be8ab3f',
  HITECH: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FHI%20Tech.png?alt=media&token=ed6c0456-26ae-4ddc-98ec-fa6b0b892ec4',
  URC: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FURC.png?alt=media&token=f4993708-edf0-4503-8729-2d00f16ba5ab',
  KELECTRONICS: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FK%20Electronics%20Logo-1766305188934.jpg?alt=media&token=ada4fc3a-75af-46c8-a5b3-64a1491593b6',
  ATS: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FATS%20LOGO.jpg?alt=media&token=07f7845d-c90b-4edb-8aff-aa9af5b5b580',
  ELECTRA: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FElectra%20Logo.jpg?alt=media&token=7325e6ac-2371-4741-91ee-50b44ce09845',
  MTI: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FMTI.png?alt=media&token=7ec69134-31bb-4ceb-a124-0409a824255c',
  ALSAFY: 'https://firebasestorage.googleapis.com/v0/b/tcs-for-engineers.firebasestorage.app/o/PQA%2FService%20centers%2FALSAFY.png?alt=media&token=fcb8577b-0994-4d1a-9a29-92489c872b04',
  SAMSUNG_FALLBACK: DEFAULT_ENGINEER_PHOTO_URL,
};

/** Default Samsung mark used for engineers — match by path so token/query variants still fill the frame. */
function isSamsungEngineerPhotoUrl(url) {
  if (!url) return false;
  const u = String(url);
  if (u === DEFAULT_ENGINEER_PHOTO_URL || u === PARTNER_LOGOS.SAMSUNG_FALLBACK) return true;
  return /SAMSUNG\.jpg/i.test(u);
}

/** True when the engineer uploaded their own photo (not Samsung default / placeholder). */
function isCustomEngineerPhotoUpload(eng) {
  if (!eng?.photoUrl) return false;
  const u = String(eng.photoUrl);
  if (u.includes('picsum.photos')) return false;
  if (isSamsungEngineerPhotoUrl(u)) return false;
  if (u.includes('Service%20centers.png')) return false;
  if (u.startsWith('/logos/')) return false;
  if (eng.photoUpdatedAt) return true;
  return /firebasestorage\.googleapis\.com/i.test(u) && !/SAMSUNG\.jpg/i.test(u);
}

function resolveEngineerPhotoForImport(rec, existing) {
  if (existing && isCustomEngineerPhotoUpload(existing)) return existing.photoUrl;
  const fromSheet = rec?.photoUrl;
  if (fromSheet && !String(fromSheet).includes('picsum.photos') && !isSamsungEngineerPhotoUrl(fromSheet)) {
    return fromSheet;
  }
  return DEFAULT_ENGINEER_PHOTO_URL;
}

/** Home dashboard (TCS): monthly Hall of Fame + quarterly ladder list length (podium + rows below). */
const TCS_HOME_LEADERBOARD_LIMIT = 20;
const TCS_WINNERS_PER_PRODUCT = TCS_WINNERS_DEFAULT_SLOTS;
const INITIAL_ENGINEER_FEEDBACK = {
  fullName: '',
  phoneNumber: '',
  company: '',
  product: '',
  position: '',
  message: '',
};

/** Views where visitor engagement / funnel analytics must not run */
const ADMIN_ANALYTICS_VIEWS = new Set(['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'PROFILE_MGMT', 'EXTERNAL_LOGS']);

const isFeedbackPortalRealm = (realm) => realm === 'TCS' || realm === 'PQA';

const quarterKeyToIndex = (quarterKey) => {
  const m = String(quarterKey || '').toUpperCase().match(/^Q([1-4])-(\d{4})$/);
  if (!m) return null;
  return (parseInt(m[2], 10) * 4) + (parseInt(m[1], 10) - 1);
};

const quarterIndexToKey = (index) => {
  if (!Number.isFinite(index) || index < 0) return null;
  const year = Math.floor(index / 4);
  const quarterNum = (index % 4) + 1;
  return `Q${quarterNum}-${year}`;
};

const normalizeEngineerCodeKey = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const normalizeEngineerDigits = (value) => String(value || '').replace(/\D/g, '');
const getTcsEngineerIdentityKey = (entry) =>
  normalizeEngineerCodeKey(entry?.engineerCode) ||
  normalizeEngineerCodeKey(entry?.code) ||
  normalizeEngineerCodeKey(entry?.gspnId) ||
  normalizeEngineerCodeKey(entry?.sbaId) ||
  normalizeEngineerCodeKey(entry?.id);
const winnerCodeEqualsStrict = (a, b) => {
  const na = normalizeEngineerCodeKey(a);
  const nb = normalizeEngineerCodeKey(b);
  return Boolean(na && nb && na === nb);
};
const getWinnerCodeCandidates = (entry) => {
  // Include name so portal winners saved as display names (e.g. MOHAMEDMAHER) still match roster rows.
  const candidates = [entry?.engineerCode, entry?.code, entry?.sbaId, entry?.gspnId, entry?.name]
    .map((v) => normalizeEngineerCodeKey(v))
    .filter(Boolean);
  return [...new Set(candidates)];
};

const engineerCodeEquals = (a, b) => {
  const na = normalizeEngineerCodeKey(a);
  const nb = normalizeEngineerCodeKey(b);
  if (na && nb && na === nb) return true;

  const da = normalizeEngineerDigits(a);
  const db = normalizeEngineerDigits(b);
  if (da.length >= 4 && db.length >= 4 && da === db) return true;

  const af = parseFloat(String(a ?? '').replace(/,/g, '').trim());
  const bf = parseFloat(String(b ?? '').replace(/,/g, '').trim());
  if (Number.isFinite(af) && Number.isFinite(bf) && af === bf) return true;
  return false;
};
const recordMatchesWinnerCode = (entry, winnerCode) =>
  getWinnerCodeCandidates(entry).some((candidate) => engineerCodeEquals(candidate, winnerCode));

const resolveTcsDashboardProduct = (mode) => {
  if (mode === 'TCS_DA') return 'DA';
  if (mode === 'TCS_AV' || mode === 'TCS_VD') return 'AV';
  if (mode === 'TCS_MX') return 'MX';
  return null;
};
const getMxEvaluationTier = (score) => {
  const s = parseFloat(score);
  if (!Number.isFinite(s)) return 'Bronze';
  if (s >= 100) return 'Masters';
  if (s >= 90) return 'Diamond';
  if (s >= 80) return 'Platinum';
  if (s >= 70) return 'Gold';
  if (s >= 60) return 'Silver';
  return 'Bronze';
};

/** After swapping to the Samsung fallback in the DOM, apply cover styling (React className does not update). */
function handleEngineerPhotoError(e) {
  const el = e?.currentTarget || e?.target;
  if (!el || typeof el !== 'object') return;
  el.onerror = null;
  el.src = PARTNER_LOGOS.SAMSUNG_FALLBACK;
  el.classList?.remove?.('object-contain', 'bg-white', 'p-0.5');
  el.classList?.add?.('object-cover', 'object-center');
}

/**
 * Brand logos under gs://tcs-for-engineers.firebasestorage.app/PQA/Service centers/
 * Upload as <STEM>.png | .jpg | .jpeg | .webp (first match wins per brand).
 * Service centers are matched by partnerName / name containing the brand (e.g. "RAYA" → RAYA logo).
 */
const PQA_SERVICE_CENTERS_FOLDER = 'PQA/Service centers';
const PQA_BRAND_LOGO_STEM = {
  RAYA: 'RAYA',
  SKY: 'SKY',
  HITECH: 'HITECH',
  URC: 'URC',
  KELECTRONICS: 'K-ELECTRONICS',
  ATS: 'ATS',
  ELECTRA: 'ELECTRA',
  MTI: 'MTI',
  ALSAFY: 'ALSAFY',
};
const PQA_LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

/** Map Storage file stem → brand key (handles K-ELECTRONICS ↔ KELECTRONICS). */
const STEM_TO_BRAND_KEY = (() => {
  const m = {};
  for (const [key, stem] of Object.entries(PQA_BRAND_LOGO_STEM)) {
    const u = stem.toUpperCase();
    m[u] = key;
    m[u.replace(/-/g, '')] = key;
  }
  return m;
})();

const TierBadge = ({ tier, size = 'md' }) => {
  const meta = TIER_META[tier] || TIER_META.Bronze;
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[8px] gap-1'
    : size === 'lg'
      ? 'px-5 py-2 text-[13px] gap-2'
      : 'px-3 py-1 text-[10px] gap-1.5';
  const imgSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className={`inline-flex items-center ${sizeClass} rounded-full border ${meta.border} ${meta.text} bg-black/40 font-black uppercase tracking-wider shadow-lg ${meta.glow}`}>
      <img src={meta.img} alt={tier} className={`${imgSize} object-contain tier-emblem-blend`} />
      {tier}
    </span>
  );
};

const TierLogo = ({ tier, size = 'lg' }) => {
  const meta = TIER_META[tier] || TIER_META.Bronze;
  const boxSize = size === 'xl' ? 'h-28 w-28 md:h-32 md:w-32' : size === 'lg' ? 'h-20 w-20 md:h-24 md:w-24' : 'h-14 w-14 md:h-16 md:w-16';
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={meta.img} alt={tier || 'Tier'} className={`${boxSize} object-contain tier-emblem-blend`} />
      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{tier || 'Rank'}</p>
    </div>
  );
};

// ─── 3D Rank Reveal Component ─────────────────────────────────────────────────
const TIER_GLOW_COLORS = {
  Masters: { from: 'rgba(168, 85, 247, 0.6)', to: 'rgba(192, 132, 252, 0.3)', ring: 'border-purple-500', particle: 'bg-purple-400', text: 'text-purple-300', gradient: 'from-purple-600 via-purple-400 to-fuchsia-300' },
  Diamond: { from: 'rgba(96, 165, 250, 0.6)', to: 'rgba(147, 197, 253, 0.3)', ring: 'border-blue-400', particle: 'bg-blue-400', text: 'text-blue-200', gradient: 'from-blue-500 via-cyan-400 to-sky-200' },
  Platinum: { from: 'rgba(212, 212, 216, 0.6)', to: 'rgba(228, 228, 231, 0.3)', ring: 'border-zinc-300', particle: 'bg-zinc-300', text: 'text-zinc-100', gradient: 'from-zinc-300 via-zinc-100 to-white' },
  Gold: { from: 'rgba(234, 179, 8, 0.6)', to: 'rgba(250, 204, 21, 0.3)', ring: 'border-yellow-500', particle: 'bg-yellow-400', text: 'text-yellow-300', gradient: 'from-yellow-500 via-amber-400 to-orange-300' },
  Silver: { from: 'rgba(161, 161, 170, 0.5)', to: 'rgba(212, 212, 216, 0.2)', ring: 'border-zinc-400', particle: 'bg-zinc-400', text: 'text-zinc-300', gradient: 'from-zinc-400 via-zinc-300 to-zinc-200' },
  Bronze: { from: 'rgba(194, 65, 12, 0.5)', to: 'rgba(251, 146, 60, 0.3)', ring: 'border-orange-600', particle: 'bg-orange-400', text: 'text-orange-400', gradient: 'from-orange-600 via-amber-500 to-yellow-400' },
};

const RankReveal3D = ({ tier, score, name, onDismiss, isPqaMode, rank }) => {
  const reduce = useReducedMotion();
  const glowColors = isPqaMode ? TIER_GLOW_COLORS.Diamond : (TIER_GLOW_COLORS[tier] || TIER_GLOW_COLORS.Bronze);
  const meta = isPqaMode ? null : (TIER_META[tier] || TIER_META.Bronze);
  const [phase, setPhase] = React.useState('reveal'); // 'reveal' | 'idle'
  const [visible, setVisible] = React.useState(true);
  const scoreNum = Number(score);
  const scoreText = Number.isFinite(scoreNum) && scoreNum > 0 ? score : '';
  const spinMs = reduce ? 280 : 1300;

  React.useEffect(() => {
    const spinTimer = setTimeout(() => setPhase('idle'), spinMs);
    let dismissFadeTimer = null;
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      dismissFadeTimer = setTimeout(() => onDismiss?.(), 400);
    }, reduce ? 2200 : 5000);
    return () => {
      clearTimeout(spinTimer);
      clearTimeout(dismissTimer);
      if (dismissFadeTimer) clearTimeout(dismissFadeTimer);
    };
  }, [onDismiss, reduce, spinMs]);

  const handleTap = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 400);
  };

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: `${i * 0.35}s`,
    radius: `${65 + (i % 3) * 25}px`,
    duration: `${2.5 + (i % 3) * 0.8}s`,
    size: i % 2 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
  }));

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="rank-reveal"
          className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
          onClick={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.98) 100%)' }}
        >
          <div className="absolute inset-0 bg-grid opacity-20" />

          <div className="relative flex flex-col items-center gap-10 perspective-1200">
            {!reduce && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`absolute w-40 h-40 rounded-full border-2 ${glowColors.ring} animate-ring-expand`} />
                  <div className={`absolute w-40 h-40 rounded-full border-2 ${glowColors.ring} animate-ring-expand-delay`} />
                </div>

                <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div
                    className="w-32 h-32 rounded-full animate-radial-burst"
                    style={{ background: `radial-gradient(circle, ${glowColors.from} 0%, transparent 70%)` }}
                  />
                </div>

                <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
                  <div
                    className="w-56 h-56 rounded-full animate-glow-pulse blur-3xl"
                    style={{ background: `radial-gradient(circle, ${glowColors.from} 0%, ${glowColors.to} 50%, transparent 80%)` }}
                  />
                </div>

                <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className={`absolute ${p.size} ${glowColors.particle} rounded-full shadow-lg animate-particle-orbit`}
                      style={{
                        '--orbit-radius': p.radius,
                        '--orbit-duration': p.duration,
                        animationDelay: p.delay,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <motion.div
              className={phase === 'reveal' ? (reduce ? '' : 'animate-rank-spin-3d') : 'animate-rank-float'}
              initial={reduce ? { opacity: 0, scale: 0.92 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0.28 : 0.45 }}
            >
              {isPqaMode ? (
                <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-[6px] border-blue-400 bg-black/50 shadow-[0_0_40px_rgba(96,165,250,0.5)] flex items-center justify-center relative z-10">
                  <span className="text-7xl font-black italic text-blue-400">#{rank || '-'}</span>
                </div>
              ) : (
                <img
                  src={meta?.img}
                  alt={tier}
                  className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] relative z-10 tier-emblem-blend"
                />
              )}
            </motion.div>

            <motion.div
              className="text-center space-y-3"
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduce ? 0.05 : 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600">
                {isPqaMode ? 'System Ranking' : 'You have earned'}
              </p>
              <h2
                className={`text-4xl md:text-6xl font-black uppercase italic tracking-tighter bg-gradient-to-r ${glowColors.gradient} bg-clip-text text-transparent animate-shimmer`}
                style={{ backgroundImage: `linear-gradient(110deg, ${glowColors.from}, white 30%, ${glowColors.from} 50%, white 70%, ${glowColors.from})` }}
              >
                {isPqaMode ? `Rank #${rank || '-'}` : tier}
              </h2>
              <p className={`text-xs font-black uppercase tracking-[0.4em] ${glowColors.text}`}>{name}</p>
            </motion.div>

            {!isPqaMode && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: reduce ? 0.1 : 1.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-7xl md:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  {scoreText}
                </span>
                {scoreText ? (
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600 mt-2">
                    TCS Score
                  </p>
                ) : null}
              </motion.div>
            )}

            <motion.p
              className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: reduce ? 0.2 : 1.4 }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

// --- Sub-components ---

const Header = ({
  onHome,
  onLogoClick,
  appMode,
  isAdminPortal = false,
  employeeLoggedIn = false,
  employeeLabel = '',
  onEmployeeSignIn,
  onEmployeeDashboard,
  onEmployeeSignOut,
}) => {
  const showLogo = appMode !== null && !isAdminPortal;
  const isTcs = appMode?.startsWith('TCS');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuCloseRef = useRef(null);
  const accountMenuRef = useRef(null);
  const appLogo = useMemo(() => {
    if (appMode?.startsWith('PQA')) return './pqa_logo.png';
    return './fawzy-logo.png';
  }, [appMode]);
  const slogan = 'Earn Your Tier • Own Your Title';

  function canHover() {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch {
      return false;
    }
  }

  function openAccountMenu() {
    if (accountMenuCloseRef.current) {
      clearTimeout(accountMenuCloseRef.current);
      accountMenuCloseRef.current = null;
    }
    setAccountMenuOpen(true);
  }

  function scheduleCloseAccountMenu() {
    if (!canHover()) return;
    if (accountMenuCloseRef.current) clearTimeout(accountMenuCloseRef.current);
    accountMenuCloseRef.current = setTimeout(() => setAccountMenuOpen(false), 180);
  }

  useEffect(() => () => {
    if (accountMenuCloseRef.current) clearTimeout(accountMenuCloseRef.current);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const onDocPointer = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, [accountMenuOpen]);

  return (
    <header className="sticky top-0 z-[100] px-4 py-4 sm:px-6 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700 overflow-visible">
      <div className="max-w-[1400px] mx-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 md:gap-4 min-h-0 overflow-visible">
        <div className="flex items-center min-w-0 relative z-[1]">
          <div className="cursor-pointer group" onClick={onLogoClick || onHome}>
            <img src="./sam_logo.png" alt="Samsung" className="h-10 md:h-14 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
        <div className="flex justify-center text-center min-w-0 px-1 overflow-hidden pointer-events-none">
           <p className="text-[9px] sm:text-[10px] md:text-[13px] uppercase tracking-[0.18em] sm:tracking-[0.35em] md:tracking-[0.5em] text-zinc-300 font-extrabold leading-snug truncate max-w-full">
            {slogan}
          </p>
        </div>
        <div className="flex justify-end items-center gap-2 sm:gap-3 min-w-0 relative z-[20] overflow-visible">
          {!isAdminPortal && (
            employeeLoggedIn ? (
              <div
                ref={accountMenuRef}
                className="relative z-[30]"
                onMouseEnter={() => { if (canHover()) openAccountMenu(); }}
                onMouseLeave={scheduleCloseAccountMenu}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAccountMenuOpen((v) => !v);
                  }}
                  className="max-w-[9rem] xs:max-w-[11rem] sm:max-w-[14rem] truncate px-2.5 sm:px-4 py-2.5 rounded-xl bg-cyan-600/90 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-colors border border-cyan-400/20 relative z-[31] touch-manipulation"
                  title={`Account · ${employeeLabel || 'GSPN'}`}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                >
                  {employeeLabel || 'Profile'}
                </button>
                {accountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_16px_40px_rgba(0,0,0,0.55)] overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseEnter={() => { if (canHover()) openAccountMenu(); }}
                    onMouseLeave={scheduleCloseAccountMenu}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountMenuOpen(false);
                        onEmployeeDashboard?.();
                      }}
                      className="w-full text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:bg-cyan-600/20 hover:text-white border-b border-white/5 touch-manipulation"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountMenuOpen(false);
                        onEmployeeSignOut?.();
                      }}
                      className="w-full text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/15 hover:text-red-200 touch-manipulation"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onEmployeeSignIn}
                className="px-3 sm:px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-zinc-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:border-cyan-500/50 hover:text-white transition-colors touch-manipulation"
              >
                Sign in
              </button>
            )
          )}
          {showLogo && (
            <div
              className={`rounded-2xl overflow-hidden border-2 border-white/10 shadow-3xl bg-black transition-all duration-700 hover:scale-105 hover:border-white/40 shrink-0 ${
                isTcs
                  ? 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14'
                  : 'h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2.2rem]'
              }`}
            >
              <img src={appLogo} alt="App Logo" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const MetricBar = ({ label, value, max = 100, suffix = "", target = null, color = "bg-blue-600", inverse = false }) => {
  const pct = Math.min(100, Math.max(0, (Number(value) / max) * 100));
  const targetPct = target !== null ? Math.min(100, Math.max(0, (target / max) * 100)) : null;

  // Color logic: inverse = lower is better
  let barGradient;
  if (inverse) {
    const v = Number(value);
    if (v <= target) barGradient = 'from-emerald-500 to-green-400';
    else if (v <= target * 2) barGradient = 'from-yellow-500 to-amber-400';
    else barGradient = 'from-red-600 to-rose-500';
  } else {
    const v = Number(value);
    const cmp = target !== null ? target : max;
    if (v >= cmp) barGradient = 'from-emerald-500 to-green-400';
    else if (v >= cmp * 0.75) barGradient = 'from-yellow-400 to-amber-300';
    else barGradient = 'from-red-600 to-rose-500';
  }

  const valueColor = inverse
    ? (Number(value) <= (target || 0) ? 'text-emerald-400' : Number(value) <= (target || 0) * 2 ? 'text-yellow-400' : 'text-red-400')
    : (Number(value) >= (target || max) ? 'text-emerald-400' : Number(value) >= (target || max) * 0.75 ? 'text-yellow-400' : 'text-red-400');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-black italic tracking-tighter ${valueColor}`}>{typeof value === 'number' ? value.toFixed ? Number(value).toFixed(1) : value : value}</span>
          <span className="text-[8px] font-black text-zinc-600 uppercase">{suffix}</span>
        </div>
      </div>
      <div className="relative h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-out relative`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-y-0 right-0 w-4 bg-white/20 blur-sm rounded-full" />
        </div>
        {targetPct !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 rounded-full"
            style={{ left: `${targetPct}%` }}
          />
        )}
      </div>
      {target !== null && (
        <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">
          Target: {inverse ? '≤' : '≥'}{target}{suffix}
        </p>
      )}
    </div>
  );
};


const PageContent = ({ initialView = null, initialAdminPortal = false } = {}) => {
  const { message, modal, notification } = App.useApp();
  const adminEntryAtBoot = (() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const byHost = host.includes('scora-admin');
    const byQuery = String(params.get('portal') || '').toLowerCase() === 'admin';
    const byPath = window.location.pathname.toLowerCase().startsWith('/admin');
    return byHost || byQuery || byPath;
  })();
  const bootStorageKey = adminEntryAtBoot ? UI_STATE_STORAGE_KEY_ADMIN : UI_STATE_STORAGE_KEY_MAIN;
  const [view, setView] = useState(() => {
    // Admin: restore dashboard when this tab already has an active admin session.
    if (initialAdminPortal || adminEntryAtBoot) return readAdminBootView();
    if (initialView) return initialView;
    if (typeof window === 'undefined') return 'APP_SELECTION';
    try {
      const raw = sessionStorage.getItem(bootStorageKey);
      if (!raw) return 'APP_SELECTION';
      const parsed = JSON.parse(raw);
      const restored = parsed?.view || 'APP_SELECTION';
      if (restored === 'ADMIN_DASHBOARD' || restored === 'ADMIN_LOGIN' || restored === 'PROFILE_MGMT' || restored === 'EXTERNAL_LOGS') {
        return 'APP_SELECTION';
      }
      return restored;
    } catch {
      return 'APP_SELECTION';
    }
  });
  const [isAdminPortal, setIsAdminPortal] = useState(() => {
    if (initialAdminPortal || adminEntryAtBoot) return true;
    if (typeof window === 'undefined') return false;
    try {
      const raw = sessionStorage.getItem(bootStorageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.isAdminPortal;
    } catch {
      return false;
    }
  });
  const [appMode, setAppMode] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(bootStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.appMode || null;
    } catch {
      return null;
    }
  }); // 'TCS_MX' | 'TCS_DA' | 'TCS_AV' | 'TCS_VD' (legacy) | 'PQA_MX' | 'PQA_CE'
  const [tcsMxRoleTab, setTcsMxRoleTab] = useState(() => {
    if (typeof window === 'undefined') return 'engineers';
    try {
      const raw = sessionStorage.getItem(bootStorageKey);
      if (!raw) return 'engineers';
      const parsed = JSON.parse(raw);
      const tab = parsed?.tcsMxRoleTab;
      return TCS_MX_ROLE_TABS.some((t) => t.key === tab) ? tab : 'engineers';
    } catch {
      return 'engineers';
    }
  });
  /** Set when user picks TCS vs PQA at gateway — keeps search screen aligned (engineer code vs service center code). */
  const [portalRealm, setPortalRealm] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(bootStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.portalRealm || null;
    } catch {
      return null;
    }
  });

  // ─── View history stack for swipe-back / browser-back support ────────────
  const viewStackRef = React.useRef((() => {
    if (initialAdminPortal || adminEntryAtBoot) {
      const bootView = readAdminBootView();
      return bootView === 'ADMIN_LOGIN' ? ['ADMIN_LOGIN'] : ['ADMIN_LOGIN', bootView];
    }
    return ['APP_SELECTION'];
  })());
  const navigateTo = React.useCallback((nextView) => {
    viewStackRef.current = [...viewStackRef.current, nextView];
    window.history.pushState({ view: nextView }, '');
    setView(nextView);
    if (nextView !== 'ENGINEER_PROFILE') {
      setShowRankReveal(false);
    }
  }, []);
  const { launch: launchPortal, overlay: portalLaunchOverlay, busy: portalLaunchBusy } = usePortalLaunch();
  const navigateBack = React.useCallback(() => {
    const stack = viewStackRef.current;
    if (stack.length > 1) {
      viewStackRef.current = stack.slice(0, -1);
      const prev = stack[stack.length - 2];
      setView(prev);
      if (prev !== 'ENGINEER_PROFILE') {
        setShowRankReveal(false);
      }
    } else {
      setShowRankReveal(false);
      setView('APP_SELECTION');
    }
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      navigateBack();
    };
    window.addEventListener('popstate', handlePopState);

    // Admin portal: Firebase Auth session (not localStorage adminSession)
    const host = window.location.hostname.toLowerCase();
    if (host.includes('scora-pqa')) {
      setPortalRealm('PQA');
      setView('PQA_DIVISION_SELECTION');
      viewStackRef.current = ['APP_SELECTION', 'PQA_DIVISION_SELECTION'];
    } else if (host.includes('scora-admin')) {
      setIsAdminPortal(true);
      const bootView = readAdminBootView();
      if (bootView !== 'ADMIN_LOGIN') {
        setView(bootView);
        viewStackRef.current = ['ADMIN_LOGIN', bootView];
      }
    } else if (host.includes('scora-tcs')) {
      setPortalRealm('TCS');
      setView('TCS_DIVISION_SELECTION');
      viewStackRef.current = ['APP_SELECTION', 'TCS_DIVISION_SELECTION'];
    } else if (host.includes('scora-quiz')) {
      window.location.replace('https://samsungeg-scora.vercel.app/scora-challenge/join');
    } else if (host.includes('scora-challenge')) {
      window.location.replace('/scora-challenge/join');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateBack]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = isAdminPortal ? UI_STATE_STORAGE_KEY_ADMIN : UI_STATE_STORAGE_KEY_MAIN;
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          view,
          appMode: appMode || null,
          portalRealm: portalRealm || null,
          isAdminPortal: !!isAdminPortal,
          tcsMxRoleTab,
        })
      );
    } catch {
      // Ignore persistence failures
    }
  }, [view, appMode, portalRealm, isAdminPortal, tcsMxRoleTab]);

  const isPqaMode = appMode?.startsWith('PQA');
  const isTcsMxAlternateRole = appMode === 'TCS_MX' && tcsMxRoleTab !== 'engineers';
  const tcsMxPersonLabel = appMode === 'TCS_MX' ? getTcsMxRolePersonLabel(tcsMxRoleTab) : 'Engineer';
  /** Search / lookup copy: PQA portal → service center code; TCS portal → engineer code. Falls back to appMode when portalRealm unset. */
  const searchIsPqaContext = portalRealm === 'PQA' || (portalRealm === null && isPqaMode);
  const portalVsAppMismatch =
    (portalRealm === 'TCS' && isPqaMode) || (portalRealm === 'PQA' && appMode?.startsWith('TCS'));
  // Derived Firestore collection name — available everywhere in the component
  const colName = resolveFirestoreCollection(appMode, tcsMxRoleTab);
  const [engineers, setEngineers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    if (!(initialAdminPortal || adminEntryAtBoot)) return null;
    try {
      if (sessionStorage.getItem(ADMIN_SESSION_OK_KEY) !== '1') return null;
    } catch {
      return null;
    }
    return readCachedAdminProfile() || readMigrationSession();
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null); // New error state

  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [pqaDefaultUrl, setPqaDefaultUrl] = useState(PQA_SERVICE_CENTER_PHOTO);
  const [partnerLogoUrls, setPartnerLogoUrls] = useState({});

  useEffect(() => {
    if (view === 'ENGINEER_PROFILE' && !selectedEngineer) {
      setView('ENGINEER_LOOKUP');
    }
    if (view === 'ENGINEER_HISTORY' && !selectedEngineer) {
      setView('ENGINEER_LOOKUP');
    }
  }, [selectedEngineer, view]);

  useEffect(() => {
    // Dynamically fetch the real download URL (with token) for the PQA Service Center photo
    const getPqaPhoto = async () => {
      try {
        const { ref, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const pqaRef = ref(storage, 'PQA/Service centers.png');
        const url = await getDownloadURL(pqaRef);
        if (url) setPqaDefaultUrl(url);
      } catch (e) { console.warn("PQA photo fetch failed, using fallback path.", e); }
    };
    getPqaPhoto();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ref, listAll, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const next = {};

        const tryStemExtensions = async (key, stem) => {
          for (const ext of PQA_LOGO_EXTENSIONS) {
            try {
              return await getDownloadURL(ref(storage, `${PQA_SERVICE_CENTERS_FOLDER}/${stem}.${ext}`));
            } catch { /* next */ }
          }
          return null;
        };

        // 1) List folder — picks up whatever filenames you uploaded (RAYA.png, Raya.jpg, …)
        try {
          const { items } = await listAll(ref(storage, PQA_SERVICE_CENTERS_FOLDER));
          await Promise.all(
            items.map(async (itemRef) => {
              const name = itemRef.name; // "RAYA.png"
              if (!name || name.startsWith('.')) return;
              const stem = name.replace(/\.[^.]+$/i, '');
              const stemU = stem.toUpperCase().trim();
              const brandKey = STEM_TO_BRAND_KEY[stemU] || STEM_TO_BRAND_KEY[stemU.replace(/\s+/g, '')];
              if (!brandKey) return;
              try {
                const url = await getDownloadURL(itemRef);
                if (url) next[brandKey] = url;
              } catch { /* skip */ }
            })
          );
        } catch (listErr) {
          console.warn('PQA Service centers folder list failed (check Storage list rules). Falling back to fixed paths.', listErr);
        }

        // 2) Fill any missing brand with known stems + extensions
        for (const [key, stem] of Object.entries(PQA_BRAND_LOGO_STEM)) {
          if (next[key]) continue;
          const url = await tryStemExtensions(key, stem);
          if (url) next[key] = url;
        }

        if (!cancelled) setPartnerLogoUrls(next);
      } catch (e) {
        console.warn('PQA brand logos init failed.', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [noEngineers, setNoEngineers] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ ...EMPTY_ADMIN_FORM });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminData, setEditAdminData] = useState({ ...EMPTY_ADMIN_FORM });
  const [fetchedHiddenEngineers, setFetchedHiddenEngineers] = useState([]);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkSelectedArchivedIds, setBulkSelectedArchivedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [isLogged, setIsLogged] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (initialAdminPortal || adminEntryAtBoot) {
      try {
        return sessionStorage.getItem(ADMIN_SESSION_OK_KEY) === '1';
      } catch {
        return false;
      }
    }
    return false;
  });
  // Admin UI unlock after login form OR restored tab session (see ADMIN_SESSION_OK_KEY).
  const adminSessionOkRef = React.useRef((() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(ADMIN_SESSION_OK_KEY) === '1';
    } catch {
      return false;
    }
  })());
  const academySurveySettingsTouchedRef = React.useRef(false);

  useEffect(() => {
    if (!isAdminPortal) return;
    try {
      adminSessionOkRef.current = sessionStorage.getItem(ADMIN_SESSION_OK_KEY) === '1';
    } catch {
      adminSessionOkRef.current = false;
    }
  }, [isAdminPortal]);

  useEffect(() => {
    const unsub = subscribeAdminAuth(({ user, profile, migration }) => {
      if (isAdminPortal) {
        if (!adminSessionOkRef.current) {
          return;
        }
        if (profile) {
          setCurrentUser(profile);
          setIsLogged(true);
          writeCachedAdminProfile(profile);
          return;
        }
        // Firebase signed in but admin profile still loading — keep restored session.
        if (user) {
          return;
        }
        // Legacy migration login (no Firebase user) is handled above via readMigrationSession.
        if (migration) {
          return;
        }
        adminSessionOkRef.current = false;
        try {
          sessionStorage.removeItem(ADMIN_SESSION_OK_KEY);
        } catch {
          /* ignore */
        }
        clearCachedAdminProfile();
        setCurrentUser(null);
        setIsLogged(false);
        setView('ADMIN_LOGIN');
        viewStackRef.current = ['ADMIN_LOGIN'];
        return;
      }
      if (profile) {
        setCurrentUser(profile);
        setIsLogged(true);
      } else {
        setCurrentUser(null);
        setIsLogged(false);
      }
    });
    return () => unsub();
  }, [isAdminPortal]);

  const liveAdminUid = isLogged ? currentUser?.uid || '' : '';
  const liveAdminEmail = currentUser?.email || '';
  useEffect(() => {
    if (!liveAdminUid) return undefined;
    return watchAdminProfile(liveAdminUid, liveAdminEmail, (profile) => {
      if (!profile) return;
      setCurrentUser((prev) => (prev?.uid === profile.uid ? { ...prev, ...profile } : prev));
      writeCachedAdminProfile(profile);
    });
  }, [liveAdminUid, liveAdminEmail]);

  // Hard lock: admin portal with no session can only show the login screen.
  useEffect(() => {
    if (isAdminPortal && !isLogged && !adminSessionOkRef.current && view !== 'ADMIN_LOGIN') {
      setView('ADMIN_LOGIN');
      viewStackRef.current = ['ADMIN_LOGIN'];
    }
  }, [isAdminPortal, isLogged, view]);

  // New feature states
  const [homeViewMode, setHomeViewMode] = useState('QUARTERLY'); // Default to ACCUMULATED for PQA
  const [pqaMxGroupBy, setPqaMxGroupBy] = useState('PARTNER'); // 'PARTNER' | 'CENTER'

  const [selectedHofMonth, setSelectedHofMonth] = useState(null); // Used for Monthly view
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null); // Used for Quarterly view

  // Engineer profile period selector
  const [profileViewMode, setProfileViewMode] = useState('MONTHLY'); // 'MONTHLY' | 'QUARTERLY'
  const [selectedProfileMonth, setSelectedProfileMonth] = useState(null); // key: "Month-Year"
  const [selectedProfileQuarter, setSelectedProfileQuarter] = useState(null); // key: "Q1-2026"

  // Engineer History month selector
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);

  /** True when user opened profile via exact engineer code from SEARCH (hide detailed metrics). */
  const [profileOpenedByExactCode, setProfileOpenedByExactCode] = useState(false);

  // Arabic engineer feedback (test form)
  const [engineerFeedback, setEngineerFeedback] = useState(INITIAL_ENGINEER_FEEDBACK);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.feedbackEnabled !== false;
  });
  /** Home popup + floating promo; dismissed in-memory until full page refresh */
  const [showFeedbackPromo, setShowFeedbackPromo] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.feedbackEnabled !== false;
  });
  const [academySurveySent, setAcademySurveySent] = useState(false);
  const [isSubmittingAcademySurvey, setIsSubmittingAcademySurvey] = useState(false);
  const [academySurveyPopupEnabled, setAcademySurveyPopupEnabled] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.academySurveyPopupEnabled !== false;
  });
  const [surveyDefinitions, setSurveyDefinitions] = useState([DEFAULT_ACADEMY_SURVEY]);
  const [activeSurveyId, setActiveSurveyId] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.activeSurveyId || DEFAULT_SURVEY_ID;
  });
  /** Admin switch for the in-app "turn on phone alerts" banner (default: on). */
  const [notifyAlertsEnabled, setNotifyAlertsEnabled] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.notifyAlertsEnabled !== false;
  });
  const [academySurveySettingsLoading, setAcademySurveySettingsLoading] = useState(false);
  /** Live display settings fetched once; the alerts banner waits for this so OFF is never overridden by the default. */
  const [academySurveySettingsLoaded, setAcademySurveySettingsLoaded] = useState(false);
  const [academySurveySettingsSaving, setAcademySurveySettingsSaving] = useState(false);
  /** User dismissed the floating shortcut for this session only */
  const [showSurveyShortcut, setShowSurveyShortcut] = useState(() => {
    const cached = readCachedAcademySurveySettings();
    return cached?.academySurveyPopupEnabled !== false;
  });
  const [gogoOpen, setGogoOpen] = useState(false);
  const [academySurvey, setAcademySurvey] = useState(() => emptySurveyAnswers(DEFAULT_ACADEMY_SURVEY));

  // Activity log panel toggle
  /** Admin dashboard: modal shortcuts (accounts / TCS guide / action log) */
  const [adminModal, setAdminModal] = useState(null);
  /** Admin portal main category: data | display | survey | insights | system */
  const [adminPanelTab, setAdminPanelTab] = useState('data');
  const [knowledgeBaseSubTab, setKnowledgeBaseSubTab] = useState('consultants');
  const adminUndoStackRef = useRef([]);
  const [adminUndoCount, setAdminUndoCount] = useState(0);
  const [adminUndoRunning, setAdminUndoRunning] = useState(false);

  // Engineer self-service photo auth
  const [showPhotoAuth, setShowPhotoAuth] = useState(false);
  const [photoAuthCode, setPhotoAuthCode] = useState('');
  const [photoAuthStep, setPhotoAuthStep] = useState('idle'); // 'idle' | 'auth' | 'upload' | 'done'
  const [selfPhotoFile, setSelfPhotoFile] = useState(null);
  const [selfPhotoUploading, setSelfPhotoUploading] = useState(false);
  const [tcsProductImagesSyncing, setTcsProductImagesSyncing] = useState(false);
  const selfPhotoInputRef = useRef(null);

  // Rank reveal state
  const [showRankReveal, setShowRankReveal] = useState(false);

  // PWA: one-time install sheet (install popup wins over notify banner)
  const [pwaInstallSheetOpen, setPwaInstallSheetOpen] = useState(false);

  const activeSurveyDef = useMemo(() => {
    const found = surveyDefinitions.find((d) => d.id === activeSurveyId);
    return found || surveyDefinitions[0] || DEFAULT_ACADEMY_SURVEY;
  }, [surveyDefinitions, activeSurveyId]);
  const activeSurveyDefRef = useRef(activeSurveyDef);
  activeSurveyDefRef.current = activeSurveyDef;
  const activeSurveyDisplayName = displaySurveyName(activeSurveyDef);

  const resetAcademySurvey = () => {
    setAcademySurvey(emptySurveyAnswers(activeSurveyDefRef.current || DEFAULT_ACADEMY_SURVEY));
    setAcademySurveySent(false);
    setIsSubmittingAcademySurvey(false);
  };

  const handleSamsungAcademySurveyExported = React.useCallback(
    ({ count, totalLoaded, filters, fileName }) => {
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SURVEY',
        action: 'Exported Samsung Academy survey (filtered)',
        details: { count, totalLoaded, filters, fileName },
        severity: 'info',
      });
    },
    [currentUser?.username]
  );

  const handleArabicFeedbackExported = React.useCallback(
    ({ count, totalLoaded, filters, fileName }) => {
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'FEEDBACK',
        action: 'Exported Arabic feedback (filtered)',
        details: { count, totalLoaded, filters, fileName },
        severity: 'info',
      });
    },
    [currentUser?.username]
  );

  // Analytics
  const [sessionStart, setSessionStart] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const visitedPagesRef = React.useRef([]);

  const refreshAnalytics = React.useCallback(() => {
    setAnalyticsLoading(true);
    getAnalyticsSummary().then(data => {
      setAnalyticsSummary(data);
      setAnalyticsLoading(false);
    });
  }, []);

  const applyAdminUndoEntry = React.useCallback(async (entry) => {
    if (!entry) return;
    switch (entry.type) {
      case 'SAVE_RECORD': {
        if (entry.wasNew && entry.savedRecord?.id) {
          await deleteEngineerPermanent(entry.savedRecord.id, entry.colName);
          setEngineers((prev) => prev.filter((e) => e.id !== entry.savedRecord.id));
        } else if (entry.before) {
          await saveEngineerToDb(entry.before, entry.colName);
          setEngineers((prev) => {
            const idx = prev.findIndex((e) => e.id === entry.before.id);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = entry.before;
              return next;
            }
            return [...prev, entry.before];
          });
        }
        break;
      }
      case 'ARCHIVE': {
        const restored = { ...entry.record, hidden: false };
        await saveEngineerToDb(restored, entry.colName);
        setEngineers((prev) => [...prev, restored]);
        setFetchedHiddenEngineers((prev) => prev.filter((e) => e.id !== entry.record.id));
        break;
      }
      case 'BULK_ARCHIVE': {
        for (const rec of entry.records) {
          await saveEngineerToDb({ ...rec, hidden: false }, entry.colName);
        }
        const ids = new Set(entry.records.map((r) => r.id));
        setEngineers((prev) => [...prev, ...entry.records.map((r) => ({ ...r, hidden: false }))]);
        setFetchedHiddenEngineers((prev) => prev.filter((e) => !ids.has(e.id)));
        setBulkSelectedIds([]);
        break;
      }
      case 'RESTORE': {
        await archiveEngineer(entry.record.id, entry.colName);
        setEngineers((prev) => prev.filter((e) => e.id !== entry.record.id));
        setFetchedHiddenEngineers((prev) => [...prev, { ...entry.record, hidden: true }]);
        break;
      }
      case 'BULK_RESTORE': {
        for (const rec of entry.records) {
          await archiveEngineer(rec.id, entry.colName);
        }
        const ids = new Set(entry.records.map((r) => r.id));
        setEngineers((prev) => prev.filter((e) => !ids.has(e.id)));
        setFetchedHiddenEngineers((prev) => [...prev, ...entry.records.map((r) => ({ ...r, hidden: true }))]);
        setBulkSelectedArchivedIds([]);
        break;
      }
      default:
        throw new Error('Unsupported undo action');
    }
  }, []);

  const handleAdminUndo = React.useCallback(() => {
    const stack = adminUndoStackRef.current || [];
    if (!stack.length) {
      message.warning('Nothing to undo.');
      return;
    }
    const peek = stack[stack.length - 1];
    modal.confirm({
      title: 'Undo last change?',
      content: `This will revert: ${peek.label}. You will be asked to confirm once more.`,
      okText: 'Continue',
      cancelText: 'Cancel',
      onOk: () => {
        modal.confirm({
          title: 'Confirm undo',
          content: 'This will write the previous state back to the database. Are you absolutely sure?',
          okText: 'Yes, undo',
          okType: 'danger',
          cancelText: 'Go back',
          onOk: async () => {
            const entry = popUndoEntry(adminUndoStackRef, setAdminUndoCount);
            if (!entry) return;
            setAdminUndoRunning(true);
            const hide = message.loading('Reverting last change…', 0);
            try {
              await applyAdminUndoEntry(entry);
              message.success('Last change was undone.');
              writeLog({
                type: 'ADMIN_ACTION',
                actor: currentUser?.username || 'admin',
                category: 'UNDO',
                action: 'Admin undo',
                details: { undoType: entry.type, label: entry.label },
                severity: 'warning',
              });
            } catch (err) {
              console.error(err);
              pushUndoEntry(adminUndoStackRef, setAdminUndoCount, entry);
              message.error('Undo failed. Your change was kept on the undo stack.');
            } finally {
              hide();
              setAdminUndoRunning(false);
            }
          },
        });
      },
    });
  }, [applyAdminUndoEntry, currentUser?.username, message, modal]);

  // Cookie consent

  // Activity log
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [logSeverityFilter, setLogSeverityFilter] = useState('ALL');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');
  const [logActorQuery, setLogActorQuery] = useState('');
  const [logActionQuery, setLogActionQuery] = useState('');
  const loadLogs = React.useCallback(() => {
    setLogsLoading(true);
    refreshAnalytics();
    fetchLogs(200).then(data => { setActivityLogs(data); setLogsLoading(false); });
  }, [refreshAnalytics]);
  const externalLogsPath = '/admin?logs=external';
  const userActionSessionRef = React.useRef('');
  const lastLoggedViewRef = React.useRef(null);
  const visitorEngagementSnapshotRef = React.useRef(() => ({}));
  const surveyStartedRef = React.useRef(false);
  const surveyCompletedRef = React.useRef(false);
  const feedbackStartedRef = React.useRef(false);
  const feedbackCompletedRef = React.useRef(false);
  const prevEngagementViewRef = React.useRef(null);
  const trackFunnelStepRef = React.useRef(() => {});

  const detectLogCategory = React.useCallback((log) => {
    if (log?.category) return String(log.category).toUpperCase();
    const action = String(log?.action || '').toLowerCase();
    if (action.includes('survey')) return 'SURVEY';
    if (action.includes('feedback')) return 'FEEDBACK';
    if (
      action.includes('permission')
      || action.includes('admin account')
      || action.includes('access scope')
      || action.includes('added new admin')
      || action.includes('deleted admin')
    ) return 'PERMISSIONS';
    if (action.includes('export')) return 'EXPORT';
    const t = String(log?.type || '').toUpperCase();
    if (t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('FAILED') || t.includes('ERROR')) return 'SECURITY';
    if (t.includes('ADMIN')) return 'ADMIN';
    if (t.includes('VISITOR') || t.includes('USER')) return 'VISITOR';
    return 'OTHER';
  }, []);

  const formatLogDetailValue = React.useCallback((value) => {
    if (value == null) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }, []);

  const filteredActivityLogs = React.useMemo(() => {
    const actorNeedle = logActorQuery.trim().toLowerCase();
    const actionNeedle = logActionQuery.trim().toLowerCase();
    return activityLogs.filter((log) => {
      const type = String(log?.type || '').toUpperCase();
      const severity = String(log?.severity || 'info').toLowerCase();
      const category = detectLogCategory(log);
      const actor = String(log?.actor || '').toLowerCase();
      const action = String(log?.action || '').toLowerCase();
      const detailsText = Object.entries(log?.details || {}).map(([k, v]) => `${k}:${formatLogDetailValue(v)}`).join(' ').toLowerCase();

      if (logTypeFilter !== 'ALL' && type !== logTypeFilter) return false;
      if (logSeverityFilter !== 'ALL' && severity !== logSeverityFilter.toLowerCase()) return false;
      if (logCategoryFilter !== 'ALL' && category !== logCategoryFilter) return false;
      if (actorNeedle && !actor.includes(actorNeedle)) return false;
      if (actionNeedle && !(action.includes(actionNeedle) || detailsText.includes(actionNeedle))) return false;
      return true;
    });
  }, [activityLogs, detectLogCategory, formatLogDetailValue, logActionQuery, logActorQuery, logCategoryFilter, logSeverityFilter, logTypeFilter]);

  const exportFilteredActivityLogs = React.useCallback(() => {
    if (!filteredActivityLogs.length) {
      message.warning('No logs match current filters.');
      return;
    }
    const rows = filteredActivityLogs.map((log, idx) => ({
      '#': idx + 1,
      Timestamp: log.timestamp ? log.timestamp.toISOString() : '',
      Type: log.type || '',
      Category: detectLogCategory(log),
      Severity: log.severity || '',
      Actor: log.actor || '',
      Action: log.action || '',
      Details: Object.entries(log.details || {}).map(([k, v]) => `${k}: ${formatLogDetailValue(v)}`).join(' | '),
      IP: log.ip || '',
      Location: log.location || '',
      UserAgent: log.userAgent || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Action Log');
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `action_log_filtered_${stamp}.xlsx`);
    message.success('Exported filtered action logs.');
  }, [detectLogCategory, filteredActivityLogs, formatLogDetailValue, message]);

  const exportAnalyticsToExcel = React.useCallback(() => {
    if (!analyticsSummary) {
      message.warning('Tap Refresh first to load analytics.');
      return;
    }
    const surveyFeedbackLogs = activityLogs
      .filter((log) => {
        const cat = detectLogCategory(log);
        return cat === 'SURVEY' || cat === 'FEEDBACK';
      })
      .slice(0, 500)
      .map((log, idx) => ({
        '#': idx + 1,
        Timestamp: log.timestamp ? log.timestamp.toISOString() : '',
        Category: detectLogCategory(log),
        Action: log.action || '',
        Actor: log.actor || '',
        Details: Object.entries(log.details || {}).map(([k, v]) => `${k}: ${formatLogDetailValue(v)}`).join(' | '),
      }));
    const ok = exportAnalyticsReport(analyticsSummary, { recentLogs: surveyFeedbackLogs });
    if (ok) message.success('Analytics exported to Excel.');
    else message.error('Could not export analytics.');
  }, [activityLogs, analyticsSummary, detectLogCategory, formatLogDetailValue, message]);

  const logUserAction = React.useCallback(({ action, category = 'VISITOR', details = {}, severity = 'info' }) => {
    const actor =
      (isLogged && currentUser?.username)
        ? currentUser.username
        : `visitor:${userActionSessionRef.current || 'session'}`;
    writeLog({
      type: 'USER_ACTION',
      actor,
      category,
      action,
      details: {
        ...details,
        view,
        appMode: appMode || null,
        portalRealm: portalRealm || null,
        sessionId: userActionSessionRef.current || null,
      },
      severity,
    });
  }, [appMode, currentUser?.username, isLogged, portalRealm, view]);

  // Direct URL support: /samsung-academy-survey | /feedback | /?portal=admin | /?survey=… | /?feedback=…
  const portalQueryHandledRef = useRef(false);
  /** Read before the query effect strips `?survey=`; QR/link visitors need the selected survey without the idle delay. */
  const openedViaSurveyLinkRef = useRef(
    typeof window !== 'undefined' && isDirectSurveyQuery(new URLSearchParams(window.location.search).get('survey')),
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const survey = String(params.get('survey') || '').toLowerCase();
    if (isDirectSurveyQuery(survey)) {
      setPortalRealm('TCS');
      setAppMode((prev) => prev || 'TCS_MX');
      setShowSurveyShortcut(false);
      resetAcademySurvey();
      setView('SAMSUNG_ACADEMY_SURVEY');
      viewStackRef.current = ['APP_SELECTION', 'SAMSUNG_ACADEMY_SURVEY'];
      params.delete('survey');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
      return;
    }

    const feedback = String(params.get('feedback') || params.get('form') || '').toLowerCase();
    if (isDirectFeedbackQuery(feedback)) {
      setPortalRealm('TCS');
      setAppMode((prev) => prev || 'TCS_MX');
      setShowFeedbackPromo(false);
      setEngineerFeedback(INITIAL_ENGINEER_FEEDBACK);
      setFeedbackSent(false);
      try {
        sessionStorage.setItem('feedback_opened', '1');
      } catch { /* ignore */ }
      setView('FEEDBACK');
      viewStackRef.current = ['APP_SELECTION', 'FEEDBACK'];
      params.delete('feedback');
      params.delete('form');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
      return;
    }

    const portal = String(params.get('portal') || '').toLowerCase();
    const logs = String(params.get('logs') || '').toLowerCase();

    if (portal === 'admin') {
      setIsAdminPortal(true);
      const forceLogout = ['1', 'true', 'yes'].includes(String(params.get('logout') || '').toLowerCase());
      if (forceLogout) {
        adminSessionOkRef.current = false;
        try {
          sessionStorage.removeItem(ADMIN_SESSION_OK_KEY);
        } catch {
          /* ignore */
        }
        clearCachedAdminProfile();
        clearAdminUiPrefs();
        signOutAdmin().finally(() => {
          setIsLogged(false);
          setCurrentUser(null);
          setView('ADMIN_LOGIN');
          viewStackRef.current = ['ADMIN_LOGIN'];
          const clean = new URL(window.location.href);
          clean.searchParams.delete('logout');
          window.history.replaceState({}, '', clean.pathname + clean.search);
        });
        portalQueryHandledRef.current = true;
        return;
      }
      const tab = String(params.get('tab') || '').toLowerCase();
      if (tab === 'scora-challenge' || tab === 'quiz') setAdminPanelTab('scora-challenge');
      if (tab === 'samsung-kb' || tab === 'samsung-products' || tab === 'products-kb' || tab === 'consultants' || tab === 'technical-consultants' || tab === 'knowledge') {
        setAdminPanelTab('knowledge-base');
      }
      const hasAdminSession =
        isLogged ||
        adminSessionOkRef.current ||
        (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_OK_KEY) === '1');
      const bootView = readAdminBootView();
      if (hasAdminSession && (logs === 'external' || logs === '1')) {
        setView('EXTERNAL_LOGS');
        viewStackRef.current = ['ADMIN_LOGIN', 'ADMIN_DASHBOARD', 'EXTERNAL_LOGS'];
      } else if (hasAdminSession && bootView !== 'ADMIN_LOGIN') {
        setView(bootView);
        viewStackRef.current = ['ADMIN_LOGIN', bootView];
      } else if (hasAdminSession) {
        setView('ADMIN_DASHBOARD');
        viewStackRef.current = ['ADMIN_LOGIN', 'ADMIN_DASHBOARD'];
      } else {
        setView('ADMIN_LOGIN');
        viewStackRef.current = ['ADMIN_LOGIN'];
      }
      portalQueryHandledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged]);

  const copyPublicDirectLink = React.useCallback(async (fullUrl, label) => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      message.success(`${label} direct link copied.`);
    } catch {
      message.error('Failed to copy link.');
    }
  }, [message]);

  useEffect(() => {
    if (view === 'EXTERNAL_LOGS') loadLogs();
  }, [loadLogs, view]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        setAcademySurveySettingsLoading(true);
        try {
          const [settings, defs] = await Promise.all([
            getAcademySurveySettings(),
            getSurveyDefinitions(),
          ]);
          if (cancelled || academySurveySettingsTouchedRef.current) return;
          setAcademySurveyPopupEnabled(settings.academySurveyPopupEnabled !== false);
          setFeedbackEnabled(settings.feedbackEnabled !== false);
          setNotifyAlertsEnabled(settings.notifyAlertsEnabled !== false);
          setActiveSurveyId(settings.activeSurveyId || DEFAULT_SURVEY_ID);
          setSurveyDefinitions(defs.length ? defs : [DEFAULT_ACADEMY_SURVEY]);
          writeCachedAcademySurveySettings(settings);
          setAcademySurveySettingsLoaded(true);
          if (settings.academySurveyPopupEnabled === false) {
            setShowSurveyShortcut(false);
          }
          if (settings.feedbackEnabled === false) {
            setShowFeedbackPromo(false);
          }
        } catch (err) {
          if (!cancelled) console.error('Academy survey settings load failed', err);
        } finally {
          if (!cancelled) {
            setAcademySurveySettingsLoading(false);
            setAcademySurveySettingsLoaded(true);
          }
        }
      })();
    }, openedViaSurveyLinkRef.current ? 0 : 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const resetEngineerFeedback = React.useCallback(() => {
    setEngineerFeedback(INITIAL_ENGINEER_FEEDBACK);
    setFeedbackSent(false);
  }, []);

  const canTrackVisitorAnalytics = useMemo(
    () => !isAdminPortal && !ADMIN_ANALYTICS_VIEWS.has(view),
    [isAdminPortal, view]
  );

  const dismissFeedbackPromo = React.useCallback(() => {
    try {
      if (!sessionStorage.getItem('feedback_opened')) {
        trackFunnelStepRef.current('feedback', 'promo_dismissed', 'promo_close');
      }
    } catch {
      trackFunnelStepRef.current('feedback', 'promo_dismissed', 'promo_close');
    }
    setShowFeedbackPromo(false);
  }, []);

  const feedbackHomePopupOpen =
    !isAdminPortal && isFeedbackPortalRealm(portalRealm) && feedbackEnabled && showFeedbackPromo && view === 'HOME';

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (feedbackHomePopupOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [feedbackHomePopupOpen]);

  const openFeedbackForm = React.useCallback(() => {
    try {
      sessionStorage.setItem('feedback_opened', '1');
    } catch { /* ignore */ }
    setShowFeedbackPromo(false);
    resetEngineerFeedback();
    navigateTo('FEEDBACK');
  }, [navigateTo, resetEngineerFeedback]);

  const handleAcademySurveyPopupToggle = async (enabled) => {
    if (!canWriteModule(currentUser, 'display')) {
      message.warning('You do not have write access to display settings.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SECURITY',
        action: 'Denied survey popup toggle (insufficient permissions)',
        severity: 'warning',
      });
      return;
    }
    setAcademySurveySettingsSaving(true);
    academySurveySettingsTouchedRef.current = true;
    setAcademySurveyPopupEnabled(enabled);
    if (!enabled) setShowSurveyShortcut(false);
    try {
      await saveAcademySurveySettings({ academySurveyPopupEnabled: enabled }, currentUser?.username || 'admin');
      writeCachedAcademySurveySettings({
        academySurveyPopupEnabled: enabled,
        feedbackEnabled,
        notifyAlertsEnabled,
        activeSurveyId,
      });
      if (enabled) setShowSurveyShortcut(true);
      message.success(enabled ? 'Samsung Academy survey popup is ON for all visitors.' : 'Samsung Academy survey popup is OFF.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SURVEY',
        action: enabled ? 'Enabled Samsung Academy survey popup' : 'Disabled Samsung Academy survey popup',
        severity: 'info',
      });
    } catch (err) {
      console.error(err);
      setAcademySurveyPopupEnabled(!enabled);
      if (enabled) setShowSurveyShortcut(false);
      else setShowSurveyShortcut(true);
      message.error('Could not save survey popup setting.');
    } finally {
      setAcademySurveySettingsSaving(false);
    }
  };

  const handleFeedbackEnabledToggle = async (enabled) => {
    if (!canWriteModule(currentUser, 'display')) {
      message.warning('You do not have write access to display settings.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SECURITY',
        action: 'Denied feedback toggle (insufficient permissions)',
        severity: 'warning',
      });
      return;
    }
    setAcademySurveySettingsSaving(true);
    academySurveySettingsTouchedRef.current = true;
    setFeedbackEnabled(enabled);
    if (!enabled) setShowFeedbackPromo(false);
    try {
      await saveAcademySurveySettings({ feedbackEnabled: enabled }, currentUser?.username || 'admin');
      writeCachedAcademySurveySettings({
        academySurveyPopupEnabled,
        feedbackEnabled: enabled,
        notifyAlertsEnabled,
        activeSurveyId,
      });
      if (enabled) setShowFeedbackPromo(true);
      message.success(enabled ? 'Arabic feedback form is ON for all visitors.' : 'Arabic feedback form is OFF.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'FEEDBACK',
        action: enabled ? 'Enabled Arabic feedback form' : 'Disabled Arabic feedback form',
        severity: 'info',
      });
    } catch (err) {
      console.error(err);
      setFeedbackEnabled(!enabled);
      if (enabled) setShowFeedbackPromo(false);
      else setShowFeedbackPromo(true);
      message.error('Could not save feedback setting.');
    } finally {
      setAcademySurveySettingsSaving(false);
    }
  };

  const handleNotifyAlertsToggle = async (enabled) => {
    if (!canWriteModule(currentUser, 'display')) {
      message.warning('You do not have write access to display settings.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SECURITY',
        action: 'Denied alerts banner toggle (insufficient permissions)',
        severity: 'warning',
      });
      return;
    }
    setAcademySurveySettingsSaving(true);
    academySurveySettingsTouchedRef.current = true;
    setAcademySurveySettingsLoaded(true);
    setNotifyAlertsEnabled(enabled);
    try {
      await saveAcademySurveySettings({ notifyAlertsEnabled: enabled }, currentUser?.username || 'admin');
      writeCachedAcademySurveySettings({
        academySurveyPopupEnabled,
        feedbackEnabled,
        notifyAlertsEnabled: enabled,
        activeSurveyId,
      });
      message.success(enabled ? 'Phone alerts banner is ON for all visitors.' : 'Phone alerts banner is OFF.');
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'SYSTEM',
        action: enabled ? 'Enabled phone alerts banner' : 'Disabled phone alerts banner',
        severity: 'info',
      });
    } catch (err) {
      console.error(err);
      setNotifyAlertsEnabled(!enabled);
      message.error('Could not save notification banner setting.');
    } finally {
      setAcademySurveySettingsSaving(false);
    }
  };

  const handleActiveSurveyChange = async (id) => {
    setActiveSurveyId(id);
    writeCachedAcademySurveySettings({
      academySurveyPopupEnabled,
      feedbackEnabled,
      notifyAlertsEnabled,
      activeSurveyId: id,
    });
    const latest = await getSurveyDefinitions().catch(() => surveyDefinitions);
    if (latest?.length) setSurveyDefinitions(latest);
  };

  useEffect(() => {
    const touched = Object.values(academySurvey || {}).some((v) => String(v || '').trim());
    if (touched || academySurveySent || view === 'SAMSUNG_ACADEMY_SURVEY') return;
    setAcademySurvey(emptySurveyAnswers(activeSurveyDef));
    // Refresh empty answers when the selected survey changes, without wiping an in-progress form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurveyDef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'visitorActionSessionId';
    const existing = sessionStorage.getItem(key);
    if (existing) {
      userActionSessionRef.current = existing;
      return;
    }
    const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    userActionSessionRef.current = sid;
    sessionStorage.setItem(key, sid);
  }, []);

  useEffect(() => {
    const previous = lastLoggedViewRef.current;
    if (previous === view) return;
    lastLoggedViewRef.current = view;
    if (!previous) {
      logUserAction({
        action: 'Opened app view',
        category: 'NAVIGATION',
        details: { to: view },
      });
      return;
    }
    logUserAction({
      action: 'Changed view',
      category: 'NAVIGATION',
      details: { from: previous, to: view },
    });
  }, [logUserAction, view]);

  const trackFunnelStep = React.useCallback((funnel, step, source) => {
    if (!canTrackVisitorAnalytics) return;
    const label = step.replace(/_/g, ' ');
    logUserAction({
      action: `${funnel === 'survey' ? 'Survey' : 'Feedback'} funnel: ${label}`,
      category: funnel === 'survey' ? 'SURVEY' : 'FEEDBACK',
      details: { step, source, portalRealm, appMode },
    });
    recordFunnelStep(funnel, step, {
      appMode,
      sessionId: userActionSessionRef.current,
      source,
    });
  }, [appMode, canTrackVisitorAnalytics, logUserAction, portalRealm]);

  trackFunnelStepRef.current = trackFunnelStep;

  useVisitorEngagement({
    enabled: canTrackVisitorAnalytics,
    sessionId: userActionSessionRef.current,
    appMode,
    snapshotRef: visitorEngagementSnapshotRef,
  });

  const {
    profile: employeeProfile,
    isLoggedIn: employeeLoggedIn,
    logout: employeeLogout,
  } = useEmployeeAuth();
  const [showEmployeeAuth, setShowEmployeeAuth] = useState(false);
  const [activeConsultantId, setActiveConsultantId] = useState(null);
  const [gogoTipCompleteNonce, setGogoTipCompleteNonce] = useState(0);

  const dismissSurveyShortcut = React.useCallback(() => {
    try {
      if (!sessionStorage.getItem('survey_opened')) {
        trackFunnelStep('survey', 'promo_dismissed', 'shortcut_close');
      }
    } catch {
      trackFunnelStep('survey', 'promo_dismissed', 'shortcut_close');
    }
    setShowSurveyShortcut(false);
  }, [trackFunnelStep]);

  const openSurveyForm = React.useCallback(() => {
    try {
      sessionStorage.setItem('survey_opened', '1');
    } catch { /* ignore */ }
    setShowSurveyShortcut(false);
    resetAcademySurvey();
    navigateTo('SAMSUNG_ACADEMY_SURVEY');
  }, [navigateTo, resetAcademySurvey]);

  useEffect(() => {
    if (!canTrackVisitorAnalytics) return;
    if (!academySurveyPopupEnabled || !showSurveyShortcut) return;
    if (view === 'APP_SELECTION' || view === 'PQA_DIVISION_SELECTION') return;
    try {
      if (sessionStorage.getItem('survey_promo_shown')) return;
      sessionStorage.setItem('survey_promo_shown', '1');
    } catch { /* ignore */ }
    trackFunnelStep('survey', 'promo_shown', 'floating_shortcut');
  }, [academySurveyPopupEnabled, canTrackVisitorAnalytics, showSurveyShortcut, trackFunnelStep, view]);

  useEffect(() => {
    if (!feedbackHomePopupOpen) return;
    try {
      if (sessionStorage.getItem('feedback_promo_shown')) return;
      sessionStorage.setItem('feedback_promo_shown', '1');
    } catch { /* ignore */ }
    trackFunnelStep('feedback', 'promo_shown', 'home_modal');
  }, [feedbackHomePopupOpen, trackFunnelStep]);

  useEffect(() => {
    if (!canTrackVisitorAnalytics || !feedbackEnabled || !showFeedbackPromo) return;
    if (!isFeedbackPortalRealm(portalRealm)) return;
    if (view === 'HOME' || view === 'APP_SELECTION' || view === 'PQA_DIVISION_SELECTION' || view === 'TCS_DIVISION_SELECTION' || view === 'FEEDBACK') return;
    try {
      if (sessionStorage.getItem('feedback_promo_floating_shown')) return;
      sessionStorage.setItem('feedback_promo_floating_shown', '1');
    } catch { /* ignore */ }
    trackFunnelStep('feedback', 'promo_shown', 'floating_shortcut');
  }, [canTrackVisitorAnalytics, feedbackEnabled, portalRealm, showFeedbackPromo, trackFunnelStep, view]);

  useEffect(() => {
    if (view === 'SAMSUNG_ACADEMY_SURVEY' && !academySurveySent && !surveyStartedRef.current) {
      const touched = Object.values(academySurvey || {}).some((v) => String(v || '').trim());
      if (touched) {
        surveyStartedRef.current = true;
        trackFunnelStep('survey', 'started', 'form_interaction');
      }
    }
  }, [academySurvey, academySurveySent, trackFunnelStep, view]);

  useEffect(() => {
    if (view === 'FEEDBACK' && !feedbackSent && !feedbackStartedRef.current) {
      const touched = Boolean(
        engineerFeedback.fullName
        || engineerFeedback.phoneNumber
        || engineerFeedback.company
        || engineerFeedback.product
        || engineerFeedback.message
      );
      if (touched) {
        feedbackStartedRef.current = true;
        trackFunnelStep('feedback', 'started', 'form_interaction');
      }
    }
  }, [engineerFeedback, feedbackSent, trackFunnelStep, view]);

  useEffect(() => {
    const prev = prevEngagementViewRef.current;
    if (prev === view) return;
    if (prev === 'SAMSUNG_ACADEMY_SURVEY') {
      if (!surveyCompletedRef.current) {
        trackFunnelStep(
          'survey',
          'abandoned',
          surveyStartedRef.current ? 'left_form' : 'left_without_submit'
        );
      }
      surveyStartedRef.current = false;
      surveyCompletedRef.current = false;
    } else if (view === 'SAMSUNG_ACADEMY_SURVEY' && canTrackVisitorAnalytics && prev != null) {
      try {
        sessionStorage.setItem('survey_opened', '1');
      } catch { /* ignore */ }
      trackFunnelStep('survey', 'opened', 'form_view');
    }
    if (prev === 'FEEDBACK') {
      if (!feedbackCompletedRef.current) {
        trackFunnelStep(
          'feedback',
          'abandoned',
          feedbackStartedRef.current ? 'left_form' : 'left_without_submit'
        );
      }
      feedbackStartedRef.current = false;
      feedbackCompletedRef.current = false;
    } else if (view === 'FEEDBACK' && canTrackVisitorAnalytics && prev != null) {
      try {
        sessionStorage.setItem('feedback_opened', '1');
      } catch { /* ignore */ }
      trackFunnelStep('feedback', 'opened', 'form_view');
    }
    prevEngagementViewRef.current = view;
  }, [canTrackVisitorAnalytics, trackFunnelStep, view]);

  const [tcsWinnersConfigs, setTcsWinnersConfigs] = useState([]);
  const [tcsWinnersLoading, setTcsWinnersLoading] = useState(false);
  const [tcsWinnersSaving, setTcsWinnersSaving] = useState(false);
  const [winnerHubQuarter, setWinnerHubQuarter] = useState('Q1');
  const [winnerHubYear, setWinnerHubYear] = useState(String(new Date().getFullYear()));
  const [winnerHubProduct, setWinnerHubProduct] = useState('MX');
  const [winnerHubMxRole, setWinnerHubMxRole] = useState('engineers');
  const [winnerHubCodes, setWinnerHubCodes] = useState(Array.from({ length: TCS_WINNERS_PER_PRODUCT }, () => ''));
  const winnerHubQuarterKey = `${winnerHubQuarter}-${winnerHubYear}`;
  const winnerHubSlotCount = useMemo(
    () => getTcsWinnersSlotCount(winnerHubProduct === 'MX' ? winnerHubMxRole : 'engineers'),
    [winnerHubProduct, winnerHubMxRole],
  );
  const dashboardWinnersSlotCount = useMemo(
    () => getTcsWinnersSlotCount(appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers'),
    [appMode, tcsMxRoleTab],
  );
  const winnersConfigMap = useMemo(() => buildTcsWinnersConfigMap(tcsWinnersConfigs), [tcsWinnersConfigs]);

  const loadTcsWinnersConfigs = React.useCallback(async (silent = false) => {
    setTcsWinnersLoading(true);
    try {
      const rows = await getTcsDashboardWinners();
      setTcsWinnersConfigs(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error('Failed to load TCS winners config.', e);
      if (!silent) message.error('Failed to load TCS winners config.');
    } finally {
      setTcsWinnersLoading(false);
    }
  }, [message]);
  useEffect(() => {
    if (adminModal !== 'winners') return;
    const cfg = lookupTcsWinnersConfig(
      winnersConfigMap,
      winnerHubQuarterKey,
      winnerHubProduct,
      winnerHubProduct === 'MX' ? winnerHubMxRole : 'engineers',
    );
    const nextCodes = Array.from({ length: winnerHubSlotCount }, (_, idx) => String(cfg?.winners?.[idx] || ''));
    setWinnerHubCodes(nextCodes);
  }, [adminModal, winnersConfigMap, winnerHubQuarterKey, winnerHubProduct, winnerHubMxRole, winnerHubSlotCount]);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!visitedPagesRef.current.includes(view)) {
      visitedPagesRef.current = [...visitedPagesRef.current, view];
    }
    if (view === 'ADMIN_DASHBOARD' && isLogged) {
      const t = setTimeout(() => { refreshAnalytics(); loadLogs(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [view]);

  useEffect(() => {
    if (!isLogged || !currentUser) return;
    const canManageTcs = canAccessTcsEnv(currentUser) && canReadModule(currentUser, 'tcs');
    if (!canManageTcs) return;
    loadTcsWinnersConfigs();
  }, [isLogged, currentUser, loadTcsWinnersConfigs]);

  const adminCanWriteData = useMemo(
    () => (isPqaMode ? canWriteModule(currentUser, 'pqa') : canWriteModule(currentUser, 'tcs')),
    [currentUser, isPqaMode]
  );
  const adminCanReadData = useMemo(
    () => (isPqaMode ? canReadModule(currentUser, 'pqa') : canReadModule(currentUser, 'tcs')),
    [currentUser, isPqaMode]
  );

  const adminTabs = useMemo(() => {
    if (!currentUser) return [];
    return [
      { key: 'data', label: 'Data', show: canAccessModule(currentUser, 'tcs') || canAccessModule(currentUser, 'pqa') },
      { key: 'display', label: 'Display', show: canAccessModule(currentUser, 'display') },
      { key: 'survey', label: 'Survey', show: canAccessModule(currentUser, 'survey') || canAccessModule(currentUser, 'surveyForms') },
      { key: 'feedback', label: 'Feedback', show: canAccessModule(currentUser, 'feedback') },
      { key: 'scora-challenge', label: 'SCORA Challenge', show: canAccessModule(currentUser, 'quiz') },
      { key: 'knowledge-base', label: 'Knowledge Base', show: canAccessModule(currentUser, 'knowledge') },
      { key: 'insights', label: 'Insights', show: currentUser.role === 'SUPER_ADMIN' },
      { key: 'system', label: 'System', show: currentUser.role === 'SUPER_ADMIN' },
    ].filter((tab) => tab.show);
  }, [currentUser]);

  // The open tab survives a logout/login on the same page; keep it within what the new user may see.
  useEffect(() => {
    if (!adminTabs.length || adminTabs.some((tab) => tab.key === adminPanelTab)) return;
    setAdminPanelTab(adminTabs[0].key);
  }, [adminTabs, adminPanelTab]);

  useEffect(() => {
    if (!appMode?.startsWith('TCS')) return;
    loadTcsWinnersConfigs(true);
  }, [appMode, tcsMxRoleTab, view, loadTcsWinnersConfigs]);

  // Helper to ensure PQA Service Center photo is displayed correctly
  const getPhotoUrl = (eng) => {
    if (!eng) return DEFAULT_ENGINEER_PHOTO_URL;

    const isPqa = appMode?.startsWith('PQA') || Boolean(eng.pqaBranch);

    // TCS engineers: Samsung logo only until they upload their own photo
    if (!isPqa) {
      if (isCustomEngineerPhotoUpload(eng)) return eng.photoUrl;
      return DEFAULT_ENGINEER_PHOTO_URL;
    }

    // ── PQA: custom uploads, then partner logos ───────────────────────
    if (
      eng.photoUrl &&
      !eng.photoUrl.includes('Service%20centers.png') &&
      !eng.photoUrl.includes('picsum.photos') &&
      !eng.photoUrl.startsWith('/logos/')
    ) {
      return eng.photoUrl;
    }

    const pqaPlaceholder = () => pqaDefaultUrl || PQA_SERVICE_CENTER_PHOTO;
    /** Resolved Storage URL, else PQA generic placeholder (not missing /logos files), else local path for TCS */
    const brandUrl = (key) => PARTNER_LOGOS[key] || (isPqa ? pqaPlaceholder() : `/logos/${key.toLowerCase()}.png`);

    // Match brand on any common field
    const hay = [
      eng.partnerName,
      eng.partner,
      eng.name,
      eng.asc,
      eng.code,
      eng.centerName,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    if (hay.includes('RAYA')) return brandUrl('RAYA');
    if (hay.includes('SKY')) return brandUrl('SKY');
    if (hay.includes('HI TECH') || hay.includes('HITECH')) return brandUrl('HITECH');
    if (hay.includes('URC')) return brandUrl('URC');
    if (hay.includes('K-ELECTRONICS') || hay.includes('K ELECTRONICS') || hay.includes('KELECTRONICS')) return brandUrl('KELECTRONICS');
    if (hay.includes('ATS')) return brandUrl('ATS');
    if (hay.includes('ELECTRA')) return brandUrl('ELECTRA');
    if (hay.includes('MTI')) return brandUrl('MTI');
    if (hay.includes('ALSAFY') || hay.includes('AL SAFY')) return brandUrl('ALSAFY');

    if (isPqa) {
      if (!eng.photoUrl || eng.photoUrl.includes('picsum') || eng.photoUrl.includes('default') || eng.photoUrl === PQA_SERVICE_CENTER_PHOTO) {
        return PARTNER_LOGOS.SAMSUNG_FALLBACK;
      }
    }
    return eng.photoUrl || PARTNER_LOGOS.SAMSUNG_FALLBACK;
  };
  
  // Helper for conditional logo styling (Samsung default fills frame; partner /local logos stay letterboxed)
  const getLogoStyle = (url) =>
    isSamsungEngineerPhotoUrl(url) ? 'object-cover object-center' : 'object-contain bg-white p-0.5';

  /** TCS: leaderboard/search primary label. DA/AV prefer Engineer Name; MX keeps SBA/code. */
  const tcsDisplayPrimary = (eng) => {
    if (appMode?.startsWith('PQA')) return eng?.name || eng?.code || '—';
    if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
      return String(eng?.name || '').trim() || String(eng?.gspnId || eng?.code || '').trim() || '—';
    }
    if (appMode === 'TCS_DA' || appMode === 'TCS_AV' || appMode === 'TCS_VD') {
      return resolveDaAvDisplayName(eng);
    }
    const sba = String(eng?.sbaId || '').trim();
    if (sba) return sba;
    const code = String(eng?.code || '').trim();
    if (code) return code;
    return eng?.name || '—';
  };
  const tcsDisplaySecondary = (eng) => {
    if (appMode?.startsWith('PQA')) return '';
    if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
      const gspn = String(eng?.gspnId || eng?.code || '').trim();
      const asc = String(eng?.asc || eng?.ascCode || '').trim();
      if (gspn && asc) return `${gspn} · ${asc}`;
      return gspn || asc || '';
    }
    if (appMode === 'TCS_DA' || appMode === 'TCS_AV' || appMode === 'TCS_VD') {
      const code = String(eng?.code || eng?.engineerCode || '').trim();
      const asc = String(eng?.asc || '').trim();
      if (code && asc && asc !== 'N/A') return `${code} · ${asc}`;
      return code || (asc !== 'N/A' ? asc : '') || '';
    }
    const asc = String(eng?.asc || '').trim();
    if (asc && asc !== 'N/A') return asc;
    return String(eng?.name || '').trim();
  };

  const isTcsMode = appMode?.startsWith('TCS');

  const PHOTO_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
  const photoUpdatedAtMs = (eng) => {
    const v = eng?.photoUpdatedAt;
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    return 0;
  };
  /** Firebase Storage folder for TCS engineer photos: mx | da | av */
  const getTcsStorageFolder = () => {
    if (appMode === 'TCS_MX') return 'mx';
    if (appMode === 'TCS_DA') return 'da';
    if (appMode === 'TCS_AV' || appMode === 'TCS_VD') return 'av';
    return 'engineers';
  };

  const renderPodiumMedalNumeral = (displayRank) => {
    const medal = PODIUM_MEDAL_STYLES[displayRank];
    if (!medal) return null;
    return (
      <div className={`mb-1 flex items-baseline justify-center font-black italic leading-none tracking-tighter ${medal.glow}`}>
        <span className={`bg-clip-text text-transparent bg-gradient-to-b ${medal.gradient} text-lg sm:text-2xl md:text-3xl`}>#</span>
        <span className={`bg-clip-text text-transparent bg-gradient-to-b ${medal.gradient} text-3xl sm:text-5xl md:text-6xl`}>{displayRank}</span>
      </div>
    );
  };

  /** TCS: medal numeral + tier emblem. PQA: medal numeral only. */
  const renderRankBadgePodium = (displayRank, eng, compact = false) => {
    if (isTcsMode && eng) {
      const tier = resolveTierByMode(eng);
      const meta = TIER_META[tier] || TIER_META.Bronze;
      return (
        <div className="mb-1 flex flex-col items-center sm:mb-2">
          {renderPodiumMedalNumeral(displayRank) || (
            <div className="mb-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest text-zinc-300 border-zinc-500/30 bg-zinc-500/10">
              #{displayRank}
            </div>
          )}
          <img
            src={meta.img}
            alt={tier || 'Tier'}
            className={`object-contain drop-shadow-[0_8px_28px_rgba(0,0,0,0.5)] tier-emblem-blend ${
              compact
                ? 'h-9 w-9 sm:h-14 sm:w-14 md:h-[4.25rem] md:w-[4.25rem]'
                : 'h-[4.25rem] w-[4.25rem] sm:h-16 sm:w-16 md:h-[5.25rem] md:w-[5.25rem]'
            }`}
          />
        </div>
      );
    }
    const medalNumeral = renderPodiumMedalNumeral(displayRank);
    if (medalNumeral) return medalNumeral;
    return (
      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">#{displayRank}</div>
    );
  };

  /** TCS list: tier emblem + rank block. PQA: # in box. */
  const renderRankBadgeList = (displayRank, isFirst, isSecond, isThird, eng) => {
    const rankColor = isFirst ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30' : isThird ? 'text-orange-400 bg-orange-600/10 border-orange-600/30' : 'text-zinc-400 bg-zinc-800/60 border-white/10';
    if (isTcsMode && eng) {
      const rankTone = isFirst
        ? 'text-yellow-300 border-yellow-500/50 bg-yellow-500/10'
        : isSecond
          ? 'text-zinc-200 border-zinc-300/40 bg-zinc-300/10'
          : isThird
            ? 'text-orange-300 border-orange-500/40 bg-orange-500/10'
            : 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10';
      return (
        <div className={`flex h-10 min-w-[3.2rem] flex-shrink-0 items-center justify-center rounded-full border px-3 text-xs font-black italic tracking-widest uppercase md:h-12 md:min-w-[3.6rem] md:text-sm ${rankTone}`}>
          <span>
            #{displayRank}
          </span>
        </div>
      );
    }
    return (
      <div className={`flex h-8 w-8 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-lg md:rounded-2xl border font-black italic md:text-lg ${rankColor}`}>
        #{displayRank}
      </div>
    );
  };

  /** Top 3 rows only (same order & #displayRank as the ladder). Full list continues below from rank 4. */
  const renderHomeRankingPodium = (entries, scoreField, scoreLabelStr) => {
    const top = entries.slice(0, 3);
    if (top.length === 0) return null;
    const scoreOf = (eng) => {
      if (scoreField === 'avgScore') return eng?.avgScore;
      if (scoreField === 'engineerEvaluation') return eng?.engineerEvaluation;
      if (scoreField === 'roleScore') return eng?.roleScore ?? calculateReceptionistScore(eng);
      if (scoreField === 'galaxyConsultantTickets') return eng?.galaxyConsultantTickets;
      return eng?.tcsScore;
    };
    const PodiumCol = ({ eng, stepClass, champion, forcedRank }) => {
      const displayRank = eng.displayRank ?? forcedRank ?? 0;
      const url = getPhotoUrl(eng);
      const sc = scoreOf(eng);
      const scoreTone = champion
        ? 'text-yellow-400'
        : displayRank === 2
          ? 'text-zinc-300'
          : displayRank === 3
            ? 'text-orange-500'
            : 'text-white';
      return (
        <div className="flex min-w-0 w-full max-w-full flex-col items-center">
          <div className={`flex w-full flex-col items-center gap-1 mb-2 px-0.5 sm:px-1 ${champion ? 'sm:scale-[1.03] md:scale-105' : ''}`}>
            {renderRankBadgePodium(displayRank, eng, true)}
            <img
              src={url}
              alt=""
              onError={handleEngineerPhotoError}
              className={`h-11 w-11 shrink-0 rounded-xl border shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl md:h-[4.5rem] md:w-[4.5rem] ${getLogoStyle(url)} ${
                champion ? 'border-yellow-500/80 ring-1 ring-yellow-500/25 sm:ring-2' : 'border-white/15'
              }`}
            />
            <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-0.5 text-center leading-tight">
              <span className="line-clamp-2 break-words text-[8px] font-black uppercase text-white sm:text-[10px] md:text-xs">{tcsDisplayPrimary(eng)}</span>
              {tcsDisplaySecondary(eng) ? (
                <span className="line-clamp-2 w-full break-words text-[7px] font-bold normal-case tracking-normal text-zinc-500 sm:text-[8px] md:text-[9px]">
                  {tcsDisplaySecondary(eng)}
                </span>
              ) : null}
            </div>
            {!appMode?.startsWith('PQA') && eng.tier && !isTcsMode && <TierBadge tier={eng.tier} size="sm" />}
            {!isTcsMode && (
              <>
                <div className={`text-base font-black italic tracking-tighter sm:text-xl md:text-3xl ${scoreTone}`}>
                  {sc != null ? parseFloat(sc).toFixed(1) : '—'}
                </div>
                <div className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[7px]">{scoreLabelStr}</div>
              </>
            )}
          </div>
          <div
            className={`w-full rounded-t-xl border-x border-t border-white/10 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 shadow-inner sm:rounded-t-2xl ${stepClass}`}
          />
        </div>
      );
    };
    return (
      <div className="mb-6 w-full min-w-0 max-w-full md:mb-10" aria-label="Top three podium">
        <div className="mx-auto grid w-full min-w-0 max-w-4xl grid-cols-3 items-end gap-1 px-1 sm:gap-3 sm:px-3 md:gap-5">
          {top.length >= 2 && (
            <MotionCard index={1}>
              <PodiumCol eng={top[1]} forcedRank={2} stepClass="h-12 sm:h-[5.5rem] md:h-[7rem]" />
            </MotionCard>
          )}
          {top.length >= 1 && (
            <MotionCard index={0}>
              <PodiumCol eng={top[0]} forcedRank={1} stepClass="h-16 sm:h-[7.5rem] md:h-[9.5rem]" champion />
            </MotionCard>
          )}
          {top.length >= 3 && (
            <MotionCard index={2}>
              <PodiumCol eng={top[2]} forcedRank={3} stepClass="h-10 sm:h-[4.5rem] md:h-[5.5rem]" />
            </MotionCard>
          )}
        </div>
      </div>
    );
  };

  // Record visit on mount & session end on tab close
  const isLoggedRef = React.useRef(isLogged);
  const appModeRef = React.useRef(appMode);
  useEffect(() => { isLoggedRef.current = isLogged; }, [isLogged]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);

  useEffect(() => {
    if (!appMode) return;
    try {
      const k = `analytics_seg_${appMode}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      recordVisitorModeSegment(appMode);
    } catch (_) { /* sessionStorage unavailable */ }
  }, [appMode]);

  useEffect(() => {
    let start;
    let cancelled = false;
    // Stagger first analytics write — a cold getDoc racing other boot reads
    // can trip Firestore ca9/b815 on firebase@12.9.
    const bootTimer = setTimeout(() => {
      recordVisit().then((t) => {
        if (cancelled) return;
        start = t;
        setSessionStart(t);
      });
    }, 1800);
    const handleUnload = () => {
      if (!start) return;
      const getSnap = visitorEngagementSnapshotRef.current;
      const engagement = typeof getSnap === 'function' ? getSnap() : {};
      try {
        const flushKey = `eng_flush_${engagement.sessionId || userActionSessionRef.current || 'default'}`;
        if (sessionStorage.getItem(flushKey)) return;
        sessionStorage.setItem(flushKey, '1');
      } catch { /* ignore */ }
      recordSessionEnd(start, visitedPagesRef.current, isLoggedRef.current, appModeRef.current, engagement);
    };
    window.addEventListener('beforeunload', handleUnload);

    // Global error capture — log JS errors and unhandled promise rejections
    const isFirestoreNoise = (value) =>
      /FIRESTORE|INTERNAL ASSERTION FAILED|ChunkLoadError|Loading chunk/i.test(String(value || ''));
    const isEventLike = (value) =>
      (typeof Event !== 'undefined' && value instanceof Event)
      || (value && typeof value === 'object' && !(value instanceof Error) && 'isTrusted' in value && !value.message);
    const onError = (event) => {
      if (isFirestoreNoise(event?.message) || isFirestoreNoise(event?.error?.message) || isEventLike(event?.error)) return;
      writeLog({
        type: 'ERROR',
        actor: isLoggedRef.current ? (localStorage.getItem('userName') || 'admin') : 'visitor',
        action: 'Uncaught JS error',
        details: { message: event.message?.slice(0, 200), filename: event.filename, lineno: event.lineno },
        severity: 'error',
      });
    };
    const onRejection = (event) => {
      if (isEventLike(event?.reason)) {
        event.preventDefault?.();
        return;
      }
      if (isFirestoreNoise(event?.reason?.message) || isFirestoreNoise(event?.reason)) return;
      writeLog({
        type: 'ERROR',
        actor: isLoggedRef.current ? (localStorage.getItem('userName') || 'admin') : 'visitor',
        action: 'Unhandled promise rejection',
        details: { reason: String(event.reason)?.slice(0, 200) },
        severity: 'error',
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      cancelled = true;
      clearTimeout(bootTimer);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Initial/Mode Load
  useEffect(() => {
    if (!appMode && (view === 'APP_SELECTION' || view === 'TCS_DIVISION_SELECTION' || view === 'PQA_DIVISION_SELECTION')) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        // Isolate each read — permission on admins must not block the portal.
        let fetchedEngineers = [];
        let fetchedHiddenEngineers = [];
        let fetchedAdmins = [];
        try {
          fetchedEngineers = await getEngineers(colName);
        } catch (e) {
          console.warn('engineers load failed:', e?.message || e);
        }
        try {
          fetchedHiddenEngineers = await getHiddenEngineers(colName);
        } catch (e) {
          console.warn('hidden engineers load failed:', e?.message || e);
        }
        // Admins list requires Auth claims — only attempt when already signed in as admin
        if (isLogged || currentUser?.uid) {
          try {
            fetchedAdmins = await getAdmins();
          } catch (e) {
            console.warn('admins load failed:', e?.message || e);
          }
        }
        let fetchedWinners = [];
        if (appMode?.startsWith('TCS')) {
          try {
            fetchedWinners = await getTcsDashboardWinners();
          } catch (winnersErr) {
            console.warn('TCS dashboard winners load failed:', winnersErr);
          }
        }
        setTcsWinnersConfigs(Array.isArray(fetchedWinners) ? fetchedWinners : []);

        // Data Handling
        if (fetchedEngineers && fetchedEngineers.length > 0) {
          setEngineers(fetchedEngineers);
          setNoEngineers(false);
        } else {
          const fallback = getInitialDataForCollection(colName);
          console.warn(`No records in ${colName}. Using demo fallback (${fallback.length} rows).`);
          setEngineers(fallback);
          setNoEngineers(false);
          // Soft warning only — do not block ADMIN_LOGIN (Firebase Auth does not need admin list)
          if (!isAdminPortal) {
            setFetchError('Database connection issue: Missing or insufficient permissions.. Using offline fallback data.');
          }
        }

        if (fetchedHiddenEngineers && fetchedHiddenEngineers.length > 0) {
          setFetchedHiddenEngineers(fetchedHiddenEngineers);
        } else {
          setFetchedHiddenEngineers([]);
        }

        if (fetchedAdmins && fetchedAdmins.length > 0) {
          setAdmins(fetchedAdmins);
        } else if (currentUser?.uid || currentUser?.id) {
          // Firestore admins list blocked or empty — still show the signed-in operator
          setAdmins([
            {
              id: currentUser.uid || currentUser.id,
              uid: currentUser.uid || currentUser.id,
              firebaseUid: currentUser.firebaseUid || currentUser.uid || currentUser.id,
              username: currentUser.username || 'admin',
              email: currentUser.email || '',
              name: currentUser.name || currentUser.username || 'Admin',
              role: currentUser.role || 'ADMIN',
              access: currentUser.access || 'ALL',
              permissions: currentUser.permissions || null,
            },
          ]);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!isAdminPortal || view !== 'ADMIN_LOGIN') {
          setFetchError(`Database connection issue: ${error.message || 'Unknown error'}. Using offline fallback data.`);
        }
        setEngineers(getInitialDataForCollection(colName));
        setAdmins([]);
        setNoEngineers(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appMode, view, colName, isLogged, currentUser?.uid, isAdminPortal]);

  const sortedEngineers = useMemo(() => {
    return [...engineers].sort((a, b) => {
      const sa = isUnifiedEngineerRecord(a) ? (getUnifiedAverageFinalResult(a) ?? 0) : (parseFloat(a.tcsScore) || 0);
      const sb = isUnifiedEngineerRecord(b) ? (getUnifiedAverageFinalResult(b) ?? 0) : (parseFloat(b.tcsScore) || 0);
      return sb - sa;
    });
  }, [engineers]);

  // Deduplicated: TCS = latest month per code. PQA = merge ALL month rows per center (KPIs often split across months) then sort by resolved PQA score.
  const deduplicatedEngineers = useMemo(() => {
    if (isPqaMode) {
      const byCode = {};
      engineers.forEach((e) => {
        const code = String(e.code ?? '').replace(/[\s,]/g, '').trim().toUpperCase();
        if (!code) return;
        if (appMode && e.pqaBranch && e.pqaBranch !== appMode) return;
        if (!byCode[code]) byCode[code] = [];
        byCode[code].push(e);
      });
      return Object.values(byCode)
        .map((recs) => {
          const sortByRecency = (a, b) => {
            const ya = parseInt(a.year) || 0;
            const yb = parseInt(b.year) || 0;
            if (yb !== ya) return yb - ya;
            return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
          };
          const sorted = [...recs].sort(sortByRecency);
          return mergePqaKpiFromRecordsPure(sorted[0], recs);
        })
        .sort((a, b) => resolvePqaTcsScorePure(b) - resolvePqaTcsScorePure(a));
    }
    const byCode = {};
    engineers.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      const existing = byCode[code];
      if (!existing) { byCode[code] = e; return; }
      const existY = parseInt(existing.year), newY = parseInt(e.year);
      if (newY > existY || (newY === existY && getMonthIndex(e.month) > getMonthIndex(existing.month))) {
        byCode[code] = e;
      }
    });
    return Object.values(byCode).sort((a, b) => {
      const sa = isUnifiedEngineerRecord(a) ? (getUnifiedAverageFinalResult(a) ?? 0) : (parseFloat(a.tcsScore) || 0);
      const sb = isUnifiedEngineerRecord(b) ? (getUnifiedAverageFinalResult(b) ?? 0) : (parseFloat(b.tcsScore) || 0);
      return sb - sa;
    });
  }, [engineers, isPqaMode, appMode]);

  /** Admin registry: receptionists/galaxy show every record (no code collapse). */
  const adminRegistryList = useMemo(() => {
    if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
      return [...engineers].sort(
        (a, b) => resolveMxRoleDashboardScore(b, 'receptionists') - resolveMxRoleDashboardScore(a, 'receptionists'),
      );
    }
    if (appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants') {
      return [...engineers].sort(
        (a, b) => calculateGalaxyConsultantScore(b) - calculateGalaxyConsultantScore(a),
      );
    }
    return deduplicatedEngineers;
  }, [engineers, deduplicatedEngineers, appMode, tcsMxRoleTab]);

  const visibleRegistryIds = useMemo(
    () => adminRegistryList.map((e) => e.id).filter(Boolean),
    [adminRegistryList]
  );

  const allVisibleSelected = visibleRegistryIds.length > 0 && visibleRegistryIds.every((id) => bulkSelectedIds.includes(id));
  const archivedRegistryIds = useMemo(
    () => fetchedHiddenEngineers.map((e) => e.id).filter(Boolean),
    [fetchedHiddenEngineers]
  );
  const allArchivedSelected = archivedRegistryIds.length > 0 && archivedRegistryIds.every((id) => bulkSelectedArchivedIds.includes(id));

  useEffect(() => {
    // Keep selection valid when list/app mode changes.
    setBulkSelectedIds((prev) => prev.filter((id) => visibleRegistryIds.includes(id)));
  }, [visibleRegistryIds]);
  useEffect(() => {
    setBulkSelectedArchivedIds((prev) => prev.filter((id) => archivedRegistryIds.includes(id)));
  }, [archivedRegistryIds]);


  const topThree = useMemo(() => {
    return sortedEngineers.slice(0, 3);
  }, [sortedEngineers]);


  const allMonthPeriods = useMemo(() => {
    const seen = new Set();
    const periods = [];
    engineers.forEach((e) => {
      if (isUnifiedEngineerRecord(e)) {
        listPresentQuarters(e).forEach((q) => {
          const month = QUARTER_END_MONTH[q];
          const year = e.year || String(new Date().getFullYear());
          if (!month || !year) return;
          const key = `${month}-${year}`;
          if (seen.has(key)) return;
          seen.add(key);
          periods.push({ key, month, year, quarter: q });
        });
        return;
      }
      const key = `${e.month}-${e.year}`;
      if (!seen.has(key) && e.month && e.year) {
        seen.add(key);
        periods.push({ key, month: e.month, year: e.year });
      }
    });
    return periods.sort((a, b) => {
      const ya = parseInt(a.year), yb = parseInt(b.year);
      if (ya !== yb) return ya - yb;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    });
  }, [engineers]);

  // ─── Hall of Fame: top N for selected month (deduplicated by code); TCS uses TCS_HOME_LEADERBOARD_LIMIT ─────────
  // Default to the LAST element = latest month (ascending sort → last = newest)
  const effectiveHofMonth = selectedHofMonth || allMonthPeriods[allMonthPeriods.length - 1]?.key || null;
  const resolveTierByMode = React.useCallback((eng) => {
    if (appMode === 'TCS_MX') {
      return getMxEvaluationTier(resolveMxRoleTierScore(eng, tcsMxRoleTab));
    }
    return getTier(parseFloat(eng?.tcsScore) || 0);
  }, [appMode, tcsMxRoleTab]);
  const resolveTcsDashboardScore = React.useCallback((eng) => {
    if (appMode === 'TCS_MX') {
      if (tcsMxRoleTab !== 'engineers') {
        return resolveMxRoleDashboardScore(eng, tcsMxRoleTab);
      }
      if (isUnifiedEngineerRecord(eng)) {
        const avg = getUnifiedAverageFinalResult(eng);
        return avg != null ? Number(avg.toFixed(1)) : 0;
      }
      const evalScore = parseFloat(eng?.engineerEvaluation);
      if (Number.isFinite(evalScore)) return Number(evalScore.toFixed(1));
    }
    const tcs = parseFloat(eng?.tcsScore);
    return Number.isFinite(tcs) ? Number(tcs.toFixed(1)) : 0;
  }, [appMode, tcsMxRoleTab]);
  /** Period score for Hall of Fame: unified docs use that quarter's Final Result when a month maps to Qn. */
  const resolveScoreForPeriod = React.useCallback((eng, monthName, quarterKey) => {
    if (isUnifiedEngineerRecord(eng) && tcsMxRoleTab === 'engineers' && appMode === 'TCS_MX') {
      const q = quarterKey || monthNameToQuarter(monthName);
      const qFinal = getUnifiedQuarterFinalResult(eng, q);
      if (qFinal != null) return Number(qFinal.toFixed(1));
      return getUnifiedAverageFinalResult(eng) ?? 0;
    }
    return resolveTcsDashboardScore(eng);
  }, [appMode, tcsMxRoleTab, resolveTcsDashboardScore]);
  const hofTop10 = useMemo(() => {
    if (!effectiveHofMonth) return [];
    const [m, y] = effectiveHofMonth.split('-');
    const targetMonthIdx = getMonthIndex(m);
    const targetQuarter = monthNameToQuarter(m);
    const filtered = engineers.filter((e) => {
      if (!sameCalendarYear(e.year, y)) return false;
      if (isUnifiedEngineerRecord(e) && appMode === 'TCS_MX' && tcsMxRoleTab === 'engineers') {
        return targetQuarter ? engineerHasQuarter(e, targetQuarter) : false;
      }
      const eMonthIdx = getMonthIndex(e.month);
      if (targetMonthIdx >= 0 && eMonthIdx >= 0) return eMonthIdx === targetMonthIdx;
      return e.month?.toLowerCase() === m?.toLowerCase();
    });
    const asNum = (v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
      if (!s) return 0;
      const hasComma = s.includes(',');
      const hasDot = s.includes('.');
      let norm = s;
      if (hasComma && !hasDot) norm = (/^-?\d+,\d+$/.test(s)) ? s.replace(',', '.') : s.replace(/,/g, '');
      else if (hasComma && hasDot) norm = s.replace(/,/g, '');
      const n = parseFloat(norm);
      return Number.isFinite(n) ? n : 0;
    };

    if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
      // ── By Partner: aggregate partnerScore per official partner ──────────────
      const partners = {};

      // Seed ALL 7 partners so they always appear even if score is 0
      PQA_OFFICIAL_MX_PARTNERS.forEach((op) => {
        partners[op] = {
          id: `partner-${op}`,
          name: op,
          code: op,
          tcsScore: 0,
          bestPartnerScore: 0,
          bestPartnerRank: 0,
          totalCenterScore: 0,
          count: 0,
          photoUrl: `/logos/${op.toLowerCase()}.png`
        };
      });

      filtered.forEach(e => {
        const candidates = [
          String(e.partnerName || '').trim(),
          String(e.asc || '').trim(),
          String(e.name || '').trim(),
        ].filter(Boolean);
        let matched = null;
        for (const c of candidates) {
          matched = mapPqaSheetPartnerKeyToOfficial(c);
          if (matched) break;
        }
        if (matched) {
          const ps = asNum(e.partnerScore || 0);
          const pr = parseInt(String(e.monthlyRank ?? e.monthlyEvalRank ?? 0).replace(/[^0-9-]/g, ''), 10) || 0;
          // For MX monthly by-partner fallback, prefer month sheet scores (★Partner Ranking / ★Monthly Average),
          // then Evaluation-point total, then generic tcsScore.
          const cs = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
          // Track best partnerScore (Excel pre-computed) and also accumulate center scores as fallback
          if (ps > partners[matched].bestPartnerScore) partners[matched].bestPartnerScore = ps;
          if (pr > 0 && (!partners[matched].bestPartnerRank || pr < partners[matched].bestPartnerRank)) {
            partners[matched].bestPartnerRank = pr;
          }
          partners[matched].totalCenterScore += cs;
          partners[matched].count += 1;
        }
      });

      const monthlyPartners = Object.values(partners)
        .map(p => ({
          ...p,
          // Prefer Excel partnerScore; fall back to average of center scores
          tcsScore: p.bestPartnerScore > 0 ? p.bestPartnerScore : (p.count > 0 ? parseFloat((p.totalCenterScore / p.count).toFixed(1)) : 0)
        }))
        .sort((a, b) => {
          const ra = a.bestPartnerRank > 0 ? a.bestPartnerRank : 999;
          const rb = b.bestPartnerRank > 0 ? b.bestPartnerRank : 999;
          if (ra !== rb) return ra - rb;
          return b.tcsScore - a.tcsScore;
        })
        .slice(0, 7);
      let currentRank = 1;
      return monthlyPartners.map((p, i) => {
        if (i > 0 && p.tcsScore < monthlyPartners[i - 1].tcsScore) currentRank = i + 1;
        return { ...p, displayRank: p.bestPartnerRank || currentRank };
      });
    }

    // ── By Center: deduplicate + dense/excel ranking ─────────────────────────
    const byCode = {};
    filtered.forEach(e => {
      const code = e.code?.toUpperCase();
      if (!code) return;
      if (appMode === 'PQA_MX') {
        // Monthly service-center ranking must use month-level sheet values first.
        const score = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
        const prevScore = byCode[code] ? asNum(byCode[code].monthlyScore ?? byCode[code].centerMonthlyScore ?? byCode[code].evalMonthlyScore ?? byCode[code].tcsScore ?? 0) : -1;
        if (!byCode[code] || score > prevScore) byCode[code] = e;
      } else if (appMode === 'PQA_CE') {
        const score = asNum((asNum(e.tcsScore) > 0 ? e.tcsScore : (e.centerMonthlyScore ?? e.monthlyScore ?? e.evalMonthlyScore ?? 0)));
        const prevScore = byCode[code]
          ? asNum((asNum(byCode[code].tcsScore) > 0 ? byCode[code].tcsScore : (byCode[code].centerMonthlyScore ?? byCode[code].monthlyScore ?? byCode[code].evalMonthlyScore ?? 0)))
          : -1;
        if (!byCode[code] || score > prevScore) byCode[code] = e;
      } else if (!byCode[code] || resolveScoreForPeriod(e, m) > resolveScoreForPeriod(byCode[code], m)) {
        byCode[code] = e;
      }
    });
    const limit =
      appMode === 'PQA_MX' || appMode === 'PQA_CE'
        ? 999
        : appMode?.startsWith('PQA')
          ? 10
          : TCS_HOME_LEADERBOARD_LIMIT;
    const sorted = Object.values(byCode)
      .map((e) => {
        if (appMode === 'PQA_MX') {
          const mxScore = asNum(e.monthlyScore ?? e.centerMonthlyScore ?? e.evalMonthlyScore ?? e.tcsScore ?? 0);
          return { ...e, tcsScore: mxScore };
        }
        if (appMode === 'PQA_CE') {
          const ceScore = asNum((asNum(e.tcsScore) > 0 ? e.tcsScore : (e.centerMonthlyScore ?? e.monthlyScore ?? e.evalMonthlyScore ?? 0)));
          return { ...e, tcsScore: ceScore };
        }
        if (appMode === 'TCS_MX') {
          return { ...e, tcsScore: resolveScoreForPeriod(e, m) };
        }
        return e;
      })
      .sort((a, b) => {
        if (appMode?.startsWith('PQA')) {
           const rankA = a.centerMonthlyRank > 0 ? a.centerMonthlyRank : 999;
           const rankB = b.centerMonthlyRank > 0 ? b.centerMonthlyRank : 999;
           if (rankA !== rankB) return rankA - rankB;
        }
        return b.tcsScore - a.tcsScore;
      })
      .slice(0, limit);

    // Assign display ranks: CE monthly ladder shows 1…N in list order (Excel rank columns can be wrong scale).
    let currentRank = 1;
    return sorted.map((e, i) => {
      if (i > 0 && e.tcsScore < sorted[i - 1].tcsScore) currentRank++;
      if (appMode === 'PQA_CE') {
        return { ...e, displayRank: i + 1 };
      }
      if (appMode?.startsWith('PQA')) {
        return { ...e, displayRank: e.centerMonthlyRank || currentRank };
      }
      return { ...e, displayRank: currentRank };
    });
  }, [engineers, effectiveHofMonth, appMode, pqaMxGroupBy, tcsMxRoleTab, resolveTcsDashboardScore, resolveScoreForPeriod]);
  const tcsMonthlyWinnersSource = useMemo(() => {
    if (!isTcsMode || !effectiveHofMonth) return [];
    const [month, year] = String(effectiveHofMonth || '').split('-');
    const targetQuarter = monthNameToQuarter(month);
    const byEngineer = {};
    engineers
      .filter((e) => {
        if (!sameCalendarYear(e.year, year)) return false;
        if (isUnifiedEngineerRecord(e) && appMode === 'TCS_MX' && tcsMxRoleTab === 'engineers') {
          return targetQuarter ? engineerHasQuarter(e, targetQuarter) : false;
        }
        return e.month?.toLowerCase() === String(month || '').toLowerCase();
      })
      .forEach((e) => {
        const engineerKey = getTcsEngineerIdentityKey(e);
        if (!engineerKey) return;
        const score = resolveScoreForPeriod(e, month);
        if (!byEngineer[engineerKey] || score > resolveScoreForPeriod(byEngineer[engineerKey], month)) byEngineer[engineerKey] = e;
      });
    const sorted = Object.values(byEngineer).sort((a, b) => resolveScoreForPeriod(b, month) - resolveScoreForPeriod(a, month));
    let denseRank = 1;
    return sorted.map((e, i) => {
      const cur = resolveScoreForPeriod(e, month);
      const prev = i > 0 ? resolveScoreForPeriod(sorted[i - 1], month) : null;
      if (i > 0 && cur < prev) denseRank = i + 1;
      return { ...e, displayRank: denseRank, tcsScore: cur };
    });
  }, [isTcsMode, effectiveHofMonth, engineers, appMode, tcsMxRoleTab, resolveScoreForPeriod]);

  // ─── Quarterly: all unique quarter keys, sorted latest-first ─────────────────
  const allQuarterKeys = useMemo(() => {
    const seen = new Set();
    engineers.forEach(e => {
      const yk = normalizeYearKey(e.year);
      if (!yk) return;
      if (e.month) {
        const q = getQuarter(e.month);
        if (q && /^Q[1-4]$/.test(q)) seen.add(`${q}-${yk}`);
      }
      let qf = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
      if (/^[1-4]$/.test(qf)) qf = `Q${qf}`;
      if (/^Q[1-4]$/.test(qf)) seen.add(`${qf}-${yk}`);
      // Unified engineer docs (and any role row with quarters{})
      Object.keys(e.quarters || {}).forEach((qk) => {
        const q = String(qk || '').toUpperCase();
        if (/^Q[1-4]$/.test(q) && e.quarters?.[qk]?.present !== false) {
          seen.add(`${q}-${yk}`);
        }
      });
    });
    // Manual dashboard winners often exist for a quarter before roster rows are uploaded.
    // Include those quarters so Receptionists / Galaxy Consultants can navigate to the saved period.
    if (isTcsMode) {
      const product = resolveTcsDashboardProduct(appMode) || '';
      const mxRole = appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers';
      tcsWinnersConfigs.forEach((cfg) => {
        if (!product || String(cfg?.product || '').toUpperCase() !== product) return;
        if (appMode === 'TCS_MX') {
          const cfgRole = String(cfg?.mxRole || 'engineers');
          if (cfgRole !== mxRole) return;
        }
        const qk = String(cfg?.quarterKey || '').toUpperCase();
        if (/^Q[1-4]-\d{4}$/.test(qk) && Array.isArray(cfg?.winners) && cfg.winners.length > 0) {
          seen.add(qk);
        }
      });
    }
    return [...seen]
      .filter((k) => /^Q[1-4]-\d{4}$/.test(k))
      .sort((a, b) => {
        const [qa, ya] = a.split('-');
        const [qb, yb] = b.split('-');
        if (parseInt(yb, 10) !== parseInt(ya, 10)) return parseInt(yb, 10) - parseInt(ya, 10);
        return parseInt(qb.replace('Q', ''), 10) - parseInt(qa.replace('Q', ''), 10);
      });
  }, [engineers, isTcsMode, appMode, tcsMxRoleTab, tcsWinnersConfigs]);

  const effectiveQuarterKey = selectedQuarterKey || allQuarterKeys[0] || null;
  const effectiveHomeQuarterKey = useMemo(() => {
    if (homeViewMode === 'QUARTERLY') return effectiveQuarterKey;
    const parsed = parseMonthYearKey(effectiveHofMonth);
    const monthQuarter = getQuarter(parsed.month);
    const yearKey = normalizeYearKey(parsed.year);
    if (monthQuarter && yearKey) return `${monthQuarter}-${yearKey}`;
    return effectiveQuarterKey;
  }, [homeViewMode, effectiveQuarterKey, effectiveHofMonth]);
  const winnersScopeQuarterKey = useMemo(() => {
    if (effectiveHomeQuarterKey) return effectiveHomeQuarterKey;
    if (effectiveQuarterKey) return effectiveQuarterKey;
    if (!isTcsMode) return null;
    const product = resolveTcsDashboardProduct(appMode) || '';
    const mxRole = appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers';
    const keys = Array.from(winnersConfigMap.keys())
      .filter((k) => isWinnersMapKeyForRole(k, product, mxRole))
      .map((k) => k.split('-').slice(0, 2).join('-'))
      .filter((k) => /^Q[1-4]-\d{4}$/.test(k))
      .sort((a, b) => quarterKeyToIndex(b) - quarterKeyToIndex(a));
    return keys[0] || null;
  }, [effectiveHomeQuarterKey, effectiveQuarterKey, isTcsMode, winnersConfigMap, appMode, tcsMxRoleTab]);
  const tcsDashboardProduct = resolveTcsDashboardProduct(appMode);
  const resolvedTcsWinnersConfig = useMemo(() => {
    if (!isTcsMode || !tcsDashboardProduct || !winnersScopeQuarterKey) return null;
    const activeMxRole = appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers';
    let cfg = resolveTcsWinnersConfig(
      tcsWinnersConfigs,
      winnersConfigMap,
      winnersScopeQuarterKey,
      tcsDashboardProduct,
      activeMxRole,
    );
    let resolvedQuarter = winnersScopeQuarterKey;
    if (!cfg || !Array.isArray(cfg.winners) || cfg.winners.length === 0) {
      const productConfigs = tcsWinnersConfigs
        .filter((item) => {
          if (String(item?.product || '').toUpperCase() !== tcsDashboardProduct) return false;
          if (appMode === 'TCS_MX') {
            const itemRole = String(item?.mxRole || 'engineers');
            if (itemRole !== activeMxRole) return false;
          }
          return Array.isArray(item?.winners) &&
            item.winners.length > 0 &&
            /^Q[1-4]-\d{4}$/.test(String(item?.quarterKey || '').toUpperCase());
        })
        .sort((a, b) => (quarterKeyToIndex(String(b.quarterKey).toUpperCase()) || -1) - (quarterKeyToIndex(String(a.quarterKey).toUpperCase()) || -1));
      if (productConfigs.length > 0) {
        cfg = productConfigs[0];
        resolvedQuarter = String(cfg.quarterKey || winnersScopeQuarterKey).toUpperCase();
      }
    }
    if (!cfg || !Array.isArray(cfg.winners) || cfg.winners.length === 0) return null;
    return {
      ...cfg,
      resolvedQuarterKey: resolvedQuarter,
      fallbackUsed: resolvedQuarter !== winnersScopeQuarterKey,
    };
  }, [isTcsMode, tcsDashboardProduct, winnersScopeQuarterKey, winnersConfigMap, tcsWinnersConfigs, appMode, tcsMxRoleTab]);
  const applyConfiguredTcsWinners = React.useCallback((entries) => {
    if (!isTcsMode) return entries;
    if (!resolvedTcsWinnersConfig || !Array.isArray(resolvedTcsWinnersConfig.winners)) return [];
    const configuredWinners = resolvedTcsWinnersConfig.winners.map((w) => normalizeEngineerCodeKey(w)).filter(Boolean);
    const rowMatchesWinner = (row, winnerCode) => {
      if (recordMatchesWinnerCode(row, winnerCode)) return true;
      if (engineerCodeEquals(getTcsEngineerIdentityKey(row), winnerCode)) return true;
      return [row?.engineerCode, row?.code, row?.sbaId, row?.gspnId].some((field) =>
        engineerCodeEquals(field, winnerCode),
      );
    };
    const recencyKey = (row) => {
      const y = parseInt(String(row?.year || '0'), 10) || 0;
      const m = getMonthIndex(row?.month);
      return (y * 100) + (Number.isFinite(m) ? m : 0);
    };
    const pickBest = (rows) =>
      [...rows].sort((a, b) => {
        const ra = recencyKey(a);
        const rb = recencyKey(b);
        if (rb !== ra) return rb - ra;
        return resolveTcsDashboardScore(b) - resolveTcsDashboardScore(a);
      })[0];

    const ranked = [];
    const usedIds = new Set();
    configuredWinners.forEach((winnerCode, idx) => {
      const fromEntries = entries.filter((row) => {
        const key = row?.id || `${row?.code}-${row?.month}-${row?.year}`;
        return !usedIds.has(key) && rowMatchesWinner(row, winnerCode);
      });
      const fromAllRows = engineers.filter((row) => {
        const key = row?.id || `${row?.code}-${row?.month}-${row?.year}`;
        return !usedIds.has(key) && rowMatchesWinner(row, winnerCode);
      });
      const pick = pickBest(fromEntries.length > 0 ? fromEntries : fromAllRows);
      if (pick) {
        const key = pick?.id || `${pick?.code}-${pick?.month}-${pick?.year}`;
        usedIds.add(key);
        ranked.push({ ...pick, displayRank: idx + 1 });
      } else {
        // Still show configured winners even when no roster row matches (common for
        // receptionists / galaxy consultants when only codes/names were set in Admin).
        ranked.push({
          id: `configured-winner-${winnerCode}-${idx + 1}`,
          code: winnerCode,
          engineerCode: winnerCode,
          gspnId: winnerCode,
          name: winnerCode,
          tcsScore: 0,
          avgScore: 0,
          displayRank: idx + 1,
          photoUrl: DEFAULT_ENGINEER_PHOTO_URL,
          isConfiguredWinnerPlaceholder: true,
        });
      }
    });
    ranked.sort((a, b) => (a.displayRank || 999) - (b.displayRank || 999));
    // Strict behavior: when config exists, only configured winners should appear.
    return ranked;
  }, [isTcsMode, resolvedTcsWinnersConfig, engineers, resolveTcsDashboardScore, appMode, tcsMxRoleTab]);

  /** TCS quarterly pill: Q1 · MX when product is uniform; otherwise Q1 · 2025 */
  const tcsQuarterPeriodLabel = useMemo(() => {
    if (!effectiveQuarterKey || !/^Q[1-4]-\d{4}$/.test(effectiveQuarterKey)) return 'No Data';
    const [q, y] = effectiveQuarterKey.split('-');
    const prods = new Set();
    engineers.forEach((e) => {
      const yNorm = normalizeYearKey(e.year);
      if (!yNorm || yNorm !== y) return;
      const monthQ = e.month ? getQuarter(e.month) : '';
      let qField = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
      if (/^[1-4]$/.test(qField)) qField = `Q${qField}`;
      const hasUnifiedQ = Boolean(e.quarters?.[q]?.present);
      if (monthQ !== q && qField !== q && !hasUnifiedQ) return;
      const p = String(e.product || '').trim().toUpperCase();
      if (p) prods.add(p);
    });
    if (prods.size === 1) return `${q} · ${[...prods][0]}`;
    const dashProduct = resolveTcsDashboardProduct(appMode);
    if (dashProduct) return `${q} · ${dashProduct}`;
    return `${q} · ${y}`;
  }, [effectiveQuarterKey, engineers, appMode]);

  useEffect(() => {
    if (!allQuarterKeys.length) return;
    if (selectedQuarterKey && !allQuarterKeys.includes(selectedQuarterKey)) {
      setSelectedQuarterKey(null);
    }
  }, [allQuarterKeys, selectedQuarterKey]);

  useEffect(() => {
    if (appMode && !appMode.startsWith('PQA') && allMonthPeriods.length === 0 && homeViewMode === 'MONTHLY') {
      setHomeViewMode('QUARTERLY');
    }
  }, [appMode, allMonthPeriods.length, homeViewMode]);

  const quarterlyRanking = useMemo(() => {

    // ── PQA ACCUMULATED mode ─────────────────────────────────────────────────
    if (appMode?.startsWith('PQA')) {
      if (appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER') {
        // Collect best accumulatedScore & accumulatedRank per partner across all records
        const pGroup = {};
        const asNum = (v) => {
          if (typeof v === 'number' && Number.isFinite(v)) return v;
          const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
          if (!s) return 0;
          const hasComma = s.includes(',');
          const hasDot = s.includes('.');
          let norm = s;
          if (hasComma && !hasDot) {
            norm = (/^-?\d+,\d+$/.test(s)) ? s.replace(',', '.') : s.replace(/,/g, '');
          } else if (hasComma && hasDot) {
            norm = s.replace(/,/g, '');
          }
          const n = parseFloat(norm);
          return Number.isFinite(n) ? n : 0;
        };
        PQA_OFFICIAL_MX_PARTNERS.forEach((op) => {
          pGroup[op] = { id: `acc-${op}`, name: op, code: op, avgScore: 0, ytdRank: 0, monthCount: 0 };
        });

        // One merged row per center (YTD/accumulated propagated in mergePqaKpiFromRecordsPure)
        deduplicatedEngineers.forEach((e) => {
          const cands = [
            String(e.partnerName || '').trim(),
            String(e.asc || '').trim(),
            String(e.name || '').trim(),
          ].filter(Boolean);
          let matched = null;
          for (const c of cands) {
            matched = mapPqaSheetPartnerKeyToOfficial(c);
            if (matched) break;
          }
          if (matched) {
            // Strict source for MX partner accumulated dashboard: ★Partner Ranking D/E only.
            const accScore = asNum((Number(e.accumulatedScore) > 0 ? e.accumulatedScore : e.ytdScore) ?? 0);
            const accRank = parseInt(String((parseInt(String(e.accumulatedRank || 0), 10) > 0 ? e.accumulatedRank : e.ytdRank) ?? 0).replace(/[^0-9-]/g, ''), 10) || 0;
            if (accScore > pGroup[matched].avgScore) {
              pGroup[matched].avgScore = accScore;
              pGroup[matched].ytdRank = accRank;
            } else if (accScore === pGroup[matched].avgScore && accRank > 0) {
              if (!pGroup[matched].ytdRank || accRank < pGroup[matched].ytdRank) {
                pGroup[matched].ytdRank = accRank;
              }
            }
          }
        });

        const sorted = Object.values(pGroup).sort((a, b) => b.avgScore - a.avgScore);
        let currentRank = 1;
        return sorted.map((p, i) => {
          if (i > 0 && p.avgScore < sorted[i - 1].avgScore) currentRank = i + 1;
          const excelRank = p.ytdRank > 0 ? p.ytdRank : currentRank;
          return { ...p, displayRank: excelRank };
        });

      } else {
        // By Center – accumulated: use ytdScore (Excel avg score column) per center
        const byCode = {};
        engineers.forEach(e => {
          const code = e.code?.toUpperCase();
          if (!code) return;
          // Keep record with the highest ytdScore (it's the same per center per year, just take it)
          const existing = byCode[code];
          if (!existing || (e.ytdScore || 0) > (existing.ytdScore || 0) || (e.ytdScore === existing.ytdScore && (e.tcsScore || 0) > (existing.tcsScore || 0))) {
            byCode[code] = e;
          }
        });
        const sorted = Object.values(byCode)
          .map(e => {
            // Priority: Excel Monthly Average > single month score
            const score = (e.centerYtdScore || 0) > 0 ? e.centerYtdScore : (e.tcsScore || 0);
            return { ...e, _accScore: score };
          })
          .filter(e => e._accScore > 0)
          .sort((a, b) => {
              if (appMode?.startsWith('PQA')) {
                 const rankA = a.centerYtdRank > 0 ? a.centerYtdRank : 999;
                 const rankB = b.centerYtdRank > 0 ? b.centerYtdRank : 999;
                 if (rankA !== rankB) return rankA - rankB;
              }
              return b._accScore - a._accScore;
          });

        let currentRank = 1;
        return sorted.map((e, i) => {
          if (i > 0 && e._accScore < sorted[i - 1]._accScore) currentRank++;
          if (appMode?.startsWith('PQA')) {
              return { ...e, avgScore: e._accScore, displayRank: e.centerYtdRank || currentRank, monthCount: 1 };
          }
          return { ...e, avgScore: e._accScore, displayRank: currentRank, monthCount: 1 };
        });
      }
    }

    // ── TCS / non-PQA quarterly mode ─────────────────────────────────────────
    if (!effectiveQuarterKey) return [];
    const [q, y] = effectiveQuarterKey.split('-');
    const bucket = {};
    engineers.forEach(e => {
      const yNorm = normalizeYearKey(e.year);
      if (!yNorm || yNorm !== y) return;
      if (isUnifiedEngineerRecord(e) && appMode === 'TCS_MX') {
        if (!engineerHasQuarter(e, q)) return;
      } else {
        const monthQ = e.month ? getQuarter(e.month) : '';
        let qField = String(e.quarter || '').toUpperCase().replace(/\s/g, '');
        if (/^[1-4]$/.test(qField)) qField = `Q${qField}`;
        const inQuarter = monthQ === q || qField === q;
        if (!inQuarter) return;
      }
      const engineerKey = getTcsEngineerIdentityKey(e);
      if (!engineerKey) return;
      if (!bucket[engineerKey]) bucket[engineerKey] = [];
      bucket[engineerKey].push(e);
    });
    return Object.values(bucket)
      .map((rows) => {
        const sorted = [...rows].sort((a, b) => {
          const ya = parseInt(String(a.year), 10);
          const yb = parseInt(String(b.year), 10);
          if (yb !== ya) return yb - ya;
          return getMonthIndex(b.month) - getMonthIndex(a.month);
        });
        const pick = sorted[0];
        const periodScore = isUnifiedEngineerRecord(pick)
          ? (getUnifiedQuarterFinalResult(pick, q) ?? resolveTcsDashboardScore(pick))
          : resolveTcsDashboardScore(pick);
        return {
          ...pick,
          tcsScore: periodScore,
          avgScore: Number.isFinite(periodScore) ? Number(periodScore.toFixed(1)) : 0,
          monthCount: rows.length,
          displayRank: 0,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((e, i, arr) => {
        if (i === 0 || e.avgScore < arr[i - 1].avgScore) e.displayRank = i + 1;
        else e.displayRank = arr[i - 1].displayRank;
        return e;
      });
  }, [engineers, deduplicatedEngineers, effectiveQuarterKey, appMode, pqaMxGroupBy, resolveTcsDashboardScore]);
  const hasTcsWinnersConfig = Boolean(resolvedTcsWinnersConfig?.winners?.length);
  const monthlyDashboardList = useMemo(() => {
    if (isTcsMode && isTcsMxAlternateRole) {
      if (resolvedTcsWinnersConfig?.winners?.length) {
        return applyConfiguredTcsWinners(hofTop10);
      }
      return hofTop10.slice(0, dashboardWinnersSlotCount);
    }
    if (isTcsMode) return applyConfiguredTcsWinners(quarterlyRanking);
    return hofTop10;
  }, [
    isTcsMode,
    isTcsMxAlternateRole,
    resolvedTcsWinnersConfig,
    applyConfiguredTcsWinners,
    quarterlyRanking,
    hofTop10,
    dashboardWinnersSlotCount,
  ]);
  const quarterlyDashboardList = useMemo(() => {
    if (!isTcsMode) return quarterlyRanking;
    if (isTcsMxAlternateRole) {
      if (resolvedTcsWinnersConfig?.winners?.length) {
        return applyConfiguredTcsWinners(quarterlyRanking);
      }
      return quarterlyRanking.slice(0, dashboardWinnersSlotCount);
    }
    return applyConfiguredTcsWinners(quarterlyRanking);
  }, [
    isTcsMode,
    isTcsMxAlternateRole,
    resolvedTcsWinnersConfig,
    applyConfiguredTcsWinners,
    quarterlyRanking,
    dashboardWinnersSlotCount,
  ]);

  // ─── Engineer history: all records for the selected engineer's code, latest 3 months ───
  const engineerHistory = useMemo(() => {
    if (!selectedEngineer) return [];
    const profileRankScore = (row) => {
      if (appMode === 'TCS_MX') return resolveMxRoleDashboardScore(row, tcsMxRoleTab);
      return parseFloat(row?.tcsScore || 0);
    };
    return engineers
      .filter(e => e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase())
      .sort((a, b) => {
        const ya = parseInt(a.year), yb = parseInt(b.year);
        if (yb !== ya) return yb - ya;
        return getMonthIndex(b.month) - getMonthIndex(a.month);
      })
      .slice(0, 3)
      .map(record => {
        // compute rank within that month
        const cohort = engineers
          .filter(e => e.month?.toLowerCase() === record.month?.toLowerCase() && sameCalendarYear(e.year, record.year))
          .sort((a, b) => profileRankScore(b) - profileRankScore(a));
        const rank = cohort.findIndex(e => e.id === record.id) + 1;
        const qKey = `${getQuarter(record.month)}-${record.year}`;
        const qCohort = (() => {
          const [q, yr] = qKey.split('-');
          const bucket = {};
          engineers.forEach(e => {
            if (!e.month || !e.year) return;
            if (getQuarter(e.month) === q && sameCalendarYear(e.year, yr)) {
              if (!bucket[e.code]) bucket[e.code] = { code: e.code, scores: [] };
              bucket[e.code].scores.push(profileRankScore(e));
            }
          });
          return Object.values(bucket)
            .map(({ code, scores }) => ({ code, avg: scores.reduce((s, v) => s + v, 0) / scores.length }))
            .sort((a, b) => b.avg - a.avg);
        })();
        const qRank = qCohort.findIndex(e => e.code === record.code) + 1;
        return { ...record, monthRank: rank, monthTotal: cohort.length, qRank, qTotal: qCohort.length, qKey };
      });
  }, [engineers, selectedEngineer, appMode, tcsMxRoleTab]);

  // ─── Summary ranks for the currently selected engineer ──────────────────────────
  const engineerSummaryRanks = useMemo(() => {
    if (!selectedEngineer) return null;
    const profileRankScore = (row) => {
      if (appMode === 'TCS_MX') return resolveMxRoleDashboardScore(row, tcsMxRoleTab);
      return parseFloat(row?.tcsScore || 0);
    };
    const monthCohort = engineers
      .filter(e => e.month?.toLowerCase() === selectedEngineer.month?.toLowerCase() && sameCalendarYear(e.year, selectedEngineer.year))
      .sort((a, b) => profileRankScore(b) - profileRankScore(a));
    const monthRank = monthCohort.findIndex(e => e.id === selectedEngineer.id) + 1;
    const q = getQuarter(selectedEngineer.month);
    const y = selectedEngineer.year;
    const qBucket = {};
    engineers.forEach(e => {
      if (!e.month || !e.year) return;
      if (getQuarter(e.month) === q && sameCalendarYear(e.year, y)) {
        if (!qBucket[e.code]) qBucket[e.code] = { code: e.code, scores: [] };
        qBucket[e.code].scores.push(profileRankScore(e));
      }
    });
    const qList = Object.values(qBucket)
      .map(({ code, scores }) => ({ code, avg: scores.reduce((s, v) => s + v, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg);
    const qRank = qList.findIndex(e => e.code === selectedEngineer.code) + 1;
    return {
      monthRank, monthTotal: monthCohort.length,
      qRank, qTotal: qList.length,
      quarter: q, year: y,
      month: selectedEngineer.month,
    };
  }, [engineers, selectedEngineer, appMode, tcsMxRoleTab]);


  /** Digits-only comparison for long numeric service center / engineer IDs (handles spaced display). */
  const serviceCenterDigitsMatch = (storedCode, queryRaw) => {
    const qd = String(queryRaw ?? '').replace(/\D/g, '');
    const sd = String(storedCode ?? '').replace(/\D/g, '');
    if (qd.length < 4 || sd.length < 4) return false;
    return qd === sd;
  };

  /** Match Excel/Firestore engineer codes: ignore spaces/commas; case-insensitive text; numeric equality (Excel number cells). */
  const engineerCodeMatchesQuery = (storedCode, queryRaw) => {
    const q = String(queryRaw ?? '').replace(/[\s\u00a0\u2000-\u200b\u202f\u2060]/g, '').replace(/,/g, '').trim();
    const s = String(storedCode ?? '').replace(/[\s\u00a0\u2000-\u200b\u202f\u2060]/g, '').replace(/,/g, '').trim();
    if (!q || !s) return false;
    if (s.toUpperCase() === q.toUpperCase()) return true;
    if (serviceCenterDigitsMatch(storedCode, queryRaw)) return true;
    const qf = parseFloat(q);
    const sf = parseFloat(s);
    if (Number.isFinite(qf) && Number.isFinite(sf) && qf === sf) return true;
    if (/^\d+$/.test(q) && /^\d+$/.test(s)) {
      try {
        return BigInt(q) === BigInt(s);
      } catch { /* ignore */ }
    }
    return false;
  };

  const resolvePqaTcsScore = resolvePqaTcsScorePure;
  const mergePqaKpiFromRecords = mergePqaKpiFromRecordsPure;

  /** PQA dossier: merge all Firestore rows for this service center + division so KPI snapshot is never sparse. */
  const pqaDossierEngineer = useMemo(() => {
    if (!selectedEngineer || !isPqaMode) return null;
    const selBranch = selectedEngineer.pqaBranch || appMode;
    const sameCode = engineers.filter((e) => {
      if (selBranch && e.pqaBranch && e.pqaBranch !== selBranch) return false;
      return engineerCodeMatchesQuery(e.code, selectedEngineer.code);
    });
    return mergePqaKpiFromRecords(selectedEngineer, sameCode);
  }, [selectedEngineer, engineers, appMode, isPqaMode]);

  const pqaProfileSubject =
    !selectedEngineer ? null : isPqaMode ? (pqaDossierEngineer || selectedEngineer) : selectedEngineer;
  const pqaAccumulatedScore = !pqaProfileSubject
    ? 0
    : parseFloat(pqaProfileSubject.centerYtdScore || pqaProfileSubject.ytdScore || 0);

  const handleSearch = () => {
    const trimmed = searchCode.trim();
    if (!trimmed) {
      message.warning("Please enter a code or name to verify.");
      logUserAction({ action: 'Rejected empty search', category: 'SEARCH', severity: 'warning' });
      return;
    }

    if (portalRealm === 'TCS' && !appMode?.startsWith('TCS')) {
      message.error('You are in the TCS portal — open the Dashboard and select TCS MX, DA, or AV (top strip), then search by engineer code.');
      logUserAction({
        action: 'Portal/app mismatch on search',
        category: 'SECURITY',
        severity: 'warning',
        details: { query: trimmed, portalRealm, appMode },
      });
      return;
    }
    if (portalRealm === 'PQA' && !appMode?.startsWith('PQA')) {
      message.error('You are in the PQA portal — open the Dashboard and select PQA MX or CE, then search by service center code.');
      logUserAction({
        action: 'Portal/app mismatch on search',
        category: 'SECURITY',
        severity: 'warning',
        details: { query: trimmed, portalRealm, appMode },
      });
      return;
    }

    if (engineers.length === 0) {
      message.error(`No data loaded for ${appMode}. Please check admin portal.`);
      logUserAction({
        action: 'Search attempted without loaded data',
        category: 'SEARCH',
        severity: 'warning',
        details: { query: trimmed, appMode: appMode || null },
      });
      return;
    }

    const cleanSearch = trimmed.replace(/\s+/g, '').toUpperCase();

    const pqaBranchMatches = (e) => !e.pqaBranch || e.pqaBranch === appMode;

    // 1. Try code match (engineer code for TCS; service center code for PQA — same `code` field)
    let matchingRecords = engineers.filter((e) => engineerCodeMatchesQuery(e.code, trimmed));
    let openedByExactCode = matchingRecords.length > 0;

    if (appMode?.startsWith('PQA')) {
      const before = matchingRecords.length;
      matchingRecords = matchingRecords.filter(pqaBranchMatches);
      if (before > 0 && matchingRecords.length === 0) {
        message.error(
          `Service center "${trimmed}" may exist in the other PQA division (MX vs CE). Use the top strip to select ${appMode === 'PQA_CE' ? 'PQA MX' : 'PQA CE'} if the data was uploaded there, or re-import the correct workbook.`
        );
        logUserAction({
          action: 'PQA division mismatch search',
          category: 'SEARCH',
          severity: 'warning',
          details: { query: trimmed, appMode },
        });
        return;
      }
    }

    // 2. If no code match, try name match
    if (matchingRecords.length === 0) {
      matchingRecords = engineers.filter(
        e => String(e.name || '').replace(/\s+/g, '').toUpperCase().includes(cleanSearch)
      );
      openedByExactCode = false;
      if (appMode?.startsWith('PQA')) {
        matchingRecords = matchingRecords.filter(pqaBranchMatches);
      }
    }

    if (matchingRecords.length === 0) {
      message.error(`${searchIsPqaContext ? 'Service center' : tcsMxPersonLabel} "${trimmed}" not found in current records for ${appMode || 'this division'}.`);
      logUserAction({
        action: 'Search not found',
        category: 'SEARCH',
        severity: 'warning',
        details: { query: trimmed, appMode: appMode || null, context: searchIsPqaContext ? 'PQA' : 'TCS' },
      });
      return;
    }

    const sortByRecency = (a, b) => {
      const ya = parseInt(a.year) || 0, yb = parseInt(b.year) || 0;
      if (yb !== ya) return yb - ya;
      return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
    };

    const pqaHasEvalKpi = (e) =>
      ['ltp', 'exLtp', 'redo', 'ssr', 'dRnps', 'ofs', 'rCxe', 'sdr'].some((k) => parseFloat(e[k] || 0) !== 0) ||
      parseFloat(e.audit || 0) !== 0 ||
      parseFloat(e.pr || 0) !== 0;

    let newestRecord;
    if (searchIsPqaContext) {
      const withKpi = matchingRecords.filter(pqaHasEvalKpi);
      const pool = withKpi.length ? withKpi : matchingRecords;
      const sorted = [...pool].sort(sortByRecency);
      newestRecord = mergePqaKpiFromRecords(sorted[0], matchingRecords);
    } else {
      const sorted = [...matchingRecords].sort(sortByRecency);
      newestRecord = sorted[0];
    }

    setSelectedEngineer(newestRecord);
    setProfileOpenedByExactCode(openedByExactCode);

    // Setup period defaults for profile view
    setSelectedProfileMonth(`${newestRecord.month}-${newestRecord.year}`);
    const q = getQuarter(newestRecord.month);
    const qKey = q ? `${q}-${newestRecord.year}` : null;
    if (openedByExactCode) {
      setProfileViewMode('QUARTERLY');
      if (qKey) setSelectedProfileQuarter(qKey);
    } else {
      setProfileViewMode('MONTHLY');
      if (qKey) setSelectedProfileQuarter(qKey);
    }
    
    // Execute transition
    navigateTo('ENGINEER_PROFILE');
    setShowRankReveal(appMode !== 'PQA_MX');
    message.success(`Dossier found: ${String(newestRecord.code || newestRecord.name || '').trim()}`);
    logUserAction({
      action: 'Search opened profile',
      category: 'SEARCH',
      details: {
        query: trimmed,
        openedCode: newestRecord?.code || null,
        openedName: newestRecord?.name || null,
        exactCode: openedByExactCode,
      },
    });
  };

  const finishAdminSession = (profile, { migration = false } = {}, ipInfo = {}) => {
    adminSessionOkRef.current = true;
    try {
      sessionStorage.setItem(ADMIN_SESSION_OK_KEY, '1');
    } catch {
      /* ignore */
    }
    writeCachedAdminProfile(profile);
    setCurrentUser(profile);
    setLoginUser('');
    setLoginPass('');
    setIsLogged(true);
    setView('ADMIN_DASHBOARD');
    recordAdminLogin();
    try {
      localStorage.setItem('userName', profile.name || profile.username || '');
      localStorage.removeItem('adminSession');
    } catch {
      /* ignore */
    }
    writeLog({
      type: 'ADMIN_LOGIN',
      actor: profile.username,
      action: migration
        ? 'Admin logged in (migration bridge)'
        : 'Admin logged in (Firebase Auth)',
      details: { name: profile.name, uid: profile.uid, migration: !!migration },
      severity: 'info',
      ip: ipInfo.ip || null,
      location: ipInfo.location || null,
    });
    getAnalyticsSummary().then((data) => setAnalyticsSummary(data));
    if (migration) {
      message.warning('Temporary unlock — migrate to Firebase Auth when Console is ready.');
    }
  };

  const handleAdminLogin = async () => {
    let ipInfo = { ip: null, location: null };
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        ipInfo.ip = data.ip || null;
        ipInfo.location = [data.city, data.country_name].filter(Boolean).join(', ') || null;
      }
    } catch {
      /* ignore */
    }

    try {
      const { profile, migration } = await signInAdmin(loginUser, loginPass);
      finishAdminSession(profile, { migration }, ipInfo);
    } catch (err) {
      console.warn('Admin login failed:', err?.code || '', err?.message || err);
      message.error(err?.message || 'Login failed', 8);
      writeLog({
        type: 'FAILED_LOGIN',
        actor: loginUser || 'unknown',
        action: 'Failed admin login attempt',
        details: { code: err?.code || '', message: String(err?.message || '').slice(0, 200) },
        severity: 'warning',
        ip: ipInfo.ip,
        location: ipInfo.location,
      });
    }
  };

  const seedDatabase = async () => {
    setIsSaving(true);
    const hide = message.loading("Seeding database with initial data...", 0);
    try {
      const seedRows = getInitialDataForCollection(colName);
      const promises = seedRows.map(async (eng) => {
        const engToSave = { ...eng, id: Date.now().toString() + Math.random().toString(36).substring(7) };
        return saveEngineerToDb(engToSave, colName);
      });
      await Promise.all(promises);
      
      const updatedEngineers = await getEngineers(colName);
      setEngineers(updatedEngineers);
      message.success(`Database seeded successfully (${colName}).`);
      writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Seeded database', severity: 'info' });
    } catch (error) {
      console.error("Error seeding database:", error);
      message.error("Failed to seed database.");
    } finally {
      setIsSaving(false);
      hide();
    }
  };

  const handleClearSession = async () => {
    adminSessionOkRef.current = false;
    try {
      sessionStorage.removeItem(ADMIN_SESSION_OK_KEY);
    } catch {
      /* ignore */
    }
    clearCachedAdminProfile();
    clearAdminUiPrefs();
    try {
      await signOutAdmin();
    } catch {
      /* ignore */
    }
    setIsLogged(false);
    setCurrentUser(null);
    message.success('Session cleared. Please try logging in again.');
    window.location.href = '/?portal=admin';
  };

  const handleLogout = async () => {
    writeLog({ type: 'ADMIN_LOGOUT', actor: currentUser?.username || 'admin', action: 'Admin logged out', severity: 'info' });
    adminSessionOkRef.current = false;
    try {
      sessionStorage.removeItem(ADMIN_SESSION_OK_KEY);
    } catch {
      /* ignore */
    }
    clearCachedAdminProfile();
    setCurrentUser(null);
    clearAdminUiPrefs();
    try {
      await signOutAdmin();
    } catch {
      /* ignore */
    }
    setIsLogged(false);
    if (isAdminPortal) {
      setView('ADMIN_LOGIN');
      viewStackRef.current = ['ADMIN_LOGIN'];
    } else {
      setView('HOME');
    }
  };

  const handleClearTcsDivisionData = async (mode) => {
    const col = mode === 'TCS_MX'
      ? resolveFirestoreCollection(mode, tcsMxRoleTab)
      : resolveFirestoreCollection(mode);
    const short = mode === 'TCS_MX' ? 'MX' : mode === 'TCS_DA' ? 'DA' : 'AV';
    const roleLabel = mode === 'TCS_MX' && tcsMxRoleTab !== 'engineers'
      ? ` · ${getTcsMxRolePersonLabel(tcsMxRoleTab)}s`
      : '';
    try {
      const list = await getEngineers(col);
      if (list.length === 0) {
        message.info(`No records in TCS ${short}.`);
        return;
      }
      if (!window.confirm(`⚠️ Archive ALL ${list.length} records in TCS ${short}${roleLabel} (${col})?`)) return;
      await Promise.all(list.map((e) => archiveEngineer(e.id, col)));
      if (colName === col) setEngineers([]);
      message.success(`TCS ${short}${roleLabel} data cleared.`);
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        action: `Clear TCS ${short}`,
        details: { count: list.length, collection: col },
        severity: 'warning',
      });
    } catch (err) {
      console.error(err);
      message.error('Failed to clear division data.');
    }
  };

  const openTcsWinnersHub = async () => {
    const preferredQuarter = String((effectiveQuarterKey || 'Q1-2026')).toUpperCase();
    const m = preferredQuarter.match(/^Q([1-4])-(\d{4})$/);
    if (m) {
      setWinnerHubQuarter(`Q${m[1]}`);
      setWinnerHubYear(m[2]);
    }
    setWinnerHubProduct(resolveTcsDashboardProduct(appMode) || 'MX');
    setWinnerHubMxRole(appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers');
    setAdminModal('winners');
    await loadTcsWinnersConfigs();
  };

  const handleSaveTcsWinnersConfig = async () => {
    const year = String(winnerHubYear || '').replace(/[^0-9]/g, '').slice(0, 4);
    if (!/^\d{4}$/.test(year)) {
      message.warning('Please enter a valid 4-digit year.');
      return;
    }
    const mxRole = winnerHubProduct === 'MX' ? winnerHubMxRole : 'engineers';
    const cleaned = winnerHubCodes
      .slice(0, getTcsWinnersSlotCount(mxRole))
      .map((code) => normalizeEngineerCodeKey(code))
      .filter(Boolean);
    const validation = validateTcsWinnersCodes(cleaned, mxRole);
    if (!validation.ok) {
      message.warning(validation.error || 'Invalid winners list.');
      return;
    }
    const winnersToSave = validation.winners;
    setTcsWinnersSaving(true);
    try {
      const quarterKey = `${winnerHubQuarter}-${year}`;
      await saveTcsDashboardWinners({
        quarterKey,
        product: winnerHubProduct,
        mxRole,
        winners: winnersToSave,
        updatedBy: currentUser?.username || currentUser?.name || 'admin',
      });
      await loadTcsWinnersConfigs();
      setSelectedQuarterKey(quarterKey);
      setHomeViewMode('QUARTERLY');
      if (winnerHubProduct === 'MX' && mxRole !== tcsMxRoleTab && appMode === 'TCS_MX') {
        setTcsMxRoleTab(mxRole);
      }
      setWinnerHubYear(year);
      if (winnersToSave.length === 0) {
        message.success(`Cleared dashboard winners for ${winnerHubProduct} (${quarterKey}).`);
      } else if (mxRole === 'receptionists') {
        message.success(`Saved ${winnersToSave.length} receptionist winner${winnersToSave.length === 1 ? '' : 's'} for ${winnerHubProduct} (${quarterKey}).`);
      } else if (mxRole === 'galaxy_consultants') {
        message.success(`Saved ${winnersToSave.length} galaxy consultant winner${winnersToSave.length === 1 ? '' : 's'} for ${winnerHubProduct} (${quarterKey}).`);
      } else {
        message.success(`Saved Top ${winnersToSave.length} winners for ${winnerHubProduct} (${quarterKey}).`);
      }
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        action: winnersToSave.length === 0 ? 'Cleared TCS dashboard winners' : 'Saved TCS dashboard winners',
        details: { product: winnerHubProduct, quarterKey, winners: winnersToSave.join(',') || 'none' },
        severity: 'info',
      });
    } catch (e) {
      console.error(e);
      message.error(e?.message || 'Failed to save winners config.');
    } finally {
      setTcsWinnersSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && editingEng) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      // Store the file and the preview URL
      setEditingEng({
        ...editingEng,
        photoUrl: previewUrl,
        pendingFile: file,
        hidden: false
      });
    }
  };

  const saveEngineer = async (updated) => {
    setIsSaving(true);
    const hide = message.loading("Saving engineer data...", 0);

    try {
      if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
        const gspn = String(updated.code || updated.gspnId || '').trim().toUpperCase();
        if (gspn.length < 2) {
          hide();
          setIsSaving(false);
          message.warning('GSPN ID is required (at least 2 characters). Each receptionist must have a unique GSPN ID.');
          return;
        }
        updated = {
          ...updated,
          code: gspn,
          gspnId: gspn,
          asc: String(updated.asc || updated.ascCode || '').trim(),
          ascCode: String(updated.ascCode || '').trim(),
        };
      }

      const isPqa = appMode?.startsWith('PQA');
      const newScore = isPqa
        ? calculatePQAScore(updated)
        : appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists'
          ? calculateReceptionistScore(updated)
          : appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants'
            ? calculateGalaxyConsultantScore(updated)
            : (() => {
                const manual = parseFloat(updated.tcsScore);
                if (!Number.isFinite(manual)) return 0;
                return Math.min(100, Math.max(0, Number(manual.toFixed(1))));
              })();
      const newTier = appMode === 'TCS_MX'
        ? getMxEvaluationTier(resolveMxRoleTierScore(updated, tcsMxRoleTab))
        : getTier(newScore);

      let finalPhotoUrl = updated.photoUrl;

      // If a new file is pending upload
      if (updated.pendingFile) {
        try {
          const folder = isPqa ? 'PQA' : getTcsStorageFolder();
          const url = await uploadPhoto(updated.pendingFile, folder, updated.code.toUpperCase() || 'unknown', { stableFileName: true });
          if (url) finalPhotoUrl = url;
        } catch (error) {
          console.error("Failed to upload photo:", error);
          message.warning("Failed to upload photo. Changes will be saved without new photo.");
        }
      }

      let finalEng = {
        ...updated,
        tcsScore: newScore,
        tier: newTier,
        photoUrl: finalPhotoUrl,
      };
      if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
        finalEng.roleScore = newScore;
      }
      if (appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants') {
        finalEng.galaxyConsultantTickets = calculateGalaxyConsultantScore(updated);
      }
      delete finalEng.pendingFile;

      // ── Smart Month-History Logic ───────────────────────────────
      const recordCode = String(finalEng.code || finalEng.gspnId || '').trim().toUpperCase();
      const sameCodeRecords = recordCode
        ? engineers.filter((e) => String(e.code || e.gspnId || '').trim().toUpperCase() === recordCode)
        : [];

      // Check if a record for the same (month, year) already exists
      const duplicateRecord = sameCodeRecords.find(
        e => e.month?.toLowerCase() === finalEng.month?.toLowerCase()
          && e.year === finalEng.year
          && e.id !== finalEng.id
      );

      if (duplicateRecord) {
        // A different record for this exact month/year exists → ask to overwrite or cancel
        hide();
        const confirmed = window.confirm(
          `⚠️ A record for ${finalEng.month} ${finalEng.year} already exists for ${finalEng.name}.

Do you want to UPDATE the existing record? Click OK to update, or Cancel to abort.`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
        // Overwrite the duplicate record's id
        finalEng.id = duplicateRecord.id;
      } else if (finalEng.id && sameCodeRecords.some(e => e.id === finalEng.id)) {
        // The user opened an existing record but changed the month → treat as NEW entry
        const originalRecord = sameCodeRecords.find(e => e.id === finalEng.id);
        const monthChanged = originalRecord &&
          (originalRecord.month?.toLowerCase() !== finalEng.month?.toLowerCase() ||
            originalRecord.year !== finalEng.year);
        if (monthChanged) {
          // Strip id so Firestore creates a new document
          delete finalEng.id;
        }
      }

      // Generate a temporary ID if still missing
      if (!finalEng.id) finalEng.id = Date.now().toString();

      let beforeSnapshot = finalEng.id ? engineers.find((e) => e.id === finalEng.id) : null;
      if (!beforeSnapshot && duplicateRecord) {
        beforeSnapshot = duplicateRecord;
      }
      const wasNewRecord = !beforeSnapshot;

      const savedId = await saveEngineerToDb(finalEng, colName);
      const savedFinalId = savedId || finalEng.id;

      pushUndoEntry(adminUndoStackRef, setAdminUndoCount, {
        type: 'SAVE_RECORD',
        label: `Saved ${finalEng.name || finalEng.code || 'record'}`,
        colName,
        before: beforeSnapshot ? cloneSnapshot(beforeSnapshot) : null,
        savedRecord: cloneSnapshot({ ...finalEng, id: savedFinalId }),
        wasNew: wasNewRecord,
      });

      setEngineers(prev => {
        // If we are overwriting a specific id, replace that entry
        const idx = prev.findIndex(e => e.id === finalEng.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...finalEng, id: savedFinalId };
          return next;
        }
        // Otherwise it is a brand new entry
        return [...prev, { ...finalEng, id: savedFinalId }];
      });

      setEditingEng(null);
      message.success("Engineer record committed successfully");
      writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Saved engineer record', details: { name: finalEng.name, code: finalEng.code, month: finalEng.month, year: finalEng.year }, severity: 'info' });
    } catch (error) {
      console.error("Error saving engineer:", error);
      message.error("Error saving engineer. Check console.");
      writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error saving engineer', details: { error: String(error)?.slice(0, 200) }, severity: 'error' });
    } finally {
      setIsSaving(false);
      hide();
    }
  };


  const handleAddAdmin = async () => {
    if (!newAdminData.username || !newAdminData.password || !newAdminData.name) {
      message.warning('Please fill name, username, and password');
      return;
    }
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.error('Only SUPER_ADMIN can create admins');
      return;
    }
    const role = newAdminData.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    const username = newAdminData.username.trim();
    if (!ADMIN_USERNAME_PATTERN.test(username)) {
      message.warning('Username: 3–40 letters or numbers; dots, dashes and underscores allowed inside (no spaces).');
      return;
    }
    const typedEmail = String(newAdminData.email || '').trim().toLowerCase();
    if (typedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedEmail)) {
      message.warning('Enter a valid email, or leave it empty to sign in with the username.');
      return;
    }
    const email = typedEmail || internalAdminEmail(username);
    if (String(newAdminData.password).length < 8) {
      message.warning('Password must be at least 8 characters.');
      return;
    }
    if (admins.some((a) => String(a.username || '').toLowerCase() === username.toLowerCase())) {
      message.warning('Username already in use.');
      return;
    }
    if (admins.some((a) => String(a.email || '').toLowerCase() === email)) {
      message.warning('An admin with this email already exists. Edit that account instead.');
      return;
    }
    const profile = {
      username,
      name: newAdminData.name.trim(),
      role,
      access: role === 'SUPER_ADMIN' ? 'ALL' : newAdminData.access || 'TCS_ONLY',
      permissions: buildPermissionsForSave(newAdminData, role),
    };
    try {
      const data = await createAdminAccount({ email, password: newAdminData.password, profile });
      const newAdmin = { id: data.uid, firebaseUid: data.uid, email, ...profile };
      setAdmins((prev) => [...prev.filter((a) => a.id !== newAdmin.id), newAdmin]);
      getAdmins().then((rows) => { if (rows.length) setAdmins(rows); }).catch(() => {});
      setNewAdminData({ ...EMPTY_ADMIN_FORM });
      setShowAddAdmin(false);
      message.success(
        data.existingUser
          ? 'Existing sign-in linked as admin. Their current password is unchanged.'
          : typedEmail
            ? 'New admin created. They sign in with this email and password.'
            : `New admin created. They sign in with username "${username}" and this password.`,
      );
      writeLog({
        type: 'ADMIN_ACTION',
        actor: currentUser?.username || 'admin',
        category: 'PERMISSIONS',
        action: 'Added new admin (Firebase Auth)',
        details: { username: newAdmin.username, name: newAdmin.name, role: newAdmin.role, email, uid: data.uid },
        severity: 'info',
      });
    } catch (error) {
      console.error('Error adding admin:', error);
      const reason = {
        'auth/invalid-email': 'That email address is not valid.',
        'auth/weak-password': 'Password must be at least 8 characters.',
        'auth/operation-not-allowed': 'Email/password sign-in is disabled in Firebase Authentication.',
        'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
        'permission-denied': 'Only a super admin can add admins. If you are one, the latest database rules may not be deployed yet.',
      }[error?.code];
      message.error(reason || error?.message || 'Failed to add admin');
    }
  };

  const startEditAdmin = (admin) => {
    setEditingAdminId(admin.id);
    setEditAdminData({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      name: admin.name || '',
      role: admin.role || 'ADMIN',
      access: admin.access || 'TCS_ONLY',
      permissions: permissionsForForm(admin),
    });
  };

  const cancelEditAdmin = () => {
    setEditingAdminId(null);
    setEditAdminData({ ...EMPTY_ADMIN_FORM });
  };

  const persistAdminUpdate = async (updated, logAction) => {
    await saveAdminToDb(updated);
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (currentUser?.id === updated.id || currentUser?.uid === updated.uid) {
      setCurrentUser(updated);
    }
    writeLog({
      type: 'ADMIN_ACTION',
      actor: currentUser?.username || 'admin',
      category: 'PERMISSIONS',
      action: logAction,
      details: {
        username: updated.username,
        role: updated.role,
        access: updated.access,
        permissions: updated.permissions || null,
      },
      severity: 'info',
    });
  };

  const handleQuickAdminAccessChange = async (admin, authority) => {
    if (currentUser?.role !== 'SUPER_ADMIN') return;
    if (admin.id === currentUser?.id) {
      message.warning('You cannot change your own authority.');
      return;
    }
    const toSuper = authority === SUPER_ADMIN_AUTHORITY;
    const wasSuper = admin.role === 'SUPER_ADMIN';
    const basePermissions = wasSuper
      ? { ...DEFAULT_FORM_PERMISSIONS }
      : admin.permissions || permissionsForForm(admin);
    const updated = {
      ...admin,
      role: toSuper ? 'SUPER_ADMIN' : 'ADMIN',
      access: toSuper ? 'ALL' : authority,
      permissions: toSuper
        ? buildPermissionsForSave({}, 'SUPER_ADMIN')
        : syncScopePermissions(authority, basePermissions),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };
    try {
      await persistAdminUpdate(updated, toSuper ? 'Promoted admin to super admin' : 'Updated admin authority');
      message.success(
        toSuper
          ? `${admin.name || admin.username} is now a super admin (global). They get full access on their next sign-in or page refresh.`
          : `${admin.name || admin.username} is now an admin (${authority === 'ALL' ? 'TCS + PQA' : authority === 'PQA_ONLY' ? 'PQA only' : 'TCS only'}).`,
      );
    } catch (error) {
      console.error(error);
      message.error(`Failed to update authority: ${error?.code || error?.message || 'unknown error'}`);
    }
  };

  const handleSaveAdminEdit = async () => {
    if (!editingAdminId) return;
    const admin = admins.find(a => a.id === editingAdminId);
    if (!admin) return;
    if (!editAdminData.name?.trim() || !editAdminData.username?.trim()) {
      message.warning('Name and username are required.');
      return;
    }
    const duplicate = admins.some(
      a => a.id !== editingAdminId && a.username?.toLowerCase() === editAdminData.username.trim().toLowerCase()
    );
    if (duplicate) {
      message.warning('Username already in use.');
      return;
    }
    const updated = {
      ...admin,
      name: editAdminData.name.trim(),
      username: editAdminData.username.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };
    if (currentUser?.role === 'SUPER_ADMIN') {
      updated.role = editAdminData.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
      if (admin.id === currentUser?.id && updated.role !== admin.role) {
        message.warning('You cannot change your own role.');
        return;
      }
      updated.access = updated.role === 'SUPER_ADMIN' ? 'ALL' : editAdminData.access || 'TCS_ONLY';
      updated.permissions = buildPermissionsForSave(editAdminData, updated.role);
    }
    if (editAdminData.password?.trim()) {
      message.warning('Passwords cannot be changed here. Other details were saved; to set a new password, remove this admin and add them again with a different username.');
    }
    try {
      await persistAdminUpdate(updated, 'Edited admin account');
      cancelEditAdmin();
      message.success('Account updated.');
    } catch (error) {
      console.error(error);
      message.error(`Failed to save account: ${error?.code || error?.message || 'unknown error'}`);
    }
  };


  const deleteAdminHandler = async (id) => {
    if (id === currentUser?.id) {
      message.error("You cannot delete yourself");
      return;
    }
    modal.confirm({
      title: 'Remove Admin',
      content: 'Are you sure you want to remove this admin?',
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteAdminFromDb(id);
          setAdmins(prev => prev.filter(a => a.id !== id));
          message.success("Admin removed");
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            category: 'PERMISSIONS',
            action: 'Deleted admin account',
            details: { id, username: admins.find((a) => a.id === id)?.username },
            severity: 'warning',
          });
        } catch (error) {
          console.error("Error deleting admin:", error);
          message.error("Failed to delete admin");
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error deleting admin', details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      },
    });
  };

  const adminAccountsPanelProps = {
    admins,
    currentUser,
    newAdminData,
    setNewAdminData,
    editingAdminId,
    editAdminData,
    setEditAdminData,
    onAdd: handleAddAdmin,
    onSaveEdit: handleSaveAdminEdit,
    onCancelEdit: cancelEditAdmin,
    onStartEdit: startEditAdmin,
    onQuickAccessChange: handleQuickAdminAccessChange,
    onDelete: deleteAdminHandler,
  };

  const deleteEngineerHandler = async (id) => {
    modal.confirm({
      title: `Archive ${tcsMxPersonLabel}`,
      content: `Are you sure you want to archive this ${tcsMxPersonLabel.toLowerCase()} record? The data will be hidden but preserved.`,
      okText: 'Archive',
      okType: 'danger',
      onOk: async () => {
        try {
          const archivedEng = engineers.find(e => e.id === id);
          if (isEphemeralRegistryId(id)) {
            setEngineers(prev => prev.filter(e => e.id !== id));
            message.success(`${tcsMxPersonLabel} removed from the local demo registry.`);
            writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: `Removed local ${tcsMxPersonLabel.toLowerCase()} record`, details: { id, name: archivedEng?.name, code: archivedEng?.code }, severity: 'warning' });
            return;
          }
          if (archivedEng) {
            pushUndoEntry(adminUndoStackRef, setAdminUndoCount, {
              type: 'ARCHIVE',
              label: `Archived ${archivedEng.name || archivedEng.code || 'record'}`,
              colName,
              record: cloneSnapshot(archivedEng),
            });
          }
          await archiveEngineer(id, colName);
          setEngineers(prev => prev.filter(e => e.id !== id));
          if (archivedEng) {
            setFetchedHiddenEngineers(prev => [...prev, { ...archivedEng, hidden: true }]);
          }
          message.success(`${tcsMxPersonLabel} archived`);
          writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: `Archived ${tcsMxPersonLabel.toLowerCase()}`, details: { id, name: archivedEng?.name, code: archivedEng?.code }, severity: 'warning' });
        } catch (error) {
          console.error("Error deleting engineer:", error);
          message.error(`Failed to archive ${tcsMxPersonLabel.toLowerCase()} record.`);
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: `Error archiving ${tcsMxPersonLabel.toLowerCase()}`, details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      }
    });
  };

  const bulkArchiveEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can use bulk delete.');
      return;
    }
    if (bulkSelectedIds.length === 0) {
      message.warning('Select records first.');
      return;
    }

    modal.confirm({
      title: `Bulk Delete (${bulkSelectedIds.length})`,
      content: `Archive ${bulkSelectedIds.length} selected records from ${appMode}? This can be restored from Archives.`,
      okText: 'Archive Selected',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const idSet = new Set(bulkSelectedIds);
          const archived = engineers.filter((e) => idSet.has(e.id));
          if (archived.length) {
            pushUndoEntry(adminUndoStackRef, setAdminUndoCount, {
              type: 'BULK_ARCHIVE',
              label: `Bulk archived ${archived.length} records`,
              colName,
              records: archived.map((r) => cloneSnapshot(r)),
            });
          }
          const ephemeralIds = bulkSelectedIds.filter((id) => isEphemeralRegistryId(id));
          const firestoreIds = bulkSelectedIds.filter((id) => !isEphemeralRegistryId(id));
          if (ephemeralIds.length) {
            const ephemeralSet = new Set(ephemeralIds);
            setEngineers((prev) => prev.filter((e) => !ephemeralSet.has(e.id)));
          }
          if (firestoreIds.length) {
            await Promise.all(firestoreIds.map((id) => archiveEngineer(id, colName)));
            const firestoreSet = new Set(firestoreIds);
            setEngineers((prev) => prev.filter((e) => !firestoreSet.has(e.id)));
            setFetchedHiddenEngineers((prev) => [...prev, ...archived.filter((e) => firestoreSet.has(e.id)).map((e) => ({ ...e, hidden: true }))]);
          }
          if (selectedEngineer && bulkSelectedIds.includes(selectedEngineer.id)) setSelectedEngineer(null);
          setBulkSelectedIds([]);

          message.success(`${bulkSelectedIds.length} records archived.`);
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk archived ${appMode} records`,
            details: { count: archived.length, ids: bulkSelectedIds.slice(0, 30) },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Bulk archive failed:', error);
          message.error('Failed to bulk archive selected records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk archiving ${appMode}`,
            details: { count: bulkSelectedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const restoreEngineerHandler = async (id) => {
    modal.confirm({
      title: 'Restore Engineer',
      content: 'Are you sure you want to restore this engineer?',
      onOk: async () => {
        try {
          const restoredEng = fetchedHiddenEngineers.find(e => e.id === id);
          if (restoredEng) {
            pushUndoEntry(adminUndoStackRef, setAdminUndoCount, {
              type: 'RESTORE',
              label: `Restored ${restoredEng.name || restoredEng.code || 'record'}`,
              colName,
              record: cloneSnapshot(restoredEng),
            });
          }
          await saveEngineerToDb({ id, hidden: false }, colName);
          setFetchedHiddenEngineers(prev => prev.filter(e => e.id !== id));
          if (restoredEng) {
            setEngineers(prev => [...prev, { ...restoredEng, hidden: false }]);
          }
          message.success("Engineer restored");
          writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: 'Restored engineer', details: { id, name: restoredEng?.name }, severity: 'info' });
        } catch (error) {
          console.error("Error restoring engineer:", error);
          message.error("Failed to restore engineer.");
          writeLog({ type: 'ERROR', actor: currentUser?.username || 'admin', action: 'Error restoring engineer', details: { id, error: String(error)?.slice(0, 200) }, severity: 'error' });
        }
      }
    });
  };

  const bulkRestoreEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can use bulk restore.');
      return;
    }
    if (bulkSelectedArchivedIds.length === 0) {
      message.warning('Select archived records first.');
      return;
    }

    modal.confirm({
      title: `Bulk Restore (${bulkSelectedArchivedIds.length})`,
      content: `Restore ${bulkSelectedArchivedIds.length} archived records to ${appMode}?`,
      okText: 'Restore Selected',
      onOk: async () => {
        try {
          const idSet = new Set(bulkSelectedArchivedIds);
          const restored = fetchedHiddenEngineers.filter((e) => idSet.has(e.id));
          if (restored.length) {
            pushUndoEntry(adminUndoStackRef, setAdminUndoCount, {
              type: 'BULK_RESTORE',
              label: `Bulk restored ${restored.length} records`,
              colName,
              records: restored.map((r) => cloneSnapshot(r)),
            });
          }
          await Promise.all(bulkSelectedArchivedIds.map((id) => saveEngineerToDb({ id, hidden: false }, colName)));
          setFetchedHiddenEngineers((prev) => prev.filter((e) => !idSet.has(e.id)));
          setEngineers((prev) => [...prev, ...restored.map((e) => ({ ...e, hidden: false }))]);
          setBulkSelectedArchivedIds([]);
          message.success(`${restored.length} archived records restored.`);
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk restored ${appMode} records`,
            details: { count: restored.length, ids: bulkSelectedArchivedIds.slice(0, 30) },
            severity: 'info'
          });
        } catch (error) {
          console.error('Bulk restore failed:', error);
          message.error('Failed to bulk restore selected archived records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk restoring ${appMode}`,
            details: { count: bulkSelectedArchivedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const deleteArchivedEngineerHandler = async (id) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can permanently delete.');
      return;
    }
    modal.confirm({
      title: 'Permanent Delete',
      content: 'This will permanently remove the archived record from database. This action cannot be undone.',
      okText: 'Delete Permanently',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEngineerPermanent(id, colName);
          setFetchedHiddenEngineers((prev) => prev.filter((e) => e.id !== id));
          setBulkSelectedArchivedIds((prev) => prev.filter((x) => x !== id));
          message.success('Archived record permanently deleted.');
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Permanently deleted archived ${appMode} record`,
            details: { id },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Permanent delete failed:', error);
          message.error('Failed to permanently delete archived record.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error permanently deleting archived ${appMode}`,
            details: { id, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const bulkDeleteArchivedEngineersHandler = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      message.warning('Only Super Admin can permanently delete.');
      return;
    }
    if (bulkSelectedArchivedIds.length === 0) {
      message.warning('Select archived records first.');
      return;
    }
    modal.confirm({
      title: `Permanent Delete (${bulkSelectedArchivedIds.length})`,
      content: `Permanently delete ${bulkSelectedArchivedIds.length} archived records from ${appMode}? This cannot be undone.`,
      okText: 'Delete Permanently',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(bulkSelectedArchivedIds.map((id) => deleteEngineerPermanent(id, colName)));
          const idSet = new Set(bulkSelectedArchivedIds);
          setFetchedHiddenEngineers((prev) => prev.filter((e) => !idSet.has(e.id)));
          setBulkSelectedArchivedIds([]);
          message.success('Selected archived records permanently deleted.');
          writeLog({
            type: 'ADMIN_ACTION',
            actor: currentUser?.username || 'admin',
            action: `Bulk permanently deleted archived ${appMode} records`,
            details: { count: bulkSelectedArchivedIds.length, ids: bulkSelectedArchivedIds.slice(0, 30) },
            severity: 'warning'
          });
        } catch (error) {
          console.error('Bulk permanent delete failed:', error);
          message.error('Failed to permanently delete selected archived records.');
          writeLog({
            type: 'ERROR',
            actor: currentUser?.username || 'admin',
            action: `Error bulk permanently deleting archived ${appMode}`,
            details: { count: bulkSelectedArchivedIds.length, error: String(error)?.slice(0, 200) },
            severity: 'error'
          });
        }
      }
    });
  };

  const downloadTcsDivisionTemplate = (division) => {
    const short =
      division === 'TCS_MX' ? 'MX' : division === 'TCS_DA' ? 'DA' : division === 'TCS_AV' || division === 'TCS_VD' ? 'AV' : 'MX';
    const isDaAvTemplate = division === 'TCS_DA' || division === 'TCS_AV' || division === 'TCS_VD';

    // MX engineers use the redesigned unified workbook (Engineer_Wide + Summary + KPI_Detail).
    if (division === 'TCS_MX') {
      const excelBuffer = downloadUnifiedEngineerTemplate();
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = TCS_MX_UNIFIED_TEMPLATE_FILENAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    // DA / AV engineers use Quarterly Results master (Q1–Q4 wide columns).
    if (isDaAvTemplate) {
      const excelBuffer = downloadDaAvUnifiedTemplate();
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = TCS_DA_AV_UNIFIED_TEMPLATE_FILENAME.replace('.xlsx', `_${short}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TCS_MX_TEMPLATE_HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, TCS_MX_TEMPLATE_SHEET_NAME);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TCS_MX_Score_Template_${short}_2026.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadReceptionistTemplate = () => {
    const excelBuffer = buildReceptionistTemplateArrayBuffer();
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = TCS_MX_RECEPTIONIST_TEMPLATE_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadTcsBulkTemplate = (mxRole = tcsMxRoleTab) => {
    if (appMode === 'TCS_MX' && mxRole === 'receptionists') {
      downloadReceptionistTemplate();
      return;
    }
    downloadExcelTemplate();
  };

  const downloadExcelTemplate = () => {
    const isPqaMode = appMode === 'PQA_MX' || appMode === 'PQA_CE';

    if (!isPqaMode) {
      if (appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists') {
        downloadReceptionistTemplate();
        return;
      }
      const div =
        appMode === 'TCS_DA' ? 'TCS_DA' : appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'TCS_AV' : 'TCS_MX';
      downloadTcsDivisionTemplate(div);
      return;
    }

    const wb = XLSX.utils.book_new();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const pqaHeaders = [
      ["Region", "ASCCode", "ASCName", "PhotoURL", "PartnerName", "Month", "Year", "LTP", "EX-LTP", "REDO", "SSR", "D-RNPS", "OFS", "R-CXE", "SDR", "Audit", "PR"]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(pqaHeaders);
    XLSX.utils.book_append_sheet(wb, ws1, "★Evaluation point");

    // ★Partner Ranking — two header rows (must match upload parser)
    const prRow1 = ['Partner', '', '', '2026 Acc'];
    const prRow2 = ['', 'ASC Code', 'ASC Name', 'Ave Score', 'Ranking'];
    months.forEach((m) => {
      prRow1.push(m, '', '', '', '');
      prRow2.push('Branch Score', 'Ratio', 'Score(Weigh)', 'Partner Score', 'Partner Rank');
    });
    const ws2 = XLSX.utils.aoa_to_sheet([prRow1, prRow2]);
    XLSX.utils.book_append_sheet(wb, ws2, "★Partner Ranking");

    const avgHeaders = [
      ["ASC Code", "ASC name", "Average Score by month", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(avgHeaders);
    XLSX.utils.book_append_sheet(wb, ws3, "★Monthly Average");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PQA_Score_Template_${appMode}_2026.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExcelUpload = async (e, options = {}) => {
    const { targetTcsMode } = options;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type: 'array' });

      const isPqaMode = appMode?.startsWith('PQA');
      const uploadMode = isPqaMode ? appMode : (targetTcsMode || appMode);
      const uploadMxRole = uploadMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers';
      const uploadCol = resolveFirestoreCollection(uploadMode, uploadMxRole);
      const existingByCollection = {};
      const getExistingForCollection = async (collectionName) => {
        if (existingByCollection[collectionName]) return existingByCollection[collectionName];
        try {
          existingByCollection[collectionName] = await getEngineers(collectionName);
        } catch (err) {
          console.error('merge list fetch', err);
          existingByCollection[collectionName] = [];
        }
        return existingByCollection[collectionName];
      };

      let uploadedRecords = [];

      const findSheet = (keyword) => {
        const name = workbook.SheetNames.find(n => n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')));
        return name ? workbook.Sheets[name] : null;
      };

      if (isPqaMode) {
        // ════════════════════════════════════════════════════════════
        // PQA MULTI-SHEET PARSER
        // ════════════════════════════════════════════════════════════
        const partnerRankMap = {};
        const ytdRankMap = {};
        /** ASC code -> canonical partner id from ★Partner Ranking column A. */
        const codeToOfficialPartner = {};

        // ── 1. Parse Partner Ranking (Master records for all months) ──
        const prSheet = findSheet('PartnerRanking') || findSheet('Partner');
        if (prSheet) {
          const prRows = XLSX.utils.sheet_to_json(prSheet, { header: 1, raw: false });

          // ── Detect header rows ──────────────────────────────────────────────
          // The sheet has 2 header rows:
          //   Row A (group row): "Partner" | blank | blank | "2026 Acc" | "Jan" | "Feb" ...
          //   Row B (col  row):  blank | "ASC Code" | "ASC Name" | "Ave Score" | "Ranking" | "Branch Score" | ...
          let prGroupRowIdx = -1;  // row with "Partner" label and month group names
          let prColRowIdx   = -1;  // row with "ASC Code"

          for (let i = 0; i < Math.min(prRows.length, 40); i++) {
            const r = prRows[i] || [];
            const rowText = r.map(v => String(v || '').toLowerCase().trim());
            const rowNorm = r.map(v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
            const hasAscCode =
              rowText.some((t) => t === 'asc code' || t.replace(/[^a-z]/g, '') === 'asccode') ||
              rowNorm.includes('asccode');
            if (hasAscCode) {
              prColRowIdx = i;
              if (prGroupRowIdx < 0 && i > 0) prGroupRowIdx = i - 1;
              break;
            }
            // group row is the one containing "partner" in col 0 or col 1
            if ((rowText[0] === 'partner' || rowText[1] === 'partner') && prGroupRowIdx === -1) {
              prGroupRowIdx = i;
            }
          }
          if (prColRowIdx === -1) { prGroupRowIdx = -1; } // need both

          const groupRow  = prGroupRowIdx >= 0 ? (prRows[prGroupRowIdx] || []) : [];
          const colRow    = prColRowIdx   >= 0 ? (prRows[prColRowIdx]   || []) : [];

          // ── Map column indices from colRow ──────────────────────────────────
          let prPartnerCol = 0;       // Column A always holds partner name
          let prCodeCol    = -1;
          let prNameCol    = -1;
          let prAccScoreCol = -1;     // "2026 Acc" → Ave Score
          let prAccRankCol  = -1;     // "2026 Acc" → Ranking

          // Find "partner" in groupRow to confirm column 0
          for (let j = 0; j < groupRow.length; j++) {
            if (String(groupRow[j] || '').toLowerCase().trim() === 'partner') { prPartnerCol = j; break; }
          }

          // Scan colRow for ASC Code, ASC Name, Partner, and 2026 Acc columns
          for (let j = 0; j < colRow.length; j++) {
            const v = String(colRow[j] || '').toLowerCase().trim();
            const nv = v.replace(/[^a-z]/g, '');
            if (v === 'asc code' || nv === 'asccode' || (v.includes('code') && (v.includes('asc') || v.includes('center')))) prCodeCol = j;
            if (v === 'asc name' || nv === 'ascname' || (v.includes('name') && (v.includes('asc') || v.includes('center')))) prNameCol = j;
            if (v === 'partner' || nv === 'partnername') prPartnerCol = j;
            if ((v.includes('ave') || v.includes('avg')) && v.includes('score')) prAccScoreCol = j;
            if (v === 'ranking' || (v.includes('ranking') && !v.includes('partner')) || (v === 'rank' && !v.includes('partner'))) prAccRankCol = j;
          }
          // Fallback when Samsung sheet omits "Ave. Score" / "Ranking" labels (template layout).
          if (prAccScoreCol < 0 && prCodeCol > -1) prAccScoreCol = prCodeCol + 2;
          if (prAccRankCol < 0 && prCodeCol > -1) prAccRankCol = prCodeCol + 3;

          // ── Detect monthly blocks from groupRow ─────────────────────────────
          // Each month group: "Jan" / "Feb" etc. appears in groupRow with merged span
          // Within that span, colRow has: Branch Score | Ratio | Score(Weigh) | Partner Score | Partner Rank
          const prMonths = [];
          for (let j = 0; j < groupRow.length; j++) {
            const val = String(groupRow[j] || '').trim();
            if (!val) continue;
            const m = val.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\s_']*(2\d|\d{4}))?$/i);
            if (m) {
              prMonths.push({
                month: m[1].charAt(0).toUpperCase() + m[1].slice(1, 3).toLowerCase(),
                year: m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : '2026',
                startCol: j
              });
            }
          }

          // For each month block, locate exact sub-columns using colRow
          prMonths.forEach((mb, mi) => {
            const blockEnd = mi + 1 < prMonths.length ? prMonths[mi + 1].startCol : mb.startCol + 8;
            mb.branchScoreCol  = -1;
            mb.partnerScoreCol = -1;
            mb.partnerRankCol  = -1;
            for (let c = mb.startCol; c < Math.min(blockEnd, colRow.length); c++) {
              const h = String(colRow[c] || '').toLowerCase().trim();
              if (h.includes('branch') && h.includes('score') && mb.branchScoreCol === -1) mb.branchScoreCol = c;
              else if (h.includes('partner') && h.includes('score')) mb.partnerScoreCol = c;
              else if (h.includes('partner') && h.includes('rank')) mb.partnerRankCol = c;
            }
            // Fallbacks by offset if header names didn't match
            if (mb.branchScoreCol  === -1) mb.branchScoreCol  = mb.startCol;
            if (mb.partnerScoreCol === -1) mb.partnerScoreCol = mb.startCol + 3;
            if (mb.partnerRankCol  === -1) mb.partnerRankCol  = mb.startCol + 4;
          });

          // ── Iterate data rows ───────────────────────────────────────────────
          let lastPartnerName = '';  // carry-forward for merged cells in col A
          let lastPartnerAscCode = '';
          /** Samsung sheets merge D/E vertically — only first row has values; carry within partner block. */
          let lastPartnerKeyForAcc = '';
          let lastPrAccScore = 0;
          let lastPrAccRank = 0;
          /** Best accumulated score/rank seen for each partner (all ASC rows get this for dashboard). */
          const partnerAccumFromRanking = {};
          /** Last seen partner label (column A) per ASC — used to apply canonical partner D/E. */
          const ascToPartnerName = {};

          if (prCodeCol < 0 && prPartnerCol === 0) {
            prCodeCol = 1;
            if (prAccScoreCol < 0) prAccScoreCol = prCodeCol + 2;
            if (prAccRankCol < 0) prAccRankCol = prCodeCol + 3;
          }

          const applyPartnerAccumCarry = (cellPartnerRaw, parsedAcc, parsedRank) => {
            const cellPartner = String(cellPartnerRaw || '').trim();
            if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
              const nk = normalizePqaPartnerKey(cellPartner);
              if (lastPartnerKeyForAcc && nk !== lastPartnerKeyForAcc) {
                lastPrAccScore = 0;
                lastPrAccRank = 0;
              }
              lastPartnerKeyForAcc = nk;
            }
            if (parsedAcc > 0) lastPrAccScore = parsedAcc;
            if (parsedRank > 0) lastPrAccRank = parsedRank;
            const accScore = parsedAcc > 0 ? parsedAcc : lastPrAccScore;
            const accRank = parsedRank > 0 ? parsedRank : lastPrAccRank;
            return { accScore, accRank };
          };

          if (prColRowIdx < 0) {
            console.warn('PQA: ★Partner Ranking — no "ASC Code" header row found in first 40 rows; skipped.');
          }

          for (let i = prColRowIdx >= 0 ? prColRowIdx + 1 : prRows.length; i < prRows.length; i++) {
            const r = prRows[i] || [];
            const rawPc = r[prCodeCol];
            const rawPcStr = rawPc === undefined || rawPc === null ? '' : String(rawPc).trim();
            let pCode;
            if (!rawPcStr) {
              if (!lastPartnerAscCode) continue;
              pCode = lastPartnerAscCode;
            } else {
              pCode = String(rawPc).replace(/[\s,]/g, '').trim().toUpperCase();
              if (!pCode || pCode === 'ASC CODE') continue;
              lastPartnerAscCode = pCode;
            }
            const pName = String(r[prNameCol] || pCode).trim();

            // Carry-forward partner name from merged Column A
            const cellPartner = String(r[prPartnerCol] || '').trim();
            if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
              lastPartnerName = cellPartner;
            }
            const partnerName = lastPartnerName;
            const pKeyPartner = normalizePqaPartnerKey(partnerName);
            if (partnerName) ascToPartnerName[pCode] = partnerName;

            // 2026 Accumulated data (D/E — use robust parse + vertical merge carry)
            const parsedAcc = prAccScoreCol > -1 ? parseExcelNumericCell(r[prAccScoreCol]) : 0;
            const parsedRank = prAccRankCol > -1 ? (parseInt(String(r[prAccRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0) : 0;
            const { accScore, accRank } = applyPartnerAccumCarry(cellPartner, parsedAcc, parsedRank);

            if (pKeyPartner && (accScore > 0 || accRank > 0)) {
              const prev = partnerAccumFromRanking[pKeyPartner] || { ytdScore: 0, ytdRank: 0 };
              if (accScore >= prev.ytdScore) {
                partnerAccumFromRanking[pKeyPartner] = {
                  ytdScore: accScore,
                  ytdRank: accRank > 0 ? accRank : prev.ytdRank,
                };
              } else if (accRank > 0 && !prev.ytdRank) {
                partnerAccumFromRanking[pKeyPartner] = { ...prev, ytdRank: accRank };
              }
            }

            if (accScore > 0 || accRank > 0) {
              ytdRankMap[pCode] = { ytdRank: accRank, ytdScore: accScore };
            }

            // Monthly data
            for (const mb of prMonths) {
              const branchScore   = parseExcelNumericCell(r[mb.branchScoreCol]);
              const pScore        = parseExcelNumericCell(r[mb.partnerScoreCol]);
              const pRank         = parseInt(String(r[mb.partnerRankCol] ?? '').replace(/[^0-9-]/g, ''), 10) || 0;

              if (branchScore > 0 || pScore > 0 || pRank > 0 || accScore > 0) {
                const key = `${pCode}_${mb.month.toLowerCase()}_${mb.year}`;
                partnerRankMap[key] = {
                  code: pCode, name: pName, partnerName,
                  monthlyScore: branchScore,
                  monthlyRank: pRank, partnerScore: pScore,
                  accumulatedScore: accScore, accumulatedRank: accRank,
                  mName: mb.month, year: mb.year
                };
              }
            }
          }

          // Backfill: every ASC under a partner inherits ★Partner Ranking D/E block totals (merged cells).
          if (prColRowIdx >= 0 && Object.keys(partnerAccumFromRanking).length > 0) {
            lastPartnerName = '';
            lastPartnerAscCode = '';
            for (let i = prColRowIdx + 1; i < prRows.length; i++) {
              const r = prRows[i] || [];
              const rawPc = r[prCodeCol];
              const rawPcStr = rawPc === undefined || rawPc === null ? '' : String(rawPc).trim();
              let pCode;
              if (!rawPcStr) {
                if (!lastPartnerAscCode) continue;
                pCode = lastPartnerAscCode;
              } else {
                pCode = String(rawPc).replace(/[\s,]/g, '').trim().toUpperCase();
                if (!pCode || pCode === 'ASC CODE') continue;
                lastPartnerAscCode = pCode;
              }
              const cellPartner = String(r[prPartnerCol] || '').trim();
              if (cellPartner && cellPartner.toLowerCase() !== 'partner') {
                lastPartnerName = cellPartner;
              }
              const partnerName = lastPartnerName;
              const pk = normalizePqaPartnerKey(partnerName);
              const agg = pk ? partnerAccumFromRanking[pk] : null;
              if (agg && (agg.ytdScore > 0 || agg.ytdRank > 0)) {
                ytdRankMap[pCode] = { ytdScore: agg.ytdScore, ytdRank: agg.ytdRank };
              }
            }
          }

          // Map sheet partner labels → canonical MX partners, then push D/E onto every ASC for that block.
          const officialPartnerFromSheet = {};
          for (const [pk, agg] of Object.entries(partnerAccumFromRanking)) {
            const off = mapPqaSheetPartnerKeyToOfficial(pk);
            if (!off || !agg) continue;
            const prev = officialPartnerFromSheet[off] || { ytdScore: 0, ytdRank: 0 };
            if ((agg.ytdScore || 0) > (prev.ytdScore || 0)) {
              officialPartnerFromSheet[off] = {
                ytdScore: agg.ytdScore,
                ytdRank: agg.ytdRank > 0 ? agg.ytdRank : prev.ytdRank,
              };
            } else if ((agg.ytdScore || 0) === (prev.ytdScore || 0) && agg.ytdRank > 0) {
              if (!prev.ytdRank || agg.ytdRank < prev.ytdRank) {
                officialPartnerFromSheet[off] = { ...prev, ytdRank: agg.ytdRank };
              }
            }
          }
          for (const [code, pn] of Object.entries(ascToPartnerName)) {
            const off = mapPqaSheetPartnerKeyToOfficial(normalizePqaPartnerKey(pn));
            const agg = off ? officialPartnerFromSheet[off] : null;
            if (!agg || (!(agg.ytdScore > 0) && !(agg.ytdRank > 0))) continue;
            if (off) codeToOfficialPartner[code] = off;
            const cur = ytdRankMap[code] || {};
            ytdRankMap[code] = {
              ...cur,
              ytdScore: agg.ytdScore > 0 ? agg.ytdScore : (parseFloat(cur.ytdScore) || 0),
              ytdRank: agg.ytdRank > 0 ? agg.ytdRank : (parseInt(String(cur.ytdRank || 0), 10) || 0),
            };
          }
        }

        // ── 2. Parse Evaluation point (PQA MX / CE only — ASC Code + monthly KPI bands; independent of TCS) ──
        const normEvName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const evalSheetNamePick =
          workbook.SheetNames.find((n) => normEvName(n).includes('evaluationpoint')) ||
          workbook.SheetNames.find((n) => {
            const x = normEvName(n);
            return x.includes('evaluation') && !x.includes('monthlyaverage') && !x.includes('monthaverage');
          }) ||
          null;
        const evalSheet =
          (evalSheetNamePick ? workbook.Sheets[evalSheetNamePick] : null) ||
          findSheet('Evaluation') ||
          findSheet('EvaluationPoint');
        if (evalSheet) {
          const evalRows = XLSX.utils.sheet_to_json(evalSheet, { header: 1, raw: false, defval: '' });
          const { partnerPatches, ytdPatches } = parsePqaEvaluationPointRows(evalRows, appMode);
          Object.entries(partnerPatches).forEach(([k, patch]) => {
            partnerRankMap[k] = { ...(partnerRankMap[k] || {}), ...patch };
          });
          Object.entries(ytdPatches).forEach(([code, ytd]) => {
            // Keep Partner Ranking (★Partner Ranking D/E accumulated) as source of truth when present.
            const prev = ytdRankMap[code] || {};
            ytdRankMap[code] = {
              ...prev,
              ytdScore: (parseFloat(prev.ytdScore || 0) > 0) ? prev.ytdScore : (ytd.ytdScore || prev.ytdScore || 0),
              ytdRank: (parseInt(String(prev.ytdRank || 0), 10) > 0) ? prev.ytdRank : (ytd.ytdRank || prev.ytdRank || 0),
              centerYtdScore: prev.centerYtdScore || ytd.centerYtdScore || 0,
              centerYtdRank: prev.centerYtdRank || ytd.centerYtdRank || 0,
            };
          });
        }
        // ── 3. Parse Monthly Average for Center Accumulated Score ──
        const avgSheet = findSheet('MonthlyAverage') || findSheet('Monthly Average') || findSheet('Average');
        if (avgSheet) {
          const avgRows = XLSX.utils.sheet_to_json(avgSheet, { header: 1, raw: false });
          let aCodeCol = -1, aNameCol = -1, aScoreCol = -1, aYtdRankCol = -1, aPartnerCol = -1;
          let aMonthCols = [];
          let headerRowIdx = 1;

          for (let i = 0; i < Math.min(avgRows.length, 10); i++) {
             const r = avgRows[i] || [];
             if (r.some(v => String(v).toLowerCase().replace(/\s/g, '') === 'asccode')) {
                headerRowIdx = i;
                break;
             }
          }
          
          const colRow = avgRows[headerRowIdx] || [];
          const monthRow = avgRows[headerRowIdx + 1] || [];

          for (let j = 0; j < Math.max(colRow.length, monthRow.length); j++) {
             const cName = String(colRow[j] || '').toLowerCase().trim();
             const cn = cName.replace(/[^a-z]/g, '');
             if (cn === 'asccode' || (cName.includes('code') && (cName.includes('asc') || cName.includes('center')))) aCodeCol = j;
             if (cn === 'ascname' || (cName.includes('name') && (cName.includes('asc') || cName.includes('center')))) aNameCol = j;
             if (cName.includes('partner')) aPartnerCol = j;

             if (cName.includes('score') && String(monthRow[j] || '').toLowerCase().replace(/\s/g, '') === 'bymonth') {
                 aScoreCol = j;
                 if (String(colRow[j+1] || '').toLowerCase().includes('rank')) aYtdRankCol = j + 1;
             }
             
             const mStr = String(monthRow[j] || '').trim();
             if (mStr) {
                const mMatch = mStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*([-\s_']*(2\d|\d{4}))?$/i);
                if (mMatch && cName === 'score') {
                   const mName = mMatch[1].charAt(0).toUpperCase() + mMatch[1].slice(1, 3).toLowerCase();
                   const mYear = mMatch[3] ? (mMatch[3].length === 2 ? '20' + mMatch[3] : mMatch[3]) : '2026';
                   let rankCol = j + 1;
                   if (String(colRow[j+1] || '').toLowerCase().includes('rank')) rankCol = j + 1;
                   aMonthCols.push({ month: mName, year: mYear, scoreCol: j, rankCol: rankCol });
                }
             }
          }

          // CE/MX Samsung fallback: ASC Code in B, Acc score in D, Acc rank in E.
          if (aCodeCol > -1 && aScoreCol < 0) aScoreCol = aCodeCol + 2;
          if (aCodeCol > -1 && aYtdRankCol < 0) aYtdRankCol = aCodeCol + 3;

          // If month headers weren't detected (common in CE templates), use fixed month pairs after Acc block:
          // Jan(F/G), Feb(H/I), Mar(J/K), ...
          if (aCodeCol > -1 && aMonthCols.length === 0) {
            let defaultYear = '2026';
            for (let rr = 0; rr < Math.min(avgRows.length, 6); rr++) {
              const rowTxt = (avgRows[rr] || []).join(' ');
              const ym = String(rowTxt).match(/(20\d{2})/);
              if (ym) { defaultYear = ym[1]; break; }
            }
            for (let mi = 0; mi < MONTH_ORDER.length; mi++) {
              const scoreCol = aCodeCol + 4 + mi * 2;
              const rankCol = scoreCol + 1;
              if (scoreCol >= Math.max(colRow.length, monthRow.length) + 20) break;
              aMonthCols.push({
                month: pqaShortMonthDisplayName(MONTH_ORDER[mi]),
                year: defaultYear,
                scoreCol,
                rankCol,
              });
            }
          }

          if (aCodeCol > -1) {
             for (let i = headerRowIdx + 2; i < avgRows.length; i++) {
                const r = avgRows[i] || [];
                const pCode = String(r[aCodeCol]).replace(/[\s,]/g, '').trim().toUpperCase();
                if (!pCode || pCode === 'ASC CODE') continue;
                
                const centerYtdScore = aScoreCol > -1 ? parseExcelNumericCell(r[aScoreCol]) : 0;
                const centerYtdRank = parseInt(String(r[aYtdRankCol]).replace(/[^0-9]/g, '')) || 0;
                
                if (centerYtdScore > 0 || centerYtdRank > 0) {
                   if (!ytdRankMap[pCode]) ytdRankMap[pCode] = { ytdScore: 0, ytdRank: 0 };
                   if (centerYtdScore > 0) ytdRankMap[pCode].centerYtdScore = centerYtdScore;
                   if (centerYtdRank > 0) ytdRankMap[pCode].centerYtdRank = centerYtdRank;
                }
                
                for (const mc of aMonthCols) {
                   const mScore = parseExcelNumericCell(r[mc.scoreCol]);
                   const mRank = parseInt(String(r[mc.rankCol]).replace(/[^0-9]/g, '')) || 0;
                    if (mScore > 0 || mRank > 0) {
                      const key = `${pCode}_${mc.month.toLowerCase()}_${mc.year}`;
                      if (!partnerRankMap[key]) {
                         partnerRankMap[key] = { 
                           code: pCode, 
                           name: aNameCol > -1 ? String(r[aNameCol] || pCode).trim() : pCode,
                           partnerName: aPartnerCol > -1 ? String(r[aPartnerCol] || '').trim() : '',
                           mName: mc.month, 
                           year: mc.year 
                         };
                      } else {
                        if (aNameCol > -1 && (!partnerRankMap[key].name || partnerRankMap[key].name === pCode)) {
                          partnerRankMap[key].name = String(r[aNameCol] || pCode).trim();
                        }
                        if (aPartnerCol > -1 && !partnerRankMap[key].partnerName) {
                          partnerRankMap[key].partnerName = String(r[aPartnerCol] || '').trim();
                        }
                      }
                      if (mScore > 0) partnerRankMap[key].centerMonthlyScore = mScore;
                      if (mRank > 0) partnerRankMap[key].centerMonthlyRank = mRank;
                   }
                }
             }
          }
        }

        for (const [key, rd] of Object.entries(partnerRankMap)) {
           const hasAnyData = rd.monthlyScore || rd.partnerScore || rd.monthlyRank || rd.monthlyEvalRank || rd.ltp || rd.ltpVd || rd.ltpDa || rd.evalMonthlyScore || rd.centerMonthlyScore || rd.tc || rd.sdr || rd.audit || rd.ofs || rd.ssr || rd.rCxe || rd.coa || rd.switching || rd.owRnps || rd.dRnps || rd.nps || rd.npsDr || rd.appointments || rd.pr || rd.exLtp || rd.redo || rd.redoVd || rd.redoDa;
           if (!hasAnyData) continue;
           const ytd = ytdRankMap[rd.code] || {};
           const prVal = rd.pr || 0;
           const capDefaults = appMode === 'PQA_CE' ? PQA_KPI_DEFAULTS_CE : PQA_KPI_DEFAULTS_MX;
           const kpiDerived = calculatePQAScore({
             ltp: rd.ltp || 0, exLtp: rd.exLtp || 0, redo: rd.redo || 0, ssr: rd.ssr || 0, dRnps: rd.dRnps || 0,
             ofs: rd.ofs || 0, rCxe: rd.rCxe || 0, sdr: rd.sdr || 0, audit: rd.audit || 0, pr: prVal,
           });
          // CE: monthly score/rank source is ★Monthly Average.
          // MX: monthly total source is ★Evaluation point (Σpoint), then other monthly sources.
          const rawExcel = appMode === 'PQA_CE'
            ? (rd.centerMonthlyScore ?? rd.monthlyScore ?? rd.evalMonthlyScore)
            : (rd.evalMonthlyScore ?? rd.monthlyScore ?? rd.centerMonthlyScore);
           let tcsVal = kpiDerived;
           if (rawExcel != null && rawExcel !== '' && Number.isFinite(Number(rawExcel))) {
             const n = Number(rawExcel);
            if (appMode === 'PQA_CE') {
              if (n > 0) tcsVal = Number(n.toFixed(1));
            } else {
              if (n > 0 && n <= 100) tcsVal = Number(n.toFixed(1));
              else if (n > 100) tcsVal = kpiDerived;
            }
           }
          const canonicalPartner = codeToOfficialPartner[rd.code] || mapPqaSheetPartnerKeyToOfficial(rd.partnerName || '');
          const pqaRecord = {
              id: '', region: rd.region || '', code: rd.code || 'Unknown', name: rd.name || rd.code || 'Unknown',
             photoUrl: 'https://picsum.photos/200', partnerName: canonicalPartner || rd.partnerName || 'N/A',
              month: rd.mName || 'Unknown', year: rd.year || '2026',
              pqaBranch: appMode,
              ltp: rd.ltp||0, ltpVd: rd.ltpVd||0, ltpDa: rd.ltpDa||0, exLtp: rd.exLtp||0, redo: rd.redo||0, redoVd: rd.redoVd||0, redoDa: rd.redoDa||0, owRnps: rd.owRnps||0, 
              ssr: rd.ssr||0, dRnps: rd.dRnps||0, ofs: rd.ofs||0, rCxe: rd.rCxe||0, 
              nps: rd.nps||0, npsDr: rd.npsDr||0, appointments: rd.appointments||0, coa: rd.coa||0, sdr: rd.sdr||0, switching: rd.switching||0, audit: rd.audit||0, tc: rd.tc||0, pr: prVal,
              pqaKpiCaps: rd.pqaKpiCaps ? { ...capDefaults, ...rd.pqaKpiCaps } : { ...capDefaults },
              accumulatedScore: rd.accumulatedScore || ytd.ytdScore || 0,
              accumulatedRank: rd.accumulatedRank || ytd.ytdRank || 0,
              ytdScore: rd.accumulatedScore || ytd.ytdScore || 0,
              centerYtdScore: ytd.centerYtdScore || 0,
              ytdRank: rd.accumulatedRank || ytd.ytdRank || 0,
              centerYtdRank: ytd.centerYtdRank || 0,
              monthlyRank: rd.monthlyRank || 0, 
              monthlyEvalRank: rd.monthlyEvalRank || 0,
              monthlyScore: rd.monthlyScore || 0,
              centerMonthlyScore: rd.centerMonthlyScore || 0,
              centerMonthlyRank: rd.centerMonthlyRank || 0,
              partnerScore: rd.partnerScore || 0,
              evalMonthlyScore: rd.evalMonthlyScore ?? 0,
              tcsScore: tcsVal,
           };
           pqaRecord.tier = getTier(pqaRecord.tcsScore);
           uploadedRecords.push(pqaRecord);
        }

      } else if (uploadMode === 'TCS_MX' && uploadMxRole === 'engineers' && workbookHasEngineerWide(workbook)) {
        const { records, headerRow, sheetName, quartersFound } = parseUnifiedEngineerWorkbook(workbook, {
          year: String(new Date().getFullYear()),
        });
        if (headerRow < 0) {
          message.warning('No Engineer_Wide header row found. Expected columns: Engineer Code, Q1 - …, Q2 - …, Notes.');
          return;
        }
        if (sheetName) {
          console.info(`TCS unified import: sheet "${sheetName}" (${records.length} engineers, quarters: ${quartersFound.join(', ') || 'none'})`);
        }
        uploadedRecords = records.map((eng) => ({
          ...eng,
          tier: getMxEvaluationTier(eng.engineerEvaluation ?? eng.tcsScore),
        }));
      } else if (uploadMode === 'TCS_DA' || uploadMode === 'TCS_AV' || uploadMode === 'TCS_VD') {
        // Always use the DA/AV wide KPI parser for these divisions — never the MX IQC Skip path.
        const expectedProduct = uploadMode === 'TCS_DA' ? 'DA' : 'AV';
        let { records, headerRow, sheetName, quartersFound } = parseDaAvUnifiedWorkbook(workbook, {
          year: String(new Date().getFullYear()),
          expectedProduct,
        });
        // If product filter emptied the set (e.g. sheet has no Product column tagged wrong),
        // retry without product filter and keep rows in the active division collection.
        if (headerRow >= 0 && records.length === 0) {
          const retry = parseDaAvUnifiedWorkbook(workbook, {
            year: String(new Date().getFullYear()),
            expectedProduct: '',
          });
          records = (retry.records || []).map((eng) => ({
            ...eng,
            product: expectedProduct,
          }));
          headerRow = retry.headerRow;
          sheetName = retry.sheetName;
          quartersFound = retry.quartersFound;
        }
        if (headerRow < 0) {
          message.warning(
            'No DA/AV KPI header row found. Expected columns: Engineer Code, Partner, ASC, Service Type, Q1 Final, Q2 Final (and Q1/Q2 KPI columns).',
          );
          return;
        }
        if (records.length === 0) {
          message.warning('DA/AV sheet found but no engineer rows with Engineer Code. Check that data rows are filled.');
          return;
        }
        if (sheetName) {
          console.info(
            `TCS DA/AV KPI import: sheet "${sheetName}" (${records.length} engineers, quarters: ${quartersFound.join(', ') || 'none'}, product: ${expectedProduct})`,
          );
        }
        uploadedRecords = records.map((eng) => ({
          ...eng,
          product: eng.product || expectedProduct,
          tier: getTier(eng.engineerEvaluation ?? eng.tcsScore),
        }));
      } else if (uploadMode === 'TCS_MX' && uploadMxRole === 'receptionists') {
        const { records, headerRow, sheetName } = parseReceptionistWorkbook(workbook);
        if (headerRow < 0) {
          message.warning('No receptionist header row found. Use the downloaded template (Quarter, GSPN ID, ASC_Recep, ASC_CODE, Vote for Me, IQC First Time Fail, DRNPS, Exam, Co.A, TCS Score).');
          return;
        }
        if (sheetName) {
          console.info(`Receptionist import: using sheet "${sheetName}" (${records.length} rows)`);
        }
        uploadedRecords = records.map((eng) => ({
          ...eng,
          tier: getMxEvaluationTier(calculateReceptionistScore(eng)),
        }));
      } else {
        const tcsModeForProduct = targetTcsMode || appMode;
        const expectedProduct =
          tcsModeForProduct === 'TCS_DA' ? 'DA' : tcsModeForProduct === 'TCS_AV' || tcsModeForProduct === 'TCS_VD' ? 'AV' : 'MX';
        const picked = pickBestTcsWorksheetRows(workbook);
        const rows = picked.rows;
        if (!rows.length) {
          message.warning('No TCS worksheet with engineer data found. Check that your file has ENGINEER code and IQC Skip % columns.');
        }
        const { records, headerRow } = parseTcsScoreSheetRows(rows, {
          expectedProduct,
          tcsMode: tcsModeForProduct,
        });
        if (headerRow < 0) {
          message.warning('No TCS header row found. Use the downloaded template (Engineer Code, SSR, RRR, IQCSkipRatio, etc.).');
        } else if (picked.sheetName) {
          console.info(`TCS import: using sheet "${picked.sheetName}" (${records.length} rows)`);
        }
        uploadedRecords = records.map((eng) => ({
          ...eng,
          tier:
            tcsModeForProduct === 'TCS_MX'
              ? getMxEvaluationTier(eng.engineerEvaluation)
              : getTier(eng.tcsScore),
        }));
      }

      if (uploadedRecords.length === 0) {
        message.warning("No valid data found in the Excel sheet. Check headers (Region, ASC Code, ASC Name).");
        return;
      }

      const resolveCollectionForRecord = (rec) => {
        if (isPqaMode) return uploadCol;
        const product = String(rec?.product || '').toUpperCase().trim();
        if (product === 'DA') return resolveFirestoreCollection('TCS_DA');
        if (product === 'AV' || product === 'VD') return resolveFirestoreCollection('TCS_AV');
        // Dual-product engineers stay in the division being uploaded (DA or AV tab).
        if (product === 'AV+DA' || product === 'AV+HA') return uploadCol;
        if (product === 'MX') return resolveFirestoreCollection('TCS_MX', tcsMxRoleTab);
        return uploadCol;
      };
      const groupedUploadSet = {};
      for (const rec of uploadedRecords) {
        const targetCol = resolveCollectionForRecord(rec);
        const existingRows = await getExistingForCollection(targetCol);
        const isDaAvUnified = rec.format === TCS_DA_AV_UNIFIED_FORMAT;
        const isUnified = isDaAvUnified || rec.format === TCS_MX_UNIFIED_FORMAT || isUnifiedEngineerRecord(rec);
        const existing = existingRows.find((e) => {
          if (!engineerCodeEquals(e.code, rec.code) && !engineerCodeEquals(e.engineerCode, rec.code)) return false;
          // Unified engineers: one Firestore doc per code (quarters live on the doc).
          if (isUnified) return true;
          return (
            e.month?.toLowerCase() === rec.month?.toLowerCase() &&
            String(e.year) === String(rec.year)
          );
        });
        const finalRec = existing
          ? {
              ...existing,
              ...rec,
              id: existing.id,
              photoUrl: resolveEngineerPhotoForImport(rec, existing),
              ...(isUnified
                ? {
                    quarters: { ...(existing.quarters || {}), ...(rec.quarters || {}) },
                    format: isDaAvUnified ? TCS_DA_AV_UNIFIED_FORMAT : TCS_MX_UNIFIED_FORMAT,
                  }
                : {}),
            }
          : { ...rec, photoUrl: resolveEngineerPhotoForImport(rec, null) };
        if (!groupedUploadSet[targetCol]) groupedUploadSet[targetCol] = [];
        groupedUploadSet[targetCol].push(finalRec);
      }

      try {
        const savedByCollection = {};
        for (const [targetCol, records] of Object.entries(groupedUploadSet)) {
          const promises = records.map(async (rec) => {
            const savedId = await saveEngineerToDb(rec, targetCol);
            return { ...rec, id: savedId || rec.id };
          });
          savedByCollection[targetCol] = await Promise.all(promises);
        }
        const currentCollection = colName;
        const savedCurrent = savedByCollection[currentCollection] || [];
        if (savedCurrent.length > 0) {
          const freshEngineers = await getEngineers(currentCollection);
          setEngineers(freshEngineers);
          setSelectedEngineer((prev) => {
            if (!prev) return prev;
            const byId = freshEngineers.find((e) => e.id === prev.id);
            if (byId) return byId;
            const codeKey = String(prev.code || '').replace(/\D/g, '');
            return (
              freshEngineers.find((e) => String(e.code || '').replace(/\D/g, '') === codeKey) || prev
            );
          });
        }
        const totalSaved = Object.values(savedByCollection).reduce((sum, arr) => sum + arr.length, 0);
        const summary = Object.entries(savedByCollection)
          .map(([col, arr]) => `${col}: ${arr.length}`)
          .join(' | ');

        const label = targetTcsMode || appMode;
        message.success(`Success: ${totalSaved} records processed (${label}). ${summary}`);
        writeLog({ type: 'ADMIN_ACTION', actor: currentUser?.username || 'admin', action: `Excel Bulk Import (${targetTcsMode || appMode})`, details: { count: totalSaved, collectionSummary: summary }, severity: 'info' });
      } catch (error) {
        console.error("Error uploading Excel data:", error);
        message.error("Error saving Excel data to database.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black animate-pulse uppercase tracking-widest">Initializing TCS Protocol...</div>;
  }

  // Never block admin login on Firestore list permissions — Auth is Firebase Auth now.
  if (false && fetchError && view === 'ADMIN_LOGIN' && admins.length === 0) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Info className="w-12 h-12" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Database Connection Critical Error</h2>
        <p className="max-w-md text-xs font-medium uppercase tracking-widest leading-loose opacity-70">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full">Retry Connection</button>
      </div>
    );
  }

  const pwaReady =
    !isLoading &&
    !isAdminPortal &&
    view !== 'ADMIN_LOGIN' &&
    view !== 'ADMIN_DASHBOARD' &&
    view !== 'EXTERNAL_LOGS';
  const pwaBlockedByCriticalUi =
    !!showRankReveal ||
    !!showPhotoAuth ||
    !!portalLaunchBusy ||
    !!showEmployeeAuth ||
    view === 'SAMSUNG_ACADEMY_SURVEY' ||
    view === 'FEEDBACK';

  return (
    <div className="mobile-page-shell relative z-[1] min-h-screen bg-black text-white flex flex-col pb-24 selection:bg-blue-600 selection:text-white">
      {portalLaunchOverlay}
      <Header
        onHome={() => {
          if (isAdminPortal) {
            setView(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN');
          } else {
            setView('HOME');
          }
        }}
        onLogoClick={() => {
          if (isAdminPortal) {
            viewStackRef.current = [isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN'];
            setView(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN');
          } else {
            viewStackRef.current = ['APP_SELECTION'];
            setAppMode(null);
            setPortalRealm(null);
            setView('APP_SELECTION');
          }
        }}
        appMode={appMode}
        isAdminPortal={isAdminPortal}
        employeeLoggedIn={employeeLoggedIn}
        employeeLabel={employeeProfile?.gspnId || employeeProfile?.email || 'Profile'}
        onEmployeeSignIn={() => setShowEmployeeAuth(true)}
        onEmployeeDashboard={() => navigateTo('EMPLOYEE_DASHBOARD')}
        onEmployeeSignOut={async () => {
          await employeeLogout();
          navigateTo(appMode ? 'HOME' : 'APP_SELECTION');
        }}
      />

      <main className={`flex-1 w-full min-w-0 mx-auto px-4 py-8 overflow-x-clip ${
        view === 'ADMIN_DASHBOARD'
          ? 'max-w-[min(100%,1680px)]'
          : 'max-w-4xl'
      }`}>
        {!isAdminPortal && academySurveySettingsLoaded && notifyAlertsEnabled && (
          <NotifyAlertsBanner
            ready={pwaReady && !pwaInstallSheetOpen}
            blocked={pwaBlockedByCriticalUi || pwaInstallSheetOpen}
            userId={employeeProfile?.uid || currentUser?.uid || null}
            onToast={(text) => message.info(text)}
          />
        )}
        {/* Error Notification */}
        {fetchError && (
          <div className="mb-8 p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-4 duration-500">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">{fetchError}</p>
          </div>
        )}

        {/* Animated page content wrapper — key changes on view to trigger re-animation */}
        <div key={view} className="relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out">

          {view === 'EMPLOYEE_DASHBOARD' && (
            employeeLoggedIn && employeeProfile ? (
            <EmployeeDashboard
              profile={employeeProfile}
              initialTab="pending"
              onBack={() => navigateTo(appMode ? 'HOME' : 'APP_SELECTION')}
              onSignOut={async () => {
                await employeeLogout();
                navigateTo(appMode ? 'HOME' : 'APP_SELECTION');
              }}
              onOpenConsultant={(id) => {
                if (!employeeLoggedIn) {
                  setShowEmployeeAuth(true);
                  return;
                }
                setActiveConsultantId(id);
                navigateTo('CONSULTANT_VIEWER');
              }}
              onSearchEngineer={(code) => {
                setSearchCode(String(code || ''));
                if (!appMode) {
                  setPortalRealm('TCS');
                  setAppMode('TCS_MX');
                }
                setProfileOpenedByExactCode(false);
                navigateTo('ENGINEER_LOOKUP');
              }}
            />
            ) : (
              <div className="text-center space-y-4 py-16">
                <p className="text-sm text-zinc-400">Sign in with your GSPN account to open My Knowledge.</p>
                <button
                  type="button"
                  onClick={() => setShowEmployeeAuth(true)}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  Employee sign in
                </button>
              </div>
            )
          )}

          {view === 'CONSULTANT_VIEWER' && activeConsultantId && (
            employeeLoggedIn && employeeProfile?.uid ? (
            <ConsultantViewer
              consultantId={activeConsultantId}
              uid={employeeProfile.uid}
              onBack={() => navigateTo('EMPLOYEE_DASHBOARD')}
              onFinished={(result) => {
                if (result?.passed) setGogoTipCompleteNonce((n) => n + 1);
              }}
            />
            ) : (
              <div className="text-center space-y-4 py-16">
                <p className="text-sm text-zinc-400">Sign in required to complete this course.</p>
                <button
                  type="button"
                  onClick={() => setShowEmployeeAuth(true)}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  Employee sign in
                </button>
              </div>
            )
          )}

          {view === 'APP_SELECTION' && (
            <MotionStage className="flex min-h-0 flex-col items-center justify-start space-y-10 py-2 lg:min-h-[80vh] lg:justify-center lg:space-y-12">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">System Gateway</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-blue-600">Portal</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your destination environment to proceed with operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
                {/* TCS Portal (Engineers) */}
                <MotionCard index={0}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('tcs', () => {
                      setPortalRealm('TCS');
                      if (academySurveyPopupEnabled) setShowSurveyShortcut(true);
                      navigateTo('TCS_DIVISION_SELECTION');
                    });
                  }}
                  data-gogo-target="tcs"
                  className="group relative w-full h-[32rem] rounded-[4.5rem] p-8 md:p-12 flex flex-col items-center justify-center gap-6 md:gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-blue-500/40 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-950 border border-blue-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-hidden portal-logo-float">
                    <img src="/fawzy-logo.png" alt="TCS" className="w-full h-full object-contain rounded-[2.5rem] sm:rounded-[3.5rem]" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">TCS Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">( Engineers )</p>
                  </div>
                </button>
                </MotionCard>

                {/* PQA Portal (Service Center) */}
                <MotionCard index={1}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('pqa', () => {
                      setPortalRealm('PQA');
                      navigateTo('PQA_DIVISION_SELECTION');
                    });
                  }}
                  data-gogo-target="pqa"
                  className="group relative w-full h-[32rem] rounded-[4.5rem] p-8 md:p-12 flex flex-col items-center justify-center gap-6 md:gap-8 overflow-hidden border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-yellow-500/40 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-yellow-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden portal-logo-float">
                    <img src="/pqa_logo.png" alt="PQA" className="w-full h-full object-contain rounded-[2.5rem] sm:rounded-[3.5rem]" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">PQA Portal</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">( Service Center )</p>
                  </div>
                </button>
                </MotionCard>
              </div>
            </MotionStage>
          )}

          {view === 'TCS_DIVISION_SELECTION' && (
            <MotionStage className="relative flex min-h-0 flex-col items-center justify-start space-y-10 py-2 lg:min-h-[80vh] lg:justify-center lg:space-y-12">
              <button
                type="button"
                onClick={() => navigateTo('APP_SELECTION')}
                className="lg:self-start lg:ml-8 xl:ml-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10 mb-8 lg:mb-0"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Gateway
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">TCS Environment</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-blue-500">Division</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your TCS division (Mobile Experience, Digital Appliances, AV).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4" data-gogo-target="tcs">
                <MotionCard index={0}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('tcs_mx', () => {
                      setPortalRealm('TCS');
                      setAppMode('TCS_MX');
                      navigateTo('HOME');
                    });
                  }}
                  className="group relative w-full min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden portal-logo-float">
                    <img src="/mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>
                </MotionCard>

                <MotionCard index={1}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('tcs_da', () => {
                      setPortalRealm('TCS');
                      setAppMode('TCS_DA');
                      navigateTo('HOME');
                    });
                  }}
                  className="group relative w-full min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-amber-500/30 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-zinc-950 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden portal-logo-float">
                    <img src="/ce_logo.png" alt="DA" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">DA Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Digital Appliances</p>
                  </div>
                </button>
                </MotionCard>

                <MotionCard index={2}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('tcs_av', () => {
                      setPortalRealm('TCS');
                      setAppMode('TCS_AV');
                      navigateTo('HOME');
                    });
                  }}
                  className="group relative w-full min-h-[22rem] md:min-h-[28rem] rounded-[4rem] p-10 flex flex-col items-center justify-center gap-8 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-cyan-500/30 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-[#3d3d3d] flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden portal-logo-float">
                    <img src="/av_division.png" alt="AV division" className="h-full w-full object-contain object-center bg-[#3d3d3d]" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-cyan-400 transition-colors">AV Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Audio · Visual</p>
                  </div>
                </button>
                </MotionCard>
              </div>
            </MotionStage>
          )}

          {view === 'PQA_DIVISION_SELECTION' && (
            <MotionStage className="relative flex min-h-0 flex-col items-center justify-start space-y-10 py-2 lg:min-h-[80vh] lg:justify-center lg:space-y-12">
              <button
                type="button"
                onClick={() => navigateTo('APP_SELECTION')}
                className="lg:self-start lg:ml-8 xl:ml-24 flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10 mb-8 lg:mb-0"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Gateway
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">PQA Environment</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  Select <span className="text-yellow-500">Division</span>
                </h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-md mx-auto">Choose your division cluster.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4" data-gogo-target="pqa">
                <MotionCard index={0}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('pqa_mx', () => {
                      setPortalRealm('PQA');
                      setAppMode('PQA_MX');
                      navigateTo('HOME');
                    });
                  }}
                  className="group relative w-full h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/30 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden portal-logo-float">
                    <img src="/mx_logo.png" alt="MX" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">MX Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Experience</p>
                  </div>
                </button>
                </MotionCard>

                <MotionCard index={1}>
                <button
                  type="button"
                  disabled={portalLaunchBusy}
                  onClick={() => {
                    launchPortal('pqa_ce', () => {
                      setPortalRealm('PQA');
                      setAppMode('PQA_CE');
                      navigateTo('HOME');
                    });
                  }}
                  className="group relative w-full h-[32rem] rounded-[4.5rem] p-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 transition-colors duration-500 shadow-2xl disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-64 h-64 rounded-[3.5rem] bg-zinc-950 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden portal-logo-float">
                    <img src="/ce_logo.png" alt="CE" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">CE Division</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Consumer Electronics</p>
                  </div>
                </button>
                </MotionCard>
              </div>
            </MotionStage>
          )}

                    {view === 'HOME' && (
            <MotionStage className="space-y-10 sm:space-y-16 max-w-[100vw] overflow-x-hidden px-2 sm:px-4 box-border" delay={0.05}>
              {/* Hero Section */}
              <section className="relative px-4 text-center space-y-4 pt-8">
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase">
                  {appMode?.startsWith('PQA') ? 'Evolution' : 'Beyond'}<span className="text-blue-600"> {appMode?.startsWith('PQA') ? 'in Quality' : 'Standards'}</span><br />
                  {appMode?.startsWith('PQA') ? 'Defined' : 'Above'}<span className="text-blue-600"> {appMode?.startsWith('PQA') ? 'by Rank' : 'Average'}</span>
                </h2>
              </section>

              {/* Dashboard Toggle */}
              <div className="flex flex-col items-center gap-6">
                <div className="bg-zinc-900/60 p-2 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-2xl">
                  {appMode?.startsWith('PQA') && (
                    <button
                      onClick={() => setHomeViewMode('MONTHLY')}
                      className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'MONTHLY'
                        ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      Monthly
                    </button>
                  )}
                  <button
                    onClick={() => setHomeViewMode('QUARTERLY')}
                    className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${homeViewMode === 'QUARTERLY'
                      ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                      : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    {appMode?.startsWith('PQA') ? 'Accumulated' : 'Quarterly'}
                  </button>
                </div>

                {appMode === 'TCS_MX' && (
                  <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex flex-wrap items-center justify-center gap-1 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-700">
                    {TCS_MX_ROLE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setTcsMxRoleTab(tab.key)}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${tcsMxRoleTab === tab.key
                          ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                          : 'text-zinc-500 hover:text-white'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {appMode === 'PQA_MX' && (
                  <div className="bg-zinc-900/60 p-1.5 rounded-full border border-white/10 flex items-center backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-700">
                    <button
                      onClick={() => setPqaMxGroupBy('PARTNER')}
                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'PARTNER'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      By Partner
                    </button>
                    <button
                      onClick={() => setPqaMxGroupBy('CENTER')}
                      className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pqaMxGroupBy === 'CENTER'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                      By Service Center
                    </button>
                  </div>
                )}
              </div>

              {/* ── Content Switcher: MONTHLY | ACCUMULATED ────────────────────────── */}
              {homeViewMode === 'MONTHLY' ? (
                <div className="mx-auto w-full min-w-0 max-w-5xl space-y-12 px-1 animate-in fade-in zoom-in-95 duration-500 sm:px-4">
                  {/* Month Selector */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <button
                      onClick={() => {
                        const idx = allMonthPeriods.findIndex(p => p.key === effectiveHofMonth);
                        if (idx > 0) setSelectedHofMonth(allMonthPeriods[idx - 1].key);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-yellow-500/20 rounded-2xl px-8 py-4">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      <span className="text-base font-black text-white uppercase tracking-widest">
                        {effectiveHofMonth ? effectiveHofMonth.replace('-', ' ') : 'No Data'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const idx = allMonthPeriods.findIndex(p => p.key === effectiveHofMonth);
                        if (idx < allMonthPeriods.length - 1) setSelectedHofMonth(allMonthPeriods[idx + 1].key);
                      }}
                      className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Ranking List Monthly */}
                  <div className="space-y-4">
                    <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                      {appMode === 'PQA_MX' && pqaMxGroupBy === 'PARTNER'
                        ? 'All 7 Partners — Monthly Ranking'
                        : appMode?.startsWith('PQA')
                          ? 'All Service Centers — Monthly Ranking'
                          : `Top ${dashboardWinnersSlotCount} Winners`}
                    </h3>
                        {monthlyDashboardList.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">
                        {isTcsMode && isTcsMxAlternateRole
                          ? `No ${tcsMxPersonLabel.toLowerCase()} data for this period. Add records in Admin → TCS MX → ${TCS_MX_ROLE_TABS.find((t) => t.key === tcsMxRoleTab)?.label || 'Role'}.`
                          : isTcsMode
                          ? hasTcsWinnersConfig
                            ? `No roster matches for your configured winners (${winnersScopeQuarterKey || ''}). Check SBA ID / engineer codes in Admin → Dashboard Winners.`
                            : `No configured winners for ${tcsDashboardProduct || 'TCS'} ${winnersScopeQuarterKey || ''}. Add Top ${dashboardWinnersSlotCount} in Admin Portal → Dashboard Winners.`
                          : 'No data for this period.'}
                      </div>
                    ) : (
                      <>
                        {renderHomeRankingPodium(
                          monthlyDashboardList,
                          appMode === 'TCS_MX' ? getMxRoleLeaderboardScoreField(tcsMxRoleTab) : 'tcsScore',
                          appMode?.startsWith('PQA') ? 'PQA Score' : appMode === 'TCS_MX' ? getMxRoleLeaderboardScoreLabel(tcsMxRoleTab) : 'TCS Score'
                        )}
                        {monthlyDashboardList.slice(3).map((eng, idx) => {
                          const displayRank = eng.displayRank ?? idx + 4;
                          const isFirst = displayRank === 1;
                          const isSecond = displayRank === 2;
                          const isThird = displayRank === 3;
                          const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                          const scoreLabel = appMode?.startsWith('PQA') ? 'PQA Score' : appMode === 'TCS_MX' ? getMxRoleLeaderboardScoreLabel(tcsMxRoleTab) : 'TCS Score';
                          const displayScore = appMode === 'TCS_MX' ? resolveTcsDashboardScore(eng) : parseFloat(eng.tcsScore);
                          return (
                            <div key={eng.id || eng.code} className={`glass-card rounded-[2.5rem] p-4 md:p-8 flex items-center gap-4 md:gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                              {renderRankBadgeList(displayRank, isFirst, isSecond, isThird, eng)}
                              <img
                                src={getPhotoUrl(eng)}
                                onError={handleEngineerPhotoError}
                                className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl ${getLogoStyle(getPhotoUrl(eng))} flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`}
                                alt={tcsDisplayPrimary(eng)}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-[11px] xs:text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight line-clamp-2 sm:truncate break-words ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{tcsDisplayPrimary(eng)}</h4>
                                {tcsDisplaySecondary(eng) ? (
                                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 line-clamp-2 break-words normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                                ) : null}
                                {!appMode?.startsWith('PQA') && !isTcsMode && (
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <TierBadge tier={eng.tier} size="sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {isTcsMode ? (
                                  <img
                                    src={(TIER_META[resolveTierByMode(eng)] || TIER_META.Bronze).img}
                                    alt={resolveTierByMode(eng) || 'Rank'}
                                    className="h-12 w-12 md:h-[4.25rem] md:w-[4.25rem] object-contain tier-emblem-blend"
                                  />
                                ) : (
                                  <>
                                    <span className={`text-xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                                      {Number.isFinite(displayScore) ? displayScore.toFixed(1) : '—'}
                                    </span>
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{scoreLabel}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* ── ACCUMULATED view ─────────────────────────────────────────────── */
                <div className="mx-auto w-full min-w-0 max-w-5xl space-y-12 px-1 animate-in fade-in zoom-in-95 duration-500 sm:px-4">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <div className="flex min-w-0 max-w-[min(100%,20rem)] items-center gap-2 rounded-2xl border border-blue-500/20 bg-zinc-900 px-4 py-3 sm:gap-3 sm:px-8 sm:py-4">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="truncate text-center text-xs font-black uppercase tracking-widest text-white sm:text-base">
                        {appMode?.startsWith('PQA') ? '2026 — Year to Date' : tcsQuarterPeriodLabel}
                      </span>
                    </div>
                    {!appMode?.startsWith('PQA') && (
                      <>
                        <button onClick={() => { const idx = allQuarterKeys.indexOf(effectiveQuarterKey); if (idx < allQuarterKeys.length - 1) setSelectedQuarterKey(allQuarterKeys[idx + 1]); }} className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => { const idx = allQuarterKeys.indexOf(effectiveQuarterKey); if (idx > 0) setSelectedQuarterKey(allQuarterKeys[idx - 1]); }} className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"><ChevronRight className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    {appMode?.startsWith('PQA') && appMode !== 'PQA_CE' && (
                      <h3 className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">
                        {pqaMxGroupBy === 'PARTNER' ? 'All 7 Partners — Accumulated Average' : 'All Service Centers — Accumulated Average'}
                      </h3>
                    )}
                    {quarterlyDashboardList.length === 0 ? (
                      <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest bg-zinc-900/30 rounded-[3rem] border border-white/5">
                        {appMode?.startsWith('PQA')
                          ? 'No accumulated data — upload Excel with ★Partner Ranking sheet.'
                          : isTcsMode && isTcsMxAlternateRole
                          ? `No ${tcsMxPersonLabel.toLowerCase()} data for this quarter. Add records in Admin → TCS MX → ${TCS_MX_ROLE_TABS.find((t) => t.key === tcsMxRoleTab)?.label || 'Role'}.`
                          : isTcsMode
                          ? hasTcsWinnersConfig
                            ? `No roster matches for your configured winners (${winnersScopeQuarterKey || ''}). Check SBA ID / engineer codes in Admin → Dashboard Winners.`
                            : `No configured winners for ${tcsDashboardProduct || 'TCS'} ${winnersScopeQuarterKey || ''}. Add Top ${dashboardWinnersSlotCount} in Admin Portal → Dashboard Winners.`
                          : 'No data for this quarter.'}
                      </div>
                    ) : (() => {
                      const accLimit = appMode?.startsWith('PQA') ? 500 : TCS_HOME_LEADERBOARD_LIMIT;
                      const accList = isTcsMode ? quarterlyDashboardList : quarterlyDashboardList.slice(0, accLimit);
                      const avgLabel = appMode?.startsWith('PQA') ? 'Acc. Avg PQA' : appMode === 'TCS_MX' ? getMxRoleLeaderboardScoreLabel(tcsMxRoleTab) : 'TCS Score';
                      return (
                        <>
                          {renderHomeRankingPodium(accList, 'avgScore', avgLabel)}
                          {accList.slice(3).map((eng, idx) => {
                            const displayRank = eng.displayRank ?? idx + 4;
                            const isFirst = displayRank === 1;
                            const isSecond = displayRank === 2;
                            const isThird = displayRank === 3;
                            const cardBorder = isFirst ? 'border-yellow-500/40 shadow-yellow-500/10 shadow-2xl' : isSecond ? 'border-zinc-300/20' : isThird ? 'border-orange-700/20' : 'border-white/5';
                            return (
                              <div key={`${eng.id || eng.code}-acc`} className={`glass-card rounded-[2.5rem] p-4 md:p-8 flex items-center gap-4 md:gap-6 border transition-all hover:border-white/20 ${cardBorder}`}>
                                {renderRankBadgeList(displayRank, isFirst, isSecond, isThird, eng)}
                                <img
                                  src={getPhotoUrl(eng)}
                                  onError={handleEngineerPhotoError}
                                  className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl ${getLogoStyle(getPhotoUrl(eng))} flex-shrink-0 ${isFirst ? 'border-2 border-yellow-500' : 'border border-white/10'}`}
                                  alt={tcsDisplayPrimary(eng)}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-[11px] xs:text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight line-clamp-2 sm:truncate break-words ${isFirst ? 'text-yellow-400' : 'text-white'}`}>{tcsDisplayPrimary(eng)}</h4>
                                  {tcsDisplaySecondary(eng) ? (
                                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 line-clamp-2 break-words normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                                  ) : null}
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {!appMode?.startsWith('PQA') && !isTcsMode && <TierBadge tier={eng.tier} size="sm" />}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  {isTcsMode ? (
                                    <img
                                      src={(TIER_META[resolveTierByMode(eng)] || TIER_META.Bronze).img}
                                      alt={resolveTierByMode(eng) || 'Rank'}
                                      className="h-12 w-12 md:h-[4.25rem] md:w-[4.25rem] object-contain tier-emblem-blend"
                                    />
                                  ) : (
                                    <>
                                      <span className={`text-xl md:text-4xl font-black italic tracking-tighter ${isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-orange-500' : 'text-white'}`}>
                                        {eng.avgScore != null ? parseFloat(eng.avgScore).toFixed(1) : '—'}
                                      </span>
                                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{avgLabel}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                </div>
              )}
            </MotionStage>
          )}

          {view === 'ENGINEER_LOOKUP' && (
            <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
              {appMode === 'TCS_MX' && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {TCS_MX_ROLE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setTcsMxRoleTab(tab.key)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tcsMxRoleTab === tab.key
                        ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                        : 'bg-zinc-900 text-zinc-500 border border-white/10 hover:text-white'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
              {/* Header section */}
              <div className=" gap-12 border-b border-white/5 pb-6">



                <button
                  onClick={() => setView('HOME')}
                  className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Return to Hub
                </button>

                <h2 className="text-6xl text-center font-black tracking-tighter text-white uppercase italic leading-none py-12">&ldquo;Precision Defines Rank.&rdquo;</h2>
              </div>


              {/* Central Verification Unit */}
              <div className="max-w-2xl mx-auto space-y-6">
                {portalVsAppMismatch ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Portal / division mismatch</p>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      {portalRealm === 'TCS'
                        ? 'You opened the TCS portal, but the active division is PQA. Use the top strip to switch to TCS MX, DA, or AV before searching — TCS uses engineer code.'
                        : 'You opened the PQA portal, but the active division is TCS. Use the top strip to switch to PQA MX or CE before searching — PQA uses service center code.'}
                    </p>
                  </div>
                ) : null}
                <div className="glass-card rounded-[4rem] p-12 md:p-16 space-y-12 border-blue-500/10 shadow-3xl text-center relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Search className="w-64 h-64 -rotate-12" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Credential Verification</h3>
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">
                      {searchIsPqaContext
                        ? 'Enter your service center code below'
                        : appMode === 'TCS_MX' && tcsMxRoleTab !== 'engineers'
                          ? `Enter your ${tcsMxPersonLabel.toLowerCase()} code below`
                          : 'Enter your engineer code below (Excel column “Engineer Code”) — not SBA ID'}
                    </p>
                  </div>

                  <form
                    className="space-y-8 relative z-10"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                    }}
                  >
                    <div className="relative group">
                      <input
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder={
                          searchIsPqaContext
                            ? 'SERVICE_CENTER_CODE'
                            : appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists'
                              ? 'GSPN_ID'
                              : appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants'
                                ? 'GALAXY_CONSULTANT_CODE'
                                : 'ENGINEER_CODE'
                        }
                        className="w-full bg-black border border-white/5 rounded-3xl p-6 md:p-8 text-center text-2xl md:text-4xl font-black tracking-[0.2em] md:tracking-[0.4em] focus:border-blue-500 transition-all outline-none placeholder:text-zinc-900 text-white shadow-inner"
                      />
                      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-500 group-focus-within:w-1/2 transition-all duration-700" />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black py-6 md:py-8 rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl"
                    >
                      Search
                    </button>
                  </form>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-6 relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Nodes Scanned</span>
                      <span className="text-sm font-black text-zinc-400 uppercase">Global_Registry</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Protocol</span>
                      <span className="text-sm font-black text-zinc-400 uppercase">{searchIsPqaContext ? 'PQA-V7.2' : 'TCS-V7.2'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'ADMIN_LOGIN' && (
            <div className="max-w-md mx-auto pt-24 space-y-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-white" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Secure Gateway</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">TERMINAL<br />LOGIN</h2>
                <p className="text-zinc-600 text-sm font-medium">Authentication required for management node access.</p>
              </div>

              <form
                className="space-y-6 bg-zinc-900 shadow-3xl p-10 rounded-[3rem] border border-white/5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdminLogin();
                }}
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access ID</label>
                  <input
                    type="text"
                    placeholder="USERNAME_ALPHA"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    autoComplete="username"
                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Security Token</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                  />
                </div>

                {/* Fallback Hint */}
                {admins.some(a => a.username === 'fawzy.m') && (
                  <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <p className="text-[9px] text-blue-500/70 font-medium uppercase tracking-widest text-center">
                      Hint: Use default credentials if database is empty.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-[0.3em] mt-6"
                >
                  Execute Initialization
                </button>
                <button
                  type="button"
                  onClick={() => setView('HOME')}
                  className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors py-4"
                >
                  Abort Connection
                </button>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="text-[8px] font-black text-zinc-800 uppercase tracking-widest hover:text-red-500 transition-all"
                  >
                    Clear Session Cache
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === 'ADMIN_DASHBOARD' && currentUser && (
            <AdminPortalShell
              activeTab={adminPanelTab}
              onTabChange={setAdminPanelTab}
              tabs={adminTabs}
              header={(
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500">Command Center</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">Admin Portal</h2>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/50 px-5 py-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
                    <UserCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">Operator</span>
                    <span className="text-xs font-black text-white uppercase">{currentUser.name}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-zinc-800 mx-1" />
                  {adminUndoCount > 0 && (
                    <button
                      type="button"
                      onClick={handleAdminUndo}
                      disabled={adminUndoRunning}
                      title="Undo last admin change (double confirmation)"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600/10 border border-amber-500/25 text-amber-300 hover:bg-amber-600/20 transition-all disabled:opacity-40 text-[9px] font-black uppercase tracking-widest"
                    >
                      <Undo2 className="w-4 h-4" />
                      Undo ({adminUndoCount})
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all group"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              )}
              statusBar={adminPanelTab === 'data' ? (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-[10px] font-bold text-zinc-400">
                <span className="text-zinc-500 uppercase tracking-widest">Working on</span>
                <span className="text-white font-black uppercase">{appMode || '—'}</span>
                <span className="text-zinc-700">·</span>
                <span>{engineers.length} active record{engineers.length === 1 ? '' : 's'}</span>
                {fetchedHiddenEngineers.length > 0 && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="text-red-400/90">{fetchedHiddenEngineers.length} archived</span>
                  </>
                )}
              </div>
              ) : null}
            >
              {adminPanelTab === 'data' && (
              <div className="space-y-8">
              {/* DATA sub-tabs: division / environment */}
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500">Data · environment</p>
                <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 bg-zinc-900/90 border border-white/10 rounded-3xl p-3 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_MX'); }}
                      disabled={!canAccessTcsEnv(currentUser)}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_MX' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <Users className="w-4 h-4" />
                      TCS MX
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_DA'); }}
                      disabled={!canAccessTcsEnv(currentUser)}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_DA' ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.35)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <Cpu className="w-4 h-4" />
                      TCS DA
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPortalRealm('TCS'); setAppMode('TCS_AV'); }}
                      disabled={!canAccessTcsEnv(currentUser)}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 ${appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.35)]' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <Monitor className="w-4 h-4" />
                      TCS AV
                    </button>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
                  <button
                    type="button"
                    onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_MX'); }}
                    disabled={!canAccessPqaEnv(currentUser)}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 ${appMode === 'PQA_MX' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Building2 className="w-4 h-4" />
                    PQA MX Division
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPortalRealm('PQA'); setAppMode('PQA_CE'); }}
                    disabled={!canAccessPqaEnv(currentUser)}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 ${appMode === 'PQA_CE' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Activity className="w-4 h-4" />
                    PQA CE Division
                  </button>
                </div>

                {appMode === 'TCS_MX' && (
                  <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-900/80 border border-purple-500/20 rounded-2xl p-2">
                    {TCS_MX_ROLE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setTcsMxRoleTab(tab.key)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tcsMxRoleTab === tab.key
                          ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                          : 'bg-zinc-900 text-zinc-500 border border-white/5 hover:text-white'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TCS — active profile workspace (division chosen in DATA sub-tabs above) */}
              {(canAccessModule(currentUser, 'tcs') && appMode?.startsWith('TCS')) && (() => {
                const activeTcs =
                  appMode === 'TCS_DA' ? 'TCS_DA' : appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'TCS_AV' : 'TCS_MX';
                const tabDef = {
                  TCS_MX: { label: 'TCS MX', short: 'MX', collection: colName, border: 'border-purple-500/25', img: '/mx_logo.png', imgClass: 'object-cover' },
                  TCS_DA: { label: 'TCS DA', short: 'DA', collection: 'tcs_da_engineers', border: 'border-amber-500/25', img: '/ce_logo.png', imgClass: 'object-cover' },
                  TCS_AV: { label: 'TCS AV', short: 'AV', collection: 'tcs_vd_engineers', border: 'border-cyan-500/25', img: '/av_division.png', imgClass: 'object-contain object-center bg-[#3d3d3d]' },
                };
                const cur = tabDef[activeTcs];
                const mxRoleLabel = activeTcs === 'TCS_MX'
                  ? (TCS_MX_ROLE_TABS.find((t) => t.key === tcsMxRoleTab)?.label || 'Engineers')
                  : null;
                return (
                  <div className={`rounded-[2rem] border bg-zinc-900/40 p-6 md:p-8 space-y-5 ${cur.border}`}>
                    <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-400 mb-1">TCS bulk data — {cur.short}{mxRoleLabel ? ` · ${mxRoleLabel}` : ''}</p>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">{cur.label}{mxRoleLabel ? ` — ${mxRoleLabel}` : ''}</h3>
                      <p className="text-[10px] text-zinc-500 font-medium max-w-2xl">
                        {activeTcs === 'TCS_MX' && tcsMxRoleTab === 'engineers'
                          ? <>Download <strong className="text-zinc-300">Engineer_Performance_Unified_Format.xlsx</strong>, fill the <strong className="text-zinc-300">Engineer_Wide</strong> sheet, then upload. One document per engineer (quarters live on the doc). <strong className="text-zinc-300">Engineer Code</strong> is the search ID. Collection: <span className="text-zinc-400 font-mono text-[9px]">{cur.collection}</span>.</>
                          : activeTcs === 'TCS_DA' || activeTcs === 'TCS_AV'
                            ? <>Download the single-sheet <strong className="text-zinc-300">TCS_DA_AV_KPI_Template</strong> (Engineer Name first, then Code, Partner, ASC, Service Type, Q1/Q2 KPIs), fill rows, then upload. Collection: <span className="text-zinc-400 font-mono text-[9px]">{cur.collection}</span>.</>
                            : <>Download the template, upload Excel, then manage records in the registry below. <strong className="text-zinc-300">{tcsMxRoleTab === 'receptionists' ? 'GSPN ID' : `${getTcsMxRolePersonLabel(tcsMxRoleTab)} Code`}</strong> is the search ID. Collection: <span className="text-zinc-400 font-mono text-[9px]">{cur.collection}</span>.</>}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 ${activeTcs === 'TCS_AV' ? 'bg-[#3d3d3d]' : 'bg-black'}`}>
                          <img src={cur.img} alt="" className={`h-full w-full ${cur.imgClass}`} style={activeTcs === 'TCS_AV' || activeTcs === 'TCS_VD' ? { transform: 'none' } : undefined} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">{cur.label}</p>
                          <p className="text-[9px] text-zinc-500">{engineers.length} record{engineers.length === 1 ? '' : 's'} in this division</p>
                        </div>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                        {adminCanReadData && (
                        <button
                          type="button"
                          onClick={() => downloadTcsBulkTemplate(tcsMxRoleTab)}
                          className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/80 border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                        >
                          <Download className="w-4 h-4" /> Template
                        </button>
                        )}
                        {adminCanWriteData && (
                        <label className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-wider hover:bg-blue-600/30 cursor-pointer transition-all">
                          <Upload className="w-4 h-4" /> Upload
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleExcelUpload(e, { targetTcsMode: activeTcs })} />
                        </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PQA — active profile workspace (division chosen in strip above; roster below) */}
              {(canAccessModule(currentUser, 'pqa') && isPqaMode) && (
                <div className="rounded-[2rem] border border-yellow-500/15 bg-zinc-900/40 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-yellow-500/90 mb-1">PQA bulk data — {appMode === 'PQA_CE' ? 'CE' : 'MX'}</p>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">PQA Excel (multi-sheet)</h3>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Template includes ★Evaluation point, ★Partner Ranking, and ★Monthly Average. Upload applies to <strong className="text-zinc-400">{appMode}</strong>. Full service-center list: <strong className="text-zinc-400">Live Engineer Registry</strong> below.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    {adminCanReadData && (
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/80 border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                    >
                      <Download className="w-4 h-4" /> PQA template
                    </button>
                    )}
                    {adminCanWriteData && (
                    <label className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-200 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/25 cursor-pointer transition-all">
                      <Upload className="w-4 h-4" /> PQA upload
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                    </label>
                    )}
                  </div>
                </div>
              )}

              {adminCanWriteData && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEng({
                    ...buildMxRoleEditingDefaults(appMode === 'TCS_MX' ? tcsMxRoleTab : 'engineers'),
                    photoUrl: appMode?.startsWith('PQA') ? PQA_SERVICE_CENTER_PHOTO : DEFAULT_ENGINEER_PHOTO_URL,
                  })}
                  className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  {appMode?.startsWith('PQA') ? 'Add Service Center' : `Add ${tcsMxPersonLabel}`}
                </button>
              </div>
              )}

              {(adminCanReadData || adminCanWriteData) && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                      Live {appMode?.startsWith('PQA') ? 'Service Center' : `${tcsMxPersonLabel}`} Registry
                    </h3>
                  </div>
                  <button
                    onClick={() => setNoEngineers(!noEngineers)}
                    className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all shadow-xl"
                  >
                    <Eye className="w-4 h-4" />
                    {noEngineers ? "Minimize Archives" : "Inspect Archives"}
                  </button>
                </div>

                {currentUser?.role === 'SUPER_ADMIN' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setBulkSelectedIds(allVisibleSelected ? [] : visibleRegistryIds)}
                      className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all"
                    >
                      {allVisibleSelected ? 'Clear Selection' : 'Select All'}
                    </button>
                    <button
                      onClick={bulkArchiveEngineersHandler}
                      disabled={bulkSelectedIds.length === 0}
                      className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-600/20 transition-all disabled:opacity-40"
                    >
                      Bulk Delete ({bulkSelectedIds.length})
                    </button>
                  </div>
                )}

                {/* Archive Stack */}
                {noEngineers && fetchedHiddenEngineers.length > 0 && (
                  <>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setBulkSelectedArchivedIds(allArchivedSelected ? [] : archivedRegistryIds)}
                        className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all"
                      >
                        {allArchivedSelected ? 'Clear Selection' : 'Select All'}
                      </button>
                      <button
                        onClick={bulkRestoreEngineersHandler}
                        disabled={bulkSelectedArchivedIds.length === 0}
                        className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-600/20 transition-all disabled:opacity-40"
                      >
                        Restore Selected ({bulkSelectedArchivedIds.length})
                      </button>
                      <button
                        onClick={bulkDeleteArchivedEngineersHandler}
                        disabled={bulkSelectedArchivedIds.length === 0}
                        className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-600/20 transition-all disabled:opacity-40"
                      >
                        Delete From Archive ({bulkSelectedArchivedIds.length})
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                    {fetchedHiddenEngineers.map(eng => (
                      <div key={eng.id} className="bg-red-950/10 border border-red-900/20 p-6 rounded-3xl flex items-center justify-between group hover:bg-red-900/20 transition-all">
                        <div className="flex items-center gap-5">
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setBulkSelectedArchivedIds((prev) => prev.includes(eng.id) ? prev.filter((id) => id !== eng.id) : [...prev, eng.id])}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                bulkSelectedArchivedIds.includes(eng.id)
                                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                  : 'bg-zinc-900 border-white/15 text-transparent hover:border-white/35'
                              }`}
                              title={bulkSelectedArchivedIds.includes(eng.id) ? 'Deselect' : 'Select'}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          <img
                            src={getPhotoUrl(eng)}
                            onError={handleEngineerPhotoError}
                            className={`w-12 h-12 rounded-xl grayscale opacity-40 shadow-2xl ${getLogoStyle(getPhotoUrl(eng))}`}
                            alt={tcsDisplayPrimary(eng)}
                          />
                          <div>
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-tight line-through opacity-50">{tcsDisplayPrimary(eng)}</p>
                            {tcsDisplaySecondary(eng) ? (
                              <p className="text-[10px] font-bold text-zinc-600 line-through opacity-50 mt-0.5 normal-case">{tcsDisplaySecondary(eng)}</p>
                            ) : null}
                            <span className="text-[9px] font-black text-red-500 tracking-widest uppercase mt-1 block">ARCHIVED : {eng.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreEngineerHandler(eng.id)}
                            className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                            title="Restore archived record"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => deleteArchivedEngineerHandler(eng.id)}
                              className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                              title="Delete permanently from archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}

                {/* Active Registry Stack */}
                <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                  {adminRegistryList.length === 0 ? (
                    <div className="p-24 text-center text-zinc-700 italic font-black uppercase tracking-[0.3em]">No registry entries detected.</div>
                  ) : adminRegistryList.map((eng, idx) => (

                    <div key={eng.id || `${eng.code}-${eng.month}-${eng.year}-${idx}`} className="bg-black hover:bg-zinc-900/50 transition-all p-3 md:p-6 flex items-center justify-between gap-2 group">
                      <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => setBulkSelectedIds((prev) => prev.includes(eng.id) ? prev.filter((id) => id !== eng.id) : [...prev, eng.id])}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            bulkSelectedIds.includes(eng.id)
                              ? 'bg-red-600/20 border-red-500 text-red-400'
                              : 'bg-zinc-900 border-white/15 text-transparent hover:border-white/35'
                          }`}
                          title={bulkSelectedIds.includes(eng.id) ? 'Deselect' : 'Select'}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                      )}
                      <div className="w-10 h-10 md:w-14 md:h-14 relative flex-shrink-0">
                          <img
                            src={getPhotoUrl(eng)}
                            onError={handleEngineerPhotoError}
                            className={`w-full h-full rounded-xl md:rounded-2xl grayscale-50 group-hover:grayscale-0 transition-all shadow-2xl shadow-black/80 ${getLogoStyle(getPhotoUrl(eng))}`}
                            alt={tcsDisplayPrimary(eng)}
                          />
                          {isPqaMode ? (
                            // PQA: show numeric rank in corner
                            (() => {
                              const pqaRank = deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === eng.code?.toUpperCase()) + 1;
                              const isTopThree = pqaRank <= 3;
                              return (
                                <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black italic ${
                                  pqaRank === 1 ? 'bg-yellow-500 text-black' :
                                  pqaRank === 2 ? 'bg-zinc-300 text-black' :
                                  pqaRank === 3 ? 'bg-orange-500 text-black' :
                                  'bg-zinc-800 text-zinc-400'
                                }`}>{pqaRank}</div>
                              );
                            })()
                          ) : (
                            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border-2 border-black bg-black flex items-center justify-center">
                              <img src={TIER_META[eng.tier]?.img || TIER_META.Bronze.img} alt={eng.tier} className="w-4 h-4 object-contain tier-emblem-blend" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs md:text-base font-black text-white uppercase tracking-tighter group-hover:text-blue-500 transition-colors truncate">{tcsDisplayPrimary(eng)}</h4>
                          {tcsDisplaySecondary(eng) ? (
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5 truncate normal-case tracking-normal">{tcsDisplaySecondary(eng)}</p>
                          ) : null}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {isPqaMode && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{eng.code}</span>
                            )}
                            {isPqaMode ? (
                              // PQA: show numeric rank pill
                              (() => {
                                const pqaRank = deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === eng.code?.toUpperCase()) + 1;
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                    pqaRank === 1 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                    pqaRank === 2 ? 'bg-zinc-300/10 border-zinc-300/30 text-zinc-300' :
                                    pqaRank === 3 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                    'bg-zinc-800/60 border-white/5 text-zinc-500'
                                  }`}>#{pqaRank}</span>
                                );
                              })()
                            ) : (
                              <TierBadge tier={eng.tier} size="sm" />
                            )}
                            {eng.sbaId && isPqaMode && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">SBA: {eng.sbaId}</span>
                            )}
                            {(eng.quarter || getQuarter(eng.month)) && (
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                {(eng.quarter || getQuarter(eng.month))} · {eng.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-sm md:text-xl font-black text-white tracking-widest italic">
                            {appMode?.startsWith('PQA') ? resolvePqaTcsScorePure(eng) : eng.tcsScore}
                          </span>
                          <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{appMode?.startsWith('PQA') ? 'PQA' : 'TCS'}</p>
                        </div>
                        {adminCanWriteData && (
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => setEditingEng(eng)}
                            className="p-2 md:p-3 bg-zinc-900 text-zinc-500 rounded-lg md:rounded-2xl hover:bg-white hover:text-black transition-all"
                          >
                            <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEngineerHandler(eng.id)}
                            className="p-2 md:p-3 bg-zinc-900 text-zinc-500 rounded-lg md:rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                          >
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
              </div>
              )}

              {adminPanelTab === 'display' && canAccessModule(currentUser, 'display') && (
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-white/10 bg-zinc-900/35 p-6 md:p-8 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">Display</p>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Public dashboard settings</h3>
                    <p className="text-[10px] text-zinc-500 font-medium max-w-lg">Configure what visitors see on leaderboards and exports.</p>
                    {canWriteModule(currentUser, 'display') && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-zinc-950/60 p-5">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Survey popup</p>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-md">
                          When ON, TCS portal visitors see a floating button for the selected survey
                          {activeSurveyDisplayName ? <> (<span dir={surveyDir(activeSurveyDef)} className="text-zinc-300">{activeSurveyDisplayName}</span>)</> : null}.
                          When OFF, it is hidden. Choose which survey is shown in the Survey tab.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${academySurveyPopupEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {academySurveySettingsLoading ? '…' : academySurveyPopupEnabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                          checked={academySurveyPopupEnabled}
                          loading={academySurveySettingsLoading || academySurveySettingsSaving}
                          onChange={handleAcademySurveyPopupToggle}
                        />
                      </div>
                    </div>
                    )}
                    {canWriteModule(currentUser, 'display') && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-purple-500/20 bg-zinc-950/60 p-5">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Engineer feedback (Arabic form)</p>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-md">
                          When ON, visitors see a home popup and floating shortcut; the submission form stays in Arabic. Dismiss hides until browser refresh.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${feedbackEnabled ? 'text-purple-400' : 'text-zinc-500'}`}>
                          {academySurveySettingsLoading ? '…' : feedbackEnabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                          checked={feedbackEnabled}
                          loading={academySurveySettingsLoading || academySurveySettingsSaving}
                          onChange={handleFeedbackEnabledToggle}
                        />
                      </div>
                    </div>
                    )}
                    {canWriteModule(currentUser, 'display') && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-blue-500/20 bg-zinc-950/60 p-5">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Phone alerts banner</p>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-md">
                          When ON, visitors see the &quot;Turn on phone alerts&quot; banner under the header until they allow or dismiss it. When OFF, it is hidden for everyone and no permission prompt is offered.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${notifyAlertsEnabled ? 'text-blue-400' : 'text-zinc-500'}`}>
                          {academySurveySettingsLoading ? '…' : notifyAlertsEnabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                          checked={notifyAlertsEnabled}
                          loading={academySurveySettingsLoading || academySurveySettingsSaving}
                          onChange={handleNotifyAlertsToggle}
                        />
                      </div>
                    </div>
                    )}
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Public direct links</p>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-2xl">
                          Share these URLs to open the survey or feedback form directly — no need to navigate the portal first.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Selected survey</p>
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                academySurveyPopupEnabled
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                  : 'border-white/10 text-zinc-500'
                              }`}
                            >
                              Popup {academySurveyPopupEnabled ? 'On' : 'Off'}
                            </span>
                          </div>
                          <p
                            className="text-sm font-black text-white"
                            lang={activeSurveyDef?.language === 'ar' ? 'ar' : 'en'}
                            dir={activeSurveyDef?.language === 'ar' ? 'rtl' : 'ltr'}
                          >
                            {activeSurveyDisplayName}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 break-all">{SCORA_PUBLIC_SURVEY_URL}</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(SCORA_PUBLIC_SURVEY_URL, '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600/25 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => copyPublicDirectLink(SCORA_PUBLIC_SURVEY_URL, activeSurveyDisplayName)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-800 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </button>
                          </div>
                          <PublicLinkQr
                            url={SCORA_PUBLIC_SURVEY_URL}
                            fileName="scora-survey-qr"
                            label="Survey QR code"
                            onError={() => message.error('Could not create the QR image.')}
                          />
                          <p className="text-[10px] text-zinc-500">
                            The link and QR always open the survey selected in the Survey tab. Change the selection there and printed QR codes follow it.
                          </p>
                        </div>
                        <div className="rounded-xl border border-purple-500/20 bg-black/30 p-4 space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Arabic feedback form</p>
                          <p className="text-[10px] font-mono text-zinc-400 break-all">{SCORA_PUBLIC_FEEDBACK_URL}</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(SCORA_PUBLIC_FEEDBACK_URL, '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/15 border border-purple-500/25 text-purple-300 text-[9px] font-black uppercase tracking-widest hover:bg-purple-600/25 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => copyPublicDirectLink(SCORA_PUBLIC_FEEDBACK_URL, 'Feedback')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-800 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </button>
                          </div>
                          <PublicLinkQr
                            url={SCORA_PUBLIC_FEEDBACK_URL}
                            fileName="scora-feedback-qr"
                            label="Feedback form QR code"
                            onError={() => message.error('Could not create the QR image.')}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      {(canReadModule(currentUser, 'tcs') && appMode?.startsWith('TCS')) && (
                        <button
                          type="button"
                          onClick={openTcsWinnersHub}
                          className="flex flex-col items-center gap-2 bg-zinc-900 border border-blue-500/20 text-blue-300 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-blue-600/10 transition-all"
                        >
                          <Award className="w-5 h-5" />
                          Dashboard Winners
                        </button>
                      )}
                      {canAccessModule(currentUser, 'survey') && (
                      <button
                        type="button"
                        onClick={() => setAdminPanelTab('survey')}
                        className="flex flex-col items-center gap-2 bg-zinc-900 border border-emerald-500/20 text-emerald-300 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-600/10 transition-all"
                      >
                        <ClipboardList className="w-5 h-5" />
                        Survey analytics
                      </button>
                      )}
                      {canAccessModule(currentUser, 'feedback') && (
                      <button
                        type="button"
                        onClick={() => setAdminPanelTab('feedback')}
                        className="flex flex-col items-center gap-2 bg-zinc-900 border border-purple-500/20 text-purple-300 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-purple-600/10 transition-all"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Feedback export
                      </button>
                      )}
                      <button
                        type="button"
                        onClick={() => (isPqaMode ? setView('PQA_INFO') : setAdminModal('guide'))}
                        className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                      >
                        <BookOpen className="w-5 h-5" />
                        {isPqaMode ? 'PQA Guide' : 'TCS Guide'}
                      </button>
                      {(canReadModule(currentUser, 'tcs') && appMode?.startsWith('TCS')) && (
                        <button
                          type="button"
                          disabled={tcsProductImagesSyncing}
                          onClick={async () => {
                            setTcsProductImagesSyncing(true);
                            try {
                              const urls = await uploadTcsAllProductImagesFromPublic();
                              message.success(`Saved to Firebase: tcs/all-products-images/ (${Object.keys(urls).length} files).`);
                            } catch (e) {
                              console.error(e);
                              const isStorageDenied =
                                String(e?.code || '').includes('storage/unauthorized') ||
                                String(e?.message || '').includes('storage/unauthorized');
                              message.error(
                                isStorageDenied
                                  ? 'Storage blocked by Firebase rules. Open Storage Rules (link under Sync Division Images), paste rules, click Publish, then try again.'
                                  : e?.message || 'Upload failed.'
                              );
                            } finally {
                              setTcsProductImagesSyncing(false);
                            }
                          }}
                          className="flex flex-col items-center gap-2 bg-zinc-900 border border-cyan-500/20 text-cyan-300 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-cyan-600/10 transition-all disabled:opacity-40 col-span-2 sm:col-span-1"
                        >
                          {tcsProductImagesSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                          Sync Division Images
                        </button>
                      )}
                      {(canReadModule(currentUser, 'tcs') && appMode?.startsWith('TCS')) && (
                        <p className="col-span-2 text-[10px] text-zinc-500 leading-relaxed mt-1">
                          First-time upload?{' '}
                          <a
                            href={FIREBASE_STORAGE_RULES_CONSOLE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline"
                          >
                            Open Firebase Storage Rules
                          </a>
                          {' → '}
                          <button
                            type="button"
                            className="text-cyan-400 underline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(FIREBASE_STORAGE_RULES_SNIPPET);
                                message.success('Rules copied. Paste in Firebase → Publish, then Sync again.');
                              } catch {
                                message.info('Copy storage.rules from the project folder manually.');
                              }
                            }}
                          >
                            Copy rules
                          </button>
                          {' → Publish → Sync Division Images.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {adminPanelTab === 'survey' && (canAccessModule(currentUser, 'survey') || canAccessModule(currentUser, 'surveyForms')) && (
                <div className="space-y-6">
                  {canAccessModule(currentUser, 'surveyForms') && (
                    <div className="rounded-[2rem] border border-emerald-500/15 bg-zinc-900/35 p-6 md:p-8">
                      <SurveyDefinitionsPanel
                        message={message}
                        actor={currentUser?.username || 'admin'}
                        canWrite={canWriteModule(currentUser, 'surveyForms')}
                        activeSurveyId={activeSurveyId}
                        popupEnabled={academySurveyPopupEnabled}
                        onActiveChange={handleActiveSurveyChange}
                        onDefinitionsChange={setSurveyDefinitions}
                      />
                    </div>
                  )}
                  <div className="rounded-[2rem] border border-emerald-500/15 bg-zinc-900/35 p-6 md:p-8">
                    {canReadModule(currentUser, 'survey') ? (
                      <SamsungAcademySurveyDashboard
                        message={message}
                        onExported={handleSamsungAcademySurveyExported}
                        allowExport={canReadModule(currentUser, 'survey')}
                        activeSurveyId={activeSurveyId}
                        definitions={surveyDefinitions}
                      />
                    ) : (
                      <div className="space-y-4 text-center py-12">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Survey — analysis</p>
                        <p className="text-sm text-zinc-500 max-w-md mx-auto">
                          Analytics and export need &quot;Survey responses&quot; read access. Ask a super admin to grant it.
                        </p>
                        {canAccessModule(currentUser, 'display') && (
                        <button
                          type="button"
                          onClick={() => setAdminPanelTab('display')}
                          className="px-6 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-200"
                        >
                          Open Display settings
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminPanelTab === 'feedback' && canAccessModule(currentUser, 'feedback') && (
                <div className="rounded-[2rem] border border-purple-500/15 bg-zinc-900/35 p-6 md:p-8">
                  {canReadModule(currentUser, 'feedback') ? (
                    <ArabicFeedbackDashboard
                      message={message}
                      onExported={handleArabicFeedbackExported}
                      allowExport={canReadModule(currentUser, 'feedback')}
                    />
                  ) : (
                    <div className="space-y-4 text-center py-12">
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Feedback — write access</p>
                      <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        You can change the public feedback form in the Display tab. Analytics and export require read access.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAdminPanelTab('display')}
                        className="px-6 py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-[10px] font-black uppercase tracking-widest text-purple-200"
                      >
                        Open Display settings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminPanelTab === 'scora-challenge' && canAccessModule(currentUser, 'quiz') && (
                <div className="rounded-[2rem] border border-orange-500/15 bg-zinc-900/35 p-4 md:p-6 lg:p-8 w-full">
                  <QuizAdminPanel
                    currentUser={currentUser}
                    canRead={canReadModule(currentUser, 'quiz')}
                    canWrite={canWriteModule(currentUser, 'quiz')}
                  />
                </div>
              )}

              {adminPanelTab === 'knowledge-base' && canAccessModule(currentUser, 'knowledge') && (
                <div className="space-y-6 w-full">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'consultants', label: 'Technical Consultants and Tips' },
                      { key: 'product-spec', label: 'Product Specification' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setKnowledgeBaseSubTab(t.key)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          knowledgeBaseSubTab === t.key
                            ? t.key === 'product-spec'
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                              : 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                            : 'bg-zinc-900 text-zinc-500 border border-white/5 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {knowledgeBaseSubTab === 'consultants' && (
                    <div className="rounded-[2rem] border border-cyan-500/15 bg-zinc-900/35 p-4 md:p-6 lg:p-8 w-full">
                      <TechnicalConsultantsPanel actor={currentUser.username || currentUser.name || 'admin'} />
                    </div>
                  )}

                  {knowledgeBaseSubTab === 'product-spec' && (
                    <div className="rounded-[2rem] border border-emerald-500/15 bg-zinc-900/35 p-4 md:p-6 lg:p-8 w-full">
                      <SamsungProductKbPanel actor={currentUser.username || currentUser.name || 'admin'} />
                    </div>
                  )}
                </div>
              )}

              {adminPanelTab === 'insights' && currentUser?.role === 'SUPER_ADMIN' && (
                <div className="space-y-6 report-studio">
                  {analyticsSummary && (() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const todayVisitors = analyticsSummary.dailyVisitorHits?.[today] || 0;
                    const todayAdmins = analyticsSummary.dailyAdminLogins?.[today] || 0;
                    const avgVMs = analyticsSummary.avgVisitorSessionMs || 0;
                    const avgVMin = Math.floor(avgVMs / 60000);
                    const avgVSec = Math.floor((avgVMs % 60000) / 1000);
                    const avgAMs = analyticsSummary.avgAdminSessionMs || 0;
                    const avgAMin = Math.floor(avgAMs / 60000);
                    const avgASec = Math.floor((avgAMs % 60000) / 1000);
                    const visitorSeries = buildDailySeries(analyticsSummary.dailyVisitorHits, 14);
                    const adminSeries = buildDailySeries(analyticsSummary.dailyAdminLogins, 14);
                    return (
                      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/50 p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <BarChart3 className="w-4 h-4 text-zinc-300" />
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Insights studio</h3>
                          <button
                            type="button"
                            onClick={refreshAnalytics}
                            disabled={analyticsLoading}
                            className="ml-auto flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-white/10 rounded-full text-[8px] font-black text-zinc-300 uppercase tracking-widest hover:text-white transition-all disabled:opacity-40"
                          >
                            <RefreshCw className={`w-3 h-3 ${analyticsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </button>
                        </div>

                        <StudioStatGrid
                          cols="grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                          items={[
                            { label: 'Visitor hits', value: analyticsSummary.visitorHits || 0 },
                            { label: 'Visitors today', value: todayVisitors },
                            { label: 'Avg visitor', text: `${avgVMin}m ${avgVSec}s` },
                            { label: 'Admin logins', value: analyticsSummary.adminLogins || 0 },
                            { label: 'Admins today', value: todayAdmins },
                            { label: 'Avg admin', text: `${avgAMin}m ${avgASec}s` },
                          ]}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <StudioPanel title="Visitor wave · 14 days">
                            <StudioWave
                              primary={visitorSeries.map((r) => r.count)}
                              primaryLabel="Visitors"
                            />
                          </StudioPanel>
                          <StudioPanel title="Admin wave · 14 days">
                            <StudioWave
                              primary={adminSeries.map((r) => r.count)}
                              primaryLabel="Admins"
                            />
                          </StudioPanel>
                        </div>
                      </div>
                    );
                  })()}
                  <VisitorEngagementPanel analyticsSummary={analyticsSummary} />
                  <button
                    type="button"
                    onClick={exportAnalyticsToExcel}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Export analytics (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdminModal('logs'); loadLogs(); }}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <Activity className="w-5 h-5" />
                    Open audit log
                  </button>
                </div>
              )}

              {adminPanelTab === 'system' && currentUser?.role === 'SUPER_ADMIN' && (
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-white/10 bg-zinc-900/35 p-6 md:p-8 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">System</p>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Accounts &amp; maintenance</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setAdminModal('accounts')}
                        className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all"
                      >
                        <Settings className="w-5 h-5" />
                        Manage accounts
                      </button>
                      <button
                        type="button"
                        onClick={seedDatabase}
                        disabled={isSaving}
                        className="flex flex-col items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 p-5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-purple-600/20 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                        Seed database
                      </button>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-red-500/20 bg-red-950/10 p-6 md:p-8 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-red-400">Danger zone</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Archive or clear all records for the selected division. This cannot be undone easily.</p>
                    {(canAccessModule(currentUser, 'tcs') && appMode?.startsWith('TCS')) && (() => {
                      const activeTcs = appMode === 'TCS_DA' ? 'TCS_DA' : appMode === 'TCS_AV' || appMode === 'TCS_VD' ? 'TCS_AV' : 'TCS_MX';
                      const short = activeTcs === 'TCS_DA' ? 'DA' : activeTcs === 'TCS_AV' ? 'AV' : 'MX';
                      const mxRoleSuffix = activeTcs === 'TCS_MX' && tcsMxRoleTab !== 'engineers'
                        ? ` · ${getTcsMxRolePersonLabel(tcsMxRoleTab)}s`
                        : '';
                      return (
                        <button
                          type="button"
                          onClick={() => handleClearTcsDivisionData(activeTcs === 'TCS_AV' ? 'TCS_AV' : activeTcs)}
                          className="flex w-full flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-600/10 px-5 py-4 font-black text-[10px] uppercase tracking-wider text-red-300 transition-all hover:bg-red-600/20"
                        >
                          <Trash2 className="w-5 h-5" />
                          Clear TCS {short}{mxRoleSuffix}
                        </button>
                      );
                    })()}
                    {isPqaMode && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Archive ALL records for ${appMode}?`)) return;
                          try {
                            await Promise.all(engineers.map((e) => archiveEngineer(e.id, colName)));
                            setEngineers([]);
                            message.success(`${appMode} data cleared.`);
                          } catch (err) {
                            message.error('Failed to clear database.');
                          }
                        }}
                        className="flex w-full flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-600/10 px-5 py-4 font-black text-[10px] uppercase tracking-wider text-red-400 transition-all hover:bg-red-600/20"
                      >
                        <Trash2 className="w-5 h-5" />
                        Clear {appMode} data
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">Manage accounts</span>}
                open={adminModal === 'accounts'}
                onCancel={() => { setAdminModal(null); cancelEditAdmin(); }}
                footer={null}
                width="min(1100px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto', paddingTop: 12 } }}
              >
                <AdminAccountsPanel {...adminAccountsPanelProps} compact />
                <button
                  type="button"
                  onClick={() => { setAdminModal(null); setView('PROFILE_MGMT'); }}
                  className="w-full mt-4 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Open full directory view
                </button>
              </Modal>

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">TCS dashboard winners</span>}
                open={adminModal === 'winners'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(820px, 96vw)"
                destroyOnHidden
              >
                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-zinc-500">
                    {winnerHubProduct === 'MX' && winnerHubMxRole === 'receptionists'
                      ? `Configure up to Top ${winnerHubSlotCount} receptionist codes per quarter. Fill only the ranks you have — empty slots are fine.`
                      : winnerHubProduct === 'MX' && winnerHubMxRole === 'galaxy_consultants'
                        ? `Configure up to Top ${winnerHubSlotCount} galaxy consultant codes per quarter. Fill only the ranks you have — empty slots are fine.`
                        : `Configure fixed Top ${winnerHubSlotCount} codes per quarter/product for TCS dashboard ranking.`}
                    {winnerHubProduct === 'MX' ? ' For MX, pick Engineers, Receptionists, or Galaxy Consultants.' : ''}
                  </p>
                  <div className={`grid grid-cols-1 gap-3 ${winnerHubProduct === 'MX' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Quarter</label>
                      <select
                        value={winnerHubQuarter}
                        onChange={(e) => setWinnerHubQuarter(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-white"
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Year</label>
                      <input
                        value={winnerHubYear}
                        onChange={(e) => setWinnerHubYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        placeholder="2026"
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Product</label>
                      <select
                        value={winnerHubProduct}
                        onChange={(e) => {
                          setWinnerHubProduct(e.target.value);
                          if (e.target.value !== 'MX') setWinnerHubMxRole('engineers');
                        }}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-white"
                      >
                        <option value="MX">MX</option>
                        <option value="DA">DA</option>
                        <option value="AV">AV</option>
                      </select>
                    </div>
                    {winnerHubProduct === 'MX' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">MX role</label>
                        <select
                          value={winnerHubMxRole}
                          onChange={(e) => setWinnerHubMxRole(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-white"
                        >
                          {TCS_MX_WINNER_ROLES.map((role) => (
                            <option key={role.key} value={role.key}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    {Array.from({ length: winnerHubSlotCount }, (_, idx) => (
                      <div key={`winner-rank-${idx + 1}`} className="grid grid-cols-[56px_1fr] gap-2 items-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">#{idx + 1}</div>
                        <input
                          value={winnerHubCodes[idx] || ''}
                          onChange={(e) => {
                            const v = normalizeEngineerCodeKey(e.target.value);
                            setWinnerHubCodes((prev) => prev.map((code, i) => (i === idx ? v : code)));
                          }}
                          placeholder={
                            winnerHubProduct === 'MX' && winnerHubMxRole === 'receptionists'
                              ? 'GSPN ID'
                              : winnerHubProduct === 'MX' && winnerHubMxRole === 'galaxy_consultants'
                                ? 'Galaxy Consultant Code'
                                : 'SBA ID or Engineer Code'
                          }
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  {isTcsMode && resolvedTcsWinnersConfig && (
                    <p className="text-[10px] font-bold text-zinc-500">
                      Dashboard currently uses winners from <span className="text-zinc-300">{resolvedTcsWinnersConfig.resolvedQuarterKey}</span>
                      {resolvedTcsWinnersConfig.fallbackUsed ? ' (fallback from latest configured quarter).' : '.'}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      type="button"
                      onClick={loadTcsWinnersConfigs}
                      disabled={tcsWinnersLoading}
                      className="px-5 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                      {tcsWinnersLoading ? 'Loading…' : 'Reload'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTcsWinnersConfig}
                      disabled={tcsWinnersSaving}
                      className="px-5 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:bg-blue-600/30 transition-all disabled:opacity-40"
                    >
                      {tcsWinnersSaving ? 'Saving…' : (winnerHubMxRole === 'receptionists' || winnerHubMxRole === 'galaxy_consultants') && winnerHubProduct === 'MX' ? 'Save winners' : `Save Top ${winnerHubSlotCount}`}
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">TCS reference guide</span>}
                open={adminModal === 'guide'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(900px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto' } }}
              >
                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Technical Capability System (TCS)</strong> scores engineers on KPIs, DRNPS, and exam performance. Tiers (Bronze → Masters) follow your composite TCS score.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>MX engineers: upload <strong className="text-zinc-200">Engineer_Performance_Unified_Format.xlsx</strong> (sheet <strong className="text-zinc-200">Engineer_Wide</strong>). One Firestore document per engineer with Q1/Q2… blocks; Final Result average drives the tier.</li>
                    <li>DA / AV engineers: upload the single-sheet <strong className="text-zinc-200">TCS_DA_AV_KPI_Template</strong> (Q1 Final / Q2 Final + KPIs). One row per engineer.</li>
                    <li>Use the Excel template column <strong className="text-zinc-200">Engineer Code</strong> as the unique ID engineers type in search.</li>
                    <li>Quarterly views aggregate months within the same calendar quarter; set Quarter / Year / Product (MX, DA, or AV) in the sheet.</li>
                    <li>Leaderboard order uses your uploaded TCS Score (or calculated fallbacks from column data).</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => { setAdminModal(null); setView('TCS_INFO'); }}
                    className="w-full py-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:bg-blue-600/30 transition-all"
                  >
                    Open full TCS guide page
                  </button>
                </div>
              </Modal>

              <Modal
                title={<span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-300">Actions log</span>}
                open={adminModal === 'logs'}
                onCancel={() => setAdminModal(null)}
                footer={null}
                width="min(900px, 96vw)"
                destroyOnHidden
                styles={{ body: { maxHeight: 'min(85vh, 900px)', overflowY: 'auto', paddingTop: 8 } }}
              >
                {(() => {
                  const SEVERITY_STYLES = {
                    info: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                    error: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };
                  const TYPE_COLORS = {
                    ADMIN_LOGIN: 'text-emerald-400',
                    ADMIN_LOGOUT: 'text-zinc-400',
                    ADMIN_ACTION: 'text-blue-400',
                    FAILED_LOGIN: 'text-yellow-400',
                    ERROR: 'text-red-400',
                    VISITOR_EVENT: 'text-purple-400',
                    USER_ACTION: 'text-cyan-300',
                  };
                  const typeOptions = ['ALL', ...Array.from(new Set(activityLogs.map((log) => String(log?.type || '').toUpperCase()).filter(Boolean)))];
                  const categoryOptions = ['ALL', ...Array.from(new Set(activityLogs.map((log) => detectLogCategory(log)).filter(Boolean)))];
                  return (
                    <div className="space-y-4">
                      <LogTrafficPanel
                        analyticsSummary={analyticsSummary}
                        loading={analyticsLoading}
                        onRefresh={refreshAnalytics}
                        compact
                      />
                      <VisitorEngagementPanel analyticsSummary={analyticsSummary} compact />

                      <div className="flex items-center gap-2 flex-wrap border-b border-white/5 pb-3">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Last 200 events</span>
                        <button
                          type="button"
                          onClick={exportAnalyticsToExcel}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full text-[8px] font-black text-purple-300 uppercase tracking-widest hover:bg-purple-600/20 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Export Analytics
                        </button>
                        <button
                          type="button"
                          onClick={exportFilteredActivityLogs}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-300 uppercase tracking-widest hover:bg-emerald-600/20 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Export Filtered
                        </button>
                        <button
                          type="button"
                          onClick={loadLogs}
                          disabled={logsLoading}
                          className="flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-white/10 rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                          {logsLoading ? 'Loading…' : 'Refresh'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {['SURVEY', 'FEEDBACK', 'VISITOR', 'SECURITY'].map((cat) => (
                          <button
                            key={`quick-${cat}`}
                            type="button"
                            onClick={() => setLogCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                              logCategoryFilter === cat
                                ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                                : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setLogCategoryFilter('ALL')}
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                            logCategoryFilter === 'ALL'
                              ? 'bg-zinc-700 border-white/20 text-white'
                              : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white'
                          }`}
                        >
                          All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          value={logActorQuery}
                          onChange={(e) => setLogActorQuery(e.target.value)}
                          placeholder="Filter by actor (who)"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-[10px] font-bold text-white outline-none"
                        />
                        <input
                          value={logActionQuery}
                          onChange={(e) => setLogActionQuery(e.target.value)}
                          placeholder="Filter by action/details"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-[10px] font-bold text-white outline-none"
                        />
                        <select
                          value={logCategoryFilter}
                          onChange={(e) => setLogCategoryFilter(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                        >
                          {categoryOptions.map((c) => (
                            <option key={`cat-${c}`} value={c}>{c}</option>
                          ))}
                        </select>
                        <select
                          value={logTypeFilter}
                          onChange={(e) => setLogTypeFilter(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                        >
                          {typeOptions.map((t) => (
                            <option key={`typ-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                        <select
                          value={logSeverityFilter}
                          onChange={(e) => setLogSeverityFilter(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                        >
                          <option value="ALL">ALL SEVERITY</option>
                          <option value="info">INFO</option>
                          <option value="warning">WARNING</option>
                          <option value="error">ERROR</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setLogTypeFilter('ALL');
                            setLogSeverityFilter('ALL');
                            setLogCategoryFilter('ALL');
                            setLogActorQuery('');
                            setLogActionQuery('');
                          }}
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                          Clear Filters
                        </button>
                      </div>

                      {filteredActivityLogs.length === 0 ? (
                        <p className="text-center text-zinc-700 text-[10px] uppercase tracking-widest py-8">{logsLoading ? 'Loading logs…' : 'No activity recorded yet.'}</p>
                      ) : (
                        <div className="space-y-2 max-h-[min(65vh,620px)] overflow-y-auto pr-2">
                          {filteredActivityLogs.map(log => (
                            <div key={log.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                              <div className="flex-shrink-0 mt-0.5">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${TYPE_COLORS[log.type] || 'text-zinc-400'}`}>{log.type?.replace('_', ' ')}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white">{log.action}</p>
                                <p className="text-[8px] text-cyan-300/80 uppercase tracking-widest mt-0.5">{detectLogCategory(log)}</p>
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <p className="text-[9px] text-zinc-500 mt-0.5 break-words">
                                    {Object.entries(log.details).map(([k, v]) => `${k}: ${formatLogDetailValue(v)}`).join(' · ')}
                                  </p>
                                )}
                                {(log.ip || log.location) && (
                                  <p className="text-[8px] text-blue-400/70 mt-0.5">
                                    IP: {log.ip || 'unknown'}{log.location ? ` · ${log.location}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">{log.actor}</p>
                                <p className="text-[7px] text-zinc-700 mt-0.5">
                                  {log.timestamp ? log.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Modal>
            </AdminPortalShell>
          )}


          {view === 'PROFILE_MGMT' && (
            <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
              <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-white" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Security Infrastructure</span>
                  </div>
                  <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">ADMIN<br />DIRECTORY</h2>
                </div>
                <button
                  onClick={() => setView('ADMIN_DASHBOARD')}
                  className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Return to Command
                </button>
              </div>

              <AdminAccountsPanel {...adminAccountsPanelProps} />
            </div>
          )}

          {view === 'ENGINEER_PROFILE' && selectedEngineer && (
            <>
              {/* 3D Rank Reveal Overlay */}
              {showRankReveal && appMode !== 'PQA_MX' && (
                <RankReveal3D
                  tier={resolveTierByMode(selectedEngineer)}
                  score={isPqaMode ? resolvePqaTcsScore(pqaProfileSubject) : resolveTcsDashboardScore(selectedEngineer)}
                  name={isPqaMode ? selectedEngineer.name : tcsDisplayPrimary(selectedEngineer)}
                  onDismiss={() => setShowRankReveal(false)}
                  isPqaMode={isPqaMode}
                  rank={profileOpenedByExactCode
                    ? (isPqaMode
                      ? (parseInt(String(pqaProfileSubject?.centerYtdRank || pqaProfileSubject?.ytdRank || 0), 10) || '-')
                      : '(-)')
                    : (isPqaMode
                      ? (deduplicatedEngineers.findIndex(d => d.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()) + 1 || '-')
                      : (engineerSummaryRanks?.monthRank || selectedEngineer.ytdRank || '-'))}
                />
              )}
              <div className="space-y-16 animate-in slide-in-from-right-8 duration-700 overflow-x-hidden max-w-full">
                {/* Dossier Header */}
                <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-8 md:gap-12 border-b border-white/5 pb-16">
                  <div className="flex flex-col items-center md:items-start gap-8 w-full min-w-0 max-w-full">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <img
                        src={getPhotoUrl(selectedEngineer)}
                        onError={handleEngineerPhotoError}
                        className={`relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3.5rem] ${getLogoStyle(getPhotoUrl(selectedEngineer))} border-4 border-zinc-800 shadow-3xl grayscale-50 group-hover:grayscale-0 transition-all duration-500`}
                        alt={selectedEngineer.name}
                      />
                      {/* Only show tier emblem for TCS mode */}
                      {!isPqaMode && (
                        <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border-4 border-black z-20 bg-black">
                          <img src={TIER_META[resolveTierByMode(selectedEngineer)]?.img || TIER_META.Bronze.img} alt={resolveTierByMode(selectedEngineer)} className="w-7 h-7 md:w-9 md:h-9 object-contain tier-emblem-blend" />
                        </div>
                      )}
                    </div>
                    {/* Self-service photo update */}
                    <button
                      onClick={() => { setShowPhotoAuth(true); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                    >
                      <Camera className="w-3 h-3" />
                      {isPqaMode ? 'Update Center Photo' : 'Update My Photo'}
                    </button>
                    <div className="text-center md:text-left space-y-2 w-full min-w-0 max-w-full px-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <div className="h-[1px] w-8 bg-blue-500 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] sm:tracking-[0.5em] text-blue-500">Personnel Dossier</span>
                        {isPqaMode && (
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                            (selectedEngineer.pqaBranch || appMode) === 'PQA_CE'
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                              : 'border-purple-500/40 text-purple-200 bg-purple-500/10'
                          }`}>
                            {(selectedEngineer.pqaBranch || appMode) === 'PQA_CE' ? 'PQA CE data' : 'PQA MX data'}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight md:tracking-tighter text-white uppercase italic leading-[1.15] break-words [overflow-wrap:anywhere] max-w-full">
                        {isPqaMode ? selectedEngineer.name : tcsDisplayPrimary(selectedEngineer)}
                      </h2>
                      {!isPqaMode && tcsDisplaySecondary(selectedEngineer) ? (
                        <p className="text-xs sm:text-sm font-bold text-zinc-400 normal-case mt-1 break-words [overflow-wrap:anywhere] max-w-full">{tcsDisplaySecondary(selectedEngineer)}</p>
                      ) : null}
                      {isPqaMode ? null : (
                        <p className="text-zinc-500 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.5em] mt-1 break-all max-w-full">
                          Engineer code · {String(selectedEngineer.code || '—')}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 mt-2 max-w-full">
                        {isPqaMode && (
                          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.6em]">{selectedEngineer.code}</p>
                        )}
                        {selectedEngineer.ytdRank > 0 && !profileOpenedByExactCode && (
                          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">YTD Rank: #{selectedEngineer.ytdRank}</span>
                          </div>
                        )}
                        {selectedEngineer.region && !profileOpenedByExactCode && (
                           <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Region: {selectedEngineer.region}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto shrink-0">
                    <div className="glass-card px-6 sm:px-10 py-5 sm:py-6 rounded-3xl flex flex-col items-center md:items-end border-blue-500/20 shadow-2xl w-full max-w-sm md:max-w-none">
                      <span className="text-4xl sm:text-5xl md:text-6xl font-black text-white italic tracking-tighter">
                        {isPqaMode
                          ? ((profileOpenedByExactCode && pqaAccumulatedScore > 0)
                            ? Number(pqaAccumulatedScore.toFixed(1))
                            : resolvePqaTcsScore(pqaProfileSubject))
                          : resolveTcsDashboardScore(selectedEngineer)}
                      </span>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        {isPqaMode
                          ? (profileOpenedByExactCode && pqaAccumulatedScore > 0 ? 'Accumulated PQA Score' : 'Aggregate PQA Score')
                          : 'TCS Rank'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setProfileOpenedByExactCode(false); setView('ENGINEER_LOOKUP'); }}
                      className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" /> Back to Registry
                    </button>
                  </div>
                </div>

                {/* ── Period Selector ─────────────────────────────────── */}
                {(() => {
                  if (profileOpenedByExactCode) {
                    let eng = isPqaMode ? pqaProfileSubject : selectedEngineer;
                    if (!isPqaMode && selectedEngineer?.id) {
                      const liveEng = engineers.find((e) => e.id === selectedEngineer.id);
                      if (liveEng) eng = liveEng;
                    }
                    let pqaExactMonthPeriods = [];
                    if (isPqaMode && selectedEngineer) {
                      const selectedBranch = selectedEngineer.pqaBranch || appMode;
                      const pqaRows = engineers
                        .filter((e) => {
                          if (selectedBranch && e.pqaBranch && e.pqaBranch !== selectedBranch) return false;
                          return engineerCodeMatchesQuery(e.code, selectedEngineer.code);
                        })
                        .sort((a, b) => {
                          const ya = parseInt(a.year) || 0;
                          const yb = parseInt(b.year) || 0;
                          if (yb !== ya) return yb - ya;
                          return (getMonthIndex(b.month) || 0) - (getMonthIndex(a.month) || 0);
                        });
                      const monthKeyed = {};
                      const pqaRowRichness = (r) =>
                        ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'sdr', 'audit', 'pr'].reduce(
                          (s, f) => s + Math.abs(parseFloat(r[f] || 0)),
                          0
                        );
                      pqaRows.forEach((r) => {
                        const mk = `${r.month}-${r.year}`;
                        const prev = monthKeyed[mk];
                        if (!prev) {
                          monthKeyed[mk] = r;
                          return;
                        }
                        const nr = pqaRowRichness(r);
                        const np = pqaRowRichness(prev);
                        if (nr > np) monthKeyed[mk] = r;
                      });
                      pqaExactMonthPeriods = Object.values(monthKeyed).map((r, idx) => ({
                        key: `${r.month}-${r.year}`,
                        reactKey: r.id ? `pqa-exact-${String(r.id)}` : `pqa-exact-${idx}-${r.month}-${r.year}`,
                        label: `${r.month} ${r.year}`,
                        record: r,
                      }));
                      const exactKey = selectedProfileMonth && pqaExactMonthPeriods.some((p) => p.key === selectedProfileMonth)
                        ? selectedProfileMonth
                        : (pqaExactMonthPeriods[0]?.key || null);
                      const exactRec = pqaExactMonthPeriods.find((p) => p.key === exactKey)?.record || pqaExactMonthPeriods[0]?.record;
                      if (exactRec) {
                        const siblings = pqaRows.filter((r) => r.month?.toLowerCase() === exactRec.month?.toLowerCase() && String(r.year) === String(exactRec.year));
                        eng = mergePqaKpiFromRecords(exactRec, siblings);
                      }
                    }
                    const pqaSnapCaps = eng.pqaKpiCaps || (appMode === 'PQA_CE' ? PQA_KPI_DEFAULTS_CE : PQA_KPI_DEFAULTS_MX);
                    const dispSsr = parseFloat(eng.ssrScore ?? 0);
                    const dispRrr = parseFloat(eng.rrrScore || 0);
                    const dispIqc = resolveMxIqcSkipForDisplay(eng);
                    const dispCore = parseFloat(eng.corePartsScore ?? eng.corePartsPBA ?? 0);
                    const dispEval = parseFloat(eng.engineerEvaluation || 0);
                    const dispTrain = parseFloat(eng.q1TrainingScore ?? eng.trainingAttendance ?? 0);
                    const dispExam = parseFloat(eng.examScore || 0);
                    const dispDrnpsSheet = parseFloat(eng.drnpsScore ?? calculateDRNPS(eng.promoters, eng.detractors));
                    const isReceptionistProfile = appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists';
                    const isGalaxyProfile = appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants';
                    const isDaAvExactProfile = !isPqaMode && !isReceptionistProfile && !isGalaxyProfile && (
                      appMode === 'TCS_DA' ||
                      appMode === 'TCS_AV' ||
                      appMode === 'TCS_VD' ||
                      ['DA', 'AV', 'VD'].includes(String(eng?.product || selectedEngineer?.product || '').toUpperCase())
                    );
                    return (
                      <div className="rounded-[2rem] border border-blue-500/20 bg-zinc-900/50 p-8 md:p-10 max-w-4xl mx-auto space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.35em] mb-2">Verification by code — KPI snapshot</p>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {isPqaMode
                              ? `KPIs from the ★Evaluation point sheet — ${(eng.pqaBranch || appMode) === 'PQA_CE' ? 'CE' : 'MX'} registry only (MX vs CE are stored separately). Targets follow headers such as SSR (20), D-RNPS (10).`
                              : isReceptionistProfile
                                ? 'Receptionist KPIs: Vote for Me (customers rated 10), IQC first time fail %, DRNPS %, Exam points, and Co.A bonus points.'
                                : isGalaxyProfile
                                  ? 'Galaxy Consultant KPI: number of Galaxy Consultant tickets.'
                                  : isDaAvExactProfile
                                    ? (eng?.quarters
                                      ? 'Choose Q1 or Q2 to view that quarter’s DA/AV KPIs. TCS Rank above is the average of available Final Scores.'
                                      : 'DA/AV criteria from uploaded sheet: SSR, REDO, Chatbot, HASS, Acc Core Parts (VD), Training Attendance, Linkage ratio. Ranking score uses Final Score.')
                                  : isUnifiedEngineerRecord(eng)
                                    ? 'Choose a quarter to view Engineer_Wide KPIs. Q1 uses SSR / RRR90 / IQC Skip / Core Parts… — Q2 uses LCD-OCTA / PBA / Multi Parts / RRR30 / Maintenance / OQC… Percent cells show 0–100 (e.g. 21.9%). TCS Rank above is the average of available Final Results.'
                                    : 'Metrics match the TCS MX template: IQC Skip % (column M), Repair cases (L), Engineer evaluation, DRNPS, Exam, TCS Score. Download the updated template from Admin if needed.'}
                          </p>
                        </div>
                        {isPqaMode && pqaExactMonthPeriods.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {pqaExactMonthPeriods.map((p) => (
                              <button
                                key={p.reactKey}
                                onClick={() => setSelectedProfileMonth(p.key)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                  (selectedProfileMonth || pqaExactMonthPeriods[0]?.key) === p.key
                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                    : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {!isPqaMode ? (
                          <div className="space-y-8">
                            {isReceptionistProfile ? (
                              <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                  <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">Receptionist KPIs</p>
                                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">Vote for Me · IQC first time fail · DRNPS · Exam · Co.A</p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <TierLogo tier={resolveTierByMode(eng)} size="lg" />
                                  </div>
                                </div>
                                <div className="space-y-5 pl-2 md:pl-4 border-l-2 border-emerald-500/35">
                                  <MetricBar label="Vote for Me" value={parseFloat(eng.voteForMe || 0)} max={50} suffix="" target={30} />
                                  <MetricBar label="IQC first time fail" value={parseFloat(eng.iqcFirstTimeFail || 0)} max={100} suffix="%" target={5} inverse />
                                  <MetricBar label="DRNPS" value={resolveReceptionistDrnps(eng)} max={100} suffix="%" target={80} />
                                  <MetricBar label="Exam" value={parseFloat(eng.examScore || 0)} max={100} suffix=" pts" target={90} />
                                  <MetricBar label="Co.A (bonus)" value={parseFloat(eng.coa || 0)} max={10} suffix=" pts" target={10} />
                                </div>
                              </div>
                            ) : isGalaxyProfile ? (
                              <div className="rounded-2xl border border-cyan-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                  <div>
                                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.35em]">Galaxy Consultant</p>
                                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">Galaxy consultant tickets</p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <span className="text-3xl md:text-4xl font-black text-white italic tabular-nums">{parseFloat(eng.galaxyConsultantTickets || 0)}</span>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Tickets</p>
                                  </div>
                                </div>
                                <MetricBar label="Galaxy consultant tickets" value={parseFloat(eng.galaxyConsultantTickets || 0)} max={60} suffix="" target={40} />
                              </div>
                            ) : isDaAvExactProfile ? (
                              eng?.quarters ? (
                              (() => {
                                const presentQs = Object.keys(eng.quarters || {}).filter((q) => eng.quarters[q]?.present).sort();
                                const allQs = Object.keys(eng.quarters || {}).sort();
                                const qKeys = allQs.length ? allQs : ['Q1', 'Q2'];
                                const activeQ =
                                  (selectedProfileQuarter && qKeys.includes(String(selectedProfileQuarter).split('-')[0].toUpperCase())
                                    ? String(selectedProfileQuarter).split('-')[0].toUpperCase()
                                    : null)
                                  || presentQs[presentQs.length - 1]
                                  || qKeys[0];
                                const qBlock = eng.quarters?.[activeQ];
                                const qPresent = Boolean(qBlock?.present);
                                const qFinal = getDaAvQuarterFinal(eng, activeQ);
                                const avgFinal = getDaAvAverageFinal(eng);
                                const kpiCards = getDaAvQuarterKpiCards(activeQ, qBlock?.metrics || {});
                                return (
                                  <div className="space-y-6">
                                    <div>
                                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Choose quarter</p>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {qKeys.map((q) => {
                                          const has = Boolean(eng.quarters?.[q]?.present);
                                          const key = `${q}-${eng.year || new Date().getFullYear()}`;
                                          return (
                                            <button
                                              key={q}
                                              type="button"
                                              onClick={() => setSelectedProfileQuarter(key)}
                                              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                q === activeQ
                                                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                                                  : has
                                                    ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                                                    : 'bg-zinc-950 border-white/5 text-zinc-600'
                                              }`}
                                            >
                                              {q}{has ? '' : ' · N/A'}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                        <div>
                                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">{activeQ} DA / AV criteria</p>
                                          <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">
                                            {activeQ === 'Q1'
                                              ? 'SSR · REDO · Chatbot · HASS · Acc Core Parts · Training · Linkage'
                                              : 'RNPS · REDO · Training · ST Con · MJ % · Complete Repair · Kahoot · HASS · Repair Volume'}
                                          </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                          <span className="text-3xl md:text-4xl font-black text-white italic tabular-nums">
                                            {qFinal != null ? qFinal.toFixed(1) : 'N/A'}
                                          </span>
                                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{activeQ} Final</p>
                                          <p className="text-[9px] text-zinc-500 mt-1">TCS Rank (avg): {avgFinal != null ? avgFinal.toFixed(1) : 'N/A'}</p>
                                        </div>
                                      </div>

                                      {!qPresent ? (
                                        <p className="text-amber-400/90 text-sm font-bold">
                                          {qBlock?.notes || eng.notes || `No ${activeQ} record for this engineer.`}
                                        </p>
                                      ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {kpiCards.map((card) => (
                                            <div key={card.label} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{card.label}</p>
                                              <p className="text-lg font-black text-white mt-1 tabular-nums">{formatDaAvKpiValue(card)}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()
                              ) : (
                              <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                  <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">DA / AV criteria</p>
                                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">SSR · REDO · CHATBOT · HASS · ACC CORE PARTS (VD) · TRAINING ATTENDANCE · LINKAGE RATIO</p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <TierLogo tier={resolveTierByMode(eng)} size="lg" />
                                  </div>
                                </div>
                                <div className="space-y-5 pl-2 md:pl-4 border-l-2 border-emerald-500/35">
                                  <MetricBar label="SSR" value={dispSsr} max={100} suffix="%" target={0} inverse={false} />
                                  <MetricBar label="REDO" value={parseFloat(eng.redoRatio || 0)} max={100} suffix="%" target={0} inverse />
                                  <MetricBar label="Chatbot" value={parseFloat(eng.maintenanceModeRatio || 0)} max={100} suffix="%" target={0} inverse={false} />
                                  <MetricBar label="HASS" value={parseFloat(eng.oqcPassRate || 0)} max={100} suffix="%" target={0} inverse={false} />
                                  <MetricBar label="Acc Core Parts (VD)" value={dispCore} max={100} suffix="%" target={0} inverse={false} />
                                  <MetricBar label="Training Attendance" value={dispTrain} max={100} suffix="%" target={0} inverse={false} />
                                  <MetricBar label="Linkage ratio" value={dispIqc} max={100} suffix="%" target={0} inverse={false} />
                                </div>
                              </div>
                              )
                            ) : isUnifiedEngineerRecord(eng) ? (
                              (() => {
                                const presentQs = listPresentQuarters(eng);
                                const allQs = Object.keys(eng.quarters || {}).sort();
                                const qKeys = allQs.length ? allQs : ['Q1', 'Q2'];
                                const activeQ =
                                  (selectedProfileQuarter && qKeys.includes(String(selectedProfileQuarter).split('-')[0].toUpperCase())
                                    ? String(selectedProfileQuarter).split('-')[0].toUpperCase()
                                    : null)
                                  || presentQs[presentQs.length - 1]
                                  || qKeys[0];
                                const qBlock = eng.quarters?.[activeQ];
                                const qPresent = Boolean(qBlock?.present);
                                const flat = qPresent ? flattenQuarterForDisplay(qBlock) : null;
                                const qFinal = qPresent ? getUnifiedQuarterFinalResult(eng, activeQ) : null;
                                const avgFinal = getUnifiedAverageFinalResult(eng);
                                const kpiCards = getUnifiedQuarterKpiCards(activeQ, flat);
                                return (
                                  <div className="space-y-6">
                                    <div>
                                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Choose quarter</p>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {qKeys.map((q) => {
                                          const has = engineerHasQuarter(eng, q);
                                          const key = `${q}-${eng.year || new Date().getFullYear()}`;
                                          return (
                                            <button
                                              key={q}
                                              type="button"
                                              onClick={() => setSelectedProfileQuarter(key)}
                                              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                q === activeQ
                                                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                                  : has
                                                    ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                                                    : 'bg-zinc-950 border-white/5 text-zinc-600'
                                              }`}
                                            >
                                              {q}{has ? '' : ' · N/A'}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                        <div>
                                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">{activeQ} evaluation criteria</p>
                                          <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">
                                            {activeQ === 'Q1'
                                              ? 'SSR % · RRR90 % · IQC Skip % · Core Parts · MPU % · DRNPS % · Exam'
                                              : 'LCD/OCTA % · PBA % · Multi Parts % · IQC Skip % · RRR30 % · Training · DRNPS % · Maintenance % · OQC Fail %'}
                                          </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                          <span className="text-3xl md:text-4xl font-black text-white italic tabular-nums">
                                            {qFinal != null ? qFinal.toFixed(1) : 'N/A'}
                                          </span>
                                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{activeQ} Final Result</p>
                                          <p className="text-[9px] text-zinc-500 mt-1">TCS Rank (avg): {avgFinal != null ? avgFinal.toFixed(1) : 'N/A'}</p>
                                        </div>
                                      </div>

                                      {!qPresent ? (
                                        <p className="text-amber-400/90 text-sm font-bold">
                                          {qBlock?.notes || eng.notes || `No ${activeQ} record for this engineer.`}
                                        </p>
                                      ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {kpiCards.map((card) => (
                                            <div key={card.label} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{card.label}</p>
                                              <p className="text-lg font-black text-white mt-1 tabular-nums">{formatUnifiedKpiValue(card)}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <>
                                <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/5 pb-5">
                                    <div>
                                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.35em]">Engineer evaluation</p>
                                      <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">Sub-metrics: SSR · RRR · IQC skip · Core parts · Q1 training</p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <span className="text-3xl md:text-4xl font-black text-white italic tabular-nums">{dispEval.toFixed(1)}</span>
                                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Target ≥ 90</p>
                                    </div>
                                  </div>
                                  <div className="space-y-5 pl-2 md:pl-4 border-l-2 border-emerald-500/35">
                                    <MetricBar label="SSR %" value={dispSsr} max={100} suffix="%" target={0} inverse />
                                    <MetricBar label="RRR (RRR90)" value={dispRrr} max={100} suffix="%" target={0} inverse />
                                    <MetricBar label="IQC skip %" value={dispIqc} max={100} suffix="%" target={25} inverse />
                                    <MetricBar label="Core parts %" value={dispCore} max={100} suffix="%" target={30} inverse />
                                    <MetricBar label="Q1 training (max 20 pts)" value={Math.min(20, dispTrain)} max={20} suffix=" pts" target={20} />
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-purple-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-4">
                                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.35em]">DRNPS</p>
                                  <MetricBar label="DRNPS" value={dispDrnpsSheet} max={100} suffix="" target={80} />
                                </div>
                                <div className="rounded-2xl border border-blue-500/25 bg-zinc-950/70 p-6 md:p-8 space-y-4">
                                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.35em]">Exam</p>
                                  <MetricBar label="Exam" value={dispExam} max={100} suffix="%" target={90} />
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="rounded-xl border border-blue-500/20 bg-zinc-950/60 p-4">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.25em]">Monthly total (Σpoint)</p>
                                <p className="text-2xl font-black text-white italic tabular-nums mt-1">{parseFloat(((eng.pqaBranch || appMode) === 'PQA_CE' ? (eng.centerMonthlyScore ?? eng.monthlyScore ?? eng.evalMonthlyScore) : (eng.evalMonthlyScore ?? eng.monthlyScore ?? eng.centerMonthlyScore)) || resolvePqaTcsScore(eng) || 0).toFixed(1)}</p>
                              </div>
                              <div className="rounded-xl border border-zinc-700/40 bg-zinc-950/60 p-4">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">Monthly rank</p>
                                <p className="text-2xl font-black text-zinc-200 italic tabular-nums mt-1">#{parseInt(((eng.pqaBranch || appMode) === 'PQA_CE' ? (eng.centerMonthlyRank || eng.monthlyRank || eng.monthlyEvalRank) : (eng.monthlyEvalRank || eng.monthlyRank || eng.centerMonthlyRank)) || 0, 10) || '-'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              <MetricBar label="LTP" value={parseFloat(eng.ltp || 0)} max={pqaSnapCaps.ltp} suffix=" pts" target={pqaSnapCaps.ltp} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="LTP VD" value={parseFloat(eng.ltpVd || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="LTP DA" value={parseFloat(eng.ltpDa || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="EX-LTP" value={parseFloat(eng.exLtp || 0)} max={pqaSnapCaps.exLtp} suffix=" pts" target={pqaSnapCaps.exLtp} />
                              <MetricBar label="REDO" value={parseFloat(eng.redo || 0)} max={pqaSnapCaps.redo} suffix=" pts" target={pqaSnapCaps.redo} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="DA Re-do" value={parseFloat(eng.redoDa || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="VD Re-do" value={parseFloat(eng.redoVd || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="SSR" value={parseFloat(eng.ssr || 0)} max={pqaSnapCaps.ssr} suffix=" pts" target={pqaSnapCaps.ssr} />
                              <MetricBar label="D-RNPS" value={parseFloat(eng.dRnps || 0)} max={pqaSnapCaps.dRnps} suffix=" pts" target={pqaSnapCaps.dRnps} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="NPS" value={parseFloat(eng.nps || 0)} max={20} suffix=" pts" target={20} />
                              )}
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="NPS-DR" value={parseFloat(eng.npsDr || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="OFS" value={parseFloat(eng.ofs || 0)} max={pqaSnapCaps.ofs} suffix=" pts" target={pqaSnapCaps.ofs} />
                              {(eng.pqaBranch || appMode) === 'PQA_CE' && (
                                <MetricBar label="Appointments" value={parseFloat(eng.appointments || 0)} max={5} suffix=" pts" target={5} />
                              )}
                              <MetricBar label="R-CXE" value={parseFloat(eng.rCxe || 0)} max={pqaSnapCaps.rCxe} suffix=" pts" target={pqaSnapCaps.rCxe} />
                              <MetricBar label="CO.A" value={parseFloat(eng.coa || 0)} max={pqaSnapCaps.coa || 50} suffix="" target={pqaSnapCaps.coa || 50} />
                              <MetricBar label="SDR" value={parseFloat(eng.sdr || 0)} max={pqaSnapCaps.sdr} suffix=" pts" target={pqaSnapCaps.sdr} />
                              <MetricBar label="Audit" value={Math.abs(parseFloat(eng.audit || 0))} max={pqaSnapCaps.audit} suffix=" ded" target={0} inverse />
                              <MetricBar label="PR" value={Math.abs(parseFloat(eng.pr || 0))} max={pqaSnapCaps.pr} suffix=" ded" target={0} inverse />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // ── Unified MX engineer (one doc + quarters{}) ─────────────────────────────
                  if (!isPqaMode && appMode === 'TCS_MX' && tcsMxRoleTab === 'engineers' && isUnifiedEngineerRecord(selectedEngineer)) {
                    const uEng = selectedEngineer;
                    const presentQs = listPresentQuarters(uEng);
                    const allQs = Object.keys(uEng.quarters || {}).sort();
                    const qKeys = allQs.length ? allQs : ['Q1', 'Q2'];
                    const avgFinal = getUnifiedAverageFinalResult(uEng);
                    const activeQ =
                      (selectedProfileQuarter && qKeys.includes(String(selectedProfileQuarter).split('-')[0].toUpperCase())
                        ? String(selectedProfileQuarter).split('-')[0].toUpperCase()
                        : null)
                      || presentQs[presentQs.length - 1]
                      || qKeys[0];
                    const qBlock = uEng.quarters?.[activeQ];
                    const qPresent = Boolean(qBlock?.present);
                    const flat = qPresent ? flattenQuarterForDisplay(qBlock) : null;
                    const qFinal = qPresent ? getUnifiedQuarterFinalResult(uEng, activeQ) : null;
                    const kpiCards = getUnifiedQuarterKpiCards(activeQ, flat);

                    return (
                      <div className="space-y-8">
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Choose quarter</p>
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            {qKeys.map((q) => {
                              const has = engineerHasQuarter(uEng, q);
                              const key = `${q}-${uEng.year || new Date().getFullYear()}`;
                              return (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => setSelectedProfileQuarter(key)}
                                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    q === activeQ
                                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                      : has
                                        ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                                        : 'bg-zinc-950 border-white/5 text-zinc-600'
                                  }`}
                                >
                                  {q}{has ? '' : ' · N/A'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 border-blue-500/10">
                          <div className="flex flex-col items-center md:border-r border-white/5 md:pr-8 flex-shrink-0">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                              {activeQ} Final Result
                            </span>
                            <TierLogo tier={getMxEvaluationTier(qFinal ?? avgFinal)} size="xl" />
                            <span className="text-4xl font-black text-white mt-3 tabular-nums">
                              {qFinal != null ? qFinal.toFixed(1) : 'N/A'}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-2">
                              TCS Rank (avg): {avgFinal != null ? avgFinal.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex-1 w-full space-y-3">
                            {!qPresent ? (
                              <p className="text-amber-400/90 text-sm font-bold text-center md:text-left">
                                {qBlock?.notes || uEng.notes || `No ${activeQ} record for this engineer.`}
                              </p>
                            ) : qFinal == null ? (
                              <p className="text-amber-400/90 text-sm font-bold text-center md:text-left">
                                {uEng.notes || `${activeQ} metrics present, but Final Result was not computable (e.g. missing Q1 baseline).`}
                              </p>
                            ) : (
                              <p className="text-zinc-400 text-xs text-center md:text-left">
                                {activeQ === 'Q1'
                                  ? 'Q1 criteria: SSR, RRR90, IQC Skip, Core Parts, MPU, Training, Bonus, DRNPS, Exam.'
                                  : 'Q2 criteria: LCD/OCTA, PBA, Multi Parts, IQC Skip, RRR30, Training, DRNPS, Maintenance Mode, OQC.'}
                              </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {kpiCards.map((card) => (
                                <div key={card.label} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{card.label}</p>
                                  <p className="text-lg font-black text-white mt-1 tabular-nums">{qPresent ? formatUnifiedKpiValue(card) : 'N/A'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // ── Unified DA/AV engineer (quarters{} — do not alter MX block above) ─────
                  if (
                    !isPqaMode &&
                    (appMode === 'TCS_DA' || appMode === 'TCS_AV' || appMode === 'TCS_VD') &&
                    selectedEngineer?.quarters
                  ) {
                    const uEng = selectedEngineer;
                    const presentQs = Object.keys(uEng.quarters || {}).filter((q) => uEng.quarters[q]?.present).sort();
                    const allQs = Object.keys(uEng.quarters || {}).sort();
                    const qKeys = allQs.length ? allQs : ['Q1', 'Q2'];
                    const avgFinal = getDaAvAverageFinal(uEng);
                    const activeQ =
                      (selectedProfileQuarter && qKeys.includes(String(selectedProfileQuarter).split('-')[0].toUpperCase())
                        ? String(selectedProfileQuarter).split('-')[0].toUpperCase()
                        : null)
                      || presentQs[presentQs.length - 1]
                      || qKeys[0];
                    const qBlock = uEng.quarters?.[activeQ];
                    const qPresent = Boolean(qBlock?.present);
                    const qFinal = getDaAvQuarterFinal(uEng, activeQ);
                    const kpiCards = getDaAvQuarterKpiCards(activeQ, qBlock?.metrics || {});

                    return (
                      <div className="space-y-8">
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Choose quarter</p>
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            {qKeys.map((q) => {
                              const has = Boolean(uEng.quarters?.[q]?.present);
                              const key = `${q}-${uEng.year || new Date().getFullYear()}`;
                              return (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => setSelectedProfileQuarter(key)}
                                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    q === activeQ
                                      ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                                      : has
                                        ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                                        : 'bg-zinc-950 border-white/5 text-zinc-600'
                                  }`}
                                >
                                  {q}{has ? '' : ' · N/A'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 border-amber-500/10">
                          <div className="flex flex-col items-center md:border-r border-white/5 md:pr-8 flex-shrink-0">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                              {activeQ} Final
                            </span>
                            <TierLogo tier={getTier(qFinal ?? avgFinal)} size="xl" />
                            <span className="text-4xl font-black text-white mt-3 tabular-nums">
                              {qFinal != null ? qFinal.toFixed(1) : 'N/A'}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-2">
                              TCS Rank (avg): {avgFinal != null ? avgFinal.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex-1 w-full space-y-3">
                            {!qPresent ? (
                              <p className="text-amber-400/90 text-sm font-bold text-center md:text-left">
                                {qBlock?.notes || uEng.notes || `No ${activeQ} record for this engineer.`}
                              </p>
                            ) : (
                              <p className="text-zinc-400 text-xs text-center md:text-left">
                                {activeQ === 'Q1'
                                  ? 'Q1 criteria: SSR, REDO, Chatbot, HASS, Acc Core Parts, Training Attendance, Linkage Ratio.'
                                  : 'Q2 criteria: RNPS, REDO, Training Attendance, ST Con, MJ %, Complete Repair, Kahoot, HASS, Repair Volume.'}
                              </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {kpiCards.map((card) => (
                                <div key={card.label} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{card.label}</p>
                                  <p className="text-lg font-black text-white mt-1 tabular-nums">{qPresent ? formatDaAvKpiValue(card) : 'N/A'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Build list of all monthly & quarterly periods for this engineer
                  // Deduplicate by month+year — keep highest score record per period
                  const allEngRecords = engineers
                    .filter((e) =>
                      isPqaMode
                        ? engineerCodeMatchesQuery(e.code, selectedEngineer.code)
                        : e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()
                    )
                    .sort((a, b) => {
                      const ya = parseInt(a.year), yb = parseInt(b.year);
                      if (ya !== yb) return ya - yb; // oldest year first
                      return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                    });
                  const pqaRowRichness = (r) =>
                    ['ltp', 'ltpVd', 'ltpDa', 'exLtp', 'redo', 'redoVd', 'redoDa', 'ssr', 'dRnps', 'nps', 'npsDr', 'ofs', 'rCxe', 'appointments', 'sdr', 'audit', 'pr'].reduce(
                      (s, f) => s + Math.abs(parseFloat(r[f] || 0)),
                      0
                    );
                  // One record per month-year: TCS keeps highest tcsScore; PQA prefers rows with Evaluation-point KPIs
                  const dedupByMonth = {};
                  allEngRecords.forEach((r) => {
                    const k = `${r.month?.toLowerCase()}-${r.year}`;
                    const prev = dedupByMonth[k];
                    if (!prev) {
                      dedupByMonth[k] = r;
                      return;
                    }
                    if (isPqaMode) {
                      const nr = pqaRowRichness(r);
                      const np = pqaRowRichness(prev);
                      if (nr > np) dedupByMonth[k] = r;
                      else if (nr === np && parseFloat(r.tcsScore || 0) <= 100 && parseFloat(prev.tcsScore || 0) > 100) {
                        dedupByMonth[k] = r;
                      }
                    } else if (resolveTcsDashboardScore(r) > resolveTcsDashboardScore(prev)) {
                      dedupByMonth[k] = r;
                    }
                  });
                  const engRecords = Object.values(dedupByMonth).sort((a, b) => {
                    const ya = parseInt(a.year), yb = parseInt(b.year);
                    if (ya !== yb) return ya - yb; // oldest year first
                    return getMonthIndex(a.month) - getMonthIndex(b.month); // Jan → Dec
                  });
                  const monthPeriods = engRecords.map((r, idx) => ({
                    key: `${r.month}-${r.year}`,
                    reactKey: r.id ? String(r.id) : `mp-${idx}-${r.month}-${r.year}`,
                    label: `${r.month} ${r.year}`,
                  }));
                  const quarterPeriods = [...new Map(
                    engRecords
                      .filter(r => getQuarter(r.month) !== null)
                      .map(r => {
                        const q = getQuarter(r.month);
                        const qk = `${q}-${r.year}`;
                        return [qk, { key: qk, label: `${q} · ${r.year}` }];
                      })
                  ).values()];


                  // Effective display record
                  const effMonthKey = selectedProfileMonth || monthPeriods[0]?.key;
                  const { month: effM, year: effY } = parseMonthYearKey(effMonthKey || '');
                  const effRecord = engRecords.find(
                    r => r.month?.toLowerCase() === effM?.toLowerCase() && String(r.year) === String(effY)
                  ) || selectedEngineer;

                  const mergePqaForProfile = (rec) => {
                    if (!rec || !isPqaMode) return rec;
                    const br = rec.pqaBranch || appMode;
                    const sibs = engineers.filter((e) => {
                      if (br && e.pqaBranch && e.pqaBranch !== br) return false;
                      return engineerCodeMatchesQuery(e.code, rec.code);
                    });
                    return mergePqaKpiFromRecords(rec, sibs);
                  };
                  const pqaEffMerged = isPqaMode && effRecord ? mergePqaForProfile(effRecord) : null;

                  const effQKey = selectedProfileQuarter || quarterPeriods[0]?.key;

                  // Quarterly average for this engineer in the selected quarter
                  const [effQ, effQY] = (effQKey || '').split('-');
                  const qRecords = engRecords.filter(
                    r => getQuarter(r.month) === effQ && r.year === effQY
                  );
                  const qAvgScore = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + resolveTcsDashboardScore(r), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgDrnps = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + calculateDRNPS(r.promoters, r.detractors), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgExam = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.examScore || 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgSsr = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.ssrScore ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgRrr = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.rrrScore || 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgIqc = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + resolveMxIqcSkipForDisplay(r), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgCoreParts = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.corePartsScore ?? r.corePartsPBA ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgQ1Training = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.q1TrainingScore ?? r.trainingAttendance ?? 0), 0) / qRecords.length).toFixed(1))
                    : 0;
                  const qAvgEval = qRecords.length > 0
                    ? parseFloat((qRecords.reduce((s, r) => s + (parseFloat(r.engineerEvaluation || 0)), 0) / qRecords.length).toFixed(1))
                    : 0;

                  // The record whose data drives the performance bars (PQA: merge Evaluation-point KPIs from all uploads for this center)
                  const dispRecord = (() => {
                    if (!isPqaMode) {
                      return profileViewMode === 'QUARTERLY' ? (qRecords[0] || selectedEngineer) : effRecord;
                    }
                    if (profileViewMode === 'QUARTERLY') {
                      return mergePqaForProfile(qRecords[0] || effRecord || selectedEngineer);
                    }
                    return pqaEffMerged || effRecord;
                  })();
                  const dispScore = (() => {
                    if (!isPqaMode) {
                      return profileViewMode === 'QUARTERLY' ? qAvgScore : resolveTcsDashboardScore(effRecord);
                    }
                    if (profileViewMode === 'QUARTERLY' && qRecords.length > 0) {
                      return parseFloat(
                        (
                          qRecords.reduce((s, r) => s + resolvePqaTcsScore(mergePqaForProfile(r)), 0) /
                          qRecords.length
                        ).toFixed(1)
                      );
                    }
                    return resolvePqaTcsScore(pqaEffMerged || effRecord);
                  })();
                  
                  // Weighted component pts - handle PQA vs TCS
                  const dispExam = isPqaMode ? 0 : (profileViewMode === 'QUARTERLY' ? qAvgExam : parseFloat(effRecord.examScore || 0));
                  const dispDrnps = isPqaMode ? parseFloat(dispRecord.dRnps || 0) : (profileViewMode === 'QUARTERLY' ? qAvgDrnps : calculateDRNPS(effRecord.promoters, effRecord.detractors));
                  const dispSsr = profileViewMode === 'QUARTERLY' ? qAvgSsr : parseFloat(effRecord.ssrScore ?? 0);
                  const dispRrr = profileViewMode === 'QUARTERLY' ? qAvgRrr : parseFloat(effRecord.rrrScore || 0);
                  const dispIqc = profileViewMode === 'QUARTERLY' ? qAvgIqc : resolveMxIqcSkipForDisplay(effRecord);
                  const dispCoreParts = profileViewMode === 'QUARTERLY' ? qAvgCoreParts : parseFloat(effRecord.corePartsScore ?? effRecord.corePartsPBA ?? 0);
                  const dispQ1Training = profileViewMode === 'QUARTERLY' ? qAvgQ1Training : parseFloat(effRecord.q1TrainingScore ?? effRecord.trainingAttendance ?? 0);
                  const dispDrnpsRaw = profileViewMode === 'QUARTERLY'
                    ? parseFloat((qRecords.reduce((s, r) => s + parseFloat(r.drnpsScore ?? calculateDRNPS(r.promoters, r.detractors)), 0) / (qRecords.length || 1)).toFixed(1))
                    : parseFloat(effRecord.drnpsScore ?? calculateDRNPS(effRecord.promoters, effRecord.detractors));

                  const examPts = isPqaMode ? 0 : parseFloat(Math.min(20, (dispExam / 100) * 20).toFixed(1));
                  const drnpsPts = isPqaMode ? 0 : parseFloat(Math.min(30, (dispDrnps / 100) * 30).toFixed(1));
                  const isDaAvModePre = !isPqaMode && (
                    appMode === 'TCS_DA' ||
                    appMode === 'TCS_AV' ||
                    appMode === 'TCS_VD' ||
                    ['DA', 'AV', 'VD'].includes(String(effRecord?.product || selectedEngineer?.product || '').toUpperCase())
                  );
                  const hasEngineerEvaluation = profileViewMode === 'QUARTERLY'
                    ? qRecords.some(r => r.engineerEvaluation !== undefined && r.engineerEvaluation !== null && r.engineerEvaluation !== '')
                    : (effRecord.engineerEvaluation !== undefined && effRecord.engineerEvaluation !== null && effRecord.engineerEvaluation !== '');
                  const useMxEvalBreakdown =
                    !isPqaMode && appMode === 'TCS_MX' && hasEngineerEvaluation;
                  const hideLegacyKpiBreakdown = !isPqaMode && appMode === 'TCS_MX';
                  const dispEval = profileViewMode === 'QUARTERLY' ? qAvgEval : parseFloat(effRecord.engineerEvaluation || 0);
                  const evalPts = isPqaMode ? 0 : parseFloat(Math.min(50, (dispEval / 100) * 50).toFixed(1));
                  const kpiPts = isPqaMode
                    ? dispScore
                    : (useMxEvalBreakdown
                      ? evalPts
                      : parseFloat(((dispScore - (examPts || 0) - (drnpsPts || 0))).toFixed(1)));
                  const isDaAvProfile = isDaAvModePre;
                  const daAvCriteriaBars = [
                    { label: 'SSR', value: parseFloat(dispRecord.ssrScore ?? dispSsr ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                    { label: 'REDO', value: parseFloat(dispRecord.redoRatio ?? 0), max: 100, suffix: '%', target: 0, inverse: true },
                    { label: 'Chatbot', value: parseFloat(dispRecord.maintenanceModeRatio ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                    { label: 'HASS', value: parseFloat(dispRecord.oqcPassRate ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                    { label: 'Acc Core Parts (VD)', value: parseFloat(dispRecord.corePartsScore ?? dispRecord.corePartsPBA ?? dispCoreParts ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                    { label: 'Training Attendance', value: parseFloat(dispRecord.q1TrainingScore ?? dispRecord.trainingAttendance ?? dispQ1Training ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                    { label: 'Linkage ratio', value: parseFloat(dispRecord.iqcSkipRatio ?? dispIqc ?? 0), max: 100, suffix: '%', target: 0, inverse: false },
                  ];
                  const daAvCriteriaCards = [
                    { label: 'SSR', value: `${parseFloat(activeRecord.ssrScore ?? 0).toFixed(1)}%` },
                    { label: 'REDO', value: `${parseFloat(activeRecord.redoRatio ?? 0).toFixed(1)}%` },
                    { label: 'Chatbot', value: `${parseFloat(activeRecord.maintenanceModeRatio ?? 0).toFixed(1)}%` },
                    { label: 'HASS', value: `${parseFloat(activeRecord.oqcPassRate ?? 0).toFixed(1)}%` },
                    { label: 'Acc Core Parts (VD)', value: `${parseFloat(activeRecord.corePartsScore ?? activeRecord.corePartsPBA ?? 0).toFixed(1)}%` },
                    { label: 'Training Attendance', value: `${parseFloat(activeRecord.trainingAttendance ?? activeRecord.q1TrainingScore ?? 0).toFixed(1)}%` },
                    { label: 'Linkage ratio', value: `${parseFloat(activeRecord.iqcSkipRatio ?? 0).toFixed(1)}%` },
                  ];

                  return (
                    <div className="space-y-8">
                      {/* Period toggle */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="inline-flex bg-zinc-900 border border-white/10 rounded-2xl p-1 gap-1">
                          {['MONTHLY', 'QUARTERLY'].map(mode => (
                            <button
                              key={mode}
                              onClick={() => setProfileViewMode(mode)}
                              className={`px-6 py-2(5) rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileViewMode === mode
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-zinc-500 hover:text-white'
                                }`}
                            >
                              {mode === 'MONTHLY' ? '📅 Monthly' : '📊 Quarterly'}
                            </button>
                          ))}
                        </div>

                        {/* Month or Quarter picker */}
                        {profileViewMode === 'MONTHLY' ? (
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            {monthPeriods.map(p => (
                              <button
                                key={p.reactKey}
                                onClick={() => {
                                  setSelectedProfileMonth(p.key);
                                  const { month: m, year: y } = parseMonthYearKey(p.key);
                                  const rec = engRecords.find(r => r.month?.toLowerCase() === m?.toLowerCase() && String(r.year) === String(y));
                                  if (rec) setSelectedEngineer(rec);
                                }}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.key === effMonthKey
                                  ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                                  : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                  }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            {quarterPeriods.map(p => (
                              <button
                                key={p.key}
                                onClick={() => setSelectedProfileQuarter(p.key)}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.key === effQKey
                                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                  : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'
                                  }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score breakdown + TCS total */}
                      <div className="glass-card rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 border-blue-500/10">
                        {/* TCS rank logo / PQA total */}
                    <div className="flex flex-col items-center md:border-r border-white/5 md:pr-8 flex-shrink-0">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                            {profileViewMode === 'QUARTERLY' ? `Avg ${isPqaMode ? 'Points' : 'TCS'} — ${effQKey?.replace('-', ' ')}` : `${isPqaMode ? 'Monthly Sum' : 'TCS Score'} — ${effM ? `${effM} ${effY}` : '—'}`}
                          </span>
                          {isPqaMode ? (
                            <span className="text-6xl font-black text-white italic tracking-tighter">{dispScore}</span>
                          ) : (
                            <TierLogo tier={appMode === 'TCS_MX' ? getMxEvaluationTier(dispEval) : getTier(dispScore)} size="xl" />
                          )}
                          {dispRecord.monthlyRank > 0 && profileViewMode === 'MONTHLY' && (
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2">Monthly Rank: #{dispRecord.monthlyRank}</span>
                          )}
                          {/* TCS: rank logo in main block | PQA: keep score metadata */}
                          {isPqaMode ? (
                            <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">PQA Score</span>
                            </div>
                          ) : (
                            <p className="mt-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest">Rank Logo</p>
                          )}
                        </div>

                        {/* Three weighted components / PQA Components */}
                        <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                          {!isPqaMode ? (
                            <>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">{useMxEvalBreakdown ? 'Evaluation' : 'KPIs'}</span>
                                <span className="text-3xl font-black text-emerald-300 italic">{kpiPts > 0 ? kpiPts.toFixed(1) : '—'}</span>
                              </div>
                              <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">DRNPS</span>
                                <span className="text-3xl font-black text-purple-300 italic">{drnpsPts.toFixed(1)}</span>
                              </div>
                              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Exam</span>
                                <span className="text-3xl font-black text-blue-300 italic">{examPts.toFixed(1)}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Base Pts</span>
                                <span className="text-3xl font-black text-emerald-300 italic">
                                  {(parseFloat(dispRecord.ltp || 0) + parseFloat(dispRecord.exLtp || 0) + parseFloat(dispRecord.redo || 0) + 
                                    parseFloat(dispRecord.ssr || 0) + parseFloat(dispRecord.dRnps || 0) + parseFloat(dispRecord.ofs || 0) + 
                                    parseFloat(dispRecord.rCxe || 0) + parseFloat(dispRecord.sdr || 0)).toFixed(1)}
                                </span>
                              </div>
                              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Audit</span>
                                <span className="text-3xl font-black text-rose-300 italic">{Math.abs(dispRecord.audit || 0).toFixed(1)}</span>
                              </div>
                              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">PR/Penalty</span>
                                <span className="text-3xl font-black text-orange-300 italic">{Math.abs(dispRecord.pr || 0).toFixed(1)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Capability Metrics Matrix */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass-card rounded-[3rem] p-10 space-y-8 md:col-span-2">
                          <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                              <Activity className="w-4 h-4 text-blue-500" /> Performance Analysis
                            </h3>
                            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                              Ref: CY-{dispRecord.year}/{dispRecord.month?.slice(0, 3).toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-10 py-4">
                            {isPqaMode ? (
                              <div className="space-y-8">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em]">Operations Scoring Components</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                  <MetricBar label="LTP" value={parseFloat(dispRecord.ltp || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="Ex-LTP" value={parseFloat(dispRecord.exLtp || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="REDO Rate" value={parseFloat(dispRecord.redo || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="SSR Utilization" value={parseFloat(dispRecord.ssr || 0)} max={20} suffix=" pts" target={20} />
                                  <MetricBar label="D-RNPS" value={parseFloat(dispRecord.dRnps || 0)} max={20} suffix=" pts" target={20} />
                                  <MetricBar label="OFS Accuracy" value={parseFloat(dispRecord.ofs || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="R-CXE Quality" value={parseFloat(dispRecord.rCxe || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="SDR Score" value={parseFloat(dispRecord.sdr || 0)} max={10} suffix=" pts" target={10} />
                                  <MetricBar label="Process Audit" value={parseFloat(dispRecord.audit || 0)} max={5} suffix=" ded" target={0} inverse />
                                  <MetricBar label="Policy Review (PR)" value={parseFloat(dispRecord.pr || 0)} max={5} suffix=" ded" target={0} inverse />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-5">
                                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Score Components</p>
                                  <MetricBar label="Exam Score" value={dispExam} max={100} suffix=" pts" target={90} />
                                  <MetricBar label="DRNPS" value={parseFloat(dispDrnps.toFixed(1))} max={100} suffix=" pts" target={80} />
                                </div>
                                <div className="border-t border-white/5 pt-8 space-y-6">
                                  <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Uploaded Excel Metrics</p>
                                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest -mt-1 mb-1">Columns match the MX template: EngineerEvaluation → SSR, RRR, IQC skip, Core parts, Q1 training · DRNPS and Exam are separate categories.</p>
                                  <div className="rounded-2xl border border-emerald-500/20 bg-zinc-950/50 p-6 space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-white/5 pb-4">
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Engineer evaluation</p>
                                      <span className="text-2xl font-black text-white italic tabular-nums">{dispEval.toFixed(1)}</span>
                                    </div>
                                    <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-emerald-500/30">
                                      <MetricBar label="SSR %" value={dispSsr} max={100} suffix="%" target={0} inverse />
                                      <MetricBar label="RRR (RRR90)" value={dispRrr} max={100} suffix="%" target={0} inverse />
                                      <MetricBar label="IQC skip %" value={dispIqc} max={100} suffix="%" target={25} inverse />
                                      <MetricBar label="Core parts %" value={dispCoreParts} max={100} suffix="%" target={30} inverse />
                                      <MetricBar label="Q1 training (max 20 pts)" value={Math.min(20, dispQ1Training)} max={20} suffix=" pts" target={20} />
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-purple-500/20 bg-zinc-950/50 p-6 space-y-3">
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">DRNPS</p>
                                    <MetricBar label="DRNPS (sheet)" value={dispDrnpsRaw} max={100} suffix="" target={80} />
                                  </div>
                                  <div className="rounded-2xl border border-blue-500/20 bg-zinc-950/50 p-6 space-y-3">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Exam</p>
                                    <MetricBar label="Exam" value={dispExam} max={100} suffix="%" target={90} />
                                  </div>
                                </div>
                                {!hideLegacyKpiBreakdown && (
                                  <div className="border-t border-white/5 pt-8 space-y-5">
                                    <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">KPI Breakdown (50% of Total)</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                      {isDaAvProfile ? (
                                        daAvCriteriaBars.map((k) => (
                                          <MetricBar key={k.label} label={k.label} value={k.value} max={k.max} suffix={k.suffix} target={k.target} inverse={k.inverse} />
                                        ))
                                      ) : (
                                        <>
                                          <MetricBar label="Training Attendance" value={parseFloat(dispRecord.trainingAttendance || 0)} max={100} suffix="%" target={100} />
                                          <MetricBar label="OQC Pass Rate" value={parseFloat(dispRecord.oqcPassRate || 0)} max={100} suffix="%" target={85} />
                                          <MetricBar label="Maintenance Mode" value={parseFloat(dispRecord.maintenanceModeRatio || 0)} max={100} suffix="%" target={65} />
                                          <MetricBar label="REDO Ratio" value={parseFloat(dispRecord.redoRatio || 0)} max={3} suffix="%" target={0.7} inverse />
                                          <MetricBar label="IQC Skip Ratio" value={resolveMxIqcSkipForDisplay(dispRecord)} max={50} suffix="%" target={25} inverse />
                                          <MetricBar label="Core Parts PBA" value={parseFloat(dispRecord.corePartsPBA || 0)} max={80} suffix="%" target={30} inverse />
                                          <MetricBar label="Core Parts Octa" value={parseFloat(dispRecord.corePartsOcta || 0)} max={80} suffix="%" target={40} inverse />
                                          <MetricBar label="Multi Parts Ratio" value={parseFloat(dispRecord.multiPartsRatio || 0)} max={5} suffix="%" target={1} inverse />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>


                        <div className="space-y-8">
                          {/* Global Rank Card */}
                          <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20">
                              <Layers className="w-8 h-8" />
                            </div>
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Global Network Rank</h4>
                            <span className="text-5xl font-black text-white italic tracking-tighter mb-2">#{sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1}</span>
                            <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest">Top {Math.round(((sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1) / engineers.length) * 100)}% of global talent</p>
                          </div>

                          {/* Audit Metadata + Tier */}
                          <div className="glass-card rounded-[3rem] p-10">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Audit Metadata</h4>
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Cycle</span>
                                <span className="text-xs font-black text-white uppercase">{selectedEngineer.month} {selectedEngineer.year}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Quarter</span>
                                <span className="text-xs font-black text-yellow-400 uppercase">{selectedEngineer.quarter || getQuarter(selectedEngineer.month)} · {selectedEngineer.year}</span>
                              </div>
                              {selectedEngineer.sbaId && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-zinc-600 uppercase">SBA ID</span>
                                  <span className="text-xs font-black text-white uppercase">{selectedEngineer.sbaId}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">{isPqaMode ? 'Ranking' : 'Tier Status'}</span>
                                {isPqaMode ? (
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Numeric Only</span>
                                ) : (
                                  <TierBadge tier={resolveTierByMode(selectedEngineer)} size="sm" />
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Auth Code</span>
                                <span className="text-[10px] font-mono text-zinc-400">TCS-{selectedEngineer.code}</span>
                              </div>
                            </div>
                          </div>

                          {/* History Button */}
                          {engineerHistory.length > 0 && (
                            <button
                              onClick={() => setView('ENGINEER_HISTORY')}
                              className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-zinc-900 border border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                            >
                              <Clock className="w-4 h-4" /> View History ({engineerHistory.length} months)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  );
                })()}



                {/* Compliance Watermark */}
                <div className="pt-12 text-center opacity-20 select-none pointer-events-none">
                  <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">Official TCS Certification Document • Unauthorized reproduction prohibited</p>
                </div>
              </div>
            </>
          )}

          {/* ─── ENGINEER HISTORY VIEW ──────────────────────────────────────────────── */}
          {view === 'ENGINEER_HISTORY' && selectedEngineer && (() => {
            // All records for this engineer — engineerHistory is newest-first
            const allRecords = engineerHistory;
            const dedupByPeriod = {};
            allRecords.forEach(r => {
              const k = `${String(r.month || '').toLowerCase()}-${r.year}`;
              if (!dedupByPeriod[k] || (r.tcsScore ?? 0) > (dedupByPeriod[k].tcsScore ?? 0)) dedupByPeriod[k] = r;
            });
            const calendarRecords = Object.values(dedupByPeriod).sort((a, b) => {
              const ya = parseInt(a.year), yb = parseInt(b.year);
              if (ya !== yb) return ya - yb;
              return getMonthIndex(a.month) - getMonthIndex(b.month);
            });
            const newestKey = allRecords[0] ? `${allRecords[0].month}-${allRecords[0].year}` : null;
            const effKey = selectedHistoryMonth || newestKey;
            const { month: ekM, year: ekY } = parseMonthYearKey(effKey || '');
            const activeRecord = calendarRecords.find(
              r => r.month?.toLowerCase() === ekM?.toLowerCase() && String(r.year) === String(ekY)
            ) || allRecords[0];

            return (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-[2px] w-12 bg-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Performance Timeline</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">{selectedEngineer.name}</h2>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{selectedEngineer.code}</p>
                  </div>
                  <button
                    onClick={() => setView('ENGINEER_PROFILE')}
                    className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
                  </button>
                </div>

                {/* Month Selector pills */}
                {allRecords.length > 0 ? (
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em]">Select Period to View</p>
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        {calendarRecords.map((r, idx) => {
                          const key = `${r.month}-${r.year}`;
                          const isActive = key === effKey;
                          const isNewest = idx === calendarRecords.length - 1;
                          return (
                            <button
                              key={r.id ? `${r.id}-${key}` : `hist-${idx}-${key}`}
                              onClick={() => setSelectedHistoryMonth(key)}
                              className={`flex flex-col items-center px-6 py-3 rounded-2xl border font-black transition-all ${isActive
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-zinc-600 hover:text-white'
                                }`}
                            >
                              <span className="text-[11px] uppercase tracking-widest">{r.month}</span>
                              <span className="text-[8px] text-zinc-500 mt-0.5">{r.year}</span>
                              {isNewest && <span className="text-[6px] text-blue-300 uppercase tracking-widest mt-1">Latest</span>}
                            </button>
                          );
                        })}

                      </div>
                    </div>

                    {/* Selected Record Card */}
                    {activeRecord && (
                      <div className="glass-card rounded-[3rem] p-8 md:p-12 space-y-8 border border-blue-500/20 shadow-blue-500/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        {/* Month Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                              <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-black text-white uppercase tracking-tight">{activeRecord.month} {activeRecord.year}</p>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{activeRecord.qKey} · Monthly Performance Report</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {/* TCS: rank logo | PQA: no badge */}
                            {!isPqaMode && <TierLogo tier={resolveTierByMode(activeRecord)} size="lg" />}
                            <div className="text-right">
                              {isPqaMode && (
                                <>
                                  <span className="text-5xl font-black text-white italic tracking-tighter">{activeRecord.tcsScore}</span>
                                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">PQA Score</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rank Summary Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Monthly Rank</p>
                            <p className="text-2xl font-black text-blue-400">#{activeRecord.monthRank}</p>
                            <p className="text-[8px] text-zinc-600">of {activeRecord.monthTotal}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Quarterly Rank</p>
                            <p className="text-2xl font-black text-yellow-400">#{activeRecord.qRank}</p>
                            <p className="text-[8px] text-zinc-600">of {activeRecord.qTotal}</p>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Exam Score</p>
                            <p className="text-2xl font-black text-white">{activeRecord.examScore}</p>
                            <p className="text-[8px] text-zinc-600">/ 100 pts</p>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">DRNPS</p>
                            <p className="text-2xl font-black text-emerald-400">{calculateDRNPS(activeRecord.promoters, activeRecord.detractors).toFixed(0)}</p>
                            <p className="text-[8px] text-zinc-600">/ 100</p>
                          </div>
                        </div>

                        {/* KPI Numbers Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                          {(isDaAvProfile
                            ? daAvCriteriaCards.map((k) => ({ ...k, target: '', bad: false }))
                            : [
                              { label: 'REDO Ratio', value: `${activeRecord.redoRatio}%`, target: '≤0.7', bad: parseFloat(activeRecord.redoRatio) > 0.7 },
                              { label: 'IQC Skip', value: `${activeRecord.iqcSkipRatio}%`, target: '≤25', bad: parseFloat(activeRecord.iqcSkipRatio) > 25 },
                              { label: 'Maint. Mode', value: `${activeRecord.maintenanceModeRatio}%`, target: '≥65', bad: parseFloat(activeRecord.maintenanceModeRatio) < 65 },
                              { label: 'OQC Pass', value: `${activeRecord.oqcPassRate}%`, target: '≥85', bad: parseFloat(activeRecord.oqcPassRate) < 85 },
                              { label: 'Training', value: `${activeRecord.trainingAttendance}%`, target: '=100', bad: parseFloat(activeRecord.trainingAttendance) < 100 },
                              { label: 'Core PBA', value: `${activeRecord.corePartsPBA}%`, target: '≤30', bad: parseFloat(activeRecord.corePartsPBA) > 30 },
                              { label: 'Core Octa', value: `${activeRecord.corePartsOcta}%`, target: '≤40', bad: parseFloat(activeRecord.corePartsOcta) > 40 },
                              { label: 'Multi Parts', value: `${activeRecord.multiPartsRatio}%`, target: '≤1', bad: parseFloat(activeRecord.multiPartsRatio) > 1 },
                            ]).map(kpi => (
                            <div key={kpi.label} className={`rounded-xl p-3 border transition-all ${kpi.bad ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
                              }`}>
                              <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{kpi.label}</p>
                              <p className={`text-base font-black ${kpi.bad ? 'text-red-400' : 'text-emerald-400'}`}>{kpi.value}</p>
                              {kpi.target ? <p className="text-[7px] text-zinc-700">target {kpi.target}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-20 text-zinc-700 font-black uppercase tracking-widest">No history records found.</div>
                )}

                {/* Survey button */}
                <button
                  onClick={() => {
                    resetAcademySurvey();
                    setAcademySurvey((prev) => ({ ...prev, fullName: selectedEngineer?.name || '' }));
                    setView('SAMSUNG_ACADEMY_SURVEY');
                  }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-400 tracking-widest hover:bg-purple-600/10 hover:border-purple-500/30 hover:text-purple-400 transition-all"
                >
                  <BookOpen className="w-4 h-4" /> {activeSurveyDisplayName}
                </button>
              </div>
            );
          })()}

          {/* ─── TCS INFO / REFERENCE VIEW ─────────────────────────────────────────── */}
          {view === 'TCS_INFO' && (
            <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <div className="text-center space-y-4 border-b border-white/5 pb-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Official Guide</span>
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic">TCS<br />Reference Guide</h2>
                <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto">Technical Capability System — A transparent framework for measuring and rewarding engineering excellence.</p>
              </div>

              {/* What is TCS */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <Info className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">What is TCS?</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  The <strong className="text-white">Technical Capability System (TCS)</strong> is Samsung&apos;s internal engineering performance framework. Each month, every engineer receives a composite score (0–100) based on three dimensions: their KPI performance, customer satisfaction (DRNPS), and technical knowledge (Exam score). This score determines their tier ranking and standing in the team leaderboard.
                </p>
              </div>

              {/* Scoring Breakdown */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">How Your Score is Calculated</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'KPIs', pct: '50%', pts: 'Max 50 pts', color: 'emerald', desc: '8 operational KPIs: REDO ratio, IQC skip, maintenance mode, OQC pass rate, training attendance, core parts PBA/Octa, and multi-parts ratio.', icon: Activity },
                    { label: 'DRNPS', pct: '30%', pts: 'Max 30 pts', color: 'purple', desc: 'Customer satisfaction score derived from promoters and detractors. Formula: (((Promoters − Detractors) × 10) + 100) ÷ 2', icon: TrendingUp },
                    { label: 'Exam', pct: '20%', pts: 'Max 20 pts', color: 'blue', desc: 'Monthly technical knowledge exam score (0–100). Reflects mastery of repair procedures and product knowledge.', icon: BookOpen },
                  ].map(({ label, pct, pts, color, desc, icon: Icon }) => (
                    <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-[2.5rem] p-8 space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 bg-${color}-500/10 rounded-2xl flex items-center justify-center border border-${color}-500/20`}>
                          <Icon className={`w-6 h-6 text-${color}-400`} />
                        </div>
                        <span className={`text-4xl font-black italic tracking-tighter text-${color}-300`}>{pct}</span>
                      </div>
                      <div>
                        <p className={`text-lg font-black text-${color}-300 uppercase tracking-tight`}>{label}</p>
                        <p className={`text-[9px] font-black text-${color}-500 uppercase tracking-widest`}>{pts}</p>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Targets */}
              <div className="glass-card rounded-[3rem] p-10 space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">KPI Targets & Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { kpi: 'REDO Ratio', target: '≤ 0.7%', points: 30, dir: 'lower is better' },
                    { kpi: 'IQC Skip Ratio', target: '≤ 25%', points: 15, dir: 'lower is better' },
                    { kpi: 'OQC Pass Rate', target: '≥ 85%', points: 15, dir: 'higher is better' },
                    { kpi: 'Training Attendance', target: '100%', points: 10, dir: 'higher is better' },
                    { kpi: 'Maintenance Mode', target: '≥ 65%', points: 10, dir: 'higher is better' },
                    { kpi: 'Multi Parts Ratio', target: '≤ 1%', points: 10, dir: 'lower is better' },
                    { kpi: 'Core Parts PBA', target: '≤ 30%', points: 5, dir: 'lower is better' },
                    { kpi: 'Core Parts Octa', target: '≤ 40%', points: 5, dir: 'lower is better' },
                  ].map(row => (
                    <div key={row.kpi} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{row.kpi}</p>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">{row.dir}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-yellow-400">{row.points} pts</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase">{row.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier System */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Tier System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { tier: 'Masters', range: '90 – 100', desc: 'Elite engineers operating at peak performance across all metrics. Top 5% of the team.', meta: TIER_META.Masters },
                    { tier: 'Diamond', range: '80 – 89', desc: 'High performers with consistently strong KPIs, DRNPS and exam results.', meta: TIER_META.Diamond },
                    { tier: 'Platinum', range: '70 – 79', desc: 'Solid performers showing great reliability and customer satisfaction scores.', meta: TIER_META.Platinum },
                    { tier: 'Gold', range: '60 – 69', desc: 'Good overall performance with room to push into higher tier rankings.', meta: TIER_META.Gold },
                    { tier: 'Silver', range: '50 – 59', desc: 'Meeting baseline standards but with clear opportunities for improvement.', meta: TIER_META.Silver },
                    { tier: 'Bronze', range: '0 – 49', desc: 'Entry level or below-target performance. Focus on KPI improvement and exam preparation.', meta: TIER_META.Bronze },
                  ].map(({ tier, range, desc, meta }) => {
                    return (
                      <div key={tier} className={`border ${meta.border} rounded-[2rem] shadow-xl ${meta.glow} bg-zinc-950`}>
                        <div className="rounded-[2rem] p-8 space-y-4 h-full">
                          <div className="flex items-center justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center shadow-lg border border-white/10">
                              <img src={meta.img} alt={tier} className="w-10 h-10 object-contain" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 border ${meta.border} ${meta.text}`}>{range} pts</span>
                          </div>
                          <div>
                            <p className={`text-2xl font-black uppercase tracking-tighter ${meta.text}`}>{tier}</p>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Specialist</p>
                          </div>
                          <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How Ranking Works */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">How Rankings Work</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: '01', title: 'Monthly Ranking', desc: 'Engineers are ranked by their TCS score within the same month and year. The leaderboard resets monthly.' },
                    { num: '02', title: 'Quarterly Ranking', desc: 'Engineers are ranked by their average TCS score across all months in a quarter (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec).' },
                    { num: '03', title: 'Tier Assignment', desc: 'Your tier (Bronze → Masters) is automatically assigned based on your final TCS score when data is saved.' },
                  ].map(({ num, title, desc }) => (
                    <div key={num} className="space-y-3">
                      <span className="text-5xl font-black italic text-zinc-800">{num}</span>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{title}</p>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ─── PQA INFO / REFERENCE VIEW ─────────────────────────────────────────── */}
          {view === 'PQA_INFO' && (
            <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700">
              {/* Header */}
              <div className="text-center space-y-4 border-b border-white/5 pb-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Service Center Guide</span>
                  <div className="h-[1px] w-16 bg-blue-500/50" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic">PQA<br />Reference Guide</h2>
                <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto">Performance & Quality Assurance — The standard for Samsung Service Center excellence.</p>
              </div>

              {/* What is PQA */}
              <div className="glass-card rounded-[3rem] p-10 md:p-16 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">What is PQA Ranking?</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  The <strong className="text-white">PQA Ranking</strong> evaluates Samsung Service Centers based on operational efficiency, repair quality, and customer experience. Unlike individual engineer TCS scores, PQA aggregated data focuses on center-wide performance (LTP, REDO, SDR) and adherence to official field audit protocols.
                </p>
              </div>

              {/* PQA Metrics Breakdown */}
              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] text-center">Core Operational Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'LTP (Life-Time Perf)', pts: '10 pts', desc: 'Accumulated performance score focusing on long-term repair stability.' },
                    { label: 'Ex-LTP (Excessive LTP)', pts: '10 pts', desc: 'Tracking and reducing excessive repair times to maintain productivity.' },
                    { label: 'REDO Rate', pts: '10 pts', desc: 'Service quality indicator measuring devices that returned within the warranty period.' },
                    { label: 'SSR (Same Symptom REDO)', pts: '20 pts', desc: 'Specific tracking for devices returning with identical symptoms within 90 days.' },
                    { label: 'D-RNPS', pts: '20 pts', desc: 'Retail Net Promoter Score for the service center, evaluating customer satisfaction.' },
                    { label: 'OFS Ordering Accuracy', pts: '10 pts', desc: 'Ordering Field Score: Warehouse accuracy and precision in ordering spare parts.' },
                    { label: 'R-CXE Experience', pts: '10 pts', desc: 'Customer Experience quality measured through environment and staff interaction.' },
                    { label: 'SDR (Same Day Repair)', pts: '10 pts', desc: 'Speed efficiency measuring the percentage of repairs completed on the same day.' },
                  ].map(({ label, pts, desc }) => (
                    <div key={label} className="bg-zinc-900 shadow-xl border border-white/5 rounded-3xl p-8 space-y-3 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400">{label}</span>
                        <span className="text-[10px] font-black text-yellow-500 uppercase">{pts}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-950/20 border border-red-500/20 rounded-[3rem] p-10 md:p-16 space-y-8">
                 <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">System Deductions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-sm font-black text-red-400 uppercase tracking-tight">Audit Shortfalls (Max -5 pts)</p>
                    <p className="text-zinc-500 text-xs text-pretty">Specific point deductions triggered by monthly field process audits and inventory checks.</p>
                  </div>
                   <div className="space-y-3">
                    <p className="text-sm font-black text-red-400 uppercase tracking-tight">Policy Review - PR (Max -5 pts)</p>
                    <p className="text-zinc-500 text-xs text-pretty">Non-compliance with the latest Samsung Global Service Policies or environmental standards.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('ADMIN_DASHBOARD')}
                className="w-full py-6 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* ─── SAMSUNG ACADEMY SURVEY ───────────────────────────────────── */}
          {view === 'SAMSUNG_ACADEMY_SURVEY' && !academySurveySettingsLoaded && (
            <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading survey">
              <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
            </div>
          )}
          {view === 'SAMSUNG_ACADEMY_SURVEY' && academySurveySettingsLoaded && (
            <PublicSurveyForm
              definition={activeSurveyDef}
              answers={academySurvey}
              onChange={setAcademySurvey}
              sent={academySurveySent}
              submitting={isSubmittingAcademySurvey}
              onReset={() => {
                resetAcademySurvey();
                setView('SAMSUNG_ACADEMY_SURVEY');
              }}
              onBack={() => navigateTo('HOME')}
              onSubmit={async () => {
                const def = activeSurveyDefRef.current || activeSurveyDef;
                const error = validateSurveyAnswers(def, academySurvey);
                if (error) { message.warning(error); return; }
                setIsSubmittingAcademySurvey(true);
                try {
                  const gate = await fetch('/api/public/form-gate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ form: 'survey' }),
                  });
                  if (!gate.ok) {
                    message.error('Too many submissions. Please try again later.');
                    return;
                  }
                  const payload = buildSurveyResponsePayload(def, academySurvey, {
                    source: 'app',
                    appMode: appMode || null,
                  });
                  await saveSamsungAcademySurveyToDb(payload);
                  logUserAction({
                    action: 'Submitted Samsung Academy survey',
                    category: 'SURVEY',
                    details: {
                      surveyId: payload.surveyId,
                      surveyName: payload.surveyName,
                      company: payload.company,
                      product: payload.product,
                      academyLocation: payload.academyLocation,
                    },
                  });
                  setAcademySurveySent(true);
                  surveyCompletedRef.current = true;
                  trackFunnelStep('survey', 'completed', 'submit_success');
                  message.success(def.copy?.thanksBody || 'Sent.');
                } catch (e) {
                  console.error(e);
                  message.error(def.language === 'ar' ? 'حدث خطأ أثناء إرسال الاستبيان. حاول مرة أخرى.' : 'Could not send. Please try again.');
                } finally {
                  setIsSubmittingAcademySurvey(false);
                }
              }}
            />
          )}

          {/* ─── EXTERNAL LOGGING AREA ───────────────────────────────────── */}
          {view === 'EXTERNAL_LOGS' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.35em]">External Logging Area</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Action Intelligence</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      window.open(SCORA_ADMIN_EXTERNAL_LOGS_URL, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Direct Link
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(SCORA_ADMIN_EXTERNAL_LOGS_URL);
                        message.success('Direct log link copied.');
                      } catch {
                        message.error('Failed to copy link.');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={exportAnalyticsToExcel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest hover:bg-purple-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export Analytics
                  </button>
                  <button
                    onClick={exportFilteredActivityLogs}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export Filtered
                  </button>
                </div>
              </div>

              <LogTrafficPanel
                analyticsSummary={analyticsSummary}
                loading={analyticsLoading}
                onRefresh={refreshAnalytics}
              />

              <VisitorEngagementPanel analyticsSummary={analyticsSummary} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <input
                  value={logActorQuery}
                  onChange={(e) => setLogActorQuery(e.target.value)}
                  placeholder="Actor / username"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-[10px] font-bold text-white outline-none"
                />
                <input
                  value={logActionQuery}
                  onChange={(e) => setLogActionQuery(e.target.value)}
                  placeholder="Action or details"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-[10px] font-bold text-white outline-none"
                />
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                >
                  {['ALL', ...Array.from(new Set(activityLogs.map((log) => detectLogCategory(log)).filter(Boolean)))].map((cat) => (
                    <option key={`ext-cat-${cat}`} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                >
                  {['ALL', ...Array.from(new Set(activityLogs.map((log) => String(log?.type || '').toUpperCase()).filter(Boolean)))].map((typ) => (
                    <option key={`ext-typ-${typ}`} value={typ}>{typ}</option>
                  ))}
                </select>
                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none"
                >
                  <option value="ALL">ALL SEVERITY</option>
                  <option value="info">INFO</option>
                  <option value="warning">WARNING</option>
                  <option value="error">ERROR</option>
                </select>
                <button
                  onClick={loadLogs}
                  disabled={logsLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                  {logsLoading ? 'Loading...' : 'Refresh Logs'}
                </button>
              </div>

              {filteredActivityLogs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-10 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                  {logsLoading ? 'Loading logs...' : 'No logs match current filters.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[min(65vh,620px)] overflow-y-auto pr-1">
                  {filteredActivityLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 flex items-start gap-3">
                      <div className="min-w-[7rem]">
                        <p className="text-[8px] font-black uppercase tracking-widest text-cyan-300">{detectLogCategory(log)}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">{String(log?.type || '').replace('_', ' ')}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white">{log.action}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-[9px] text-zinc-500 mt-1 break-words">
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${formatLogDetailValue(v)}`).join(' · ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right min-w-[7rem]">
                        <p className="text-[9px] font-black text-white">{log.actor}</p>
                        <p className="text-[8px] text-zinc-600 mt-0.5 uppercase">{log.severity || 'info'}</p>
                        <p className="text-[8px] text-zinc-700 mt-0.5">
                          {log.timestamp ? log.timestamp.toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── ARABIC FEEDBACK (TEST) ───────────────────────────────────── */}
          {view === 'FEEDBACK' && (
            <div dir="rtl" className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-16 bg-purple-500/50" />
                  <span className="text-[11px] font-black tracking-[0.35em] text-purple-300">ملاحظات TCS</span>
                  <div className="h-[1px] w-16 bg-purple-500/50" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">استفسارات وملاحظات</h2>
                <p className="text-zinc-300 text-base md:text-lg">شاركنا رأيك أو استفسارك أو أي تحديث — نسخة تجريبية للمراجعة.</p>
              </div>

              {feedbackSent ? (
                <div className="glass-card rounded-[2.5rem] p-10 md:p-14 flex flex-col items-center text-center space-y-5">
                  <div className="w-20 h-20 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">شكراً لمشاركتك</h3>
                  <p className="text-zinc-400">تم إرسال ملاحظتك بنجاح.</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        resetEngineerFeedback();
                        setView('FEEDBACK');
                      }}
                      className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-black text-sm hover:bg-purple-500 transition-all"
                    >
                      إرسال ملاحظة أخرى
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('HOME')}
                      className="px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/10 font-black text-sm hover:text-white hover:border-white/20 transition-all"
                    >
                      العودة للرئيسية
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-6 md:p-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm md:text-base font-black text-zinc-200">الاسم</label>
                      <input
                        type="text"
                        value={engineerFeedback.fullName}
                        onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="الاسم الأول واسم العائلة"
                        className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm md:text-base font-black text-zinc-200">رقم الهاتف</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={engineerFeedback.phoneNumber}
                        onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="مثال: 01012345678"
                        className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-black text-zinc-200">الشركة</label>
                    <input
                      type="text"
                      value={engineerFeedback.company}
                      onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="اكتب اسم الشركة"
                      className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm md:text-base font-black text-zinc-200">المنتج</label>
                      <select
                        value={engineerFeedback.product}
                        onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, product: e.target.value }))}
                        className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-purple-500"
                      >
                        <option value="">اختر المنتج</option>
                        {FEEDBACK_PRODUCT_OPTIONS.map((product) => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm md:text-base font-black text-zinc-200">المنصب / الوظيفة</label>
                      <input
                        type="text"
                        value={engineerFeedback.position}
                        onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, position: e.target.value }))}
                        placeholder="مثال: مهندس صيانة، مشرف فني..."
                        className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-black text-zinc-200">الاستفسار أو الملاحظة أو الرأي</label>
                    <textarea
                      value={engineerFeedback.message}
                      onChange={(e) => setEngineerFeedback((prev) => ({ ...prev, message: e.target.value }))}
                      rows={6}
                      placeholder="اكتب استفسارك أو تحديثك أو ملاحظتك أو رأيك هنا..."
                      className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-medium text-white outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const result = validateArabicFeedbackForm(engineerFeedback);
                      if (!result.ok) {
                        message.warning(result.message);
                        return;
                      }
                      setIsSendingFeedback(true);
                      try {
                        const gate = await fetch('/api/public/form-gate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ form: 'feedback' }),
                        });
                        if (!gate.ok) {
                          message.error('Too many submissions. Please try again later.');
                          return;
                        }
                        await saveFeedbackToDb({
                          ...result.data,
                          locale: 'ar',
                          formVersion: 'arabic_feedback_v1',
                          source: 'app',
                          appMode: appMode || null,
                          verificationMethod: 'phone_format',
                          verified: true,
                        });
                        logUserAction({
                          action: 'Submitted Arabic feedback',
                          category: 'FEEDBACK',
                          details: {
                            product: result.data.product,
                            company: result.data.company,
                          },
                        });
                        setFeedbackSent(true);
                        feedbackCompletedRef.current = true;
                        trackFunnelStep('feedback', 'completed', 'submit_success');
                        message.success('تم إرسال ملاحظتك بنجاح.');
                      } catch (e) {
                        console.error(e);
                        message.error('حدث خطأ أثناء الإرسال. حاول مرة أخرى.');
                      } finally {
                        setIsSendingFeedback(false);
                      }
                    }}
                    disabled={isSendingFeedback}
                    className="w-full rounded-2xl bg-purple-600 py-4 text-sm font-black text-white transition-all hover:bg-purple-500 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingFeedback ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isSendingFeedback ? 'جاري الإرسال...' : 'إرسال الملاحظة'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('HOME')}
                    className="w-full text-zinc-500 text-sm font-black hover:text-white transition-colors py-2"
                  >
                    إلغاء والعودة
                  </button>
                </div>
              )}
            </div>
          )}


          {/* Upsert Modal (Manual Entry) */}

          {editingEng && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-start justify-center p-4 sm:p-12 overflow-y-auto custom-scrollbar pt-12">
              <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative my-auto overflow-hidden">
                {/* Decorative scanline effect */}
                <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                <button
                  onClick={() => setEditingEng(null)}
                  className="absolute top-8 right-8 p-4 bg-zinc-900 text-white rounded-2xl hover:bg-white hover:text-black transition-all shadow-3xl z-[110] group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-20 pt-8 md:pt-0">
                  <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-8 md:space-y-12 relative z-10">
                    <div className="relative group">
                      <div className="absolute -inset-8 bg-blue-600/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <div
                        className="relative w-32 h-32 md:w-64 md:h-64 rounded-[2.5rem] md:rounded-[4rem] border-4 border-zinc-800 overflow-hidden cursor-pointer shadow-3xl transition-all hover:border-blue-500 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <img src={getPhotoUrl(editingEng)} className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" alt="Profile" />
                        <div className="absolute inset-0 bg-blue-600/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                          <Camera className="w-10 h-10 text-white mb-2" />
                          <span className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Update Capture</span>
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>

                    <div className="space-y-4 md:space-y-6 w-full text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="h-[2px] w-8 md:w-12 bg-blue-500" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Node Provision</span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none tracking-tighter">
                          {editingEng.id ? 'UPDATE' : 'GENERATE'}<br />
                          <span className="text-blue-500">PROTOCOL</span>
                        </h2>
                        <p className="text-zinc-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{editingEng.id ? 'Editing existing registry entry' : 'Initializing new personnel node'}</p>
                      </div>

                      <div className="pt-4 md:pt-8 space-y-3 md:space-y-4 max-w-[200px] mx-auto lg:mx-0">
                        <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                          <span>Status</span>
                          <span className="text-green-500 font-black">ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                          <span>Encryption</span>
                          <span className="text-white font-black">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{tcsMxRoleTab === 'receptionists' ? 'Receptionist name' : 'Full Operational Name'}</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.name} onChange={e => setEditingEng({ ...editingEng, name: e.target.value })} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{tcsMxRoleTab === 'receptionists' ? 'GSPN ID' : `${getTcsMxRolePersonLabel(tcsMxRoleTab)} Protocol Code`}</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none uppercase placeholder:text-zinc-800" placeholder={tcsMxRoleTab === 'receptionists' ? 'GSPN-XXXX' : 'SAM-2026-X'} value={editingEng.code || editingEng.gspnId || ''} onChange={e => setEditingEng({ ...editingEng, code: e.target.value.toUpperCase(), gspnId: e.target.value.toUpperCase() })} />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Active Audit Period</label>
                        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center">
                          <select className="w-full md:flex-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.month} onChange={e => setEditingEng({ ...editingEng, month: e.target.value })}>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input className="w-full md:w-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.year} onChange={e => setEditingEng({ ...editingEng, year: e.target.value })} placeholder="Year" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 space-y-10 glass-card">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] border-b border-white/5 pb-6">Performance Matrix Allocation</h3>

                      {!appMode?.startsWith('PQA') ? (
                        appMode === 'TCS_MX' && tcsMxRoleTab === 'receptionists' ? (
                          <div className="space-y-6">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em]">Receptionist KPIs</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ASC_CODE</label>
                                <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-zinc-500 transition-all outline-none uppercase" value={editingEng.ascCode || ''} onChange={e => setEditingEng({ ...editingEng, ascCode: e.target.value.toUpperCase() })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ASC Name</label>
                                <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-zinc-500 transition-all outline-none" value={editingEng.asc || editingEng.partnerName || ''} onChange={e => setEditingEng({ ...editingEng, asc: e.target.value, partnerName: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Vote for Me <span className="text-zinc-600 normal-case">customers rated 10</span></label>
                                <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-emerald-500 transition-all outline-none" value={editingEng.voteForMe} onChange={e => setEditingEng({ ...editingEng, voteForMe: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">IQC First Time Fail (%) <span className="text-zinc-600 normal-case">lower is better</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-orange-500 transition-all outline-none" value={editingEng.iqcFirstTimeFail} onChange={e => setEditingEng({ ...editingEng, iqcFirstTimeFail: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">DRNPS (%) <span className="text-zinc-600 normal-case">target ≥ 80</span></label>
                                <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.drnpsPercent} onChange={e => setEditingEng({ ...editingEng, drnpsPercent: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Exam (points) <span className="text-zinc-600 normal-case">target ≥ 90</span></label>
                                <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.examScore} onChange={e => setEditingEng({ ...editingEng, examScore: e.target.value })} />
                              </div>
                              <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Co.A (bonus points)</label>
                                <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-yellow-500 transition-all outline-none" value={editingEng.coa} onChange={e => setEditingEng({ ...editingEng, coa: e.target.value })} />
                              </div>
                            </div>
                          </div>
                        ) : appMode === 'TCS_MX' && tcsMxRoleTab === 'galaxy_consultants' ? (
                          <div className="space-y-6">
                            <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.4em]">Galaxy Consultant KPI</p>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">Galaxy Consultant Tickets <span className="text-zinc-600 normal-case">count</span></label>
                              <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-cyan-500 transition-all outline-none" value={editingEng.galaxyConsultantTickets} onChange={e => setEditingEng({ ...editingEng, galaxyConsultantTickets: e.target.value })} />
                            </div>
                          </div>
                        ) : (
                        <>
                          {/* ── TCS Mode: Exam & DRNPS ── */}
                          <div>
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">Exam &amp; DRNPS</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Exam Score (%) <span className="text-zinc-600 normal-case">target ≥ 90</span></label>
                                <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.examScore} onChange={e => setEditingEng({ ...editingEng, examScore: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Promoters <span className="text-zinc-600 normal-case">count</span></label>
                                <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.promoters} onChange={e => setEditingEng({ ...editingEng, promoters: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Detractors <span className="text-zinc-600 normal-case">count</span></label>
                                <input type="number" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.detractors} onChange={e => setEditingEng({ ...editingEng, detractors: e.target.value })} />
                              </div>
                            </div>
                          </div>

                          {/* ── TCS Mode: KPI Inputs ── */}
                          <div className="border-t border-white/5 pt-8">
                            <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em] mb-6">KPI Metrics</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">REDO Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 0.7 · 30 pts</span></label>
                                <input type="number" step="0.01" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.redoRatio} onChange={e => setEditingEng({ ...editingEng, redoRatio: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">IQC Skip Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 25 · 15 pts</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-orange-500 transition-all outline-none" value={editingEng.iqcSkipRatio} onChange={e => setEditingEng({ ...editingEng, iqcSkipRatio: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Maintenance Mode (%) <span className="text-zinc-600 normal-case">target ≥ 65 · 10 pts</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-yellow-500 transition-all outline-none" value={editingEng.maintenanceModeRatio} onChange={e => setEditingEng({ ...editingEng, maintenanceModeRatio: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest ml-1">OQC Pass Rate (%) <span className="text-zinc-600 normal-case">target ≥ 85 · 15 pts</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-teal-500 transition-all outline-none" value={editingEng.oqcPassRate} onChange={e => setEditingEng({ ...editingEng, oqcPassRate: e.target.value })} />
                              </div>
                              <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-green-400 uppercase tracking-widest ml-1">Training Attendance (%) <span className="text-zinc-600 normal-case">target = 100 · 10 pts</span></label>
                                <input type="number" step="0.1" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-green-500 transition-all outline-none" value={editingEng.trainingAttendance} onChange={e => setEditingEng({ ...editingEng, trainingAttendance: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Core Parts PBA (%) <span className="text-zinc-600 normal-case">target ≤ 30 · 5 pts</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.corePartsPBA} onChange={e => setEditingEng({ ...editingEng, corePartsPBA: e.target.value })} />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Core Parts Octa (%) <span className="text-zinc-600 normal-case">target ≤ 40 · 5 pts</span></label>
                                <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.corePartsOcta} onChange={e => setEditingEng({ ...editingEng, corePartsOcta: e.target.value })} />
                              </div>
                              <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Multi Parts Ratio (%) <span className="text-zinc-600 normal-case">target ≤ 1 · 10 pts</span></label>
                                <input type="number" step="0.01" min="0" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-orange-500 transition-all outline-none" value={editingEng.multiPartsRatio} onChange={e => setEditingEng({ ...editingEng, multiPartsRatio: e.target.value })} />
                              </div>
                            </div>
                          </div>
                        </>
                        )
                      ) : (
                        <>
                          {/* ── PQA Mode: Operations Metrics ── */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">LTP Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.ltp} onChange={e => setEditingEng({ ...editingEng, ltp: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">EX-LTP Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.exLtp} onChange={e => setEditingEng({ ...editingEng, exLtp: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">SDR (Same Day Repair) <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-emerald-500 transition-all outline-none" value={editingEng.sdr} onChange={e => setEditingEng({ ...editingEng, sdr: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">D-RNPS <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-purple-500 transition-all outline-none" value={editingEng.dRnps} onChange={e => setEditingEng({ ...editingEng, dRnps: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">REDO Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-500 transition-all outline-none" value={editingEng.redo} onChange={e => setEditingEng({ ...editingEng, redo: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">SSR (90 Day Redo) <span className="text-zinc-600 normal-case">max 20 pts</span></label>
                              <input type="number" step="0.1" min="0" max="20" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-red-600 transition-all outline-none" value={editingEng.ssr} onChange={e => setEditingEng({ ...editingEng, ssr: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest ml-1">OFS (Parts Accuracy) <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-teal-500 transition-all outline-none" value={editingEng.ofs} onChange={e => setEditingEng({ ...editingEng, ofs: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">R-CXE Score <span className="text-zinc-600 normal-case">max 10 pts</span></label>
                              <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-zinc-500 transition-all outline-none" value={editingEng.rCxe} onChange={e => setEditingEng({ ...editingEng, rCxe: e.target.value })} />
                            </div>

                            {/* ── PQA Mode: Deductions ── */}
                            <div className="border-t border-white/5 pt-8 md:col-span-2 space-y-6">
                               <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.4em]">Negative Deductions</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Audit Penalty <span className="text-zinc-600 normal-case">subtracted</span></label>
                                    <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/20 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-600 transition-all outline-none" value={Math.abs(editingEng.audit || 0)} onChange={e => setEditingEng({ ...editingEng, audit: e.target.value })} />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">PR Penalty <span className="text-zinc-600 normal-case">subtracted</span></label>
                                    <input type="number" step="0.1" min="0" className="w-full bg-black/40 border border-white/20 rounded-2xl p-5 text-sm font-bold text-white focus:border-rose-600 transition-all outline-none" value={Math.abs(editingEng.pr || 0)} onChange={e => setEditingEng({ ...editingEng, pr: e.target.value })} />
                                  </div>
                               </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => saveEngineer(editingEng)}
                      disabled={isSaving}
                      className="w-full bg-white text-black py-8 rounded-[2rem] font-black text-[11px] md:text-sm uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group"
                    >
                      {isSaving ? <div className="w-6 h-6 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                      {isSaving ? 'Synchronizing Node...' : 'Commit Protocol Entry'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div> {/* close animated wrapper key={view} */}
      </main>

      {/* Arabic feedback promo — home modal */}
      {feedbackHomePopupOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-promo-title"
          >
            <div className="relative w-full max-w-md rounded-[2rem] border border-purple-500/25 bg-zinc-950 shadow-[0_0_60px_rgba(147,51,234,0.35)] p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <button
                type="button"
                onClick={dismissFeedbackPromo}
                className="absolute top-4 left-4 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-all"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center space-y-2 pt-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-purple-300" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400">صوت شركاء سامسونج</p>
                <h3 id="feedback-promo-title" className="text-xl sm:text-2xl font-black text-white">
                  ملاحظات واقتراحات
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  شاركنا استفسارك أو ملاحظتك أو رأيك من خلال تجربتك لتطبيق SCORA. يستغرق النموذج دقيقة واحدة.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openFeedbackForm}
                  className="w-full rounded-2xl bg-purple-600 py-4 text-sm font-black text-white hover:bg-purple-500 transition-all"
                >
                  املأ النموذج
                </button>
                <button
                  type="button"
                  onClick={dismissFeedbackPromo}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-3 text-sm font-black text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Floating Arabic feedback link (other pages; hidden on HOME while promo active) */}
      {!isAdminPortal &&
        !gogoOpen &&
        isFeedbackPortalRealm(portalRealm) &&
        feedbackEnabled &&
        showFeedbackPromo &&
        view !== 'HOME' &&
        view !== 'APP_SELECTION' &&
        view !== 'PQA_DIVISION_SELECTION' &&
        view !== 'TCS_DIVISION_SELECTION' &&
        view !== 'FEEDBACK' && (
          <div className="fixed left-5 top-[calc(50%+4.5rem)] -translate-y-1/2 z-50" dir="rtl">
            <button
              type="button"
              onClick={dismissFeedbackPromo}
              className="absolute -top-2 -left-2 h-6 w-6 rounded-full border border-white/20 bg-zinc-900 text-white/80 hover:text-white hover:border-white/40 transition-all flex items-center justify-center"
              title="إخفاء"
              aria-label="إخفاء زر الملاحظات"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={openFeedbackForm}
              data-gogo-target="feedback"
              className="rounded-2xl bg-purple-600/95 px-4 py-3 shadow-[0_0_28px_rgba(147,51,234,0.75)] border border-purple-300/30 transition-all hover:scale-105 hover:bg-purple-500 active:scale-95"
              title="ملاحظات واقتراحات"
            >
              <span className="inline-flex items-center gap-2 text-[10px] font-black text-white">
                <MessageSquare className="w-4 h-4" />
                ملاحظات واقتراحات
              </span>
            </button>
          </div>
        )}

      {/* PWA: Add to Home Screen (once) + notification allow banner */}
      {!isAdminPortal && (
        <>
          <AddToHomeScreenSheet
            ready={pwaReady}
            blocked={pwaBlockedByCriticalUi}
            onVisibleChange={setPwaInstallSheetOpen}
            onToast={(text) => message.info(text)}
          />
        </>
      )}

      {/* Floating Samsung Academy Survey Link */}
      {!isAdminPortal && !gogoOpen && portalRealm === 'TCS' && academySurveyPopupEnabled && showSurveyShortcut && view !== 'APP_SELECTION' && view !== 'PQA_DIVISION_SELECTION' && (
        <div
          className="fixed right-5 top-[max(6rem,18%)] z-40 sm:top-1/2 sm:-translate-y-1/2"
          lang={surveyLangAttr(activeSurveyDef)}
          dir={surveyDir(activeSurveyDef)}
          translate="no"
        >
          <button
            onClick={dismissSurveyShortcut}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full border border-white/20 bg-zinc-900 text-white/80 hover:text-white hover:border-white/40 transition-all flex items-center justify-center"
            title={activeSurveyDef.copy?.hideShortcut || 'Hide'}
            aria-label={activeSurveyDef.copy?.hideShortcut || 'Hide'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openSurveyForm}
            data-gogo-target="survey"
            className="rounded-2xl bg-blue-600/95 px-4 py-3 shadow-[0_0_28px_rgba(37,99,235,0.85)] border border-blue-300/30 animate-pulse transition-all hover:scale-105 hover:bg-blue-500 active:scale-95"
            title={activeSurveyDisplayName}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-wider text-white notranslate" translate="no">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              {activeSurveyDisplayName}
            </span>
          </button>
        </div>
      )}

      {/* GoGo visitor guide — lobby host (EN/AR FAQ only) */}
      {!isAdminPortal && !showPhotoAuth && !showRankReveal && (
        <GoGoAssistant
          currentView={view}
          employeeLoggedIn={employeeLoggedIn}
          employeeProductLine={employeeProfile?.productLine || ''}
          employeeUid={employeeProfile?.uid || ''}
          tipCompleteNonce={gogoTipCompleteNonce}
          hidden={
            view === 'EXTERNAL_LOGS'
            || view === 'ADMIN_DASHBOARD'
            || view === 'CONSULTANT_VIEWER'
          }
          onOpenChange={setGogoOpen}
          onNavigate={(action) => {
            if (typeof action === 'string' && action.startsWith('goto_consultant:')) {
              const id = action.slice('goto_consultant:'.length);
              if (!employeeLoggedIn) {
                setShowEmployeeAuth(true);
                return;
              }
              setActiveConsultantId(id);
              navigateTo('CONSULTANT_VIEWER');
              return;
            }
            if (action === 'goto_employee_dashboard' || action === 'goto_knowledge') {
              if (!employeeLoggedIn) {
                setShowEmployeeAuth(true);
                return;
              }
              navigateTo('EMPLOYEE_DASHBOARD');
              return;
            }
            if (action === 'goto_tcs') {
              setPortalRealm('TCS');
              navigateTo('TCS_DIVISION_SELECTION');
              return;
            }
            if (action === 'goto_pqa') {
              setPortalRealm('PQA');
              navigateTo('PQA_DIVISION_SELECTION');
              return;
            }
            if (action === 'goto_search') {
              if (!appMode) {
                setPortalRealm('TCS');
                setAppMode('TCS_MX');
              }
              setProfileOpenedByExactCode(false);
              navigateTo('ENGINEER_LOOKUP');
              return;
            }
            if (action === 'goto_feedback') {
              setPortalRealm((prev) => prev || 'TCS');
              setAppMode((prev) => prev || 'TCS_MX');
              setShowFeedbackPromo(false);
              setEngineerFeedback(INITIAL_ENGINEER_FEEDBACK);
              setFeedbackSent(false);
              navigateTo('FEEDBACK');
              return;
            }
            if (action === 'goto_survey') {
              setPortalRealm('TCS');
              setAppMode((prev) => prev || 'TCS_MX');
              openSurveyForm();
            }
          }}
        />
      )}

      <EmployeeAuthModal
        open={showEmployeeAuth}
        onClose={() => setShowEmployeeAuth(false)}
        onSuccess={() => {
          try {
            sessionStorage.removeItem('gogo_mx_tip_popup_v1');
            sessionStorage.removeItem('gogo_incomplete_tip_v1');
          } catch { /* ignore */ }
          setShowEmployeeAuth(false);
          navigateTo('EMPLOYEE_DASHBOARD');
        }}
      />

      {/* Engineer / Service Center Photo Auth Modal */}
      {showPhotoAuth && selectedEngineer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-white/10 rounded-[3rem] w-full max-w-sm p-8 space-y-6 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => { setShowPhotoAuth(false); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
              className="absolute top-6 right-6 p-2 bg-zinc-800 text-white rounded-xl hover:bg-white hover:text-black transition-all">
              <X className="w-4 h-4" />
            </button>
            {photoAuthStep === 'done' ? (
              <div className="flex flex-col items-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase">Photo Updated!</h3>
                <p className="text-zinc-500 text-xs">{isPqaMode ? 'All records for this service center have been updated.' : 'Your profile photo has been updated.'}</p>
                <button onClick={() => { setShowPhotoAuth(false); setPhotoAuthCode(''); setPhotoAuthStep('idle'); setSelfPhotoFile(null); }}
                  className="px-8 py-3 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all">Done</button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2 pt-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mx-auto ${isPqaMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-600/10 border-blue-500/20'}`}>
                    <Camera className={`w-7 h-7 ${isPqaMode ? 'text-yellow-400' : 'text-blue-400'}`} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {isPqaMode ? 'Update Center Photo' : 'Update Photo'}
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    {photoAuthStep === 'upload'
                      ? (isPqaMode ? 'Choose the new service center photo' : 'Choose your new profile photo')
                      : (isPqaMode ? 'Enter service center code to verify' : 'Confirm your engineer code to continue')}
                  </p>
                </div>
                {photoAuthStep !== 'upload' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">
                      {isPqaMode ? 'Service Center Code' : 'Your Engineer Code'}
                    </label>
                    <input type="text" value={photoAuthCode} onChange={e => setPhotoAuthCode(e.target.value.toUpperCase())}
                      placeholder={isPqaMode ? 'Enter service center code' : 'Enter your engineer code'}
                      className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm focus:border-blue-500 transition-all outline-none font-bold text-white shadow-inner uppercase tracking-widest text-center" />
                  </div>
                )}
                {photoAuthStep === 'upload' ? (
                  <div className="space-y-4">
                    <label className="flex flex-col items-center gap-3 cursor-pointer border-2 border-dashed border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all">
                      <Camera className="w-8 h-8 text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{selfPhotoFile ? selfPhotoFile.name : 'Choose Photo'}</span>
                      <input ref={selfPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setSelfPhotoFile(f); }} />
                    </label>
                    {!isPqaMode && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-2">Photo Requirements</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Wearing official Samsung uniform</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> Face centered and looking at the camera</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-yellow-500">◆</span> No sunglasses or face coverings</p>
                        <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed border-t border-white/5 pt-3">
                          Self-service: one photo change every 90 days. Signed-in admins can replace photos anytime from the admin portal.
                        </p>
                      </div>
                    )}
                    {isPqaMode && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">📸 Photo Tips</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> Use the official service center building photo</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> Clear, well-lit exterior or interior shot</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2"><span className="text-blue-400">◆</span> This photo will show across all records for this center</p>
                        <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed border-t border-white/5 pt-3">
                          Self-service: one photo change every 90 days. Signed-in admins can replace photos anytime from the admin portal.
                        </p>
                      </div>
                    )}
                    <button disabled={!selfPhotoFile || selfPhotoUploading}
                      onClick={async () => {
                        if (!selfPhotoFile) return;
                        setSelfPhotoUploading(true);
                        try {
                          let url = null;
                          if (isPqaMode) {
                            try {
                              url = await uploadPhoto(selfPhotoFile, 'PQA', selectedEngineer.code.toUpperCase(), { stableFileName: true });
                            } catch (e) {
                              url = await uploadPhoto(selfPhotoFile, 'engineers', selectedEngineer.code.toUpperCase(), { stableFileName: true });
                            }
                          } else {
                            url = await uploadPhoto(selfPhotoFile, getTcsStorageFolder(), selectedEngineer.code.toUpperCase(), { stableFileName: true });
                          }
                          if (url) {
                            const now = Date.now();
                            const updatedEngineers = engineers.map(e =>
                              e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase()
                                ? { ...e, photoUrl: url, photoUpdatedAt: now }
                                : e
                            );
                            const seen = new Set();
                            for (const e of updatedEngineers) {
                              if (e.code?.toUpperCase() === selectedEngineer.code?.toUpperCase() && !seen.has(e.id)) {
                                seen.add(e.id);
                                await saveEngineerToDb({ ...e, photoUrl: url, photoUpdatedAt: now }, colName);
                              }
                            }
                            setEngineers(updatedEngineers);
                            setSelectedEngineer(prev => {
                              const row = updatedEngineers.find(x => x.id === prev.id);
                              return row ? { ...row } : { ...prev, photoUrl: url, photoUpdatedAt: now };
                            });
                          }
                          setPhotoAuthStep('done');
                        } catch (err) {
                          console.error('Upload error:', err);
                          const code = err?.code || '';
                          if (code.includes('unauthorized') || code.includes('permission')) {
                            message.error('Permission denied. Check Firebase Storage rules.');
                          } else if (code.includes('canceled') || code.includes('network')) {
                            message.error('Network error. Check your connection and try again.');
                          } else {
                            message.error(`Upload failed: ${err?.message || err?.code || 'Unknown error'}`);
                          }
                        } finally { setSelfPhotoUploading(false); }
                      }}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {selfPhotoUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {selfPhotoUploading ? 'Uploading...' : 'Save Photo'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (photoAuthCode.trim().toUpperCase() !== selectedEngineer.code.trim().toUpperCase()) {
                        message.error(isPqaMode ? 'Service center code does not match. Access denied.' : 'Engineer code does not match. Access denied.');
                        return;
                      }
                      const adminBypass = !!(isLogged && currentUser);
                      if (!adminBypass) {
                        const last = photoUpdatedAtMs(selectedEngineer);
                        if (last > 0 && Date.now() - last < PHOTO_COOLDOWN_MS) {
                          const daysLeft = Math.max(1, Math.ceil((PHOTO_COOLDOWN_MS - (Date.now() - last)) / (24 * 60 * 60 * 1000)));
                          message.error(`Photo updates are limited to once every 90 days. Try again in about ${daysLeft} day(s), or ask an admin.`);
                          return;
                        }
                      }
                      setPhotoAuthStep('upload');
                    }}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >Verify Code</button>
                )}
              </>
            )}
          </div>
        </div>
      )
      }

      {/* Admin bottom tabs intentionally hidden */}

      {!isAdminPortal && !gogoOpen && view !== 'APP_SELECTION' && view !== 'PQA_DIVISION_SELECTION' && view !== 'TCS_DIVISION_SELECTION' && (
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(92vw,22rem)] bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-2.5 px-3 shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-40">
        <div className="relative">
          <div
            className="pointer-events-none absolute top-1 bottom-1 rounded-2xl border border-blue-400/35 bg-blue-600/20 shadow-[0_0_22px_rgba(37,99,235,0.35)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: 'calc(50% - 0.375rem)',
              left: ['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'calc(50% + 0.125rem)' : '0.25rem',
            }}
          />
          <div className="relative grid grid-cols-2 gap-1.5 place-items-center">
            <button
              onClick={() => navigateTo('HOME')}
              className={`cursor-pointer w-full rounded-2xl py-2.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${view === 'HOME' ? 'text-white -translate-y-0.5' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <BarChart3 className={`w-5 h-5 transition-all duration-300 ${view === 'HOME' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-tight">Dashboard</span>
            </button>
            <button
              onClick={() => { setProfileOpenedByExactCode(false); navigateTo('ENGINEER_LOOKUP'); }}
              data-gogo-target="search"
              className={`cursor-pointer w-full rounded-2xl py-2.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'text-white -translate-y-0.5' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Search className={`w-5 h-5 transition-all duration-300 ${['ENGINEER_LOOKUP', 'ENGINEER_PROFILE', 'ENGINEER_HISTORY'].includes(view) ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-tight">Search</span>
            </button>
          </div>
        </div>
      </nav>
      )}

    </div >
  );
};
const Page = ({ initialView = null, initialAdminPortal = false } = {}) => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 16,
        },
      }}
    >
      <App>
        <PageContent initialView={initialView} initialAdminPortal={initialAdminPortal} />
      </App>
    </ConfigProvider>
  );
};

export default Page;
