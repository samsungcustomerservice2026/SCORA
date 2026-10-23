'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, Check, X, Languages } from 'lucide-react';
import { Switch } from 'antd';
import {
  blankSurveyDefinition,
  cloneSurveyDefinition,
  DEFAULT_ACADEMY_SURVEY,
  displaySurveyName,
  newSurveyQuestion,
  normalizeSurveyDefinition,
} from '../../lib/surveyDefinitions';
import {
  deleteSurveyDefinition,
  ensureDefaultSurveyDefinition,
  getSurveyDefinitions,
  saveAcademySurveySettings,
  saveSurveyDefinition,
} from '../../services/firestoreService';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-[12px] font-semibold text-white outline-none focus:border-emerald-500/50';
const labelClass = 'text-[10px] font-black uppercase tracking-widest text-zinc-500';

function FieldEditor({ field, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{field.type}</p>
        {canRemove ? (
          <button type="button" onClick={onRemove} className="text-zinc-600 hover:text-red-400" aria-label="Remove field">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
      <input className={inputClass} value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} placeholder="Label" />
      <input className={inputClass} value={field.placeholder || ''} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} placeholder="Placeholder" />
      {field.type === 'select' ? (
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={(field.options || []).join('\n')}
          onChange={(e) => onChange({ ...field, options: e.target.value.split('\n') })}
          placeholder="One option per line"
        />
      ) : null}
    </div>
  );
}

export default function SurveyDefinitionsPanel({
  message,
  actor = 'admin',
  canWrite = false,
  activeSurveyId,
  onActiveChange,
  onDefinitionsChange,
  popupEnabled,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = canWrite
        ? await ensureDefaultSurveyDefinition(actor)
        : await getSurveyDefinitions();
      setList(rows.length ? rows : [normalizeSurveyDefinition(DEFAULT_ACADEMY_SURVEY)]);
      if (rows.length) onDefinitionsChange?.(rows);
    } catch (err) {
      console.warn('Failed to load surveys:', err?.code || err?.message || err);
      setList([normalizeSurveyDefinition(DEFAULT_ACADEMY_SURVEY)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = (language) => {
    setEditing(blankSurveyDefinition(language));
  };

  const startEdit = (def) => setEditing(normalizeSurveyDefinition(def));
  const startClone = (def) => setEditing(cloneSurveyDefinition(def));

  const patchEditing = (partial) => {
    setEditing((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const handleSave = async () => {
    if (!editing) return;
    const name = String(editing.name || '').trim();
    if (!name) {
      message?.warning?.('Give the survey a name — this is what visitors see on the shortcut.');
      return;
    }
    if (!editing.copy?.title?.trim()) {
      message?.warning?.('Add a form title.');
      return;
    }
    const thinChoice = (editing.ratingQuestions || []).find(
      (q) => q.type === 'single' && (q.options || []).filter((o) => String(o).trim()).length < 2,
    );
    if (thinChoice) {
      message?.warning?.(`“${thinChoice.label}” needs at least 2 answers.`);
      return;
    }
    setSaving(true);
    try {
      const id = await saveSurveyDefinition({
        ...editing,
        name,
        shortcutLabel: String(editing.shortcutLabel || name).trim(),
        copy: { ...editing.copy, title: editing.copy.title.trim() },
      }, actor);
      message?.success?.('Survey saved.');
      setEditing(null);
      const rows = await getSurveyDefinitions();
      setList(rows);
      onDefinitionsChange?.(rows);
      if (!activeSurveyId || !rows.some((r) => r.id === activeSurveyId)) {
        await onActiveChange?.(id);
      }
    } catch (err) {
      console.error(err);
      message?.error?.('Could not save survey.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (def) => {
    if (!canWrite) return;
    if (list.length <= 1) {
      message?.warning?.('Keep at least one survey.');
      return;
    }
    if (!window.confirm(`Delete “${displaySurveyName(def)}”? Existing responses are kept.`)) return;
    setSaving(true);
    try {
      await deleteSurveyDefinition(def.id);
      const rows = await getSurveyDefinitions();
      setList(rows);
      onDefinitionsChange?.(rows);
      if (activeSurveyId === def.id) {
        const next = rows[0]?.id;
        if (next) await onActiveChange?.(next);
      }
      if (editing?.id === def.id) setEditing(null);
      message?.success?.('Survey deleted.');
    } catch (err) {
      console.error(err);
      message?.error?.('Could not delete survey.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (id) => {
    if (!canWrite || id === activeSurveyId) return;
    setSaving(true);
    try {
      await saveAcademySurveySettings({ activeSurveyId: id }, actor);
      await onActiveChange?.(id);
      message?.success?.('This survey is now the one visitors see when the Display toggle is ON.');
    } catch (err) {
      console.error(err);
      message?.error?.('Could not select survey.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    const e = editing;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-400">Survey editor</p>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              {e.id ? 'Edit survey' : 'New survey'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !canWrite}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save survey'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className={labelClass}>Display name</p>
            <input className={inputClass} value={e.name} onChange={(ev) => patchEditing({ name: ev.target.value, shortcutLabel: ev.target.value })} />
            <p className="text-[10px] text-zinc-600">Shown on the floating button and in Display settings.</p>
          </div>
          <div className="space-y-1.5">
            <p className={labelClass}>Creation language</p>
            <div className="flex gap-2">
              {['ar', 'en'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (e.id) {
                      patchEditing({ language: lang });
                      return;
                    }
                    const next = blankSurveyDefinition(lang);
                    setEditing({ ...next, name: e.name, shortcutLabel: e.shortcutLabel });
                  }}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-[10px] font-black uppercase tracking-widest ${
                    e.language === lang ? 'border-emerald-500 bg-emerald-600/15 text-emerald-300' : 'border-white/10 text-zinc-500'
                  }`}
                >
                  {lang === 'ar' ? 'Arabic · RTL' : 'English · LTR'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">Locked on the visitor form. Device language cannot override it.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className={labelClass}>Form title</p>
            <input className={inputClass} dir={e.language === 'ar' ? 'rtl' : 'ltr'} value={e.copy?.title || ''} onChange={(ev) => patchEditing({ copy: { ...e.copy, title: ev.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <p className={labelClass}>Subtitle</p>
            <input className={inputClass} dir={e.language === 'ar' ? 'rtl' : 'ltr'} value={e.copy?.subtitle || ''} onChange={(ev) => patchEditing({ copy: { ...e.copy, subtitle: ev.target.value } })} />
          </div>
        </div>

        <div>
          <p className={`${labelClass} mb-2`}>Profile fields</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {e.profileFields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                canRemove={e.profileFields.length > 1}
                onRemove={() => patchEditing({ profileFields: e.profileFields.filter((_, idx) => idx !== i) })}
                onChange={(next) => {
                  const profileFields = [...e.profileFields];
                  profileFields[i] = next;
                  patchEditing({ profileFields });
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={labelClass}>Questions</p>
            <div className="flex gap-3">
              {[
                { type: 'rating', label: '+ Rating (1–10)' },
                { type: 'single', label: '+ Single choice' },
              ].map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => patchEditing({
                    ratingQuestions: [...e.ratingQuestions, newSurveyQuestion(btn.type, e.language)],
                  })}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-400"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {e.ratingQuestions.map((q, i) => {
              const updateQuestion = (partial) => {
                const ratingQuestions = [...e.ratingQuestions];
                ratingQuestions[i] = { ...q, ...partial };
                patchEditing({ ratingQuestions });
              };
              const isSingle = q.type === 'single';
              return (
                <div key={q.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-white/10 p-0.5 flex-shrink-0">
                      {[
                        { type: 'rating', label: 'Rating' },
                        { type: 'single', label: 'Single choice' },
                      ].map((opt) => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            if (q.type === opt.type) return;
                            const seed = newSurveyQuestion(opt.type, e.language);
                            updateQuestion({ type: opt.type, options: seed.options });
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                            (q.type || 'rating') === opt.type ? 'bg-emerald-600/20 text-emerald-300' : 'text-zinc-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1" />
                    {e.ratingQuestions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => patchEditing({ ratingQuestions: e.ratingQuestions.filter((_, idx) => idx !== i) })}
                        className="px-2 text-zinc-600 hover:text-red-400"
                        aria-label="Remove question"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                  <input
                    className={inputClass}
                    dir={e.language === 'ar' ? 'rtl' : 'ltr'}
                    value={q.label}
                    onChange={(ev) => updateQuestion({ label: ev.target.value })}
                    placeholder="Question"
                  />
                  {isSingle ? (
                    <textarea
                      className={`${inputClass} min-h-[72px] resize-y`}
                      dir={e.language === 'ar' ? 'rtl' : 'ltr'}
                      value={(q.options || []).join('\n')}
                      onChange={(ev) => updateQuestion({ options: ev.target.value.split('\n') })}
                      placeholder="One answer per line (at least 2)"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3">
          <div>
            <p className="text-[11px] font-black text-white">Notes field</p>
            <p className="text-[10px] text-zinc-500">Optional free-text at the end of the form.</p>
          </div>
          <Switch checked={e.notesEnabled !== false} onChange={(checked) => patchEditing({ notesEnabled: checked })} />
        </div>
        {e.notesEnabled !== false ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className={labelClass}>Notes label</p>
              <input className={inputClass} dir={e.language === 'ar' ? 'rtl' : 'ltr'} value={e.copy?.notesLabel || ''} onChange={(ev) => patchEditing({ copy: { ...e.copy, notesLabel: ev.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <p className={labelClass}>Notes placeholder</p>
              <input className={inputClass} dir={e.language === 'ar' ? 'rtl' : 'ltr'} value={e.copy?.notesPlaceholder || ''} onChange={(ev) => patchEditing({ copy: { ...e.copy, notesPlaceholder: ev.target.value } })} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-400">Forms</p>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Surveys</h3>
          <p className="text-[10px] text-zinc-500 font-medium mt-1 max-w-xl">
            Edit the live form, create more, and pick exactly one to show when the Display toggle is ON.
            {!popupEnabled ? ' The Display toggle is currently OFF, so visitors will not see a shortcut.' : ''}
          </p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startCreate('ar')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:text-white hover:bg-white/5"
            >
              <Languages className="w-3.5 h-3.5" />
              New Arabic
            </button>
            <button
              type="button"
              onClick={() => startCreate('en')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              New English
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-[11px] text-zinc-500">Loading surveys…</p>
      ) : (
        <div className="space-y-3">
          {list.map((def) => {
            const selected = def.id === activeSurveyId;
            return (
              <div
                key={def.id}
                className={`rounded-2xl border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  selected ? 'border-emerald-500/40 bg-emerald-600/10' : 'border-white/10 bg-zinc-950/50'
                }`}
              >
                <button
                  type="button"
                  disabled={!canWrite || saving}
                  onClick={() => handleSelect(def.id)}
                  className={`flex-shrink-0 h-9 w-9 rounded-full border flex items-center justify-center ${
                    selected ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-white/20 text-transparent'
                  }`}
                  title="Show this survey"
                  aria-label={selected ? 'Currently displayed' : 'Display this survey'}
                >
                  <Check className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-white truncate" dir={def.language === 'ar' ? 'rtl' : 'ltr'}>
                      {displaySurveyName(def)}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-zinc-400">
                      {def.language === 'ar' ? 'Arabic' : 'English'}
                    </span>
                    {selected ? (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        Displayed
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate" dir={def.language === 'ar' ? 'rtl' : 'ltr'}>
                    {def.copy?.title}
                  </p>
                </div>
                {canWrite ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button type="button" onClick={() => startEdit(def)} className="p-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => startClone(def)} className="p-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(def)} className="p-2 rounded-xl border border-white/10 text-zinc-500 hover:text-red-400" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
