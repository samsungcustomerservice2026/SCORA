'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Download,
  Pencil,
  X,
} from 'lucide-react';
import {
  GOGO_QA_STATUS_LABELS,
  GOGO_QA_STATUSES,
  normalizeGoGoQaEntry,
  validateGoGoQaEntry,
} from '../../lib/gogoQaCatalog';
import {
  GOGO_QA_IMPORT_ACCEPT,
  downloadGoGoQaImportTemplate,
  readGoGoQaImportFile,
} from '../../lib/gogoQaImport';
import {
  deleteGoGoQaEntry,
  ensureGoGoKnowledgeSeeded,
  getGoGoQaEntries,
  importGoGoQaEntries,
  saveGoGoQaEntry,
} from '../../services/gogoService';

const EMPTY_FORM = {
  id: '',
  question_en: '',
  question_ar: '',
  answer_en: '',
  answer_ar: '',
  keywords: '',
  category: 'General',
  status: 'published',
  priority: 100,
  source: 'admin',
};

function toForm(row) {
  if (!row) return { ...EMPTY_FORM };
  return {
    id: row.id || '',
    question_en: row.question_en || '',
    question_ar: row.question_ar || '',
    answer_en: row.answer_en || '',
    answer_ar: row.answer_ar || '',
    keywords: Array.isArray(row.keywords) ? row.keywords.join(', ') : String(row.keywords || ''),
    category: row.category || 'General',
    status: row.status || 'published',
    priority: Number.isFinite(Number(row.priority)) ? Number(row.priority) : 100,
    source: row.source || 'admin',
  };
}

function statusTone(status) {
  if (status === 'published') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (status === 'draft') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
}

export default function GoGoQaPanel({ actor = 'admin' }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [portalReady, setPortalReady] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      await ensureGoGoKnowledgeSeeded();
      const list = await getGoGoQaEntries({ force: true });
      setRows(Array.isArray(list) ? list : []);
      setMessage(`Loaded ${list?.length || 0} Q&A entr${list?.length === 1 ? 'y' : 'ies'}.`);
    } catch (err) {
      setMessage(err?.message || 'Failed to load GoGo Q&A');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r?.category) set.add(String(r.category));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (statusFilter !== 'all' && (row.status || 'published') !== statusFilter) return false;
        if (categoryFilter !== 'all' && String(row.category || '') !== categoryFilter) return false;
        if (!needle) return true;
        const hay = [
          row.question_en,
          row.question_ar,
          row.answer_en,
          row.answer_ar,
          row.category,
          ...(Array.isArray(row.keywords) ? row.keywords : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        const pa = Number(b.priority || 0) - Number(a.priority || 0);
        if (pa) return pa;
        return String(a.question_en || a.question_ar || '').localeCompare(
          String(b.question_en || b.question_ar || ''),
        );
      });
  }, [rows, q, statusFilter, categoryFilter]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditorError('');
    setEditorOpen(true);
  }

  function openEdit(row) {
    setForm(toForm(row));
    setEditorError('');
    setEditorOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    setEditorError('');
    setWarnings([]);
    const editingId = form.id;
    try {
      const keepImportSource = form.source === 'excel_import';
      const draft = normalizeGoGoQaEntry(
        {
          ...form,
          keywords: form.keywords,
          priority: Number(form.priority) || 100,
          source: keepImportSource ? 'excel_import' : 'admin',
        },
        { actor, source: keepImportSource ? 'excel_import' : 'admin' },
      );
      const { ok, errors } = validateGoGoQaEntry(draft);
      if (!ok) throw new Error(errors.join(' '));
      await saveGoGoQaEntry({ ...draft, id: editingId || undefined }, { actor });
      setEditorOpen(false);
      setForm(EMPTY_FORM);
      setMessage(editingId ? 'Q&A updated and saved.' : 'Q&A created and saved.');
      await refresh();
    } catch (err) {
      const msg = err?.message || 'Save failed';
      setEditorError(msg);
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row) {
    if (!row?.id) return;
    if (!window.confirm(`Delete this Q&A?\n\n${row.question_en || row.question_ar || row.id}`)) return;
    setBusy(true);
    try {
      await deleteGoGoQaEntry(row.id);
      await refresh();
      setMessage('Q&A deleted.');
    } catch (err) {
      setMessage(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function onImportFile(file) {
    if (!file) return;
    setBusy(true);
    setWarnings([]);
    try {
      const parsed = await readGoGoQaImportFile(file);
      if (parsed.warnings?.length) setWarnings(parsed.warnings.slice(0, 12));
      if (!parsed.entries.length) throw new Error('No valid Q&A rows found in the file.');
      const result = await importGoGoQaEntries(parsed.entries, { actor });
      await refresh();
      setMessage(
        `Imported ${result.written} row(s): ${result.created} new, ${result.updated} updated.`,
      );
    } catch (err) {
      setMessage(err?.message || 'Import failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500 flex items-center gap-2">
              <MessageSquareText className="w-3.5 h-3.5" /> GoGo teaching
            </p>
            <h2 className="text-lg font-black mt-1">GoGo Q&amp;A catalog</h2>
            <p className="text-xs text-zinc-500 mt-2 max-w-3xl leading-relaxed">
              Teach GoGo in English and Arabic. He matches <span className="text-zinc-300">full sentences</span>,{' '}
              <span className="text-zinc-300">short phrases</span> (“scora app”), and{' '}
              <span className="text-zinc-300">keywords</span> — add several keywords so he recognizes many ways to ask.
              Published rows also answer the matching quick chips (e.g. What is SCORA?). Import Excel/CSV or add rows
              manually.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void downloadGoGoQaImportTemplate()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Excel template
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-600/30 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" /> Import Excel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-violet-900/30 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add Q&amp;A
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={GOGO_QA_IMPORT_ACCEPT}
              className="hidden"
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-xs text-zinc-400 border-t border-white/5 pt-3">{message}</p>
        ) : null}
        {warnings.length > 0 ? (
          <ul className="mt-2 space-y-1 text-[11px] text-amber-300/90">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions, answers, keywords…"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-300"
        >
          <option value="all">All statuses</option>
          {GOGO_QA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {GOGO_QA_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-300"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
            No Q&amp;A rows yet. Add one manually or import the Excel template.
          </div>
        ) : (
          visible.map((row) => {
            const status = row.status || 'published';
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusTone(status)}`}
                    >
                      {GOGO_QA_STATUS_LABELS[status] || status}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      {row.category || 'General'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      priority {row.priority ?? 100} · {row.source || 'admin'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white leading-snug">
                    {row.question_en || row.question_ar || '(untitled)'}
                  </p>
                  {row.question_en && row.question_ar ? (
                    <p className="text-xs text-zinc-500" dir="rtl">
                      {row.question_ar}
                    </p>
                  ) : null}
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {row.answer_en || row.answer_ar}
                  </p>
                  {Array.isArray(row.keywords) && row.keywords.length ? (
                    <p className="text-[10px] text-zinc-600">
                      Keywords: {row.keywords.join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openEdit(row)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white disabled:opacity-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDelete(row)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {portalReady && editorOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Edit GoGo Q&A"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) setEditorOpen(false);
              }}
            >
              <form
                onSubmit={onSave}
                className="relative z-[201] flex w-full max-w-2xl max-h-[92vh] flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5 sm:p-6 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">
                      {form.id ? 'Edit Q&A' : 'New Q&A'}
                    </p>
                    <h3 className="text-lg font-black text-white mt-1">Teach GoGo an answer</h3>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditorOpen(false)}
                    className="rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1.5 text-xs text-zinc-400 md:col-span-2">
                      Question (English)
                      <textarea
                        value={form.question_en}
                        onChange={(e) => setForm((f) => ({ ...f, question_en: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400 md:col-span-2">
                      Question (Arabic)
                      <textarea
                        dir="rtl"
                        value={form.question_ar}
                        onChange={(e) => setForm((f) => ({ ...f, question_ar: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400 md:col-span-2">
                      Answer (English)
                      <textarea
                        value={form.answer_en}
                        onChange={(e) => setForm((f) => ({ ...f, answer_en: e.target.value }))}
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400 md:col-span-2">
                      Answer (Arabic)
                      <textarea
                        dir="rtl"
                        value={form.answer_ar}
                        onChange={(e) => setForm((f) => ({ ...f, answer_ar: e.target.value }))}
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400 md:col-span-2">
                      Keywords (comma separated)
                      <input
                        value={form.keywords}
                        onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                        placeholder="tcs, ladder, ranking"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400">
                      Category
                      <input
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400">
                      Status
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      >
                        {GOGO_QA_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {GOGO_QA_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs text-zinc-400">
                      Priority (higher wins ties)
                      <input
                        type="number"
                        value={form.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                  {editorError ? (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {editorError}
                    </p>
                  ) : null}
                </div>

                <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-white/10 bg-zinc-950 p-5 sm:p-6 pt-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditorOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Q&A'}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
