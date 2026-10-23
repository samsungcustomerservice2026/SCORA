import { describe, it, expect } from 'vitest';
import {
  PERM,
  buildPermissionsForSave,
  canAccessModule,
  canReadModule,
  canWriteModule,
  normalizePermissions,
  readOnlyPermissions,
  sanitizePermissions,
} from '../src/lib/adminPermissions.js';
import { ADMIN_USERNAME_PATTERN, internalAdminEmail, isInternalAdminEmail } from '../src/lib/auth/adminLoginId.js';

describe('username-only admin sign-in', () => {
  it('maps a username to the internal sign-in address used by the login form', () => {
    expect(internalAdminEmail(' Ahmed.Ali ')).toBe('ahmed.ali@admins.tcs-for-engineers.local');
    expect(isInternalAdminEmail('ahmed.ali@admins.tcs-for-engineers.local')).toBe(true);
    expect(isInternalAdminEmail('ahmed@samsung.com')).toBe(false);
  });

  it('only accepts usernames that are safe inside an email address', () => {
    for (const ok of ['ahmed', 'ahmed.ali', 'op_01', 'a-b']) expect(ADMIN_USERNAME_PATTERN.test(ok)).toBe(true);
    for (const bad of ['ab', 'ahmed ali', '.ahmed', 'ahmed@x', 'أحمد']) expect(ADMIN_USERNAME_PATTERN.test(bad)).toBe(false);
  });
});

describe('admin permissions', () => {
  it('gives super admins everything', () => {
    const owner = { role: 'SUPER_ADMIN' };
    for (const m of ['display', 'surveyForms', 'knowledge', 'quiz']) expect(canWriteModule(owner, m)).toBe(true);
  });

  it('keeps pre-existing admins at the access they had before the new modules', () => {
    const legacy = { role: 'ADMIN', access: 'TCS_ONLY', permissions: { tcs: 'READ_WRITE', survey: 'READ', feedback: 'NONE', quiz: 'READ_WRITE', pqa: 'NONE' } };
    const p = normalizePermissions(legacy);
    expect(p.surveyForms).toBe(PERM.READ);
    expect(p.display).toBe(PERM.READ_WRITE);
    expect(p.knowledge).toBe(PERM.READ_WRITE);
    expect(canWriteModule(legacy, 'surveyForms')).toBe(false);
  });

  it('enforces granted survey form rights for new admins', () => {
    const formsOnly = {
      role: 'ADMIN',
      permissions: buildPermissionsForSave({ access: 'TCS_ONLY', permissions: { surveyForms: 'READ_WRITE', survey: 'NONE', tcs: 'NONE', quiz: 'NONE' } }, 'ADMIN'),
    };
    expect(canWriteModule(formsOnly, 'surveyForms')).toBe(true);
    expect(canReadModule(formsOnly, 'survey')).toBe(false);
    expect(canAccessModule(formsOnly, 'display')).toBe(false);
    expect(canAccessModule(formsOnly, 'knowledge')).toBe(false);
  });

  it('read-only preset skips modules that have no read-only mode', () => {
    const p = readOnlyPermissions();
    expect(p.survey).toBe(PERM.READ);
    expect(p.knowledge).toBe(PERM.NONE);
  });

  it('drops unknown modules and invalid values from requests', () => {
    expect(sanitizePermissions({ survey: 'READ', hack: 'READ_WRITE', tcs: 'ROOT', knowledge: 'READ' }))
      .toEqual({ survey: 'READ', knowledge: 'NONE' });
    expect(sanitizePermissions('nope')).toBeNull();
  });
});
