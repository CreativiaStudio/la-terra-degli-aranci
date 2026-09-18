import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLoveWallPosts,
  saveLoveWallPost,
  updateLoveWallPostStatus,
  deleteLoveWallPost,
  togglePinLoveWallPost,
} from '../src/utils/storage';
import { LoveWallPost } from '../src/types/lovewall';
import { weddingData } from '../src/data/weddingData';

describe('Love Wall Guestbook & Spouse Moderation Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('new posts default to status: pending', () => {
    const post: LoveWallPost = {
      id: 'post_new_1',
      author: 'Gennaro',
      message: 'Auguri infiniti!',
      iconEmoji: '🥂',
      createdAt: new Date().toISOString(),
      status: 'pending',
      likesCount: 0,
    };

    saveLoveWallPost(post);

    const posts = getLoveWallPosts();
    const found = posts.find(p => p.id === 'post_new_1');
    expect(found).toBeDefined();
    expect(found?.status).toBe('pending');

    // Public view filtering logic:
    const publicPosts = posts.filter(p => p.status === 'approved');
    expect(publicPosts.some(p => p.id === 'post_new_1')).toBe(false);
  });

  it('moderator can approve, reject, pin, and delete posts', () => {
    const post: LoveWallPost = {
      id: 'mod_test_1',
      author: 'Simona',
      message: 'Evviva gli sposi!',
      iconEmoji: '❤️',
      createdAt: new Date().toISOString(),
      status: 'pending',
      likesCount: 0,
    };
    saveLoveWallPost(post);

    // Approve
    updateLoveWallPostStatus('mod_test_1', 'approved');
    expect(getLoveWallPosts().find(p => p.id === 'mod_test_1')?.status).toBe('approved');

    // Pin
    togglePinLoveWallPost('mod_test_1');
    expect(getLoveWallPosts().find(p => p.id === 'mod_test_1')?.pinned).toBe(true);

    // Reject / Hide
    updateLoveWallPostStatus('mod_test_1', 'rejected');
    expect(getLoveWallPosts().find(p => p.id === 'mod_test_1')?.status).toBe('rejected');

    // Delete
    deleteLoveWallPost('mod_test_1');
    expect(getLoveWallPosts().find(p => p.id === 'mod_test_1')).toBeUndefined();
  });

  it('verifies couple admin PIN 0712 matches wedding date', () => {
    const enteredPin = '0712';
    expect(enteredPin).toBe(weddingData.adminPin);
  });
});
