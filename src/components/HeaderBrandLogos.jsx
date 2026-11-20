'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SCORA_VIDEO_SRC = '/scora_logo_animation.mp4';
const SCORA_FALLBACK_SRC = '/scora_brand_logo.png';
const SAMSUNG_HOLD_MS = 5_000;
const SCORA_HOLD_MS = 10_000;

/**
 * Fixed-size top-left brand slot (no layout shift):
 * Samsung (5s) → SCORA animated logo (10s) → repeat.
 * Slot size never changes; SCORA is scaled larger inside the same box.
 */
export default function HeaderBrandLogos({
  onClick,
  replayKey = 'default',
}) {
  const reduce = useReducedMotion();
  const videoRef = useRef(null);
  const [playId, setPlayId] = useState(0);
  const [phase, setPhase] = useState('samsung'); // 'samsung' | 'scora'
  const [useFallback, setUseFallback] = useState(false);

  const restartSequence = useCallback(() => {
    setPhase('samsung');
    setUseFallback(false);
    setPlayId((n) => n + 1);
  }, []);

  useEffect(() => {
    restartSequence();
  }, [replayKey, restartSequence]);

  useEffect(() => {
    if (phase !== 'samsung') return undefined;
    const hold = reduce ? 600 : SAMSUNG_HOLD_MS;
    const t = setTimeout(() => setPhase('scora'), hold);
    return () => clearTimeout(t);
  }, [phase, playId, reduce]);

  useEffect(() => {
    if (phase !== 'scora') return undefined;
    const hold = reduce ? 1200 : SCORA_HOLD_MS;
    const t = setTimeout(() => restartSequence(), hold);
    return () => clearTimeout(t);
  }, [phase, playId, reduce, restartSequence]);

  useEffect(() => {
    if (phase !== 'scora' || useFallback) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    return undefined;
  }, [phase, playId, useFallback]);

  return (
    <button
      type="button"
      onClick={onClick}
      /* Fixed footprint — never changes between Samsung / SCORA */
      className="relative -ml-1 sm:-ml-2 md:-ml-4 h-14 md:h-20 w-[12rem] sm:w-[15rem] md:w-[18rem] shrink-0 overflow-hidden bg-transparent border-0 p-0 text-left cursor-pointer group"
      aria-label="SCORA home"
    >
      <AnimatePresence mode="sync" initial={false}>
        {phase === 'samsung' ? (
          <motion.img
            key={`samsung-${playId}`}
            src="./sam_logo.png"
            alt="Samsung"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.35 }}
            /* Samsung keeps its normal visual size inside the fixed slot */
            className="absolute inset-0 m-auto h-10 md:h-14 w-auto max-w-[70%] object-contain brightness-110 group-hover:scale-105 transition-transform duration-500"
            draggable={false}
          />
        ) : useFallback ? (
          <motion.img
            key={`scora-fallback-${playId}`}
            src={SCORA_FALLBACK_SRC}
            alt="SCORA"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.35 }}
            className="absolute inset-0 m-auto h-[92%] w-auto max-w-[98%] object-contain"
            draggable={false}
          />
        ) : (
          <motion.video
            key={`scora-video-${playId}`}
            ref={videoRef}
            src={SCORA_VIDEO_SRC}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
            onError={() => setUseFallback(true)}
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.35 }}
            /* Fill the fixed slot — larger than Samsung, no layout jump */
            className="absolute inset-0 m-auto !h-full !w-full !max-h-full object-contain bg-transparent scale-[1.35] origin-center"
            aria-label="SCORA"
          />
        )}
      </AnimatePresence>
    </button>
  );
}
