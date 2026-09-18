import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('canvas-confetti', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  __esModule: true,
}));

// Polyfills for browser environment in Node jsdom
if (typeof window !== 'undefined') {
  const storage: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value.toString(); },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { for (const k in storage) delete storage[k]; },
    key: (i: number) => Object.keys(storage)[i] || null,
    length: Object.keys(storage).length,
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

  class AudioContextMock {
    currentTime = 0;
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      };
    }
    get destination() { return {}; }
  }
  Object.defineProperty(window, 'AudioContext', { value: AudioContextMock, writable: true });
}
