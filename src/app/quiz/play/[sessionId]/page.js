'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { subscribeQuizSession, submitQuizAnswer } from '../../../../services/quizService';
import { QUIZ_QUESTION_TYPES, QUIZ_SESSION_STATUS } from '../../../../constants/quiz';
import QuizChallengeHeader from '../../../../components/quiz/QuizChallengeHeader';
import QuizLiveStats from '../../../../components/quiz/QuizLiveStats';
import QuizQuestionDisplay from '../../../../components/quiz/QuizQuestionDisplay';
import QuizJoinAnotherGame from '../../../../components/quiz/QuizJoinAnotherGame';
import QuizAnswerFeedback, { useAnswerResultStorage, isScoredFeedbackType } from '../../../../components/quiz/QuizAnswerFeedback';
import QuizRevealCountdown from '../../../../components/quiz/QuizRevealCountdown';
import { normalizeQuizSettings } from '../../../../lib/quizSessionHelpers';

const T = {
  en: { wait: 'Waiting…', lobby: 'You are in! Wait for the host.', done: 'Answer locked in', waitingReveal: 'Waiting for others…', pollDone: 'Vote recorded!' },
  ar: { wait: 'في الانتظار…', lobby: 'تم الانضمام!', done: 'تم التسجيل', waitingReveal: 'في انتظار الآخرين…', pollDone: 'تم التصويت!' },
};

function PlayContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const queryPlayerId = searchParams.get('playerId');
  const [playerId, setPlayerId] = useState(queryPlayerId || '');
  const lang = searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  const t = T[lang];

  const [session, setSession] = useState(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answeredIndex, setAnsweredIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [multiSelected, setMultiSelected] = useState([]);
  const [answerCorrect, setAnswerCorrect] = useState(null);

  useEffect(() => {
    if (queryPlayerId) {
      setPlayerId(queryPlayerId);
      return;
    }
    if (!sessionId || typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(`quiz_player_${sessionId}`);
      if (stored) setPlayerId(stored);
    } catch { /* ignore */ }
  }, [queryPlayerId, sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeQuizSession(sessionId, setSession);
  }, [sessionId]);

  const qIndex = session?.currentQuestionIndex ?? -1;
  const question = session?.questions?.[qIndex];
  const nickname = typeof window !== 'undefined' ? sessionStorage.getItem(`quiz_nick_${sessionId}`) || 'Player' : 'Player';
  const resultStorage = useAnswerResultStorage(sessionId, qIndex);

  useEffect(() => {
    if (qIndex !== answeredIndex) {
      setTyped('');
      setFeedback(null);
      setMultiSelected([]);
      setAnswerCorrect(null);
    }
  }, [qIndex, answeredIndex]);

  const isReveal = session?.status === QUIZ_SESSION_STATUS.REVEAL;

  useEffect(() => {
    if (!isReveal || answeredIndex !== qIndex || qIndex < 0 || !sessionId) return;
    try {
      const raw = sessionStorage.getItem(`quiz_result_${sessionId}_q${qIndex}`);
      if (!raw) return;
      const stored = JSON.parse(raw);
      setAnswerCorrect(stored.correct);
    } catch { /* ignore */ }
  }, [isReveal, qIndex, answeredIndex, sessionId]);

  const pickAnswer = async (value) => {
    if (submitting || answeredIndex === qIndex || session?.status !== QUIZ_SESSION_STATUS.QUESTION) return;
    if (!playerId) {
      setFeedback(lang === 'ar' ? 'أعد الانضمام حتى تُسجل إجابتك.' : 'Rejoin the game so your answer can be saved.');
      return;
    }
    setSubmitting(true);
    setFeedback(lang === 'ar' ? 'جارٍ تسجيل الإجابة…' : 'Saving your answer…');
    try {
      const res = await submitQuizAnswer({ sessionId, playerId, nickname, answer: value });
      setAnsweredIndex(qIndex);
      const isPoll = question?.type === QUIZ_QUESTION_TYPES.POLL;
      resultStorage.save(res.correct, isPoll);
      setFeedback(isPoll ? t.pollDone : t.done);
    } catch (e) {
      setFeedback(e?.message || (lang === 'ar' ? 'لم يتم تسجيل الإجابة. حاول مرة أخرى.' : 'Answer was not saved. Try again.'));
    } finally { setSubmitting(false); }
  };

  if (!session) return <div className="fixed inset-0 bg-black flex items-center justify-center text-zinc-500">{t.wait}</div>;
  if (session.status === QUIZ_SESSION_STATUS.FINISHED) {
    return <QuizJoinAnotherGame lang={lang} />;
  }
  if (session.status === QUIZ_SESSION_STATUS.LOBBY || qIndex < 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-start sm:justify-center gap-6 p-6 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} />
        <p className="text-zinc-400">{t.lobby}</p>
      </div>
    );
  }

  const hasAnswered = answeredIndex === qIndex;
  const disabled = submitting || hasAnswered || isReveal;
  const settings = normalizeQuizSettings(session.settings);
  const hidePrompt = !settings.showQuestionsOnDevices;
  const highContrast = settings.highContrast;

  const toggleMulti = (idx) => {
    if (disabled) return;
    setMultiSelected((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b));
  };

  return (
    <div className={`fixed inset-0 bg-black text-white flex flex-col overflow-hidden ${highContrast ? 'contrast-125' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="shrink-0 px-4 py-3 border-b border-white/10">
        <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} />
      </div>
      <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 overflow-y-auto overflow-x-clip">
        {!isReveal && !hasAnswered && <div className="shrink-0 mb-4"><QuizLiveStats session={session} question={question} lang={lang} large /></div>}
        {!hasAnswered && feedback && (
          <p className={`shrink-0 mb-4 text-center text-sm font-black uppercase tracking-wide ${submitting ? 'text-zinc-400' : 'text-amber-300'}`}>{feedback}</p>
        )}
        {isReveal && (
          <div className="shrink-0 mb-6 space-y-4">
            <QuizRevealCountdown session={session} lang={lang} />
            {isScoredFeedbackType(question?.type) && answerCorrect !== null && (
              <QuizAnswerFeedback correct={answerCorrect} lang={lang} size="large" className="animate-in fade-in zoom-in-95 duration-700" />
            )}
          </div>
        )}
        {hasAnswered && !isReveal ? (
          <div className="flex flex-col items-center justify-start sm:justify-center text-center gap-6 py-6 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 px-8 py-6 space-y-2">
              <p className="text-emerald-400 font-black text-xl uppercase tracking-wide">{feedback || t.done}</p>
              <p className="text-zinc-500 text-sm">{t.waitingReveal}</p>
            </div>
            <p className="text-sm text-zinc-600 tabular-nums">{session.answerCount || 0} / {session.playerCount || 0}</p>
          </div>
        ) : (
          <QuizQuestionDisplay
            question={question} lang={lang} qIndex={qIndex} totalQ={session.questions?.length || 0}
            reveal={isReveal} large disabled={disabled} typedValue={typed} onTypedChange={setTyped}
            onSubmitTyped={() => (question?.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE ? pickAnswer(multiSelected.join(',')) : pickAnswer(typed))}
            onPick={pickAnswer} multiSelected={multiSelected} onToggleMulti={toggleMulti}
            hidePrompt={hidePrompt}
            showCorrectAnswer={settings.showCorrectAnswers && !settings.randomizeQuestions}
          />
        )}
      </div>
    </div>
  );
}

export default function QuizPlayPage() {
  return <Suspense fallback={<div className="fixed inset-0 bg-black" />}><PlayContent /></Suspense>;
}
