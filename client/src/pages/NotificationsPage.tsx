import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ThumbsUp, MessageCircle, UserPlus, Music } from 'lucide-react';
import { api } from '../services/api';
import type { NotificationItem } from '../types';
import { useAuthStore } from '../stores/authStore';
import { formatDate } from '../utils/format';

const typeIcon: Record<NotificationItem['type'], React.ElementType> = {
  like: ThumbsUp,
  comment: MessageCircle,
  follow: UserPlus,
  new_tape: Music,
};

const typeLabel: Record<NotificationItem['type'], string> = {
  like: 'أعجب بشريطك',
  comment: 'علّق على شريطك',
  follow: 'بدأ بمتابعتك',
  new_tape: 'نشر شريطًا جديدًا',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<(NotificationItem & { actor?: any; tapeTitle?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.getNotifications()
      .then((r) => {
        setNotifications(r.notifications);
        api.markNotificationsRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-yt-hover shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-yt-hover rounded w-3/4" />
              <div className="h-3 bg-yt-hover rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Bell size={48} className="text-yt-sub mb-4" />
        <h2 className="text-yt-text text-xl font-semibold mb-2">لا توجد إشعارات</h2>
        <p className="text-yt-sub">ستظهر هنا إشعارات الإعجابات والتعليقات والمتابعات</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-yt-text text-2xl font-bold mb-6 flex items-center gap-2">
        <Bell size={24} />
        الإشعارات
      </h1>

      <div className="space-y-1">
        {notifications.map((n) => {
          const Icon = typeIcon[n.type];
          const isUnread = !n.read;

          return (
            <Link
              key={n.id}
              to={n.tapeId ? `/tape/${n.tapeId}` : `/user/${n.actor?.username || ''}`}
              className={`flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-yt-hover ${isUnread ? 'bg-yt-card' : ''}`}
            >
              {/* Actor avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-naqaa-700 flex items-center justify-center text-white font-bold overflow-hidden">
                  {n.actor?.avatar
                    ? <img src={n.actor.avatar} alt="" className="w-full h-full object-cover" />
                    : n.actor?.username?.charAt(0) || '؟'
                  }
                </div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-yt-card border-2 border-yt-bg flex items-center justify-center">
                  <Icon size={11} className="text-naqaa-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yt-text leading-relaxed">
                  <span className="font-semibold">{n.actor?.username || 'مستخدم'}</span>
                  {' '}
                  {typeLabel[n.type]}
                  {n.tapeTitle && (
                    <span className="text-yt-sub"> — {n.tapeTitle}</span>
                  )}
                </p>
                <p className="text-xs text-yt-muted mt-1">{formatDate(n.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {isUnread && (
                <div className="w-2 h-2 rounded-full bg-naqaa-400 shrink-0 mt-2" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
