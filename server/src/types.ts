import type { Request } from 'express';
import type { User, Tape, Track } from './db/database.js';

export type { User, Tape, Track, LibraryEntry, HistoryEntry, Comment, Like, Follow, Notification, DatabaseSchema } from './db/database.js';

export interface PublicUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
}

export interface TapeWithDetails extends Tape {
  creator?: PublicUser;
  tracks?: Track[];
  trackCount?: number;
  totalDuration?: number;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isFollowingCreator?: boolean;
}

export interface CommentWithUser {
  id: string;
  tapeId: string;
  content: string;
  createdAt: string;
  user: PublicUser;
}

export interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
  };
}
