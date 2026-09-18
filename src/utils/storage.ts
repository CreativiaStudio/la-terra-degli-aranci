import { RsvpSubmission, RsvpStats } from '../types/rsvp';
import { LoveWallPost, PostStatus } from '../types/lovewall';
import { initialLoveWallPosts } from '../data/initialLoveWallData';

export const RSVP_STORAGE_KEY = 'tda_wedding_rsvp_submissions';
export const MY_RSVP_KEY = 'tda_wedding_my_rsvp';
export const LOVEWALL_STORAGE_KEY = 'tda_wedding_lovewall_posts';

export function getRsvps(): RsvpSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RSVP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading RSVPs from storage', e);
    return [];
  }
}

export function saveRsvp(sub: RsvpSubmission): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRsvps();
    const existingIndex = current.findIndex(item => item.id === sub.id || (item.phone === sub.phone && item.fullName.toLowerCase() === sub.fullName.toLowerCase()));
    if (existingIndex >= 0) {
      current[existingIndex] = { ...sub, updatedAt: new Date().toISOString() };
    } else {
      current.push(sub);
    }
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem(MY_RSVP_KEY, JSON.stringify(sub));
  } catch (e) {
    console.error('Error saving RSVP to storage', e);
  }
}

export function getMyRsvp(): RsvpSubmission | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(MY_RSVP_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function computeRsvpStats(submissions: RsvpSubmission[]): RsvpStats {
  const stats: RsvpStats = {
    totalAttending: 0,
    totalDeclined: 0,
    totalPlusOnes: 0,
    totalChildren: 0,
    totalAdults: 0,
    dietaryCounts: {
      celiachia: 0,
      lattosio: 0,
      vegetariano: 0,
      vegano: 0,
      crostacei: 0,
      frutta_secca: 0,
      personalizzato: 0,
    },
  };

  submissions.forEach(sub => {
    if (sub.attending) {
      stats.totalAttending += 1;
      const extraAdults =
        sub.companions && sub.companions.length > 0
          ? sub.companions.length
          : sub.hasPlusOne
          ? 1
          : 0;
      stats.totalPlusOnes += extraAdults;
      const adultsForThis =
        typeof sub.adultsCount === 'number' && sub.adultsCount > 0
          ? sub.adultsCount
          : 1 + extraAdults;
      stats.totalAdults += adultsForThis;
      stats.totalChildren += sub.childrenCount || 0;

      (sub.dietaryRestrictions || []).forEach(diet => {
        if (stats.dietaryCounts[diet] !== undefined) {
          stats.dietaryCounts[diet] += 1;
        }
      });
    } else {
      stats.totalDeclined += 1;
    }
  });

  return stats;
}

export function getLoveWallPosts(): LoveWallPost[] {
  if (typeof window === 'undefined') return initialLoveWallPosts;
  try {
    const raw = localStorage.getItem(LOVEWALL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(initialLoveWallPosts));
      return initialLoveWallPosts;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialLoveWallPosts;
  }
}

export function saveLoveWallPost(post: LoveWallPost): void {
  if (typeof window === 'undefined') return;
  try {
    const posts = getLoveWallPosts();
    posts.unshift(post);
    localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Error saving post', e);
  }
}

export function updateLoveWallPostStatus(id: string, status: PostStatus): void {
  if (typeof window === 'undefined') return;
  try {
    const posts = getLoveWallPosts();
    const target = posts.find(p => p.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));
    }
  } catch (e) {
    console.error('Error updating post status', e);
  }
}

export function togglePinLoveWallPost(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const posts = getLoveWallPosts();
    const target = posts.find(p => p.id === id);
    if (target) {
      target.pinned = !target.pinned;
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));
    }
  } catch (e) {
    console.error('Error toggling pin', e);
  }
}

export function deleteLoveWallPost(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const posts = getLoveWallPosts().filter(p => p.id !== id);
    localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Error deleting post', e);
  }
}

export function likeLoveWallPost(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const posts = getLoveWallPosts();
    const target = posts.find(p => p.id === id);
    if (target) {
      target.likesCount = (target.likesCount || 0) + 1;
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));
    }
  } catch (e) {
    console.error('Error liking post', e);
  }
}

export function exportRsvpsToCsv(submissions: RsvpSubmission[]): void {
  const headers = [
    'ID',
    'Data Invio',
    'Nome e Cognome',
    'Telefono',
    'Email',
    'Presenza',
    'Accompagnatore',
    'Nome Accompagnatore',
    'Numero Bambini',
    'Dettagli Bambini',
    'Esigenze Alimentari',
    'Note Chef',
    'Canzone DJ',
    'Messaggio Sposi'
  ];

  const rows = submissions.map(sub => [
    sub.id,
    new Date(sub.submittedAt).toLocaleString('it-IT'),
    `"${sub.fullName.replace(/"/g, '""')}"`,
    `"${sub.phone}"`,
    `"${sub.email || ''}"`,
    sub.attending ? 'PRESENTE' : 'ASSENTE',
    sub.hasPlusOne ? 'SI' : 'NO',
    `"${(sub.plusOneName || '').replace(/"/g, '""')}"`,
    sub.childrenCount,
    `"${(sub.childrenList || []).map(c => `${c.name} (${c.age}a)`).join(', ')}"`,
    `"${(sub.dietaryRestrictions || []).join(', ')}"`,
    `"${(sub.dietaryCustomNotes || '').replace(/"/g, '""')}"`,
    `"${(sub.djSongRequest || '').replace(/"/g, '""')}"`,
    `"${(sub.personalMessage || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RSVP_Matrimonio_Francesca_Ferdinando_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
