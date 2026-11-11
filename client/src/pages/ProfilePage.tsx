import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pencil, UserPlus, UserCheck, Check, X, AudioLines } from 'lucide-react';
import { api } from '../services/api';
import type { PublicUser, TapeWithDetails } from '../types';
import { useAuthStore } from '../stores/authStore';
import TapeCard from '../components/tapes/TapeCard';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateProfile } = useAuthStore();

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [tapes, setTapes] = useState<TapeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const target = username || currentUser?.username;
  const isOwn = !username || username === currentUser?.username;

  useEffect(() => {
    if (!target) { setLoading(false); return; }
    setLoading(true);

    const fetchFn = isOwn && currentUser
      ? api.getMyTapes().then((r) => ({ user: currentUser as PublicUser, tapes: r.tapes, followersCount: 0, followingCount: 0, isFollowing: false }))
      : api.getUserProfile(target);

    fetchFn
      .then((r) => {
        setProfileUser(r.user);
        setTapes(r.tapes);
        setFollowersCount((r as any).followersCount || 0);
        setFollowingCount((r as any).followingCount || 0);
        setIsFollowing((r as any).isFollowing || false);
        setEditUsername(r.user.username);
        setEditBio(r.user.bio || '');
        setEditAvatar(r.user.avatar || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [target, isOwn, currentUser]);

  const handleFollow = async () => {
    if (!profileUser) return;
    setIsFollowing((f) => !f);
    setFollowersCount((c) => isFollowing ? c - 1 : c + 1);
    try { await api.toggleFollow(profileUser.id); }
    catch { setIsFollowing((f) => !f); setFollowersCount((c) => isFollowing ? c + 1 : c - 1); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ username: editUsername, bio: editBio, avatar: editAvatar });
      setProfileUser((u) => u ? { ...u, username: editUsername, bio: editBio, avatar: editAvatar } : u);
      setEditing(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex items-end gap-6 mb-8">
          <div className="w-32 h-32 rounded-full bg-yt-hover" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-yt-hover rounded w-1/3" />
            <div className="h-4 bg-yt-hover rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-video rounded-xl bg-yt-hover" />
              <div className="h-4 bg-yt-hover rounded w-3/4" />
              <div className="h-3 bg-yt-hover rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-yt-sub text-lg">المستخدم غير موجود</p>
        <Link to="/" className="btn-yt-secondary mt-4 px-6 py-2.5">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Channel banner / header */}
      <div className="relative">
        {/* Gradient banner */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-naqaa-900 via-naqaa-800 to-yt-card" />

        {/* Profile info bar */}
        <div className="bg-yt-bg px-4 md:px-6 py-5 flex flex-col md:flex-row gap-5 items-center md:items-end border-b border-yt-border">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-20 md:h-20 rounded-full bg-naqaa-700 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shrink-0 ring-4 ring-yt-bg -mt-12 md:-mt-10">
            {profileUser.avatar
              ? <img src={profileUser.avatar} alt={profileUser.username} className="w-full h-full object-cover" />
              : profileUser.username.charAt(0)
            }
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-yt-text text-2xl font-bold">{profileUser.username}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-1.5 text-sm text-yt-sub flex-wrap">
              <span>{tapes.length} شريط</span>
              <span>{followersCount} متابع</span>
              <span>يتابع {followingCount}</span>
            </div>
            {profileUser.bio && !editing && (
              <p className="text-sm text-yt-sub mt-2 max-w-xl">{profileUser.bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwn ? (
              <>
                <Link to="/studio" className="btn-yt-secondary flex items-center gap-2">
                  <AudioLines size={16} /> استوديو نقاء
                </Link>
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="btn-yt-secondary flex items-center gap-1.5">
                      <Check size={16} /> حفظ
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-yt-ghost">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn-yt-secondary flex items-center gap-2">
                    <Pencil size={16} /> تعديل الملف
                  </button>
                )}
              </>
            ) : currentUser && (
              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isFollowing ? 'bg-yt-hover text-yt-text hover:bg-yt-line' : 'bg-yt-text text-yt-bg hover:bg-yt-text/90'
                }`}
              >
                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {isFollowing ? 'متابَع' : 'متابعة'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && isOwn && (
        <div className="mx-4 md:mx-6 mt-4 p-5 rounded-xl bg-yt-card border border-yt-border space-y-4">
          <div>
            <label className="block text-sm text-yt-sub mb-1.5">اسم المستخدم</label>
            <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="input-yt" />
          </div>
          <div>
            <label className="block text-sm text-yt-sub mb-1.5">رابط الصورة الشخصية</label>
            <input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://..." dir="ltr" className="input-yt" />
          </div>
          <div>
            <label className="block text-sm text-yt-sub mb-1.5">نبذة تعريفية</label>
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="input-yt resize-none" />
          </div>
        </div>
      )}

      {/* Tabs + tapes */}
      <div className="px-4 md:px-6 mt-6">
        <div className="border-b border-yt-border mb-6">
          <button className="pb-3 text-sm font-semibold text-yt-text border-b-2 border-yt-text px-1">
            الأشرطة
          </button>
        </div>

        {tapes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {tapes.map((tape) => <TapeCard key={tape.id} tape={tape} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-yt-sub">لا توجد أشرطة بعد</p>
            {isOwn && (
              <Link to="/create" className="btn-yt-primary mt-4 inline-flex px-6 py-2.5">أنشئ أول شريط</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
