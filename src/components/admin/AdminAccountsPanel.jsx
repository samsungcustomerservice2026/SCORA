'use client';

import React from 'react';
import { UserPlus, UserCircle, Trash2, Edit2, Save, X } from 'lucide-react';
import {
  PERM,
  PERM_MODULES,
  MODULE_HINTS,
  MODULE_LABELS,
  DEFAULT_FORM_PERMISSIONS,
  allPermissions,
  permOptionsFor,
  permissionBadge,
  permissionLabel,
  normalizePermissions,
  readOnlyPermissions,
} from '../../lib/adminPermissions';
import { isInternalAdminEmail } from '../../lib/auth/adminLoginId';

const MODULE_BADGES = {
  tcs: 'TCS',
  pqa: 'PQA',
  display: 'DSP',
  survey: 'SRV',
  surveyForms: 'FORMS',
  feedback: 'FDB',
  quiz: 'QUIZ',
  knowledge: 'KB',
};

export const EMPTY_ADMIN_FORM = {
  username: '',
  email: '',
  password: '',
  name: '',
  role: 'ADMIN',
  access: 'TCS_ONLY',
  permissions: { ...DEFAULT_FORM_PERMISSIONS },
};

export function adminAccessLabel(access) {
  if (access === 'ALL') return 'TCS + PQA';
  if (access === 'PQA_ONLY') return 'PQA only';
  if (access === 'TCS_ONLY') return 'TCS only';
  return access || 'TCS only';
}

/** Global authority is the super admin role; an admin's scope is only TCS / PQA. */
export function adminAuthorityBadge(admin) {
  if (admin?.role === 'SUPER_ADMIN') return 'GLOBAL';
  if (admin?.access === 'ALL') return 'TCS+PQA';
  if (admin?.access === 'PQA_ONLY') return 'PQA';
  return 'TCS';
}

export const SUPER_ADMIN_AUTHORITY = 'SUPER_ADMIN';

const AUTHORITY_OPTIONS = [
  { value: 'TCS_ONLY', label: 'Admin · TCS only' },
  { value: 'PQA_ONLY', label: 'Admin · PQA only' },
  { value: 'ALL', label: 'Admin · TCS + PQA' },
  { value: SUPER_ADMIN_AUTHORITY, label: 'Global · Super admin' },
];

function RoleAccessFields({ role, access, onRoleChange, onAccessChange, disabled }) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Role</label>
        <select
          value={role}
          disabled={disabled}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white disabled:opacity-50"
        >
          <option value="ADMIN">Admin (permissions below)</option>
          <option value="SUPER_ADMIN">Global · Super admin (full control)</option>
        </select>
        <p className="text-[9px] text-zinc-600 leading-relaxed ml-1">
          {role === 'SUPER_ADMIN'
            ? 'Everything in TCS and PQA, including admin accounts, Insights and System.'
            : 'Only the modules granted below. Admin accounts, Insights and System stay with super admins.'}
        </p>
      </div>
      {role !== 'SUPER_ADMIN' && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Environment scope</label>
          <select
            value={access}
            disabled={disabled}
            onChange={(e) => onAccessChange(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white disabled:opacity-50"
          >
            <option value="TCS_ONLY">TCS only</option>
            <option value="PQA_ONLY">PQA only</option>
            <option value="ALL">TCS + PQA</option>
          </select>
        </div>
      )}
    </>
  );
}

const PRESETS = [
  { key: 'full', label: 'Full access', build: () => allPermissions(PERM.READ_WRITE) },
  { key: 'read', label: 'Read only', build: readOnlyPermissions },
  { key: 'none', label: 'Clear', build: () => allPermissions(PERM.NONE) },
];

function ModulePermissionsFields({ permissions, onChange, onReplace, disabled }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Module permissions</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => onReplace(p.build())}
              className="px-2.5 py-1 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Read = view &amp; export. Write = change settings &amp; edit data. Read &amp; write = full access.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERM_MODULES.map((module) => (
          <div key={module} className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">
              {MODULE_LABELS[module]}
            </label>
            <select
              value={permissions?.[module] || PERM.NONE}
              disabled={disabled}
              onChange={(e) => onChange(module, e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-green-600 text-white disabled:opacity-50"
            >
              {permOptionsFor(module).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-zinc-600 leading-snug ml-0.5">{MODULE_HINTS[module]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminForm({
  title,
  icon: Icon,
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  onCancel,
  showCancel,
  isSuperAdmin,
  passwordHint,
  isEditMode = false,
}) {
  const isOwnerRole = formData.role === 'SUPER_ADMIN';

  return (
    <div className="glass-card rounded-[2rem] p-6 sm:p-8 space-y-6 border border-green-500/20">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.35em] flex items-center gap-3">
        <Icon className="w-4 h-4 text-green-500" /> {title}
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full name</label>
          <input
            type="text"
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-green-600 font-bold text-white"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Username</label>
          <input
            type="text"
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-green-600 font-bold text-white"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email (optional)</label>
          <input
            type="email"
            placeholder="name@company.com"
            disabled={isEditMode}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-green-600 font-bold text-white disabled:opacity-50"
            value={isEditMode && isInternalAdminEmail(formData.email) ? '' : formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <p className="text-[9px] text-zinc-600 leading-relaxed ml-1">
            {isEditMode
              ? 'The sign-in email cannot be changed here.'
              : 'Leave empty to sign in with the username instead of an email.'}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Password</label>
          <input
            type="password"
            placeholder={passwordHint || 'Required for new accounts'}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-green-600 font-bold text-white"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        {isSuperAdmin && (
          <>
            <RoleAccessFields
              role={formData.role}
              access={formData.access}
              onRoleChange={(role) => setFormData({ ...formData, role })}
              onAccessChange={(access) => setFormData({ ...formData, access })}
            />
            {!isOwnerRole && (
              <ModulePermissionsFields
                permissions={formData.permissions}
                onChange={(module, value) =>
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, [module]: value },
                  })
                }
                onReplace={(permissions) => setFormData({ ...formData, permissions })}
              />
            )}
          </>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 transition-all"
          >
            <Save className="w-4 h-4" /> {submitLabel}
          </button>
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminAccountCard({ admin, currentUser, isSuperAdmin, isEditing, onStartEdit, onQuickAccessChange, onDelete }) {
  const isSelf = admin.id === currentUser?.id;
  const perms = normalizePermissions(admin);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isEditing ? 'border-blue-500/40 bg-blue-950/20' : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-black rounded-xl flex items-center justify-center text-zinc-600 border border-white/10">
            <UserCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base sm:text-lg font-black text-white uppercase tracking-tight break-words">{admin.name}</p>
            <p className="text-[10px] font-bold text-zinc-500 mt-0.5 break-all">@{admin.username}</p>
            {admin.email ? (
              <p className="text-[10px] font-medium text-zinc-600 mt-0.5 break-all">
                {isInternalAdminEmail(admin.email) ? 'Signs in with username' : admin.email}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 mt-2">
              {admin.role === 'SUPER_ADMIN' && (
                <span className="text-[8px] bg-blue-600/15 text-blue-400 px-2 py-1 rounded-full border border-blue-600/25 font-black uppercase tracking-wider">
                  Super admin
                </span>
              )}
              <span className="text-[8px] bg-emerald-600/15 text-emerald-400 px-2 py-1 rounded-full border border-emerald-600/25 font-black uppercase tracking-wider">
                {adminAuthorityBadge(admin)}
              </span>
              {PERM_MODULES.map((module) => {
                const badge = permissionBadge(perms[module]);
                if (!badge) return null;
                return (
                  <span
                    key={module}
                    className="text-[8px] bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-full border border-white/10 font-black uppercase tracking-wider"
                    title={`${MODULE_LABELS[module]}: ${permissionLabel(perms[module])}`}
                  >
                    {MODULE_BADGES[module] || module.slice(0, 3).toUpperCase()} {badge}
                  </span>
                );
              })}
              {isSelf && (
                <span className="text-[8px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-white/10 font-black uppercase tracking-wider">
                  You
                </span>
              )}
            </div>
            <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-wider">
              {admin.role === 'SUPER_ADMIN'
                ? 'Role: Super admin · Global access'
                : `Role: Admin · ${adminAccessLabel(admin.access)}`}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1 border-t border-white/5">
            <select
              value={admin.role === 'SUPER_ADMIN' ? SUPER_ADMIN_AUTHORITY : admin.access || 'TCS_ONLY'}
              disabled={isSelf}
              title={isSelf ? 'You cannot change your own authority' : undefined}
              onChange={(e) => onQuickAccessChange(admin, e.target.value)}
              className="w-full sm:flex-1 min-w-0 bg-black text-zinc-300 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-blue-500/50 disabled:opacity-50"
              aria-label={`Authority for ${admin.username}`}
            >
              {AUTHORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onStartEdit(admin)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-600/10 text-blue-300 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              {!isSelf && (
                <button
                  type="button"
                  onClick={() => onDelete(admin.id)}
                  className="flex items-center justify-center p-2.5 rounded-xl border border-red-500/20 bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                  aria-label={`Delete ${admin.username}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAccountsPanel({
  admins,
  currentUser,
  newAdminData,
  setNewAdminData,
  editingAdminId,
  editAdminData,
  setEditAdminData,
  onAdd,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onQuickAccessChange,
  onDelete,
  compact = false,
}) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isEditing = !!editingAdminId;

  return (
    <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-12' : 'xl:grid-cols-12'} gap-6 lg:gap-8`}>
      <div className={`${compact ? 'lg:col-span-5' : 'xl:col-span-5'} space-y-4`}>
        {isEditing ? (
          <AdminForm
            title="Edit account"
            icon={Edit2}
            formData={editAdminData}
            setFormData={setEditAdminData}
            onSubmit={onSaveEdit}
            submitLabel="Save changes"
            onCancel={onCancelEdit}
            showCancel
            isEditMode
            isSuperAdmin={isSuperAdmin}
            passwordHint="Leave blank to keep current password"
          />
        ) : (
          <AdminForm
            title="Add new admin"
            icon={UserPlus}
            formData={newAdminData}
            setFormData={setNewAdminData}
            onSubmit={onAdd}
            submitLabel="Add admin"
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {isSuperAdmin && isEditing && (
          <p className="text-[10px] text-zinc-500 leading-relaxed px-1">
            Set environment scope plus per-module read/write rules. Display write controls the public popup and banner switches; Survey forms write allows adding, editing and deleting surveys.
          </p>
        )}
      </div>

      <div className={`${compact ? 'lg:col-span-7' : 'xl:col-span-7'} space-y-3 min-w-0`}>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.35em]">
          Active accounts ({admins.length})
        </p>
        <div
          className={`grid grid-cols-1 gap-3 ${compact ? 'max-h-[min(60vh,560px)]' : 'max-h-[min(70vh,720px)]'} overflow-y-auto overflow-x-hidden pr-1`}
        >
          {admins.map((admin) => (
            <AdminAccountCard
              key={admin.id}
              admin={admin}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
              isEditing={editingAdminId === admin.id}
              onStartEdit={onStartEdit}
              onQuickAccessChange={onQuickAccessChange}
              onDelete={onDelete}
            />
          ))}
        </div>
        {!admins.length && (
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest py-8">No admin accounts yet</p>
        )}
      </div>
    </div>
  );
}
