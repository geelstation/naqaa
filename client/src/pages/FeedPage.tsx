import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rss } from 'lucide-react';
import { api } from '../services/api';
import type { TapeWithDetails } from '../types';
import { useAuthStore } from '../stores/authStore';
import TapeCard from '../components/tapes/TapeCard';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [tapes, setTapes] = useState<TapeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getFeed()
      .then((r) => setTapes(r.tapes))
      .catch(() => setTapes([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Rss size={48} className="text-yt-sub mb-4" />
        <h2 className="text-yt-text text-xl font-semibold mb-2">سجّل الدخول لرؤية التغذية</h2>
        <p className="text-yt-sub mb-6 max-w-sm">تابع منشئيك المفضلين وشاهد أشرطتهم الجديدة هنا</p>
        <Link to="/login" className="btn-yt-primary px-6 py-2.5">تسجيل الدخول</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 animate-pulse">
            <div className="aspect-video rounded-xl bg-yt-hover" />
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-yt-hover shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-yt-hover rounded w-3/4" />
                <div className="h-3 bg-yt-hover rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tapes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Rss size={48} className="text-yt-sub mb-4" />
        <h2 className="text-yt-text text-xl font-semibold mb-2">تغذيتك فارغة</h2>
        <p className="text-yt-sub mb-6 max-w-sm">تابع بعض المنشئين لترى أشرطتهم الجديدة هنا</p>
        <Link to="/" className="btn-yt-secondary px-6 py-2.5">اكتشف المنشئين</Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6">
      <h1 className="text-yt-text text-xl font-bold mb-6 flex items-center gap-2">
        <Rss size={22} className="text-naqaa-400" />
        تغذيتك
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {tapes.map((tape) => <TapeCard key={tape.id} tape={tape} />)}
      </div>
    </div>
  );
}
