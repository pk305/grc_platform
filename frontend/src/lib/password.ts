const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*-_=+?';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;
const LENGTH = 16;

function randomIndex(max: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

function randomChar(pool: string): string {
  return pool[randomIndex(pool.length)];
}

/** A random password satisfying the backend's Django password validators. */
export function generateTemporaryPassword(): string {
  const chars = [
    randomChar(LOWER),
    randomChar(UPPER),
    randomChar(DIGITS),
    randomChar(SYMBOLS)
  ];
  while (chars.length < LENGTH) {
    chars.push(randomChar(ALL));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export const MIN_PASSWORD_LENGTH = 12;

// Best-effort UX hint only — the server's CommonPasswordValidator is the
// actual security boundary. Kept short on purpose.
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein1',
  'welcome1',
  'admin123',
  'iloveyou1'
]);

export function isCommonPassword(value: string): boolean {
  return COMMON_PASSWORDS.has(value.toLowerCase());
}

export function scoreStrength(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++;
  return score;
}

export const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
