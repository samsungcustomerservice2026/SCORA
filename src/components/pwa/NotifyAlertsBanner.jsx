'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  enablePhoneAlerts,
  isIosPhone,
  isStandaloneApp,
  shouldAskNotify,
  unlockAudioOnce,
} from '../../lib/pwa/installHelpers';

/**
 * In-app banner asking for notification permission — not the OS sheet itself.
 *
 * Lives in the same content column as <main> (same max-width and padding).
 * Portrait: stacked copy + actions. Landscape / sm+: one compact row so it
 * tracks page width instead of floating over the header.
 */
export default function NotifyAlertsBanner({
  ready = false,
  blocked = false,
  userId = null,
  onToast,
}) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const iosNeedsInstall = typeof window !== 'undefined' && isIosPhone() && !isStandaloneApp();

  useEffect(() => {
    if (!ready || blocked || !shouldAskNotify()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [ready, blocked]);

  const handleLater = useCallback(() => {
    setVisible(false);
  }, []);

  const handleAllow = useCallback(async () => {
    unlockAudioOnce();
    setBusy(true);
    try {
      const result = await enablePhoneAlerts(userId);
      if (result.status === 'need_homescreen') {
        onToast?.('On iPhone: Share → Add to Home Screen, then open from the icon.');
        return;
      }
      if (result.status === 'granted') {
        setVisible(false);
        onToast?.('Phone alerts enabled for SCORA.');
        return;
      }
      if (result.status === 'denied') {
        setVisible(false);
        onToast?.('Alerts blocked — enable them in browser or phone settings.');
        return;
      }
      onToast?.('This browser blocked the alerts prompt.');
    } finally {
      setBusy(false);
    }
  }, [onToast, userId]);

  if (!visible) return null;

  return (
    <div
      className="relative z-20 mb-6 w-full min-w-0"
      role="region"
      aria-label="Enable SCORA alerts"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-blue-500/25 bg-zinc-950 px-3.5 py-3 landscape:flex-row landscape:items-center landscape:gap-3 landscape:py-2.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3 landscape:items-center sm:items-center">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20">
            <Bell className="h-4 w-4 text-blue-400" />
          </div>
          <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-zinc-200 landscape:truncate sm:leading-relaxed">
            {iosNeedsInstall
              ? 'On iPhone: Share → Add to Home Screen, then enable alerts.'
              : 'Turn on phone alerts — you’ll get them even if the screen is locked or you’re in another app.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pl-12 landscape:pl-0 sm:pl-0">
          <button
            type="button"
            disabled={busy}
            onPointerDown={unlockAudioOnce}
            onClick={handleAllow}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {iosNeedsInstall ? 'How to install' : 'Enable alerts'}
          </button>
          <button
            type="button"
            onClick={handleLater}
            className="rounded-xl border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition hover:border-white/30 hover:text-white"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleLater}
            className="rounded-full p-1 text-zinc-500 transition hover:text-white"
            aria-label="Dismiss alerts banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
