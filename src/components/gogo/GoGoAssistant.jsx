'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, MessageCircle, Mic, MicOff, Minus, Send, ThumbsDown, ThumbsUp, Volume2, VolumeX, X } from 'lucide-react';
import {
  GOGO_BUBBLE,
  GOGO_CHIP_LABELS,
  resolveFlowReply,
  isValidGoGoName,
  normalizeGoGoName,
  loadGoGoVisitorName,
  saveGoGoVisitorName,
  getFlowNode,
  decorateGoGoChips,
} from '../../lib/gogoGuideFlow';
import { GOGO_SMART_CHIPS } from '../../lib/gogoGeminiContext';
import { prepareGoGoReplyPair } from '../../lib/gogoSpeechText';
import {
  resolveGoGoTraditionalTurn,
  resolveGoGoAdminQaTurn,
  resolveGoGoLearnedTurn,
  resolveGoGoSafeFallback,
} from '../../lib/gogoRouter';
import {
  createGoGoRecognizer,
  ensureMicrophonePermission,
  getGoGoVoiceMuted,
  isSpeechRecognitionSupported,
  setGoGoVoiceMuted,
  speakGoGoText,
  stopGoGoSpeech,
} from '../../lib/gogoVoice';
import {
  GOGO_POSE_HOLD_MS,
  poseClassFor,
} from '../../lib/gogoGestures';
import {
  buildGoGoStateTimeline,
  parseGoGoStateTaggedText,
  poseFromGoGoState,
  stripGoGoStateTags,
} from '../../lib/gogoStateTags';
import {
  buildLearningPromptHints,
} from '../../lib/gogoLearning';
import {
  getOrCreateGoGoVisitorId,
  getGoGoLearnedEntries,
  getPublishedGoGoQaEntries,
  lookupGoGoProductAnswer,
  loadGoGoChatLocal,
  markGoGoLearnedWeak,
  recordGoGoPositiveFeedback,
  saveGoGoChat,
  upsertGoGoProductFact,
} from '../../services/gogoService';
import { findGoGoProduct, getGsmArenaConfirmReply, isGsmArenaSourceQuestion } from '../../lib/gogoSamsungProducts';
import { assistantDisplayName } from '../../lib/gogoIdentity';
import {
  listAnnouncements,
  listProgressForUser,
  listPublishedConsultants,
  retrieveConsultantAnswer,
} from '../../services/consultantService';
import { formatGoGoAnnouncement } from '../../lib/consultants/retrieval';

const SPRITE_BY_POSE = {
  idle: '/gogo/idle.png?v=gogo4',
  walk: '/gogo/walk-a.png?v=gogo4',
  walkto: '/gogo/walk-b.png?v=gogo4',
  wave: '/gogo/wave.png?v=gogo4',
  welcome: '/gogo/welcome.png?v=gogo4',
  speak: '/gogo/speak.png?v=gogo4',
  think: '/gogo/think.png?v=gogo4',
  point: '/gogo/point.png?v=gogo4',
  bye: '/gogo/bye.png?v=gogo4',
  nod: '/gogo/success.png?v=gogo4',
  typing: '/gogo/typing.png?v=gogo4',
  explaining: '/gogo/explaining.png?v=gogo4',
  success: '/gogo/success.png?v=gogo4',
  empathetic: '/gogo/empathetic.png?v=gogo4',
  error: '/gogo/error.png?v=gogo4',
  listening: '/gogo/listening.png?v=gogo4',
  celebrate: '/gogo/celebrate.png?v=gogo4',
};
const SPRITE_FALLBACK = '/gogo/idle.png?v=gogo4';
const STORAGE_LANG = 'gogo_lang';

const ACTION_TARGET = {
  goto_pqa: 'pqa',
  goto_tcs: 'tcs',
  goto_search: 'search',
  goto_feedback: 'feedback',
  goto_survey: 'survey',
  goto_employee_dashboard: 'knowledge',
  goto_knowledge: 'knowledge',
};

const GUIDE_LINES = {
  goto_pqa: {
    en: { think: 'Thinking… walking you to PQA.', point: 'Point here — tap PQA.' },
    ar: { think: 'لحظة… سأرافقك إلى بي كيو اي.', point: 'هنا — اضغط على بي كيو اي.' },
  },
  goto_tcs: {
    en: { think: 'Thinking… guiding you to TCS.', point: 'Point here — tap TCS.' },
    ar: { think: 'لحظة… سأرافقك إلى تي سي اس.', point: 'هنا — اضغط على تي سي اس.' },
  },
  goto_search: {
    en: { think: 'Opening Search…', point: 'Point here — Search tab.' },
    ar: { think: 'أفتح البحث…', point: 'هنا — تبويب البحث.' },
  },
  goto_employee_dashboard: {
    en: { think: 'Opening My Knowledge…', point: 'Here — My Knowledge and your tips.' },
    ar: { think: 'أفتح لوحة المعرفة…', point: 'هنا — لوحة المعرفة والنصائح.' },
  },
  goto_knowledge: {
    en: { think: 'Opening My Knowledge…', point: 'Here — My Knowledge and your tips.' },
    ar: { think: 'أفتح لوحة المعرفة…', point: 'هنا — لوحة المعرفة والنصائح.' },
  },
  goto_feedback: {
    en: { think: 'Opening Feedback…', point: 'Point here — Feedback.' },
    ar: { think: 'أفتح الملاحظات…', point: 'هنا — الملاحظات.' },
  },
  goto_survey: {
    en: { think: 'Opening the Academy survey…', point: 'Point here — Academy survey.' },
    ar: { think: 'أفتح استبيان الأكاديمية…', point: 'هنا — استبيان الأكاديمية.' },
  },
};

function stamp(role, text, extra = {}) {
  let t = String(text || '');
  if (role === 'gogo' && /[\u0600-\u06FF]/.test(t)) {
    t = prepareGoGoReplyPair(t, 'ar').display;
  }
  const spoken = extra.spoken != null ? String(extra.spoken) : undefined;
  return { role, text: t, at: new Date().toISOString(), ...extra, ...(spoken != null ? { spoken } : {}) };
}

async function askGoGoDisabled(lang) {
  return {
    fallback: true,
    disabled: true,
    code: 'ai_disabled',
    reply:
      lang === 'ar'
        ? 'المساعد الذكي غير متاح مؤقتاً. استخدم الأزرار الإرشادية للمتابعة.'
        : 'AI Assistant temporarily unavailable. Please use the guided menu chips to continue.',
  };
}

const MX_TIP_POPUP_KEY = 'gogo_mx_tip_popup_v1';
const INCOMPLETE_TIP_KEY = 'gogo_incomplete_tip_v1';

const DOCK_NUDGE_COPY = {
  mx_new: {
    en: 'Check new technical consultant in your profile right now',
    ar: 'تحقق من الاستشارة الفنية الجديدة في ملفك الآن',
  },
  incomplete: {
    en: 'You still have a tip to finish in My Knowledge',
    ar: 'لسه عندك نصيحة فنية محتاج تخلّصها في المعرفة',
  },
  complete: {
    en: 'Great work — your tip is recorded',
    ar: 'شغل ممتاز — النصيحة اتسجّلت',
  },
};

/** Call after employee login so GoGo can nudge again on profile. */
export function resetGoGoMxTipPopup() {
  try {
    sessionStorage.removeItem(MX_TIP_POPUP_KEY);
    sessionStorage.removeItem(INCOMPLETE_TIP_KEY);
  } catch {
    /* ignore */
  }
}

async function findIncompleteConsultantId(uid, productLine) {
  if (!uid) return null;
  try {
    const [pubs, prog, anns] = await Promise.all([
      listPublishedConsultants({ productLine: productLine || null }),
      listProgressForUser(uid),
      listAnnouncements({ activeOnly: true, max: 10 }),
    ]);
    const passed = new Set(
      (prog || []).filter((p) => p?.bestResult === 'passed').map((p) => p.consultantId),
    );
    const pendingAnn = (anns || []).find((a) => a?.mustComplete && a.consultantId && !passed.has(a.consultantId));
    if (pendingAnn?.consultantId) return pendingAnn.consultantId;
    const pendingPub = (pubs || []).find((c) => c?.id && !passed.has(c.id));
    return pendingPub?.id || null;
  } catch {
    return null;
  }
}

/**
 * Click-to-chat guided assistant + voice I/O.
 * Smart Gemini chat is disabled (security / cost hardening).
 */
export default function GoGoAssistant({
  onNavigate,
  currentView = '',
  hidden = false,
  onOpenChange,
  employeeLoggedIn = false,
  employeeProductLine = '',
  employeeUid = '',
  tipCompleteNonce = 0,
}) {
  const reduceMotion = useReducedMotion();
  const [lang, setLang] = useState('en');
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [dockNudge, setDockNudge] = useState(null);
  const [pose, setPose] = useState('walk');
  const [dock, setDock] = useState('left');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chips, setChips] = useState([]);
  const [visitorName, setVisitorName] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | ask_name | chatting
  const [guideHint, setGuideHint] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  const [visitorId, setVisitorId] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micHint, setMicHint] = useState('');
  const [learnedEntries, setLearnedEntries] = useState([]);
  const [adminQaEntries, setAdminQaEntries] = useState([]);
  const listRef = useRef(null);
  const micFinalSentRef = useRef(false);
  const guideTimersRef = useRef([]);
  const pendingGuideRef = useRef(null);
  const pendingConsultantIdRef = useRef(null);
  const saveTimerRef = useRef(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const recognizerRef = useRef(null);
  const voiceAskRef = useRef(false);
  const messagesRef = useRef(messages);
  const langRef = useRef(lang);
  const nameRef = useRef('');
  const mountedRef = useRef(false);
  const employeeLoggedInRef = useRef(employeeLoggedIn);
  const lastCompleteNonceRef = useRef(0);

  messagesRef.current = messages;
  langRef.current = lang;
  nameRef.current = visitorName;
  employeeLoggedInRef.current = employeeLoggedIn;

  const flowOpts = () => ({ employeeLoggedIn: employeeLoggedInRef.current });

  const applyChips = (raw) => {
    setChips(decorateGoGoChips(raw || [], flowOpts()));
  };

  const flowReply = (nodeId, langOverride, nameOverride) => (
    resolveFlowReply(
      nodeId,
      langOverride || langRef.current,
      nameOverride != null ? nameOverride : nameRef.current,
      flowOpts(),
    )
  );

  const clearGuideTimers = () => {
    guideTimersRef.current.forEach((id) => clearTimeout(id));
    guideTimersRef.current = [];
  };

  const schedule = (fn, ms) => {
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      fn();
    }, ms);
    guideTimersRef.current.push(id);
    return id;
  };

  const persistChat = useCallback((nextMessages, nextLang, nextName) => {
    const id = visitorId;
    if (!id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveGoGoChat(id, {
        messages: nextMessages || messagesRef.current,
        lang: nextLang || langRef.current,
        visitorName: nextName || nameRef.current || '',
      });
    }, 450);
  }, [visitorId]);

  const speakReply = useCallback(async (text, {
    force = false,
    lang: langOverride,
    gesture = 'speak',
    segments: segmentsOverride = null,
    initialState = null,
    spoken: spokenOverride = null,
  } = {}) => {
    const parsed = segmentsOverride
      ? {
        displayText: stripGoGoStateTags(text),
        initialState: initialState || segmentsOverride[0]?.state || 'explaining',
        segments: segmentsOverride,
      }
      : parseGoGoStateTaggedText(text);
    const speakLangEarly = langOverride || langRef.current;
    const rawClean = spokenOverride
      || parsed.segments?.[0]?.spoken
      || parsed.displayText
      || stripGoGoStateTags(text);
    const clean = speakLangEarly === 'ar'
      ? prepareGoGoReplyPair(rawClean, 'ar').spoken
      : String(rawClean || '');
    const startPose = initialState
      ? poseFromGoGoState(initialState)
      : (parsed.segments?.length
        ? poseFromGoGoState(parsed.initialState)
        : (gesture === 'wave' || gesture === 'welcome' || gesture === 'point' ? gesture : 'speak'));

    const timeline = buildGoGoStateTimeline(
      parsed.segments?.length ? parsed.segments : [{ state: 'explaining', text: clean }],
    );

    const runPoseTimeline = () => {
      timeline.forEach((beat) => {
        schedule(() => {
          setPose(beat.pose);
        }, beat.atMs);
      });
    };

    if (!force && voiceMuted && !voiceAskRef.current) {
      if (!mountedRef.current) return;
      setPose(startPose);
      runPoseTimeline();
      const last = timeline[timeline.length - 1];
      schedule(() => setPose('idle'), (last?.atMs || 0) + 900);
      return;
    }

    const muted = force ? false : voiceMuted && !voiceAskRef.current;
    const speakLang = langOverride || langRef.current;
    await speakGoGoText(clean, {
      lang: speakLang,
      muted,
      onStart: () => {
        if (!mountedRef.current) return;
        setSpeaking(true);
        setPose(startPose);
        runPoseTimeline();
      },
      onEnd: () => {
        if (!mountedRef.current) return;
        setSpeaking(false);
        setPose('idle');
        voiceAskRef.current = false;
      },
    });
  }, [voiceMuted]);

  const playGesture = useCallback((nextPose, holdMs) => {
    if (!mountedRef.current) return;
    setPose(nextPose);
    const ms = holdMs ?? GOGO_POSE_HOLD_MS[nextPose];
    if (!ms) return;
    schedule(() => {
      setPose((current) => (current === nextPose ? 'idle' : current));
    }, ms);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    const id = getOrCreateGoGoVisitorId();
    if (cancelled) return undefined;
    setVisitorId(id);
    setMicSupported(isSpeechRecognitionSupported());
    setVoiceMuted(getGoGoVoiceMuted());

    try {
      const savedLang = sessionStorage.getItem(STORAGE_LANG);
      if (savedLang === 'ar' || savedLang === 'en') setLang(savedLang);
      else if (typeof navigator !== 'undefined' && /^ar\b/i.test(navigator.language || '')) setLang('ar');
    } catch { /* ignore */ }

    const savedName = loadGoGoVisitorName();
    const localChat = loadGoGoChatLocal(id);
    if (savedName) {
      setVisitorName(savedName);
      nameRef.current = savedName;
    } else if (localChat?.visitorName) {
      setVisitorName(localChat.visitorName);
      nameRef.current = localChat.visitorName;
      saveGoGoVisitorName(localChat.visitorName);
    }

    if (localChat?.messages?.length && (savedName || localChat.visitorName)) {
      setMessages(
        localChat.messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'gogo',
          text: String(m.text || ''),
          denied: !!m.denied,
          learnable: !!m.learnable,
          feedback: m.feedback || null,
          question: m.question || null,
          expression: m.expression || null,
          source: m.source || null,
          productName: m.productName || null,
          at: m.at,
        })),
      );
      if (localChat.lang === 'ar' || localChat.lang === 'en') setLang(localChat.lang);
      setPhase('chatting');
      const menu = flowReply('main_menu', localChat.lang === 'ar' ? 'ar' : 'en', savedName || localChat.visitorName);
      applyChips(menu.chips);
    }

    void getGoGoLearnedEntries().then((rows) => {
      if (!cancelled && Array.isArray(rows)) setLearnedEntries(rows);
    });
    void getPublishedGoGoQaEntries().then((rows) => {
      if (!cancelled && Array.isArray(rows)) setAdminQaEntries(rows);
    });

    setReady(true);
    return () => {
      cancelled = true;
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden || !ready) return undefined;
    const t1 = setTimeout(() => setEntered(true), 80);
    const t2 = setTimeout(() => setPose('welcome'), 750);
    const t3 = setTimeout(() => {
      setPose('idle');
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hidden, ready]);

  useEffect(() => {
    if (hidden || open) return undefined;
    setPose('idle');
    return undefined;
  }, [hidden, open]);

  /** One dock nudge at a time: tip complete → unfinished tip → MX new tip. */
  useEffect(() => {
    if (hidden || !ready || open) return undefined;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (cancelled) return;

        if (tipCompleteNonce && tipCompleteNonce !== lastCompleteNonceRef.current) {
          lastCompleteNonceRef.current = tipCompleteNonce;
          setDockNudge({ kind: 'complete' });
          setShowBubble(true);
          setPose('celebrate');
          schedule(() => setPose('wave'), 1400);
          schedule(() => setPose('idle'), 3000);
          return;
        }

        if (!employeeLoggedIn || !employeeUid) return;

        let incompleteDismissed = false;
        let mxDismissed = false;
        try {
          incompleteDismissed = sessionStorage.getItem(INCOMPLETE_TIP_KEY) === '1';
          mxDismissed = sessionStorage.getItem(MX_TIP_POPUP_KEY) === '1';
        } catch {
          /* ignore */
        }

        const incompleteId = await findIncompleteConsultantId(employeeUid, employeeProductLine);
        if (cancelled) return;
        if (incompleteId && !incompleteDismissed) {
          pendingConsultantIdRef.current = incompleteId;
          setDockNudge({ kind: 'incomplete' });
          setShowBubble(true);
          setPose('wave');
          schedule(() => setPose('point'), 900);
          schedule(() => setPose('idle'), 2800);
          return;
        }

        const line = String(employeeProductLine || '').toLowerCase();
        if (line !== 'mx' || mxDismissed) return;

        try {
          const anns = await listAnnouncements({ activeOnly: true, max: 10 });
          const mxAnns = (anns || []).filter((a) => {
            const aud = String(a?.audience || 'all').toLowerCase();
            return aud === 'mx' || aud === 'all';
          });
          if (mxAnns.length) pendingConsultantIdRef.current = mxAnns[0].consultantId || null;
        } catch {
          /* still show MX nudge */
        }
        if (cancelled) return;
        setDockNudge({ kind: 'mx_new' });
        setShowBubble(true);
        setPose('wave');
        schedule(() => setPose('point'), 900);
        schedule(() => setPose('idle'), 2800);
      })();
    }, 1600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hidden, ready, open, employeeLoggedIn, employeeUid, employeeProductLine, tipCompleteNonce]);

  const dismissDockNudge = useCallback(() => {
    setDockNudge((prev) => {
      try {
        if (prev?.kind === 'incomplete') sessionStorage.setItem(INCOMPLETE_TIP_KEY, '1');
        if (prev?.kind === 'mx_new') sessionStorage.setItem(MX_TIP_POPUP_KEY, '1');
      } catch {
        /* ignore */
      }
      return null;
    });
    setShowBubble(false);
  }, []);

  useEffect(() => {
    setChips((prev) => decorateGoGoChips(prev, { employeeLoggedIn }));
  }, [employeeLoggedIn]);

  useEffect(() => {
    onOpenChangeRef.current?.(open);
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => () => {
    clearGuideTimers();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    recognizerRef.current?.abort?.();
    stopGoGoSpeech();
  }, []);

  const placeSpotlightOnTarget = useCallback((targetKey, pointText) => {
    const el =
      document.querySelector(`[data-gogo-target="${targetKey}"]`) ||
      document.querySelector(`[data-gogo-target="${targetKey}-pick"]`);
    if (!el) {
      setSpotlight(null);
      setGuideHint({
        text: pointText,
        top: Math.max(80, window.innerHeight * 0.35),
        left: Math.min(window.innerWidth - 180, window.innerWidth * 0.55),
      });
      return false;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    const rect = el.getBoundingClientRect();
    const pad = 10;
    setSpotlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
    setGuideHint({
      text: pointText,
      top: Math.max(16, rect.top - 48),
      left: Math.min(window.innerWidth - 170, Math.max(12, rect.left + rect.width / 2 - 70)),
    });
    return true;
  }, []);

  useEffect(() => {
    const pending = pendingGuideRef.current;
    if (!pending) return undefined;
    const { action, pointText } = pending;
    const targetKey = ACTION_TARGET[action];
    if (!targetKey) return undefined;
    const tryPlace = () => {
      if (placeSpotlightOnTarget(targetKey, pointText)) {
        setPose('point');
        setDock('guide');
      }
    };
    schedule(tryPlace, 350);
    schedule(tryPlace, 900);
    schedule(() => {
      setPose('idle');
      pendingGuideRef.current = null;
    }, 7000);
    schedule(() => {
      setSpotlight(null);
      setGuideHint(null);
      setDock('left');
    }, 9000);
    return () => {
      clearGuideTimers();
    };
  }, [currentView, placeSpotlightOnTarget]);

  const rtl = lang === 'ar';
  const labels = GOGO_CHIP_LABELS[lang] || GOGO_CHIP_LABELS.en;

  const poseClass = useMemo(
    () => poseClassFor({ entered, listening, speaking, pose }),
    [entered, listening, speaking, pose],
  );

  const spriteSrc = useMemo(() => {
    if (listening) return SPRITE_BY_POSE.listening;
    if (pose === 'think' || busy) return SPRITE_BY_POSE.think;
    if (
      pose === 'point'
      || pose === 'explaining'
      || pose === 'success'
      || pose === 'empathetic'
      || pose === 'typing'
      || pose === 'wave'
      || pose === 'welcome'
      || pose === 'error'
      || pose === 'celebrate'
      || pose === 'listening'
    ) {
      return SPRITE_BY_POSE[pose] || SPRITE_FALLBACK;
    }
    if (speaking) return SPRITE_BY_POSE.speak;
    return SPRITE_BY_POSE[pose] || SPRITE_FALLBACK;
  }, [listening, speaking, pose, busy]);

  const showThinkCue = listening || pose === 'think' || busy || pose === 'typing';
  const showSpeakCue = speaking && !listening && pose !== 'point' && pose !== 'empathetic';
  const showPointCue = pose === 'point' || pose === 'explaining';

  const persistLang = (next) => {
    setLang(next);
    try {
      sessionStorage.setItem(STORAGE_LANG, next);
    } catch { /* ignore */ }
  };

  const dismissGuide = () => {
    clearGuideTimers();
    pendingGuideRef.current = null;
    setSpotlight(null);
    setGuideHint(null);
    setDock('left');
    setPose('idle');
  };

  const runGuidedAction = useCallback((action) => {
    if (!action || !onNavigate) return;
    clearGuideTimers();
    const L = langRef.current === 'ar' ? 'ar' : 'en';

    if (typeof action === 'string' && action.startsWith('goto_consultant:')) {
      const think =
        L === 'ar' ? 'أفتح الاستشارة الفنية…' : 'Opening the technical consultant…';
      setPose('think');
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', think, { expression: 'think' })];
        persistChat(next, L);
        return next;
      });
      schedule(() => {
        onNavigate(action);
        setPose('success');
      }, 500);
      return;
    }

    const lines = GUIDE_LINES[action]?.[L] || {
      think: L === 'ar' ? 'بلفكّر…' : 'Thinking…',
      point: L === 'ar' ? 'أشر هنا' : 'Point here',
    };
    setPose('think');
    setMessages((prev) => {
      const next = [...prev, stamp('gogo', lines.think, { expression: 'think' })];
      persistChat(next, L);
      return next;
    });
    schedule(() => {
      setPose('walkto');
      setDock('guide');
    }, 800);
    schedule(() => {
      pendingGuideRef.current = { action, pointText: lines.point };
      onNavigate(action);
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', lines.point, { expression: 'point' })];
        persistChat(next, L);
        return next;
      });
      setPose('point');
      void speakReply(lines.point);
    }, 1600);
  }, [onNavigate, persistChat, speakReply]);

  const appendFlow = (nodeId, userLabel) => {
    const L = langRef.current;
    const name = nameRef.current;
    const result = flowReply(nodeId, L, name);
    const expression = result.expression || null;
    const isGeorge = nodeId === 'george_samir';
    const pair = prepareGoGoReplyPair(result.reply, L);
    const spoken = result.spoken
      ? prepareGoGoReplyPair(result.spoken, L).spoken
      : pair.spoken;
    setMessages((prev) => {
      const next = [
        ...prev,
        ...(userLabel ? [stamp('user', userLabel)] : []),
        stamp('gogo', pair.display, {
          expression: expression || undefined,
          learnable: !isGeorge,
          question: userLabel || null,
          spoken,
          source: 'guide',
          mode: 'traditional',
        }),
      ];
      persistChat(next, L, name);
      return next;
    });
    applyChips(result.chips || []);
    setPhase(nodeId === 'ask_name' ? 'ask_name' : 'chatting');
    if (expression) {
      setPose(poseFromGoGoState(expression) || 'speak');
      void speakReply(pair.display, {
        gesture: expression === 'wave' ? 'wave' : 'speak',
        spoken,
        initialState: expression,
      });
    } else {
      void speakReply(pair.display, { spoken });
    }
    if (result.action) runGuidedAction(result.action);
  };

  const applyClientActions = (actions) => {
    if (!Array.isArray(actions) || !actions.length) return;
    for (const item of actions) {
      if (item?.type === 'navigate' && item.action) {
        runGuidedAction(item.action);
      }
    }
  };

  const sendSmartMessage = async (text, { fromVoice = false } = {}) => {
    if (!text || busy) return;
    if (phase === 'ask_name' || !nameRef.current) {
      acceptName(text);
      return;
    }

    const traditional = resolveGoGoTraditionalTurn(text, lang);
    // Safety / org answers still win immediately. Guided-menu free-text does NOT —
    // published admin Q&A must be able to teach over hardcoded guide copy.
    const traditionalIsGuard =
      !!traditional &&
      (traditional.denied ||
        traditional.mode === 'guard' ||
        traditional.source === 'guard' ||
        traditional.source === 'samsung_source_confirm' ||
        String(traditional.source || '').startsWith('cs_org'));

    if (traditional && traditionalIsGuard) {
      if (traditional.flowNodeId) {
        appendFlow(traditional.flowNodeId, text);
        return;
      }
      setMessages((prev) => {
        const next = [
          ...prev,
          stamp('user', text),
          stamp('gogo', traditional.reply, {
            denied: !!traditional.denied,
            source: traditional.source,
            mode: traditional.mode,
            learnable: !!traditional.learnable,
            question: traditional.question || text,
            expression: traditional.expression,
            spoken: traditional.spoken,
          }),
        ];
        persistChat(next, lang, nameRef.current);
        return next;
      });
      applyChips(traditional.chips || GOGO_SMART_CHIPS);
      if (traditional.expression) setPose(poseFromGoGoState(traditional.expression) || 'idle');
      void speakReply(traditional.reply, {
        force: fromVoice,
        initialState: traditional.expression || null,
        spoken: traditional.spoken,
        segments: traditional.expression
          ? [{ state: traditional.expression, text: traditional.reply, spoken: traditional.spoken }]
          : null,
      });
      return;
    }

    try {
      setBusy(true);
      setPose('think');
      // Published admin catalog beats hardcoded guide free-text + learned memory.
      // Re-read catalog so an admin edit is picked up without reloading the page.
      let catalog = adminQaEntries;
      try {
        const fresh = await getPublishedGoGoQaEntries();
        if (Array.isArray(fresh)) {
          catalog = fresh;
          setAdminQaEntries(fresh);
        }
      } catch {
        /* keep in-memory catalog */
      }
      const adminQa = resolveGoGoAdminQaTurn(text, lang, catalog);
      if (adminQa?.mode === 'admin_qa' && adminQa.reply) {
        const pair = prepareGoGoReplyPair(adminQa.reply, lang);
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', pair.display, {
              source: 'admin_qa',
              mode: 'admin_qa',
              learnable: false,
              question: text,
              expression: adminQa.expression,
              spoken: adminQa.spoken || pair.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(adminQa.chips || GOGO_SMART_CHIPS);
        setPose(poseFromGoGoState(adminQa.expression) || 'success');
        void speakReply(pair.display, {
          force: fromVoice,
          initialState: adminQa.expression,
          spoken: adminQa.spoken || pair.spoken,
        });
        return;
      }

      // No admin hit — fall through to guided free-text / org-style traditional replies.
      if (traditional) {
        if (traditional.flowNodeId) {
          appendFlow(traditional.flowNodeId, text);
          return;
        }
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', traditional.reply, {
              denied: !!traditional.denied,
              source: traditional.source,
              mode: traditional.mode,
              learnable: !!traditional.learnable,
              question: traditional.question || text,
              expression: traditional.expression,
              spoken: traditional.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(traditional.chips || GOGO_SMART_CHIPS);
        if (traditional.expression) setPose(poseFromGoGoState(traditional.expression) || 'idle');
        void speakReply(traditional.reply, {
          force: fromVoice,
          initialState: traditional.expression || null,
          spoken: traditional.spoken,
          segments: traditional.expression
            ? [{ state: traditional.expression, text: traditional.reply, spoken: traditional.spoken }]
            : null,
        });
        return;
      }

      // Learned memory before any predictive / library guess.
      const learnedEarly = resolveGoGoLearnedTurn(text, lang, learnedEntries);
      if (learnedEarly.mode === 'learned') {
        const pair = prepareGoGoReplyPair(learnedEarly.reply, lang);
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', pair.display, {
              source: 'learned',
              mode: 'traditional_learned',
              learnable: true,
              question: text,
              expression: learnedEarly.expression,
              spoken: learnedEarly.spoken || pair.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(learnedEarly.chips || GOGO_SMART_CHIPS);
        setPose(poseFromGoGoState(learnedEarly.expression) || 'success');
        void speakReply(pair.display, {
          force: fromVoice,
          initialState: learnedEarly.expression,
          spoken: learnedEarly.spoken || pair.spoken,
        });
        return;
      }
    } catch {
      /* fall through */
    } finally {
      setBusy(false);
    }

    try {
      setBusy(true);
      setPose('think');
      const { retrieveFromSamsungKb } = await import('../../services/samsungProductKbService');
      const kb = await retrieveFromSamsungKb(text, { lang });
      if (kb?.hit && kb.answer) {
        const pair = prepareGoGoReplyPair(kb.answer, lang);
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', pair.display, {
              source: 'samsung_kb',
              mode: 'traditional',
              learnable: false,
              question: text,
              productName: kb.product?.marketing_name || null,
              expression: 'explaining',
              dataStatus: kb.product?.DATA_STATUS || null,
              spoken: pair.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(GOGO_SMART_CHIPS);
        setPose('explaining');
        schedule(() => setPose('success'), 900);
        void speakReply(pair.display, {
          force: fromVoice,
          initialState: 'explaining',
          spoken: pair.spoken,
        });
        return;
      }
      if (kb?.reason === 'unverified_record' || kb?.reason === 'record_without_specs') {
        const pair = prepareGoGoReplyPair(kb.unavailable_message, lang);
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', pair.display, {
              source: 'samsung_kb_unavailable',
              mode: 'traditional',
              learnable: false,
              question: text,
              expression: 'thinking',
              spoken: pair.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(GOGO_SMART_CHIPS);
        setPose('think');
        void speakReply(pair.display, { force: fromVoice, initialState: 'thinking', spoken: pair.spoken });
        return;
      }
    } catch {
      /* KB optional */
    } finally {
      setBusy(false);
    }

    try {
      setBusy(true);
      setPose('think');
      if (
        /consultant|technical\s*tip|knowledge|course|استشار|نصيحة|معرفة|دورة|tip\b|bulletin/i.test(
          text,
        )
      ) {
        const hit = await retrieveConsultantAnswer(text, lang);
        if (hit?.found && hit.reply) {
          if (hit.consultant?.id) pendingConsultantIdRef.current = hit.consultant.id;
          const pair = prepareGoGoReplyPair(hit.reply, lang);
          setMessages((prev) => {
            const next = [
              ...prev,
              stamp('user', text),
              stamp('gogo', pair.display, {
                source: hit.guideOnly ? 'knowledge_coach' : 'consultant_library',
                mode: 'traditional',
                learnable: !hit.guideOnly,
                question: text,
                expression: 'explaining',
                spoken: pair.spoken,
              }),
            ];
            persistChat(next, lang, nameRef.current);
            return next;
          });
          applyChips(hit.chips || ['open_consultant', 'goto_knowledge', 'how_tip', 'main_menu']);
          setPose('explaining');
          void speakReply(pair.display, {
            force: fromVoice,
            initialState: 'explaining',
            spoken: pair.spoken,
          });
          return;
        }
        if (hit && hit.found === false && hit.reply) {
          const pair = prepareGoGoReplyPair(hit.reply, lang);
          setMessages((prev) => {
            const next = [
              ...prev,
              stamp('user', text),
              stamp('gogo', pair.display, {
                source: 'consultant_library_miss',
                mode: 'traditional',
                learnable: false,
                question: text,
                expression: 'thinking',
                spoken: pair.spoken,
              }),
            ];
            persistChat(next, lang, nameRef.current);
            return next;
          });
          applyChips(hit.chips || ['goto_knowledge', 'how_tip', 'main_menu']);
          setPose('think');
          void speakReply(pair.display, {
            force: fromVoice,
            initialState: 'thinking',
            spoken: pair.spoken,
          });
          return;
        }
      }
    } catch {
      /* fall through */
    } finally {
      setBusy(false);
    }

    try {
      setBusy(true);
      setPose('think');
      const productHit = await lookupGoGoProductAnswer(text, lang, {
        history: messagesRef.current,
      });
      if (productHit?.answer) {
        const pair = prepareGoGoReplyPair(productHit.answer, lang);
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('user', text),
            stamp('gogo', pair.display, {
              source: productHit.source || 'products_memory',
              mode: 'traditional',
              learnable: !productHit.unknown,
              question: text,
              productName: productHit.product?.name_en || null,
              expression: productHit.unknown ? 'thinking' : 'explaining',
              spoken: pair.spoken,
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
        applyChips(GOGO_SMART_CHIPS);
        setPose(productHit.unknown ? 'think' : 'explaining');
        if (!productHit.unknown) schedule(() => setPose('success'), 900);
        void speakReply(pair.display, {
          force: fromVoice,
          initialState: productHit.unknown ? 'thinking' : 'explaining',
          spoken: pair.spoken,
        });
        return;
      }
    } catch {
      /* fall through */
    } finally {
      setBusy(false);
    }

    setBusy(true);
    setPose('think');
    setMessages((prev) => {
      const next = [...prev, stamp('user', text)];
      persistChat(next, lang, nameRef.current);
      return next;
    });

    try {
      // Smart AI (Gemini) disabled — guided / learned / safe fallback only.
      const disabledAi = await askGoGoDisabled(lang);
      const fallback = resolveGoGoSafeFallback(text, lang, nameRef.current);
      const reply =
        fallback?.reply && fallback.source !== 'empty'
          ? fallback.reply
          : disabledAi.reply;
      const spoken = fallback?.spoken;
      setMessages((prev) => {
        const next = [
          ...prev,
          stamp('gogo', reply, {
            source: fallback?.source || 'ai_disabled',
            mode: 'guided_only',
            spoken,
            learnable: !!fallback?.learnable,
            denied: !!fallback?.denied,
            question: text,
          }),
        ];
        if (fallback?.extraReply) {
          next.push(stamp('gogo', fallback.extraReply, { source: 'menu_fallback', mode: 'guided_only' }));
        }
        persistChat(next, lang, nameRef.current);
        return next;
      });
      applyChips(fallback?.chips || GOGO_SMART_CHIPS);
      void speakReply(reply, { force: fromVoice, spoken });
      if (fallback?.action) runGuidedAction(fallback.action);
      setPose('idle');
    } catch {
      const fallback = resolveGoGoSafeFallback(text, lang, nameRef.current);
      if (fallback.extraReply) {
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('gogo', fallback.reply, { spoken: fallback.spoken, source: fallback.source, mode: 'fallback' }),
            stamp('gogo', fallback.extraReply, { source: 'menu_fallback', mode: 'fallback' }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
      } else {
        setMessages((prev) => {
          const next = [
            ...prev,
            stamp('gogo', fallback.reply, {
              learnable: !!fallback.learnable,
              denied: !!fallback.denied,
              question: text,
              spoken: fallback.spoken,
              source: fallback.source,
              mode: 'fallback',
            }),
          ];
          persistChat(next, lang, nameRef.current);
          return next;
        });
      }
      applyChips(fallback.chips || GOGO_SMART_CHIPS);
      void speakReply(fallback.reply, { force: fromVoice, spoken: fallback.spoken });
      if (fallback.action) runGuidedAction(fallback.action);
      setPose('idle');
    } finally {
      setBusy(false);
    }
  };

  const rateGoGoAnswer = async (messageIndex, rating) => {
    const msg = messagesRef.current[messageIndex];
    if (!msg || msg.role !== 'gogo' || !msg.learnable || msg.feedback) return;
    const question =
      msg.question ||
      [...messagesRef.current].slice(0, messageIndex).reverse().find((m) => m.role === 'user')?.text ||
      '';
    if (!question || !msg.text) return;

    setMessages((prev) => {
      const next = prev.map((m, i) => (i === messageIndex ? { ...m, feedback: rating } : m));
      persistChat(next, langRef.current, nameRef.current);
      return next;
    });

    try {
      if (rating === 'up') {
        await recordGoGoPositiveFeedback({
          question,
          answer: msg.text,
          lang: langRef.current,
          expressionUsed: msg.expression || '',
          visitorId,
          spoken: msg.spoken || prepareGoGoReplyPair(msg.text, langRef.current).spoken,
        });
        const product = findGoGoProduct(question);
        if (product) {
          await upsertGoGoProductFact({
            ...product,
            lastQuestion: question,
            lastAnswer: msg.text,
            lastLang: langRef.current,
            validated: true,
          });
        }
      } else {
        await markGoGoLearnedWeak({
          question,
          answer: msg.text,
          lang: langRef.current,
          expressionUsed: msg.expression || '',
          visitorId,
        });
      }
      const refreshed = await getGoGoLearnedEntries({ force: true });
      if (Array.isArray(refreshed)) setLearnedEntries(refreshed);
    } catch {
      /* local cache already updated by service helpers when possible */
    }
  };

  const startChatSession = () => {
    setShowBubble(false);
    setOpen(true);
    playGesture('welcome', 1800);

    const name = nameRef.current || loadGoGoVisitorName();
    if (name) {
      setVisitorName(name);
      nameRef.current = name;
      setPhase('chatting');
      if (!messagesRef.current.length) {
        const menu = flowReply('main_menu', langRef.current, name);
        const next = [stamp('gogo', menu.reply)];
        setMessages(next);
        applyChips(menu.chips);
        persistChat(next, langRef.current, name);
        void speakReply(menu.reply, { gesture: 'speak', spoken: menu.spoken ? prepareGoGoReplyPair(menu.spoken, langRef.current).spoken : undefined });
      } else {
        const menu = flowReply('main_menu', langRef.current, name);
        applyChips(menu.chips);
      }
      void (async () => {
        try {
          const anns = await listAnnouncements({ activeOnly: true, max: 5 });
          const latest = anns?.[0];
          if (!latest) return;
          const L = langRef.current === 'ar' ? 'ar' : 'en';
          const reply = formatGoGoAnnouncement(latest, L);
          pendingConsultantIdRef.current = latest.consultantId || null;
          const pair = prepareGoGoReplyPair(reply, L);
          setMessages((prev) => {
            const next = [
              ...prev,
              stamp('gogo', pair.display, {
                source: 'consultant_announce',
                expression: 'wave',
                spoken: pair.spoken,
              }),
            ];
            persistChat(next, L, nameRef.current);
            return next;
          });
          applyChips(['open_consultant', 'goto_knowledge', 'how_tip', 'main_menu']);
        } catch {
          /* optional */
        }
      })();
      return;
    }

    setPhase('ask_name');
    const ask = flowReply('ask_name', langRef.current);
    const next = [stamp('gogo', ask.reply)];
    setMessages(next);
    applyChips(ask.chips);
    persistChat(next, langRef.current, '');
    void speakReply(ask.reply, { gesture: 'wave' });
  };

  const acceptName = (rawName) => {
    if (!isValidGoGoName(rawName)) {
      const bad = flowReply('name_invalid', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('user', rawName), stamp('gogo', bad.reply)];
        persistChat(next, lang, '');
        return next;
      });
      applyChips(bad.chips);
      void speakReply(bad.reply);
      return;
    }
    const name = normalizeGoGoName(rawName);
    saveGoGoVisitorName(name);
    setVisitorName(name);
    nameRef.current = name;
    setPhase('chatting');
    const menu = flowReply('main_menu', lang, name);
    setMessages((prev) => {
      const next = [...prev, stamp('user', name), stamp('gogo', menu.reply)];
      persistChat(next, lang, name);
      return next;
    });
    applyChips(menu.chips);
    setPose('nod');
    schedule(() => setPose('welcome'), 700);
    schedule(() => setPose('idle'), 2200);
    void speakReply(menu.reply, { gesture: 'welcome', spoken: menu.spoken ? prepareGoGoReplyPair(menu.spoken, lang).spoken : undefined });
  };

  const switchLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    // Stop mic + speech BEFORE switching so EN/AR queues don't overlap
    recognizerRef.current?.abort?.();
    setListening(false);
    setMicHint('');
    stopGoGoSpeech();
    setSpeaking(false);

    // Update lang ref immediately (React setState is async — was causing Arabic with English voice)
    langRef.current = nextLang;
    persistLang(nextLang);

    // Name gate: swap the welcome message — don't stack EN + AR
    if (phase === 'ask_name' || !nameRef.current) {
      const ask = flowReply('ask_name', nextLang);
      const next = [stamp('gogo', ask.reply)];
      setMessages(next);
      applyChips([]);
      persistChat(next, nextLang, '');
      void speakReply(ask.reply, { lang: nextLang });
      return;
    }

    const menu = flowReply('main_menu', nextLang, nameRef.current);
    setMessages((prev) => {
      const next = [...prev, stamp('gogo', menu.reply)];
      persistChat(next, nextLang, nameRef.current);
      return next;
    });
    applyChips((menu.chips || []).filter((id) => id !== 'lang_toggle'));
    void speakReply(menu.reply, { lang: nextLang, spoken: menu.spoken ? prepareGoGoReplyPair(menu.spoken, nextLang).spoken : undefined });
  };

  const handleChip = (id) => {
    if (busy || id === 'lang_toggle') return;

    if (phase === 'ask_name' || !nameRef.current) {
      const need = flowReply('need_name', lang);
      setMessages((prev) => {
        const next = [...prev, stamp('gogo', need.reply)];
        persistChat(next, lang, '');
        return next;
      });
      applyChips([]);
      void speakReply(need.reply);
      return;
    }

    if (id === 'main_menu') {
      appendFlow('main_menu', labels.main_menu);
      return;
    }

    if (id === 'open_consultant') {
      const cid = pendingConsultantIdRef.current;
      if (cid) runGuidedAction(`goto_consultant:${cid}`);
      else runGuidedAction('goto_employee_dashboard');
      return;
    }

    if (id === 'goto_knowledge' || id === 'new_consultant' || id === 'goto_employee_dashboard') {
      runGuidedAction('goto_employee_dashboard');
      return;
    }

    if (id === 'how_tip') {
      appendFlow('how_tip', labels.how_tip);
      return;
    }

    if (getFlowNode(id)) {
      const label = labels[id] || id;
      // Teachable topic chips use the admin Q&A library the same way typed questions do.
      const teachableChip =
        /^(what_|who_are|who_built|scora_more|how_search|how_feedback|how_survey|cs_org|feedback|survey)/.test(
          id,
        );
      if (teachableChip) {
        void sendSmartMessage(label);
        return;
      }
      appendFlow(id, label);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    void sendSmartMessage(text);
  };

  const toggleMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    setGoGoVoiceMuted(next);
    if (next) stopGoGoSpeech();
  };

  const toggleMic = async () => {
    if (busy) return;

    if (listening) {
      recognizerRef.current?.stop?.();
      setListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicHint(
        lang === 'ar'
          ? 'الميكروفون شغال أحسن على Chrome أو Edge.'
          : 'Voice works best in Chrome or Edge.',
      );
      return;
    }

    setMicHint('');
    stopGoGoSpeech();
    setSpeaking(false);
    voiceAskRef.current = true;
    micFinalSentRef.current = false;

    const perm = await ensureMicrophonePermission();
    if (!perm.ok) {
      setMicHint(
        lang === 'ar'
          ? 'اسمح بالميكروفون من إعدادات المتصفح لو سمحت.'
          : 'Please allow microphone access in your browser.',
      );
      voiceAskRef.current = false;
      return;
    }

    setMicSupported(true);
    recognizerRef.current?.abort?.();

    const rec = createGoGoRecognizer({
      lang: langRef.current,
      onStart: () => {
        setListening(true);
        setPose('think');
        setMicHint(langRef.current === 'ar' ? 'أسمعك… تفضل بالحديث' : 'Listening… go ahead');
      },
      onResult: ({ interim, final }) => {
        if (interim) setInput(interim);
        if (final && !micFinalSentRef.current) {
          micFinalSentRef.current = true;
          setInput('');
          setListening(false);
          setMicHint('');
          recognizerRef.current?.stop?.();
          void sendSmartMessage(final, { fromVoice: true });
        }
      },
      onError: (code) => {
        setListening(false);
        setPose('idle');
        voiceAskRef.current = false;
        if (code === 'aborted') return;
        if (code === 'no-speech') {
          setMicHint(
            langRef.current === 'ar' ? 'ما سمعتش حاجة — جرّب تاني.' : "Didn't catch that — try again.",
          );
          return;
        }
        const L = langRef.current;
        const permissionIssue = code === 'not-allowed' || code === 'service-not-allowed';
        const msg = permissionIssue
          ? (L === 'ar'
              ? 'محتاج إذن الميكروفون. فعّله من المتصفح وجرّب تاني، أو اكتب سؤالك.'
              : 'I need microphone permission. Allow mic access in your browser and try again, or type your question.')
          : (L === 'ar'
              ? 'مش قادر أوصل لميكروفون. اتأكد إن فيه مايك متوصّل، أو اكتب سؤالك.'
              : "I couldn't reach a microphone. Check that a mic is connected, or type your question instead.");
        setMicHint(msg);
        setMessages((prev) => {
          const next = [...prev, stamp('gogo', msg)];
          persistChat(next, L, nameRef.current);
          return next;
        });
        void speakReply(msg);
      },
      onEnd: () => {
        setListening(false);
        setPose((p) => (p === 'think' ? 'idle' : p));
      },
    });

    if (!rec) {
      setMicHint(
        lang === 'ar'
          ? 'الميكروفون غير مدعوم هنا.'
          : 'Microphone is not supported here.',
      );
      return;
    }

    recognizerRef.current = rec;
    rec.start();
  };

  if (hidden) return null;

  const placeholder =
    phase === 'ask_name' || !visitorName
      ? rtl
        ? 'اسمك…'
        : 'Your name…'
      : listening
        ? rtl
          ? 'أسمعك…'
          : 'Listening…'
        : busy
          ? rtl
            ? 'لحظة…'
            : 'One moment…'
          : rtl
            ? `اكتب أو تحدّث إلى ${assistantDisplayName('ar')}…`
            : `Type or talk to ${assistantDisplayName('en')}…`;

  return (
    <>
      {spotlight && (
        <div className="fixed inset-0 z-[44] pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-black/45 gogo-dim" />
          <div
            className="absolute rounded-[2rem] border-2 border-yellow-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45),0_0_40px_rgba(250,204,21,0.45)] gogo-spotlight-pulse"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </div>
      )}

      {guideHint && (
        <button
          type="button"
          onClick={dismissGuide}
          className="fixed z-[46] pointer-events-auto px-3 py-2 rounded-2xl bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(250,204,21,0.35)] gogo-hint-bounce"
          style={{ top: guideHint.top, left: guideHint.left }}
        >
          {guideHint.text}
        </button>
      )}

      <div
        className={`fixed flex flex-col transition-[left,bottom,width,top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? 'z-[60] inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:left-5 sm:right-auto sm:w-[min(100vw-1.5rem,22rem)] sm:max-h-[calc(100dvh-1rem)] items-stretch justify-end gap-2'
            : 'z-[48] bottom-[5.75rem] sm:bottom-24 left-0 right-auto items-end justify-end gap-0 gogo-dock-fullbody'
        }`}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <AnimatePresence>
        {open && (
          <motion.div
            key="gogo-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-h-0 max-h-[min(calc(100%-13.5rem),30rem)] sm:max-h-[min(calc(100%-15rem),32rem)] flex flex-col rounded-3xl border border-white/10 bg-zinc-950/96 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/5 bg-gradient-to-r from-blue-600/25 to-transparent shrink-0 sticky top-0 z-10">
              <div className="min-w-0">
                <p className={`text-[11px] font-black text-white truncate ${rtl ? 'tracking-normal' : 'uppercase tracking-widest'}`}>{assistantDisplayName(lang)}</p>
                <p className="text-[9px] text-zinc-500 font-bold truncate">
                  {listening
                    ? rtl
                      ? 'أسمعك…'
                      : 'Listening…'
                    : speaking
                      ? rtl
                        ? 'أتحدث…'
                        : 'Speaking…'
                      : busy
                        ? rtl
                          ? 'لحظة…'
                          : 'One moment…'
                        : phase === 'ask_name'
                          ? rtl
                            ? 'ما اسمك؟'
                            : "What's your name?"
                          : visitorName
                            ? rtl
                              ? `أهلاً ${visitorName}`
                              : `Hi, ${visitorName}`
                            : rtl
                              ? 'مرشد SCORA'
                              : 'SCORA guide'}
                </p>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                  aria-label={voiceMuted ? 'Unmute voice' : 'Mute voice'}
                  title={voiceMuted ? 'Unmute' : 'Mute'}
                >
                  {voiceMuted ? <VolumeX className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={switchLanguage}
                  className="min-w-[2.25rem] px-2.5 py-2 sm:py-1 rounded-lg text-[10px] sm:text-[9px] font-black uppercase tracking-wider border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                  title={lang === 'en' ? 'العربية' : 'English'}
                >
                  {lang === 'en' ? 'ع' : 'EN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissGuide();
                    recognizerRef.current?.abort?.();
                    stopGoGoSpeech();
                    playGesture('bye', 1100);
                    schedule(() => {
                      setOpen(false);
                      setShowBubble(false);
                      setPose('wave');
                    }, 850);
                  }}
                  className="p-2 sm:p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  aria-label="Minimize"
                >
                  <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissGuide();
                    recognizerRef.current?.abort?.();
                    stopGoGoSpeech();
                    playGesture('bye', 1100);
                    schedule(() => {
                      setOpen(false);
                      setShowBubble(false);
                      setPose('wave');
                    }, 850);
                  }}
                  className="p-2 sm:p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2.5 space-y-2.5">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${m.at || i}-${i}`}
                  className={`text-[12px] leading-relaxed rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600/25 text-blue-100 ml-6'
                      : m.denied
                        ? 'bg-amber-500/10 text-amber-100/90 border border-amber-500/20 mr-4'
                        : m.expression === 'point'
                          ? 'bg-yellow-500/15 text-yellow-100 border border-yellow-500/25 mr-4'
                          : 'bg-white/5 text-zinc-200 mr-4'
                  }`}
                >
                  <div>{m.text}</div>
                  {m.role === 'gogo' && m.learnable && !m.denied ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!!m.feedback}
                        onClick={() => { void rateGoGoAnswer(i, 'up'); }}
                        className={`p-1 rounded-md border transition-all ${
                          m.feedback === 'up'
                            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/10 text-zinc-500 hover:text-emerald-200 hover:border-emerald-400/30 disabled:opacity-40'
                        }`}
                        aria-label="Good answer"
                        title={rtl ? 'إجابة جيدة' : 'Good answer'}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={!!m.feedback}
                        onClick={() => { void rateGoGoAnswer(i, 'down'); }}
                        className={`p-1 rounded-md border transition-all ${
                          m.feedback === 'down'
                            ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 text-zinc-500 hover:text-amber-200 hover:border-amber-400/30 disabled:opacity-40'
                        }`}
                        aria-label="Needs improvement"
                        title={rtl ? 'يحتاج تحسين' : 'Needs improvement'}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      {m.source === 'learned' ? (
                        <span className="text-[9px] text-emerald-300/70 ml-1">
                          {rtl ? 'من الذاكرة' : 'from memory'}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mr-4 px-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {rtl ? `${assistantDisplayName('ar')} يفكر…` : `${assistantDisplayName('en')} is thinking…`}
                </div>
              )}
            </div>

            {chips.filter((id) => id && id !== 'lang_toggle').length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0 max-h-20 overflow-y-auto">
                {chips
                  .filter((id) => id && id !== 'lang_toggle')
                  .map((id, chipIndex) => (
                  <motion.button
                    key={id}
                    type="button"
                    disabled={busy}
                    onClick={() => handleChip(id)}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.08 + chipIndex * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className={`px-2.5 py-1.5 rounded-full text-[9px] font-black tracking-wide border transition-all disabled:opacity-50 ${
                      id === 'main_menu'
                        ? 'border-white/20 bg-zinc-800 text-zinc-200'
                        : 'border-blue-500/25 bg-blue-600/15 text-blue-100 hover:border-blue-400/50 hover:bg-blue-600/25'
                    }`}
                  >
                    {labels[id] || id}
                  </motion.button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex flex-col gap-1.5 px-3 py-2.5 sm:py-3 border-t border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { void toggleMic(); }}
                  disabled={busy && !listening}
                  className={`p-2 rounded-xl border transition-all ${
                    listening
                      ? 'bg-red-500/25 border-red-400/40 text-red-200 gogo-mic-pulse'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-blue-500/40 hover:text-blue-200'
                  }`}
                  aria-label={listening ? 'Stop listening' : 'Start voice'}
                  title={listening ? 'Stop' : 'Voice'}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  disabled={busy}
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-blue-500/50 placeholder:text-zinc-600 disabled:opacity-60"
                  autoFocus={open}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-200 hover:bg-blue-600/45 transition-all disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {micHint ? (
                <p className="text-[9px] text-amber-200/90 px-1">{micHint}</p>
              ) : null}
            </form>
          </motion.div>
        )}
        </AnimatePresence>

        <div className={`relative flex shrink-0 items-end justify-start ${open ? 'gogo-dock-full' : 'gogo-dock-fullbody-avatar'}`}>
          <AnimatePresence>
          {!open && showBubble && dockNudge && (
            <motion.div
              key={`nudge-${dockNudge.kind}`}
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="gogo-mx-tip-popup absolute bottom-full mb-2 left-2 sm:left-3 z-[2] w-[min(16.5rem,calc(100vw-2rem))]"
              role="status"
              aria-live="polite"
            >
              <div className="relative rounded-2xl border border-cyan-400/30 bg-zinc-950/95 backdrop-blur-md px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
                <p className="text-[12px] leading-snug text-zinc-100 font-semibold">
                  {(DOCK_NUDGE_COPY[dockNudge.kind] || DOCK_NUDGE_COPY.mx_new)[lang === 'ar' ? 'ar' : 'en']}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {dockNudge.kind === 'complete' ? (
                    <button
                      type="button"
                      onClick={dismissDockNudge}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider"
                    >
                      {lang === 'ar' ? 'تمام' : 'OK'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const cid = pendingConsultantIdRef.current;
                          const kind = dockNudge.kind;
                          dismissDockNudge();
                          if (cid && kind === 'incomplete') {
                            onNavigate?.(`goto_consultant:${cid}`);
                          } else {
                            onNavigate?.('goto_knowledge');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider"
                      >
                        {lang === 'ar' ? GOGO_CHIP_LABELS.ar.goto_knowledge : GOGO_CHIP_LABELS.en.goto_knowledge}
                      </button>
                      <button
                        type="button"
                        onClick={dismissDockNudge}
                        className="px-2.5 py-1.5 rounded-lg border border-white/15 text-zinc-400 text-[10px] font-bold uppercase tracking-wider hover:text-white"
                      >
                        {lang === 'ar' ? 'لاحقاً' : 'Later'}
                      </button>
                    </>
                  )}
                </div>
                <span className="gogo-mx-tip-popup-tail" aria-hidden />
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={() => {
              if (open) {
                recognizerRef.current?.abort?.();
                stopGoGoSpeech();
                playGesture('bye', 1200);
                schedule(() => {
                  setOpen(false);
                  setShowBubble(false);
                  setPose('wave');
                }, 900);
              } else {
                if (dockNudge) dismissDockNudge();
                startChatSession();
              }
            }}
            className="relative group focus:outline-none touch-manipulation"
            aria-label={open ? `Close ${assistantDisplayName('en')}` : `Summon ${assistantDisplayName('en')}`}
            title={open ? 'Close' : 'Talk to GOGO'}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.4, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { type: 'spring', stiffness: 380, damping: 18, mass: 0.9, delay: 0.12 }
            }
          >
              {dockNudge?.kind === 'complete' && !open ? (
                <span className="gogo-tip-burst pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden>
                  <span className="gogo-tip-burst-ring" />
                  <span className="gogo-tip-burst-ring gogo-tip-burst-ring-delay" />
                </span>
              ) : null}
              <span
                className={`absolute -inset-2 rounded-full blur-xl transition-opacity ${
                  listening || speaking
                    ? 'bg-blue-400/40 opacity-100 gogo-mic-pulse'
                    : 'bg-blue-500/20 opacity-60 group-hover:opacity-90'
                }`}
              />
              <span className="gogo-stage relative gogo-stage-full">
                {showThinkCue && (
                  <span className="gogo-gesture-cue gogo-cue-think" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                )}
                {showPointCue && <span className="gogo-gesture-cue gogo-cue-point" aria-hidden />}
                {showSpeakCue && (
                  <span className="gogo-gesture-cue gogo-cue-speak" aria-hidden>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}
                <img
                  src={spriteSrc}
                  alt={assistantDisplayName('en')}
                  className={`relative w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] select-none pointer-events-none gogo-sprite ${poseClass} ${
                    open ? 'h-32 sm:h-44' : 'h-24 sm:h-32'
                  }`}
                  draggable={false}
                />
              </span>
            {!open && (
              <span className="absolute top-2 right-0 translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 border-2 border-blue-200/50 text-white shadow-lg gogo-summon-sign">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
            )}
            {listening && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500 text-[8px] font-black text-white uppercase tracking-wider">
                Mic
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}
