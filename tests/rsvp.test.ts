import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveRsvp,
  getRsvps,
  getMyRsvp,
  computeRsvpStats,
} from '../src/utils/storage';
import { RsvpSubmission } from '../src/types/rsvp';

describe('RSVP Engine & Guest Profiling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves RSVP submissions from storage', () => {
    const sub: RsvpSubmission = {
      id: 'rsvp_test_1',
      submittedAt: new Date().toISOString(),
      fullName: 'Alessio Esposito',
      phone: '+39 333 9876543',
      email: 'alessio@example.com',
      attending: true,
      hasPlusOne: true,
      plusOneName: 'Chiara De Luca',
      hasChildren: true,
      childrenCount: 2,
      childrenList: [
        { name: 'Leo', age: 6 },
        { name: 'Sofia', age: 3 },
      ],
      dietaryRestrictions: ['celiachia', 'lattosio'],
      djSongRequest: 'Anema e Core - Remix',
    };

    saveRsvp(sub);

    const rsvps = getRsvps();
    expect(rsvps).toHaveLength(1);
    expect(rsvps[0].fullName).toBe('Alessio Esposito');
    expect(rsvps[0].hasPlusOne).toBe(true);
    expect(rsvps[0].childrenCount).toBe(2);

    const myRsvp = getMyRsvp();
    expect(myRsvp?.phone).toBe('+39 333 9876543');
  });

  it('computes accurate RSVP statistics', () => {
    const submissions: RsvpSubmission[] = [
      {
        id: '1',
        submittedAt: new Date().toISOString(),
        fullName: 'Ospite 1',
        phone: '123',
        attending: true,
        hasPlusOne: true,
        hasChildren: true,
        childrenCount: 2,
        childrenList: [],
        dietaryRestrictions: ['celiachia'],
      },
      {
        id: '2',
        submittedAt: new Date().toISOString(),
        fullName: 'Ospite 2',
        phone: '456',
        attending: true,
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
        childrenList: [],
        dietaryRestrictions: ['vegano', 'celiachia'],
      },
      {
        id: '3',
        submittedAt: new Date().toISOString(),
        fullName: 'Ospite 3',
        phone: '789',
        attending: false,
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
        childrenList: [],
        dietaryRestrictions: [],
      },
    ];

    const stats = computeRsvpStats(submissions);

    expect(stats.totalAttending).toBe(2);
    expect(stats.totalDeclined).toBe(1);
    expect(stats.totalAdults).toBe(3); // 2 + 1 (+1)
    expect(stats.totalChildren).toBe(2);
    expect(stats.dietaryCounts.celiachia).toBe(2);
    expect(stats.dietaryCounts.vegano).toBe(1);
  });
});
