export interface PublicUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
}

export interface Tape {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  category: string;
  isPublic: boolean;
  creatorId: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  tapeId: string;
  title: string;
  curatorNote?: string | null;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
  url: string;
  coverImage: string | null;
  duration: number | null;
  position: number;
  createdAt: string;
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

export interface StudioTape extends TapeWithDetails {
  saveCount: number;
  listenCount: number;
  listenerCount: number;
}

export interface StudioSummary {
  tapes: StudioTape[];
  stats: {
    tapeCount: number;
    publicTapeCount: number;
    playCount: number;
    saveCount: number;
    listenCount: number;
    listenerCount: number;
    commentCount: number;
    followersCount: number;
  };
  activity: { date: string; label: string; count: number }[];
}

export interface CommentWithUser {
  id: string;
  tapeId: string;
  content: string;
  createdAt: string;
  user: PublicUser;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'comment' | 'like' | 'follow' | 'new_tape';
  actorId: string;
  tapeId: string | null;
  content: string;
  read: boolean;
  createdAt: string;
  actor?: PublicUser;
  tapeTitle?: string | null;
}

export interface FollowInfo {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface ValidationResult {
  valid: boolean;
  type: 'direct-audio' | 'embeddable' | 'unknown';
  message: string;
  title?: string;
  coverImage?: string;
}

export const CATEGORIES = [
  { value: 'quran', label: 'القرآن الكريم' },
  { value: 'adhkar', label: 'الأذكار والأدعية' },
  { value: 'nasheed', label: 'الأناشيد' },
  { value: 'lectures', label: 'المحاضرات' },
  { value: 'culture', label: 'الثقافة والمعرفة' },
  { value: 'misc', label: 'محتوى متنوع' },
] as const;

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || 'محتوى متنوع';
}
