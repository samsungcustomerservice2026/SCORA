'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getQuizSessionByPin, joinQuizSession } from '../../services/quizService';
import { QUIZ_PIN_LENGTH } from '../../constants/quiz';
import { normalizeQuizSettings } from '../../lib/quizSessionHelpers';
import { SCORA_CHALLENGE_LOGO_SRC, scoraChallengePlayPath } from '../../constants/scoraChallengePaths';

const NICK_PARTS = ['Swift', 'Blue', 'Mega', 'Super', 'Cosmic', 'Turbo', 'Nova', 'Pixel', 'Flash', 'Star'];
const NICK_SUFFIX = ['Fox', 'Wolf', 'Hawk', 'Tiger', 'Eagle', 'Ninja', 'Hero', 'Ace', 'Pro', 'King'];

function randomNickname() {
  const a = NICK_PARTS[Math.floor(Math.random() * NICK_PARTS.length)];
  const b = NICK_SUFFIX[Math.floor(Math.random() * NICK_SUFFIX.length)];
  return `${a}${b}${Math.floor(Math.random() * 90) + 10}`;
}

const T = {
  en: {
    pinLabel: 'Game PIN',
    nickLabel: 'Nickname',
    enter: 'Enter',
    joining: 'Joining…',
    back: '← Back',
    home: '← Back to portals',
    lang: 'العربية',
    pinIncomplete: 'Enter the full 6-digit game PIN.',
    noActiveGame: 'No active game with this PIN yet. Ask your host to start, then try again.',
    nickRequired: 'Enter a nickname (at least 2 characters).',
    nickTaken: 'This nickname is already taken in this game. Pick a different one.',
    generate: 'Random name',
    waiting: 'Enter the PIN from your host when the game starts.',
  },
  ar: {
    pinLabel: 'رمز اللعبة',
    nickLabel: 'الاسم المستعار',
    enter: 'دخول',
    joining: 'جاري الانضمام…',
    back: '→ رجوع',
    home: '→ العودة للبوابات',
    lang: 'English',
    pinIncomplete: 'أدخل رمز اللعبة المكون من 6 أرقام.',
    noActiveGame: 'لا توجد لعبة نشطة بهذا الرمز بعد. اطلب من المضيف البدء ثم حاول مرة أخرى.',
    nickRequired: 'أدخل اسماً مستعاراً (حرفان على الأقل).',
    nickTaken: 'هذا الاسم مستخدم بالفعل في هذه اللعبة. اختر اسماً آخر.',
    generate: 'اسم عشوائي',
    waiting: 'أدخل الرمز من المضيف عند بدء اللعبة.',
  },
};

export default function ScoraChallengeJoinView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLangParam = searchParams.get('lang');
  const [lang, setLang] = useState(initialLangParam === 'ar' ? 'ar' : 'en');
  // Tracks whether the player picked a language themselves (URL param or toggle),
  // so the game's default language only applies when they haven't.
  const [langTouched, setLangTouched] = useState(initialLangParam === 'ar' || initialLangParam === 'en');
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [sessionPreview, setSessionPreview] = useState(null);
  const [sessionSettings, setSessionSettings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Synchronous re-entry guard: React state (loading) updates async, so rapid
  // double clicks/submits could fire joinQuizSession twice and create duplicates.
  const joiningRef = useRef(false);
  const t = T[lang];

  useEffect(() => {
    const p = searchParams.get('pin');
    if (p) setPin(p.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH));
  }, [searchParams]);

  const handlePinStep = async (e) => {
    e.preventDefault();
    setError('');
    const code = pin.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH);
    if (code.length !== QUIZ_PIN_LENGTH) {
      setError(t.pinIncomplete);
      return;
    }
    setLoading(true);
    try {
      const session = await getQuizSessionByPin(code);
      if (!session) {
        setError(t.noActiveGame);
        return;
      }
      const settings = normalizeQuizSettings(session.settings);
      setSessionPreview(session);
      setSessionSettings(settings);
      setPin(code);
      if (!langTouched && (settings.defaultLanguage === 'ar' || settings.defaultLanguage === 'en')) {
        setLang(settings.defaultLanguage);
      }
      setStep(2);
      if (settings.nicknameGenerator && !nickname.trim()) {
        setNickname(randomNickname());
      }
    } catch {
      setError(t.noActiveGame);
    } finally {
      setLoading(false);
    }
  };

  const doJoin = async () => {
    if (!sessionPreview || joiningRef.current) return;
    const nick = nickname.trim();
    if (nick.length < 2) {
      setError(t.nickRequired);
      return;
    }
    joiningRef.current = true;
    setLoading(true);
    setError('');
    try {
      // If this device already joined this session, reuse the same player
      // instead of creating a duplicate entry.
      let existingPlayerId = null;
      try { existingPlayerId = sessionStorage.getItem(`quiz_player_${sessionPreview.id}`); } catch { /* ignore */ }
      const joined = await joinQuizSession(sessionPreview.id, nick, { existingPlayerId });
      const playerId = joined.playerId;
      try {
        // On reconnect keep the original nickname so answers match the player record.
        sessionStorage.setItem(`quiz_nick_${sessionPreview.id}`, joined.reconnected ? joined.nickname : nick);
        sessionStorage.setItem(`quiz_player_${sessionPreview.id}`, playerId);
      } catch { /* ignore */ }
      // The player's own choice (toggle or ?lang= param) always wins; the game's
      // default language only applies when the player never picked one.
      const settings = normalizeQuizSettings(sessionPreview.settings);
      const playLang = langTouched
        ? lang
        : (settings.defaultLanguage === 'ar' || settings.defaultLanguage === 'en' ? settings.defaultLanguage : lang);
      router.push(`${scoraChallengePlayPath(sessionPreview.id)}?playerId=${playerId}&lang=${playLang}`);
      // Keep the guard locked after success — navigation is in progress and any
      // extra click must not create another player.
    } catch (err) {
      joiningRef.current = false;
      setError(err.code === 'NICKNAME_TAKEN' ? t.nickTaken : (err.message || t.noActiveGame));
      setLoading(false);
    }
  };

  const handleNickStep = async (e) => {
    e.preventDefault();
    await doJoin();
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setSessionPreview(null);
    setSessionSettings(null);
  };

  const showGenerator = sessionSettings?.nicknameGenerator;

  return (
    <div className="relative min-h-dvh flex flex-col mobile-page-shell" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => { setLangTouched(true); setLang(lang === 'en' ? 'ar' : 'en'); }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
      >
        {t.lang}
      </button>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-4 py-10 sm:py-16 overflow-y-auto">
        <div className="text-center mb-10 md:mb-12 space-y-3">
          <img
            src={SCORA_CHALLENGE_LOGO_SRC}
            alt="SCORA Challenge"
            className="mx-auto h-20 sm:h-24 md:h-28 w-auto max-w-[min(100%,22rem)] object-contain rounded-xl"
          />
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            {step === 1 ? (lang === 'ar' ? 'انضم للعبة' : 'Join game') : t.nickLabel}
          </h1>
          {step === 1 && (
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">{t.waiting}</p>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handlePinStep} className="w-full max-w-md space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH))}
                className="w-full bg-black px-4 py-6 md:py-7 text-center text-2xl md:text-3xl font-black text-white tracking-[0.35em] placeholder:text-zinc-600 placeholder:tracking-normal placeholder:text-lg border-0 outline-none focus:ring-0"
                inputMode="numeric"
                placeholder={t.pinLabel}
                autoComplete="off"
                autoFocus
                aria-label={t.pinLabel}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm md:text-base font-black uppercase tracking-widest transition-colors"
              >
                {loading ? t.joining : t.enter}
              </button>
            </div>
            {error && (
              <p className="text-center text-amber-400 text-xs font-bold leading-relaxed px-2">{error}</p>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-center text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest py-2"
            >
              {t.home}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNickStep} className="w-full max-w-md space-y-4">
            <p className="text-center text-2xl font-black text-blue-400 tracking-[0.35em]">{pin}</p>
            <div className="rounded-[2rem] border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between px-5 pt-4">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t.nickLabel}</span>
                {showGenerator && (
                  <button
                    type="button"
                    onClick={() => setNickname(randomNickname())}
                    className="text-[9px] font-black uppercase text-orange-400 hover:text-orange-300"
                  >
                    {t.generate}
                  </button>
                )}
              </div>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="w-full bg-black px-4 py-6 md:py-7 text-center text-xl md:text-2xl font-bold text-white placeholder:text-zinc-600 border-0 outline-none focus:ring-0"
                placeholder={t.nickLabel}
                autoComplete="nickname"
                autoFocus
                aria-label={t.nickLabel}
              />
              <button
                type="submit"
                disabled={loading || nickname.trim().length < 2}
                className="w-full py-4 md:py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm md:text-base font-black uppercase tracking-widest transition-colors"
              >
                {loading ? t.joining : t.enter}
              </button>
            </div>
            {error && (
              <p className="text-center text-amber-400 text-xs font-bold leading-relaxed px-2">{error}</p>
            )}
            <button
              type="button"
              onClick={goBack}
              className="w-full text-center text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest py-2"
            >
              {t.back}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
