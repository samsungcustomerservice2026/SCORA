/**
 * Admins without a real mailbox sign in with their username. Firebase Auth
 * still needs an email, so those accounts use an internal, undeliverable address.
 */
export const ADMIN_INTERNAL_EMAIL_DOMAIN = 'admins.tcs-for-engineers.local';

/** Usernames become the local part of the internal address, so keep them email-safe. */
export const ADMIN_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]$/i;

export function internalAdminEmail(username) {
  const raw = String(username || '').trim().toLowerCase();
  return raw ? `${raw}@${ADMIN_INTERNAL_EMAIL_DOMAIN}` : '';
}

export function isInternalAdminEmail(email) {
  return String(email || '').toLowerCase().endsWith(`@${ADMIN_INTERNAL_EMAIL_DOMAIN}`);
}
