'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  subscribeQuizSession,
  subscribeQuizPlayers,
  hostStartQuestion,
  hostRevealQuestion,
  hostEndQuiz,
  getQuizSessionAnswers,
  updateQuizSessionSettings,
} from '../../../../services/quizService';
import { QUIZ_SESSION_STATUS } from '../../../../constants/quiz';
import { SCORA_CHALLENGE_JOIN_URL } from '../../../../constants/scoraDomains';
import { scoraChallengeJoinUrl } from '../../../../constants/scoraChallengePaths';
import { normalizeQuizSettings } from '../../../../lib/quizSessionHelpers';
import QuizChallengeHeader from '../../../../components/quiz/QuizChallengeHeader';
import QuizLiveStats from '../../../../components/quiz/QuizLiveStats';
import QuizLeaderboardTop6 from '../../../../components/quiz/QuizLeaderboardTop6';
import QuizQuestionDisplay from '../../../../components/quiz/QuizQuestionDisplay';
import QuizResultsSummary from '../../../../components/quiz/QuizResultsSummary';
import QuizJoinQR from '../../../../components/quiz/QuizJoinQR';
import QuizGameSettingsPanel from '../../../../components/quiz/QuizGameSettingsPanel';
import QuizRevealCountdown from '../../../../components/quiz/QuizRevealCountdown';
import QuizParticipantList from '../../../../components/quiz/QuizParticipantList';

export default function QuizHostPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  const [finishedAnswers, setFinishedAnswers] = useState([]);
  const autoPlayRef = useRef(false);
  const allAnsweredRevealRef = useRef(false);
  const hostUser = typeof window !== 'undefined'
    ? (() => {
        try {
          return localStorage.getItem('userName') || 'host';
        } catch {
          return 'host';
        }
      })()
    : 'host';

  useEffect(() => {
    if (!sessionId) return undefined;
    const unsub1 = subscribeQuizSession(sessionId, setSession);
    const unsub2 = subscribeQuizPlayers(sessionId, setPlayers);
    return () => { unsub1(); unsub2(); };
  }, [sessionId]);

  const qIndex = session?.currentQuestionIndex ?? -1;
  const question = session?.questions?.[qIndex];
  const totalQ = session?.questions?.length || 0;
  const settings = normalizeQuizSettings(session?.settings);
  const isReveal = session?.status === QUIZ_SESSION_STATUS.REVEAL;
  const isQuestion = session?.status === QUIZ_SESSION_STATUS.QUESTION;
  const isLobby = session?.status === QUIZ_SESSION_STATUS.LOBBY;
  const highContrast = settings.highContrast;

  const joinUrl = useMemo(() => {
    if (!session?.pin) return SCORA_CHALLENGE_JOIN_URL;
    return scoraChallengeJoinUrl(session.pin, typeof window !== 'undefined' ? window.location.origin : undefined);
  }, [session?.pin]);

  const run = useCallback(async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const msg = String(e?.message || e || 'Action failed');
      if (/insufficient permissions|unauthenticated|Admin sign-in required|Authorization/i.test(msg)) {
        alert('Admin sign-in required to control this game.\n\nSign in on the admin portal, then open the host screen again from SCORA Challenge (same browser).');
      } else {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const updateLiveSettings = useCallback(async (patch) => {
    try {
      await updateQuizSessionSettings(sessionId, patch, hostUser);
    } catch (e) {
      const msg = String(e?.message || e || 'Could not update settings');
      if (/insufficient permissions|unauthenticated|Admin sign-in required|Authorization/i.test(msg)) {
        alert('Admin sign-in required to change live settings.\n\nSign in on the admin portal, then reopen this host screen.');
      } else {
        alert(msg);
      }
    }
  }, [sessionId, hostUser]);

  const onTimerExpired = useCallback(() => {
    if (settings.unlimitedTime) return;
    if (session?.status === QUIZ_SESSION_STATUS.QUESTION && !busy) {
      run(() => hostRevealQuestion(sessionId, hostUser));
    }
  }, [session?.status, busy, run, sessionId, hostUser, settings.unlimitedTime]);

  useEffect(() => {
    if (!session || busy || !settings.autoRevealWhenAllAnswered) {
      allAnsweredRevealRef.current = false;
      return undefined;
    }
    if (session.status !== QUIZ_SESSION_STATUS.QUESTION) {
      allAnsweredRevealRef.current = false;
      return undefined;
    }
    const connected = players.length;
    const answered = session.answerCount || 0;
    if (connected > 0 && answered >= connected) {
      if (allAnsweredRevealRef.current) return undefined;
      allAnsweredRevealRef.current = true;
      run(() => hostRevealQuestion(sessionId, hostUser));
    } else {
      allAnsweredRevealRef.current = false;
    }
    return undefined;
  }, [
    session?.status,
    session?.answerCount,
    session?.currentQuestionIndex,
    players.length,
    settings.autoRevealWhenAllAnswered,
    busy,
    run,
    sessionId,
    hostUser,
    session,
  ]);

  useEffect(() => {
    if (!session || session.status !== QUIZ_SESSION_STATUS.REVEAL || !settings.autoPlay || busy) {
      autoPlayRef.current = false;
      return undefined;
    }
    if (autoPlayRef.current) return undefined;
    autoPlayRef.current = true;
    const startedAt = session.revealStartedAt
      ? new Date(session.revealStartedAt).getTime()
      : Date.now();
    const delayMs = (settings.revealDelaySec || 5) * 1000;
    const remaining = Math.max(0, delayMs - (Date.now() - startedAt));
    const id = setTimeout(() => {
      autoPlayRef.current = false;
      if (qIndex + 1 < totalQ) run(() => hostStartQuestion(sessionId, hostUser));
      else run(() => hostEndQuiz(sessionId, hostUser));
    }, remaining);
    return () => { clearTimeout(id); autoPlayRef.current = false; };
  }, [
    session?.status,
    session?.revealStartedAt,
    session?.currentQuestionIndex,
    settings.autoPlay,
    settings.revealDelaySec,
    qIndex,
    totalQ,
    busy,
    run,
    sessionId,
    hostUser,
    session,
  ]);

  useEffect(() => {
    if (session?.status === QUIZ_SESSION_STATUS.FINISHED && sessionId) {
      getQuizSessionAnswers(sessionId).then(setFinishedAnswers);
    }
  }, [session?.status, sessionId]);

  if (!session) return <div className="fixed inset-0 bg-black flex items-center justify-center text-zinc-500">Loading…</div>;

  return (
    <div className={`fixed inset-0 bg-black text-white flex flex-col overflow-hidden min-w-0 ${highContrast ? 'contrast-125' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="shrink-0 flex items-start justify-between gap-3 px-4 py-3 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} subtitle={session.templateTitle} />
        </div>
        <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="shrink-0 text-[10px] font-black uppercase text-zinc-500 hover:text-white px-2 py-2">{lang === 'en' ? 'العربية' : 'English'}</button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 md:p-8 overflow-y-auto overflow-x-clip">
          {isLobby && (
            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 py-2 pb-10 lg:max-w-none lg:flex-row lg:items-start lg:justify-center lg:gap-10">
              <div className="flex flex-col items-center gap-5 w-full lg:flex-1 lg:max-w-xl shrink-0">
                <div className="text-center space-y-2 w-full shrink-0">
                  <p className="text-2xl sm:text-3xl md:text-5xl font-black uppercase">{lang === 'ar' ? 'قاعة الانتظار' : 'Lobby'}</p>
                  <p className="text-zinc-500 text-base sm:text-lg">
                    {players.length} {lang === 'ar' ? 'لاعب متصل' : 'players connected'}
                  </p>
                </div>
                <QuizParticipantList players={players} lang={lang} variant="chips" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => hostStartQuestion(sessionId, hostUser))}
                  className="hidden lg:inline-flex bg-blue-600 px-12 py-5 rounded-2xl font-black uppercase text-lg disabled:opacity-40 shrink-0"
                >
                  {lang === 'ar' ? 'ابدأ' : 'Start first question'}
                </button>
              </div>

              <div className="flex flex-col items-center gap-6 w-full shrink-0 lg:w-auto lg:max-w-sm">
                <QuizJoinQR
                  url={joinUrl}
                  pin={session.pin}
                  title={lang === 'ar' ? 'امسح للانضمام' : 'Scan to join'}
                  subtitle={lang === 'ar' ? 'أو أدخل الرمز يدوياً' : 'Or enter the PIN manually'}
                  size={150}
                  className="w-full"
                />
                <div className="w-full lg:hidden shrink-0">
                  <QuizGameSettingsPanel
                    variant="live"
                    settings={session.settings}
                    onChange={updateLiveSettings}
                  />
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => hostStartQuestion(sessionId, hostUser))}
                  className="w-full lg:hidden bg-blue-600 px-8 py-5 rounded-2xl font-black uppercase text-base sm:text-lg disabled:opacity-40 shrink-0"
                >
                  {lang === 'ar' ? 'ابدأ السؤال الأول' : 'Start first question'}
                </button>
              </div>
            </div>
          )}

          {(isQuestion || isReveal) && question && (
            <div className="flex-1 flex flex-col min-h-0 gap-6">
              <QuizQuestionDisplay
                question={question}
                lang={lang}
                qIndex={qIndex}
                totalQ={totalQ}
                reveal={isReveal}
                showCorrectAnswer={settings.showCorrectAnswers && !settings.randomizeQuestions}
                large
              />
              {isQuestion && (
                <div className="shrink-0 space-y-5">
                  <QuizLiveStats session={session} question={question} onExpired={onTimerExpired} lang={lang} large />
                  {!settings.autoRevealWhenAllAnswered && (
                    <button type="button" disabled={busy} onClick={() => run(() => hostRevealQuestion(sessionId, hostUser))} className="w-full max-w-md mx-auto block bg-amber-600 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'كشف الإجابة' : 'Reveal answer'}</button>
                  )}
                </div>
              )}
              {isReveal && (
                <div className="shrink-0 space-y-5">
                  <QuizRevealCountdown session={session} lang={lang} />
                  {!settings.autoPlay && (
                    <div className="flex justify-center gap-3">
                  {qIndex + 1 < totalQ ? (
                    <button type="button" disabled={busy} onClick={() => run(() => hostStartQuestion(sessionId, hostUser))} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'التالي' : 'Next question'}</button>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => run(() => hostEndQuiz(sessionId, hostUser))} className="bg-emerald-600 px-10 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'إنهاء' : 'Finish'}</button>
                  )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {session.status === QUIZ_SESSION_STATUS.FINISHED && (
            <div className="flex-1 overflow-y-auto py-4">
              <QuizResultsSummary
                session={session}
                players={players}
                answers={finishedAnswers}
                lang={lang}
                showPortalLink
                animatePodium
              />
            </div>
          )}
        </div>

        {/* Sidebar (desktop only): settings in lobby; players + leaderboard during live game */}
        <aside
          className={`hidden lg:flex shrink-0 lg:w-[min(100%,400px)] xl:w-[400px] border-l border-white/10 bg-zinc-950/40 flex-col min-h-0 overflow-hidden`}
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
            {isLobby && (
              <QuizGameSettingsPanel
                variant="live"
                settings={session.settings}
                onChange={updateLiveSettings}
              />
            )}
            <QuizParticipantList
              players={players}
              lang={lang}
              maxHeight={isLobby ? '360px' : '200px'}
            />
            {(isQuestion || isReveal) && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-1 pb-3">Leaderboard</p>
                <QuizLeaderboardTop6 players={players} prevRanks={session.prevRanks || {}} lang={lang} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
