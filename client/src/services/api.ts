import type { PublicUser, TapeWithDetails, Track, ValidationResult, CommentWithUser, NotificationItem, FollowInfo, StudioSummary } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('naqaa_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'حدث خطأ غير متوقع' }));
    throw new Error(data.error || 'حدث خطأ في الاتصال');
  }

  return res.json();
}

export const api = {
  // Auth
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: PublicUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getLoginOptions: () =>
    request<{ usernameOnly: boolean }>('/auth/login-options'),

  loginWithUsername: (username: string) =>
    request<{ token: string; user: PublicUser }>('/auth/login/username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  getMe: () =>
    request<{ user: PublicUser }>('/auth/me'),

  updateProfile: (data: { username?: string; avatar?: string; bio?: string }) =>
    request<{ user: PublicUser }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tapes
  getTapes: (params?: { limit?: number; offset?: number; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.category) qs.set('category', params.category);
    return request<{ tapes: TapeWithDetails[] }>(`/tapes?${qs}`);
  },

  getTrending: () =>
    request<{ tapes: TapeWithDetails[] }>('/tapes/trending'),

  getRecent: () =>
    request<{ tapes: TapeWithDetails[] }>('/tapes/recent'),

  searchTapes: (q: string, category?: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (category) qs.set('category', category);
    return request<{ tapes: TapeWithDetails[] }>(`/tapes/search?${qs}`);
  },

  getTape: (id: string) =>
    request<{ tape: TapeWithDetails }>(`/tapes/${id}`),

  createTape: (data: {
    title: string;
    description?: string;
    coverImage?: string;
    category?: string;
    isPublic?: boolean;
    tracks?: {
      title: string;
      url: string;
      coverImage?: string;
      duration?: number;
      curatorNote?: string;
      sourceAttribution?: string;
      sourceUrl?: string;
      licenseName?: string;
      licenseUrl?: string;
    }[];
  }) =>
    request<{ tape: TapeWithDetails }>('/tapes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadAudio: async (file: File) => {
    const token = getToken();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const res = await fetch(`${API_BASE}/tapes/upload-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Audio-Extension': extension,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    const data: { url?: string; error?: string } = await res.json().catch(() => ({ error: 'حدث خطأ غير متوقع' }));
    if (!res.ok) throw new Error(data.error || 'تعذر رفع الملف');
    if (!data.url) throw new Error('لم يستلم الخادم رابط الملف المرفوع');
    return { url: data.url };
  },

  updateTape: (id: string, data: Partial<{
    title: string;
    description: string;
    coverImage: string;
    category: string;
    isPublic: boolean;
  }>) =>
    request<{ tape: TapeWithDetails }>(`/tapes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTape: (id: string) =>
    request<{ success: boolean }>(`/tapes/${id}`, { method: 'DELETE' }),

  addTrack: (tapeId: string, data: {
    title?: string;
    url: string;
    coverImage?: string;
    duration?: number;
    curatorNote?: string;
    sourceAttribution?: string;
    sourceUrl?: string;
    licenseName?: string;
    licenseUrl?: string;
  }) =>
    request<{ track: Track }>(`/tapes/${tapeId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTrack: (tapeId: string, trackId: string, data: Partial<{
    title: string;
    url: string;
    coverImage: string;
    duration: number;
    curatorNote: string;
    sourceAttribution: string;
    sourceUrl: string;
    licenseName: string;
    licenseUrl: string;
  }>) =>
    request<{ track: Track }>(`/tapes/${tapeId}/tracks/${trackId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTrack: (tapeId: string, trackId: string) =>
    request<{ success: boolean }>(`/tapes/${tapeId}/tracks/${trackId}`, { method: 'DELETE' }),

  reorderTracks: (tapeId: string, trackIds: string[]) =>
    request<{ tracks: Track[] }>(`/tapes/${tapeId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    }),

  playTape: (id: string) =>
    request<{ success: boolean }>(`/tapes/${id}/play`, { method: 'POST' }),

  saveTape: (id: string) =>
    request<{ success: boolean }>(`/tapes/${id}/save`, { method: 'POST' }),

  unsaveTape: (id: string) =>
    request<{ success: boolean }>(`/tapes/${id}/save`, { method: 'DELETE' }),

  recordListen: (id: string) =>
    request<{ success: boolean }>(`/tapes/${id}/listen`, { method: 'POST' }),

  validateUrl: (url: string) =>
    request<ValidationResult>('/tapes/validate-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  // User
  getMyTapes: () =>
    request<{ tapes: TapeWithDetails[] }>('/users/my-tapes'),

  getStudio: () =>
    request<StudioSummary>('/users/studio'),

  getLibrary: () =>
    request<{ tapes: TapeWithDetails[] }>('/users/library'),

  getHistory: () =>
    request<{ tapes: TapeWithDetails[] }>('/users/history'),

  getUserProfile: (username: string) =>
    request<{ user: PublicUser; tapes: TapeWithDetails[]; followersCount: number; followingCount: number; isFollowing: boolean }>(`/users/profile/${username}`),

  // Social — Comments
  getComments: (tapeId: string) =>
    request<{ comments: CommentWithUser[] }>(`/social/tapes/${tapeId}/comments`),

  addComment: (tapeId: string, content: string) =>
    request<{ comment: CommentWithUser }>(`/social/tapes/${tapeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (tapeId: string, commentId: string) =>
    request<{ success: boolean }>(`/social/tapes/${tapeId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Social — Likes
  toggleLike: (tapeId: string) =>
    request<{ liked: boolean }>(`/social/tapes/${tapeId}/like`, { method: 'POST' }),

  // Social — Follow
  toggleFollow: (userId: string) =>
    request<{ following: boolean }>(`/social/users/${userId}/follow`, { method: 'POST' }),

  getFollowInfo: (userId: string) =>
    request<FollowInfo>(`/social/users/${userId}/follow`),

  // Social — Feed
  getFeed: () =>
    request<{ tapes: TapeWithDetails[] }>('/social/feed'),

  // Social — Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/social/notifications'),

  markNotificationsRead: () =>
    request<{ success: boolean }>('/social/notifications/read', { method: 'PUT' }),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/social/notifications/${id}/read`, { method: 'PUT' }),
};
