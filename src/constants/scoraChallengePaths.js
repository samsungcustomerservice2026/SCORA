/** Public URL paths for SCORA Challenge (player + host routes) */

export const SCORA_CHALLENGE_ADMIN_TAB = 'scora-challenge';

/** Local app asset (also mirrored in Firebase Storage). */
export const SCORA_CHALLENGE_LOGO_SRC = '/scora_challenge_logo.jpg';

/** Firebase Storage object for the Challenge brand mark. */
export const SCORA_CHALLENGE_LOGO_STORAGE_PATH = 'PQA/scora_challenge_logo.jpg';

export const SCORA_CHALLENGE_PATHS = {
  base: '/scora-challenge',
  join: '/scora-challenge/join',
};

export function scoraChallengePlayPath(sessionId) {
  return `/scora-challenge/play/${sessionId}`;
}

export function scoraChallengeHostPath(sessionId) {
  return `/scora-challenge/host/${sessionId}`;
}

export function scoraChallengeResultsPath(sessionId, { host = false, lang = 'en' } = {}) {
  const params = new URLSearchParams({ lang });
  if (host) params.set('host', '1');
  return `/scora-challenge/results/${sessionId}?${params.toString()}`;
}

export function scoraChallengeJoinUrl(pin, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = SCORA_CHALLENGE_PATHS.join;
  return pin ? `${base}${path}?pin=${encodeURIComponent(pin)}` : `${base}${path}`;
}
