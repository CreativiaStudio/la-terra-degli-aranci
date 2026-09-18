export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface LoveWallPost {
  id: string;
  author: string;
  message: string;
  iconEmoji: string;
  createdAt: string;
  status: PostStatus;
  pinned?: boolean;
  likesCount: number;
}
