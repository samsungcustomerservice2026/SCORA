export const PERM = {
  NONE: 'NONE',
  READ: 'READ',
  WRITE: 'WRITE',
  READ_WRITE: 'READ_WRITE',
};

/** Every admin-portal area a non-owner can be granted. Accounts, Insights and System stay SUPER_ADMIN only. */
export const PERM_MODULES = ['tcs', 'pqa', 'display', 'survey', 'surveyForms', 'feedback', 'quiz', 'knowledge'];

export const PERM_OPTIONS = [
  { value: PERM.NONE, label: 'No access' },
  { value: PERM.READ, label: 'Read only' },
  { value: PERM.WRITE, label: 'Write only' },
  { value: PERM.READ_WRITE, label: 'Read & write' },
];

/** Knowledge Base editors have no read-only mode, so access there is on/off. */
const MODULE_OPTIONS = {
  knowledge: [PERM.NONE, PERM.READ_WRITE],
};

export function permOptionsFor(module) {
  const allowed = MODULE_OPTIONS[module];
  return allowed ? PERM_OPTIONS.filter((o) => allowed.includes(o.value)) : PERM_OPTIONS;
}

export const MODULE_LABELS = {
  tcs: 'TCS data',
  pqa: 'PQA data',
  display: 'Display settings',
  survey: 'Survey responses',
  surveyForms: 'Survey forms',
  feedback: 'Feedback',
  quiz: 'SCORA Challenge',
  knowledge: 'Knowledge Base',
};

/** What read / write mean per module — shown under each selector. */
export const MODULE_HINTS = {
  tcs: 'Read: view & export. Write: import and edit records.',
  pqa: 'Read: view & export. Write: import and edit records.',
  display: 'Read: public links & QR codes. Write: turn popups and banners on/off.',
  survey: 'Read: analytics & Excel export.',
  surveyForms: 'Read: see surveys. Write: add, edit, delete and pick the displayed survey.',
  feedback: 'Read: responses & export.',
  quiz: 'Read: reports. Write: create and host games.',
  knowledge: 'Consultants, tips and product specification (full edit).',
};

export const DEFAULT_FORM_PERMISSIONS = {
  tcs: PERM.READ_WRITE,
  pqa: PERM.NONE,
  display: PERM.NONE,
  survey: PERM.NONE,
  surveyForms: PERM.NONE,
  feedback: PERM.NONE,
  quiz: PERM.READ_WRITE,
  knowledge: PERM.NONE,
};

export function allPermissions(value) {
  return Object.fromEntries(PERM_MODULES.map((m) => [m, value]));
}

/** Read-only preset; modules without a read-only mode get no access. */
export function readOnlyPermissions() {
  return Object.fromEntries(
    PERM_MODULES.map((m) => [m, permOptionsFor(m).some((o) => o.value === PERM.READ) ? PERM.READ : PERM.NONE]),
  );
}

export function isSuperAdmin(user) {
  return user?.role === 'SUPER_ADMIN';
}

const isValidPerm = (v) => typeof v === 'string' && Object.values(PERM).includes(v);

/**
 * Accounts saved before a module existed keep the access they had then:
 * the role used to grant Display and Knowledge Base, and survey forms followed the survey module.
 */
function legacyModulePermission(user, module) {
  const stored = user?.permissions || {};
  if (module === 'tcs') {
    if (user?.access === 'TCS_ONLY' || user?.access === 'ALL') return PERM.READ_WRITE;
    return PERM.NONE;
  }
  if (module === 'pqa') {
    if (user?.access === 'PQA_ONLY' || user?.access === 'ALL') return PERM.READ_WRITE;
    return PERM.NONE;
  }
  if (module === 'surveyForms' && isValidPerm(stored.survey)) return stored.survey;
  if (['survey', 'surveyForms', 'feedback', 'quiz', 'display', 'knowledge'].includes(module)) return PERM.READ_WRITE;
  return PERM.NONE;
}

export function normalizePermissions(user) {
  if (isSuperAdmin(user)) return allPermissions(PERM.READ_WRITE);
  const stored = user?.permissions;
  const out = {};
  for (const mod of PERM_MODULES) {
    const value = stored?.[mod];
    out[mod] = isValidPerm(value) ? value : legacyModulePermission(user, mod);
  }
  return out;
}

/** Server-side allow-list for a permissions object coming from a request body. */
export function sanitizePermissions(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const mod of PERM_MODULES) {
    const value = raw[mod];
    if (!isValidPerm(value)) continue;
    out[mod] = permOptionsFor(mod).some((o) => o.value === value) ? value : PERM.NONE;
  }
  return Object.keys(out).length ? out : null;
}

export const ACCESS_SCOPES = ['TCS_ONLY', 'PQA_ONLY', 'ALL'];

export function getModulePermission(user, module) {
  return normalizePermissions(user)[module] || PERM.NONE;
}

export function canReadModule(user, module) {
  if (isSuperAdmin(user)) return true;
  const perm = getModulePermission(user, module);
  return perm === PERM.READ || perm === PERM.READ_WRITE;
}

export function canWriteModule(user, module) {
  if (isSuperAdmin(user)) return true;
  const perm = getModulePermission(user, module);
  return perm === PERM.WRITE || perm === PERM.READ_WRITE;
}

export function canAccessModule(user, module) {
  return canReadModule(user, module) || canWriteModule(user, module);
}

export function permissionLabel(perm) {
  return PERM_OPTIONS.find((option) => option.value === perm)?.label || 'No access';
}

export function permissionBadge(perm) {
  if (perm === PERM.READ_WRITE) return 'R+W';
  if (perm === PERM.READ) return 'R';
  if (perm === PERM.WRITE) return 'W';
  return null;
}

export function permissionsForForm(admin) {
  return { ...normalizePermissions(admin) };
}

export function buildPermissionsForSave(formData, role) {
  if (role === 'SUPER_ADMIN') return allPermissions(PERM.READ_WRITE);
  const perms = formData.permissions || {};
  const access = formData.access || 'TCS_ONLY';
  const out = {};
  for (const mod of PERM_MODULES) {
    out[mod] = isValidPerm(perms[mod]) ? perms[mod] : DEFAULT_FORM_PERMISSIONS[mod];
  }
  if (!isValidPerm(perms.tcs)) out.tcs = access === 'TCS_ONLY' || access === 'ALL' ? PERM.READ_WRITE : PERM.NONE;
  if (!isValidPerm(perms.pqa)) out.pqa = access === 'PQA_ONLY' || access === 'ALL' ? PERM.READ_WRITE : PERM.NONE;
  return out;
}

export function syncScopePermissions(access, permissions = {}) {
  return {
    ...permissions,
    tcs: access === 'TCS_ONLY' || access === 'ALL'
      ? (permissions.tcs === PERM.NONE ? PERM.READ_WRITE : permissions.tcs)
      : PERM.NONE,
    pqa: access === 'PQA_ONLY' || access === 'ALL'
      ? (permissions.pqa === PERM.NONE ? PERM.READ_WRITE : permissions.pqa)
      : PERM.NONE,
  };
}

export function canAccessTcsEnv(user) {
  return isSuperAdmin(user) || canAccessModule(user, 'tcs');
}

export function canAccessPqaEnv(user) {
  return isSuperAdmin(user) || canAccessModule(user, 'pqa');
}

/** Live Quiz — admins and super admins (module quiz). */
export function canAccessQuizEnv(user) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return canAccessModule(user, 'quiz');
  return false;
}
