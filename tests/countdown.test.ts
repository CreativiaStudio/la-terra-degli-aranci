import { describe, it, expect } from 'vitest';
import { calculateCountdown, padZero, TARGET_TIMESTAMP_MS } from '../src/utils/countdown';

describe('Countdown Calculation Engine', () => {
  it('calculates exact time remaining before target date', () => {
    // Simulated timestamp: 10 days, 5 hours, 30 minutes, 15 seconds before event
    const deltaMs = (10 * 86400 + 5 * 3600 + 30 * 60 + 15) * 1000;
    const now = TARGET_TIMESTAMP_MS - deltaMs;

    const result = calculateCountdown(TARGET_TIMESTAMP_MS, now);

    expect(result.days).toBe(10);
    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(30);
    expect(result.seconds).toBe(15);
    expect(result.isFinished).toBe(false);
  });

  it('handles zero or passed target timestamp smoothly', () => {
    const passedNow = TARGET_TIMESTAMP_MS + 5000;
    const result = calculateCountdown(TARGET_TIMESTAMP_MS, passedNow);

    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.totalMs).toBe(0);
    expect(result.isFinished).toBe(true);
  });

  it('pads single-digit numbers with leading zero', () => {
    expect(padZero(5)).toBe('05');
    expect(padZero(0)).toBe('00');
    expect(padZero(12)).toBe('12');
  });
});
