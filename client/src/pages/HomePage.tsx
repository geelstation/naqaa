import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, LoaderCircle, Radio, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { TapeWithDetails } from '../types';
import { CATEGORIES } from '../types';
import TapeCard from '../components/tapes/TapeCard';
import { usePlayerStore } from '../stores/playerStore';
import { getYouTubeVideoId } from '../utils/youtube';

const TABS = [{ value: 'all', label: 'الكل' }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))];
const STATIONS = [
  { id: 'quiet', title: 'موجة السكينة', description: 'تلاوات وأذكار', categories: ['quran', 'adhkar'], icon: '☾', tone: 'quiet' },
  { id: 'nasheed', title: 'موجة الأناشيد', description: 'أناشيد من الرف', categories: ['nasheed'], icon: '♫', tone: 'nasheed' },
  { id: 'knowledge', title: 'موجة المعرفة', description: 'محاضرات وثقافة', categories: ['lectures', 'culture'], icon: '✳', tone: 'knowledge' },
] as const;

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-video rounded-xl bg-yt-hover" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-yt-hover shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-yt-hover rounded w-3/4" />
          <div className="h-3 bg-yt-hover rounded w-1/2" />
          <div className="h-3 bg-yt-hover rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tapes, setTapes] = useState<TapeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRandomTapeId, setLastRandomTapeId] = useState<string | null>(null);
  const [radioLoading, setRadioLoading] = useState(false);
  const [radioMessage, setRadioMessage] = useState('');
  const loadTape = usePlayerStore((state) => state.loadTape);
  const setShowFullPlayer = usePlayerStore((state) => state.setShowFullPlayer);

  const q = searchParams.get('q') || '';
  const cat = searchParams.get('category') || 'all';
  const load = useCallback(() => {
    setLoading(true);
    const fetch = q
      ? api.searchTapes(q, cat === 'all' ? '' : cat)
      : api.getTapes({ limit: 60, category: cat === 'all' ? '' : cat });

    fetch
      .then((r) => setTapes(r.tapes))
      .catch(() => setTapes([]))
      .finally(() => setLoading(false));
  }, [q, cat]);

  useEffect(() => { load(); }, [load]);

  const setCategory = (v: string) => {
    setSearchParams(v === 'all' ? (q ? { q } : {}) : (q ? { q, category: v } : { category: v }));
  };

  const playStation = async (categories: readonly string[]) => {
    if (radioLoading) return;
    const stationTapes = tapes.filter((tape) => categories.includes(tape.category));
    if (stationTapes.length === 0) {
      setRadioMessage('ما لقينا شريطًا في الموجة دي حاليًا. جرّب موجة تانية.');
      return;
    }

    const candidates = stationTapes.filter((tape) => tape.id !== lastRandomTapeId);
    const choices = candidates.length > 0 ? candidates : stationTapes;
    const picked = choices[Math.floor(Math.random() * choices.length)];
    setLastRandomTapeId(picked.id);
    setRadioLoading(true);
    setRadioMessage('بنختار لك شريطًا من الرف...');
    try {
      const { tape } = await api.getTape(picked.id);
      if (!tape.tracks?.length) throw new Error('الشريط ده ما فيه مقاطع جاهزة للتشغيل.');
      loadTape(tape, 0);
      setShowFullPlayer(false);
      setRadioMessage(`على الموجة الآن: ${tape.title}`);
      if (getYouTubeVideoId(tape.tracks[0].url)) navigate(`/tape/${tape.id}`);
    } catch (error) {
      setRadioMessage(error instanceof Error ? error.message : 'تعذر تشغيل الشريط. جرّب مرة ثانية.');
    } finally {
      setRadioLoading(false);
    }
  };

  const browseTapes = () => {
    document.getElementById('tape-shelf')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      {/* Category chips — sticky below navbar */}
      <div className="category-strip sticky top-14 z-30 bg-yt-bg border-b border-yt-border">
        <div className="category-scroller flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar" aria-label="تصفية الأشرطة حسب التصنيف">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`chip shrink-0 ${cat === tab.value ? 'chip-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 md:px-6 pt-6">
        <div className="memory-hero">
          <div className="memory-hero-copy">
            <span className="memory-hero-kicker"><Sparkles size={14} /> مساحة للذكريات الجميلة</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-4 leading-tight">
              لكل صوتٍ حكاية
            </h1>
            <p className="text-sm sm:text-base text-[#f0dfc5] mt-2 leading-relaxed">
              اجمع مقاطعك في أشرطة، وارجع للحظاتك المفضلة كأنها أول مرة.
            </p>
            <div className="memory-hero-actions">
              <button type="button" onClick={browseTapes} className="memory-hero-secondary">
                تصفّح الرف
                <ArrowDown size={15} />
              </button>
            </div>
          </div>
          <svg
            viewBox="0 0 240 160"
            role="img"
            aria-label="شريط كاسيت قديم"
            className="memory-hero-art"
          >
            <defs>
              <linearGradient id="cassette-shell" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#f4dfb8" />
                <stop offset="1" stopColor="#c5a77b" />
              </linearGradient>
              <linearGradient id="cassette-label" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#bc7150" />
                <stop offset="1" stopColor="#d38c60" />
              </linearGradient>
            </defs>
            <rect x="13" y="12" width="214" height="136" rx="15" fill="#362a20" opacity=".3" />
            <rect x="8" y="6" width="214" height="136" rx="15" fill="url(#cassette-shell)" stroke="#f8e8c9" strokeWidth="3" />
            <rect x="25" y="20" width="180" height="45" rx="6" fill="url(#cassette-label)" />
            <path d="M37 33h92M37 43h65" stroke="#f5dfbd" strokeWidth="3" strokeLinecap="round" opacity=".8" />
            <text x="179" y="49" fill="#f8e8c9" fontSize="18" fontFamily="serif" textAnchor="middle">ذكريات</text>
            <rect x="29" y="75" width="172" height="47" rx="7" fill="#514438" />
            <circle cx="72" cy="98" r="18" fill="#e6d2ae" stroke="#8c7355" strokeWidth="3" />
            <circle cx="72" cy="98" r="6" fill="#8c7355" />
            <circle cx="158" cy="98" r="18" fill="#e6d2ae" stroke="#8c7355" strokeWidth="3" />
            <circle cx="158" cy="98" r="6" fill="#8c7355" />
            <path d="M82 89h66l10 9-10 9H82l-10-9z" fill="#bb9d73" opacity=".9" />
            <path d="M45 130h140" stroke="#9e8461" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="18" r="2" fill="#fff1d2" />
            <circle cx="210" cy="18" r="2" fill="#fff1d2" />
          </svg>
        </div>
      </section>

      {!q && cat === 'all' && tapes.length > 0 && !loading && (
        <section className="radio-station" aria-labelledby="radio-station-title">
          <div className="radio-station-heading">
            <span className="radio-station-icon"><Radio size={19} /></span>
            <div>
              <span className="radio-station-kicker">ما تدري وش تسمع؟</span>
              <h2 id="radio-station-title">اضبط الموجة، ونختار لك شريطًا</h2>
            </div>
            <span className="radio-live"><i /> راديو نقاء</span>
          </div>
          <div className="radio-station-options">
            {STATIONS.map((station) => {
              const stationCount = tapes.filter((tape) => station.categories.some((category) => category === tape.category)).length;
              return (
                <button
                  type="button"
                  key={station.id}
                  disabled={radioLoading || stationCount === 0}
                  onClick={() => playStation(station.categories)}
                  className={`radio-station-option radio-station-${station.tone}`}
                >
                  <span className="radio-station-option-icon">{station.icon}</span>
                  <span className="radio-station-option-copy">
                    <strong>{station.title}</strong>
                    <small>{radioLoading ? 'نقلب في الرف...' : station.description}</small>
                  </span>
                  <span className="radio-station-option-count">{stationCount}</span>
                </button>
              );
            })}
          </div>
          {radioMessage && (
            <p className={`radio-station-message ${radioLoading ? 'radio-station-message-loading' : ''}`} role="status">
              {radioLoading && <LoaderCircle size={14} className="animate-spin" />}
              {radioMessage}
            </p>
          )}
          <div className="radio-station-visualizer" aria-hidden="true">
            {Array.from({ length: 44 }, (_, index) => (
              <i key={index} style={{ height: `${12 + ((index * 17) % 25)}px`, animationDelay: `${(index % 9) * 90}ms` }} />
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <div id="tape-shelf" className="scroll-mt-32 px-4 md:px-6 py-6">
        {q && (
          <p className="text-yt-sub text-sm mb-4">
            نتائج البحث عن: <span className="text-yt-text font-medium">"{q}"</span>
          </p>
        )}
        {!q && tapes.length > 0 && !loading && (
          <div className="shelf-heading">
            <div>
              <span>اسحب شريطًا من الرف</span>
              <h2>أشرطة تستحق وقتك</h2>
            </div>
            <span className="shelf-count">{tapes.length} شريطًا</span>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : tapes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {tapes.map((tape) => <TapeCard key={tape.id} tape={tape} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-yt-hover flex items-center justify-center mb-4">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-yt-sub">
                <path d="M30 35 Q30 30 35 30 L65 30 Q70 30 70 35 L70 55 Q70 65 60 65 L40 65 Q30 65 30 55 Z"
                  fill="none" stroke="currentColor" strokeWidth="4"/>
                <circle cx="50" cy="48" r="8" fill="none" stroke="currentColor" strokeWidth="4"/>
                <circle cx="50" cy="48" r="3" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-yt-text font-semibold text-lg mb-2">
              {q ? 'لا توجد نتائج مطابقة' : 'لا توجد أشرطة بعد'}
            </h3>
            <p className="text-yt-sub text-sm">
              {q ? 'جرّب كلمات بحث مختلفة' : 'كن أول من ينشر شريطًا'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
