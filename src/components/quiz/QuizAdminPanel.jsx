'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App } from 'antd';
import {
  Plus,
  Play,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  ClipboardList,
  Octagon,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import {
  QUIZ_IMPORT_ACCEPT,
  readQuizImportFile,
  downloadQuizImportTemplate,
} from '../../lib/quizImportFile';
import {
  QUIZ_DIVISIONS,
  EMPTY_QUIZ_TEMPLATE,
  DEFAULT_QUIZ_SETTINGS,
} from '../../constants/quiz';
import { SCORA_CHALLENGE_JOIN_URL } from '../../constants/scoraDomains';
import { scoraChallengeHostPath } from '../../constants/scoraChallengePaths';
import { normalizeQuizSettings, SCORA_CHALLENGE_NAME } from '../../lib/quizSessionHelpers';
import {
  listQuizTemplates,
  saveQuizTemplate,
  archiveQuizTemplate,
  startQuizLiveSession,
  listActiveQuizSessions,
  listFinishedQuizSessions,
  getQuizSessionAnswers,
  getQuizSessionPlayers,
  fetchQuizLogs,
  adminEndQuizSession,
} from '../../services/quizService';
import QuizQuestionEditor, { createEmptyQuestion } from './QuizQuestionEditor';
import QuizJoinQR from './QuizJoinQR';
import QuizResultsSummary from './QuizResultsSummary';

export default function QuizAdminPanel({
  currentUser,
  canRead,
  canWrite,
}) {
  const { message, modal } = App.useApp();
  const actor = currentUser?.username || currentUser?.name || 'admin';

  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [templates, setTemplates] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [finishedSessions, setFinishedSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('templates');
  const [editing, setEditing] = useState(null);
  const [reportSession, setReportSession] = useState(null);
  const [reportPlayers, setReportPlayers] = useState([]);
  const [reportAnswers, setReportAnswers] = useState([]);
  const [endingSessionId, setEndingSessionId] = useState(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);
  const importModeRef = useRef('new');

  const div = divisionFilter === 'ALL' ? null : divisionFilter;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, a, f, l] = await Promise.all([
        listQuizTemplates(div),
        listActiveQuizSessions(div),
        listFinishedQuizSessions(30, div),
        fetchQuizLogs(80),
      ]);
      setTemplates(t);
      setActiveSessions(a);
      setFinishedSessions(f);
      setLogs(l);
    } catch (e) {
      message.error(e.message || 'Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  }, [div, message]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (typeof window === 'undefined' || !finishedSessions.length) return;
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('challengeReport') || params.get('quizReport');
    if (!reportId || reportSession?.id === reportId) return;
    const session = finishedSessions.find((s) => s.id === reportId);
    if (session) openReport(session);
  }, [finishedSessions, reportSession?.id]);

  const openReport = async (session) => {
    setReportSession(session);
    const [players, answers] = await Promise.all([
      getQuizSessionPlayers(session.id),
      getQuizSessionAnswers(session.id),
    ]);
    setReportPlayers(players);
    setReportAnswers(answers);
    setSubTab('reports');
  };

  const saveTemplate = async () => {
    if (!editing?.title?.trim()) {
      message.warning('Title required');
      return;
    }
    if (!editing.questions?.length) {
      message.warning('Add at least one question');
      return;
    }
    try {
      await saveQuizTemplate({
        ...editing,
        settings: normalizeQuizSettings(editing.settings),
      }, actor);
      message.success('Quiz saved');
      setEditing(null);
      reload();
    } catch (e) {
      message.error(e.message);
    }
  };

  const startLive = async (templateId) => {
    try {
      const { sessionId, pin, division } = await startQuizLiveSession({ templateId, hostUsername: actor });
      message.success(`Live game started — PIN ${pin} (${division})`);
      window.open(scoraChallengeHostPath(sessionId), '_blank', 'noopener,noreferrer');
      reload();
    } catch (e) {
      message.error(e.message);
    }
  };

  const copyJoinLink = async (pin) => {
    const url = `${SCORA_CHALLENGE_JOIN_URL}${pin ? `?pin=${pin}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success('Join link copied');
    } catch {
      message.error('Copy failed');
    }
  };

  const confirmEndGame = (session) => {
    if (!canWrite) return;
    modal.confirm({
      title: 'End this hosted game?',
      content: `PIN ${session.pin} · ${session.templateTitle || 'SCORA Challenge'} · ${session.playerCount || 0} players. Players will no longer be able to join.`,
      okText: 'End game',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setEndingSessionId(session.id);
        try {
          await adminEndQuizSession(session.id, actor);
          message.success(`Game ${session.pin} ended`);
          await reload();
        } catch (e) {
          message.error(e.message || 'Failed to end game');
        } finally {
          setEndingSessionId(null);
        }
      },
    });
  };

  const pickImportFile = (mode) => {
    importModeRef.current = mode;
    importInputRef.current?.click();
  };

  const showImportWarnings = (title, warnings) => {
    if (!warnings?.length) return;
    modal.warning({
      title,
      width: 560,
      centered: true,
      content: (
        <div className="max-h-[50vh] overflow-y-auto text-xs space-y-1">
          {warnings.map((w, i) => <p key={i}>• {w}</p>)}
        </div>
      ),
    });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const { questions, warnings, title } = await readQuizImportFile(file);
      if (importModeRef.current === 'append' && editing) {
        setEditing((prev) => {
          const kept = (prev.questions || []).filter((q) => String(q.prompt || q.promptAr || '').trim());
          return { ...prev, questions: [...kept, ...questions] };
        });
      } else {
        setEditing({
          ...EMPTY_QUIZ_TEMPLATE,
          division: div || EMPTY_QUIZ_TEMPLATE.division,
          title,
          settings: { ...DEFAULT_QUIZ_SETTINGS },
          questions,
        });
      }
      message.success(`${questions.length} question${questions.length === 1 ? '' : 's'} imported from ${file.name}. Review them, then Save quiz.`);
      showImportWarnings('Please check these questions', warnings);
    } catch (e) {
      message.error(e.message || 'Could not read this file');
      showImportWarnings('What was found in the file', e.warnings);
    } finally {
      setImporting(false);
    }
  };

  const addQuestion = () => {
    setEditing((prev) => ({
      ...prev,
      questions: [...(prev?.questions || []), createEmptyQuestion()],
    }));
  };

  const updateQuestion = (idx, updated) => {
    setEditing((prev) => {
      const questions = [...(prev.questions || [])];
      questions[idx] = updated;
      return { ...prev, questions };
    });
  };

  const applyTimeToAll = (timeSec) => {
    setEditing((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q) => ({ ...q, timeLimitSec: timeSec })),
    }));
  };

  const removeQuestion = (idx) => {
    setEditing((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  if (!canRead) {
    return (
      <p className="text-zinc-500 text-sm p-8 text-center">You do not have access to {SCORA_CHALLENGE_NAME}.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-400">{SCORA_CHALLENGE_NAME}</p>
          <h3 className="text-lg font-black text-white uppercase">Live quiz games (MX · DA · AV)</h3>
          <p className="text-[10px] text-zinc-500 mt-1 max-w-2xl">
            Kahoot-style colors, timers, randomization, multi-select &amp; poll questions. Max 200 players per game.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white"
          >
            <option value="ALL">All divisions</option>
            {QUIZ_DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button type="button" onClick={reload} disabled={loading} className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-500/20 bg-zinc-950/60 p-6 flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        <QuizJoinQR
          url={SCORA_CHALLENGE_JOIN_URL}
          title="SCORA Challenge — Join link QR"
          subtitle="Always open — enter PIN when the host starts a game"
          size={160}
        />
        <div className="flex-1 space-y-3 text-center lg:text-left">
          <p className="text-[10px] font-black uppercase text-orange-300">Player join link</p>
          <p className="text-[10px] font-mono text-zinc-400 break-all">{SCORA_CHALLENGE_JOIN_URL}</p>
          <button type="button" onClick={() => copyJoinLink()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-200 text-[10px] font-black uppercase">
            <Copy className="w-4 h-4" /> Copy link
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['templates', 'live', 'reports', 'logs'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              subTab === key ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-500 border border-white/5'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {subTab === 'templates' && (
        <div className="space-y-6">
          {canWrite && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({
                    ...EMPTY_QUIZ_TEMPLATE,
                    settings: { ...DEFAULT_QUIZ_SETTINGS },
                    questions: [createEmptyQuestion()],
                  })}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase"
                >
                  <Plus className="w-4 h-4" /> New quiz
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => pickImportFile('new')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-600 text-white text-[10px] font-black uppercase disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> {importing ? 'Reading file…' : 'Import quiz from file'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadQuizImportTemplate().catch((e) => message.error(e.message))}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-300 text-[10px] font-black uppercase hover:text-white"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel template
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 max-w-3xl leading-relaxed">
                Excel (.xlsx, .csv), Word (.docx), PDF or .txt. The Excel template has dropdowns for Type, Correct
                (follows the Type) and Time — typed answers go in &quot;Accepted answers&quot;. In Word / PDF write each question as
                {' '}<span className="text-zinc-300">1. Question</span>, options as <span className="text-zinc-300">A) …</span>,
                {' '}then <span className="text-zinc-300">Answer: B</span> (or mark the right option with *). Use
                {' '}<span className="text-zinc-300">Answer: A, C</span> for multi-select, <span className="text-zinc-300">Answer: True</span> for true/false,
                {' '}or only an answer line for a typed answer. Arabic (أ / ب / الإجابة) works too.
              </p>
            </div>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept={QUIZ_IMPORT_ACCEPT}
            className="hidden"
            onChange={handleImportFile}
          />

          {editing && canWrite && (
            <div className="rounded-[2rem] border border-orange-500/25 bg-zinc-900/40 p-4 md:p-6 lg:p-8 space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Title (EN)" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white" />
                <input placeholder="العنوان (AR)" value={editing.titleAr} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white" dir="rtl" />
                <select value={editing.division} onChange={(e) => setEditing({ ...editing, division: e.target.value })} className="bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase text-white">
                  {QUIZ_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                Game settings (timer, autoplay, reactions, etc.) are configured on the host screen when you start a live game.
              </p>

              <div className="space-y-5 min-w-0 max-w-5xl">
                {(editing.questions || []).map((q, qi) => (
                  <QuizQuestionEditor
                    key={q.id || qi}
                    question={q}
                    qIndex={qi}
                    onChange={(updated) => updateQuestion(qi, updated)}
                    onRemove={() => removeQuestion(qi)}
                    onApplyTimeToAll={applyTimeToAll}
                  />
                ))}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="button" onClick={addQuestion} className="flex-1 py-3 rounded-xl border border-dashed border-white/15 text-[10px] font-black uppercase text-zinc-500 hover:text-white hover:border-white/30">+ Add question</button>
                  <button type="button" disabled={importing} onClick={() => pickImportFile('append')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-orange-500/30 text-[10px] font-black uppercase text-orange-300 hover:text-white hover:border-orange-400/60 disabled:opacity-50">
                    <Upload className="w-4 h-4" /> {importing ? 'Reading file…' : 'Add questions from file'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={saveTemplate} className="px-6 py-2.5 rounded-xl bg-orange-600 text-white text-[10px] font-black uppercase">Save quiz</button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 text-zinc-500 text-[10px] font-black uppercase">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">{t.title}</p>
                  <p className="text-[10px] text-zinc-500">{t.division} · {t.questions?.length || 0} questions</p>
                </div>
                <div className="flex gap-2">
                  {canWrite && (
                    <>
                      <button type="button" onClick={() => setEditing({ ...t, questions: t.questions || [], settings: normalizeQuizSettings(t.settings) })} className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"><ClipboardList className="w-4 h-4" /></button>
                      <button type="button" onClick={() => startLive(t.id)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 text-[10px] font-black uppercase"><Play className="w-3 h-3" /> Start</button>
                      <button type="button" onClick={() => archiveQuizTemplate(t.id, actor).then(reload)} className="p-2 rounded-lg bg-zinc-900 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'live' && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {activeSessions.length} active game{activeSessions.length === 1 ? '' : 's'}
          </p>
          {activeSessions.length === 0 ? (
            <p className="text-zinc-600 text-center py-12 text-[10px] font-black uppercase">No active games</p>
          ) : activeSessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-emerald-500/20 bg-zinc-950 p-5 flex flex-col lg:flex-row gap-6 items-center">
              <QuizJoinQR
                url={`${SCORA_CHALLENGE_JOIN_URL}?pin=${s.pin}`}
                pin={s.pin}
                title="Scan to join"
                size={140}
                className="shrink-0"
              />
              <div className="flex-1 w-full flex flex-wrap justify-between gap-3 items-center">
                <div>
                  <p className="text-2xl font-black text-emerald-400 tracking-widest">{s.pin}</p>
                  <p className="text-[10px] text-zinc-500">{s.division} · {s.templateTitle} · {s.playerCount || 0} players · {s.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyJoinLink(s.pin)} className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white" title="Copy join link"><Copy className="w-4 h-4" /></button>
                  <button type="button" onClick={() => window.open(scoraChallengeHostPath(s.id), '_blank')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase hover:bg-blue-600/30"><ExternalLink className="w-3 h-3" /> Host</button>
                  {canWrite && (
                    <button
                      type="button"
                      disabled={endingSessionId === s.id}
                      onClick={() => confirmEndGame(s)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600/20 text-red-300 text-[10px] font-black uppercase hover:bg-red-600/30 disabled:opacity-40"
                    >
                      <Octagon className="w-3 h-3" />
                      {endingSessionId === s.id ? 'Ending…' : 'End game'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'reports' && (
        <div className="space-y-6">
          {!reportSession ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">Finished sessions</p>
              {finishedSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openReport(s)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-zinc-950 p-4 hover:border-orange-500/30 transition-all"
                >
                  <p className="font-black text-white">{s.templateTitle}</p>
                  <p className="text-[10px] text-zinc-500">PIN {s.pin} · {s.division} · {s.playerCount || 0} players</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <button type="button" onClick={() => setReportSession(null)} className="text-[10px] font-black uppercase text-zinc-500">← Back</button>
              <QuizResultsSummary
                session={reportSession}
                players={reportPlayers}
                answers={reportAnswers}
                lang="en"
                showPortalLink={false}
              />
              <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Full answer log (portal)
                </p>
                <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                  {reportAnswers.length === 0 ? (
                    <p className="text-zinc-600 py-4 text-center">No answers recorded</p>
                  ) : reportAnswers.map((a) => (
                    <div key={a.id} className="flex flex-wrap gap-2 text-zinc-500 border-b border-white/5 py-2">
                      <span className="text-white font-bold">{a.nickname}</span>
                      <span>Q{(a.questionIndex ?? 0) + 1}</span>
                      <span className={a.correct ? 'text-emerald-400' : 'text-red-400'}>
                        {a.correct ? '✓' : '✗'} {a.answer}
                      </span>
                      <span>+{a.points || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'logs' && (
        <div className="max-h-96 overflow-y-auto space-y-2 text-xs font-mono">
          {logs.map((log) => (
            <div key={log.id} className="border-b border-white/5 py-2 text-zinc-500">
              <span className="text-orange-400">{log.type}</span> · {log.action} · {log.actor}
              {log.pin && <span> · PIN {log.pin}</span>}
              {log.division && <span> · {log.division}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
