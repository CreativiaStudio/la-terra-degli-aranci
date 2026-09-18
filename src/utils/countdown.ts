export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
}

export const TARGET_TIMESTAMP_MS = 1796652000000; // 2026-12-07T15:00:00+01:00

export function calculateCountdown(
  target: number | string = TARGET_TIMESTAMP_MS,
  now: number = Date.now()
): TimeRemaining {
  const targetMs = typeof target === 'string' ? new Date(target).getTime() : target;
  const totalMs = targetMs - now;

  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { totalMs, days, hours, minutes, seconds, isFinished: false };
}

export function padZero(num: number): string {
  return String(num).padStart(2, '0');
}
