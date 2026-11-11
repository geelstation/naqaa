import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Bookmark, History, Mic2, ThumbsUp } from 'lucide-react';
import { api } from '../services/api';
import type { TapeWithDetails } from '../types';
import { useAuthStore } from '../stores/authStore';
import TapeCard from '../components/tapes/TapeCard';

type Tab = 'my-tapes' | 'library' | 'history';

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-video rounded-xl bg-yt-hover" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-yt-hover shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-yt-hover rounded w-3/4" />
          <div className="h-3 bg-yt-hover rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as Tab | null;
  const tab: Tab = rawTab && ['my-tapes', 'library', 'history'].includes(rawTab) ? rawTab : 'my-tapes';

  const [tapes, setTapes] = useState<TapeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const fn = tab === 'library' ? api.getLibrary() : tab === 'history' ? api.getHistory() : api.getMyTapes();
    fn.then((r) => setTapes(r.tapes)).catch(() => setTapes([])).finally(() => setLoading(false));
  }, [tab, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-yt-hover flex items-center justify-center mb-4">
          <Mic2 size={36} className="text-yt-sub" />
        </div>
        <h2 className="text-yt-text text-xl font-semibold mb-2">سجّل الدخول للوصول إلى مكتبتك</h2>
        <p className="text-yt-sub mb-6">بعد تسجيل الدخول يمكنك حفظ الأشرطة ومتابعة استماعك</p>
        <Link to="/login" className="btn-yt-primary px-6 py-2.5">تسجيل الدخول</Link>
      </div>
    );
  }

  const tabs = [
    { value: 'my-tapes' as Tab, label: 'أشرطتي', icon: Mic2 },
    { value: 'library' as Tab, label: 'المحفوظات', icon: Bookmark },
    { value: 'history' as Tab, label: 'السجل', icon: History },
  ];

  const emptyMessages: Record<Tab, { title: string; desc: string; action: React.ReactNode }> = {
    'my-tapes': {
      title: 'لم تنشئ أي شريط بعد',
      desc: 'ابدأ بإنشاء شريطك الأول',
      action: <Link to="/create" className="btn-yt-primary flex items-center gap-2 px-6 py-2.5"><Plus size={18} />أنشئ شريطًا</Link>,
    },
    'library': {
      title: 'لا توجد أشرطة محفوظة',
      desc: 'احفظ الأشرطة التي تعجبك',
      action: <Link to="/" className="btn-yt-secondary px-6 py-2.5">اكتشف الأشرطة</Link>,
    },
    'history': {
      title: 'لا يوجد سجل استماع',
      desc: 'استمع إلى الأشرطة وستظهر هنا',
      action: <Link to="/" className="btn-yt-secondary px-6 py-2.5">ابدأ الاستماع</Link>,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <h1 className="text-yt-text text-2xl font-bold mb-6">المكتبة</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1 border-b border-yt-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setSearchParams({ tab: t.value })}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-yt-text text-yt-text'
                  : 'border-transparent text-yt-sub hover:text-yt-text'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tapes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {tapes.map((tape) => <TapeCard key={tape.id} tape={tape} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-yt-hover flex items-center justify-center mb-4">
            {(() => { const Icon = tabs.find((t) => t.value === tab)!.icon; return <Icon size={36} className="text-yt-sub" />; })()}
          </div>
          <h3 className="text-yt-text font-semibold text-lg mb-2">{emptyMessages[tab].title}</h3>
          <p className="text-yt-sub text-sm mb-6">{emptyMessages[tab].desc}</p>
          {emptyMessages[tab].action}
        </div>
      )}
    </div>
  );
}
