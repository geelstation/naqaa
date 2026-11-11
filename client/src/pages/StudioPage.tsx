import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AudioLines, Bookmark, Check, CircleDollarSign, CreditCard, Eye, EyeOff,
  Headphones, MessageCircle, Pencil, Plus, Settings, Users, Wallet,
} from 'lucide-react';
import { api } from '../services/api';
import type { StudioSummary, StudioTape } from '../types';
import { useAuthStore } from '../stores/authStore';
import { formatPlayCount } from '../utils/format';

const numberFormat = new Intl.NumberFormat('ar');

export default function StudioPage() {
  const { user, updateProfile } = useAuthStore();
  const [studio, setStudio] = useState<StudioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingTapeId, setUpdatingTapeId] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    api.getStudio()
      .then(setStudio)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'تعذر تحميل الاستوديو'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setProfileSaved(false);
    try {
      await updateProfile({ username: username.trim(), bio: bio.trim(), avatar: avatar.trim() });
      setProfileSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ إعدادات الملف الشخصي');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVisibility = async (tape: StudioTape) => {
    setUpdatingTapeId(tape.id);
    setError('');
    try {
      const { tape: updatedTape } = await api.updateTape(tape.id, { isPublic: !tape.isPublic });
      setStudio((current) => current && ({
        ...current,
        tapes: current.tapes.map((item) => item.id === tape.id
          ? { ...item, isPublic: updatedTape.isPublic }
          : item),
        stats: {
          ...current.stats,
          publicTapeCount: current.stats.publicTapeCount + (updatedTape.isPublic ? 1 : -1),
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تغيير ظهور الشريط');
    } finally {
      setUpdatingTapeId(null);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <AudioLines size={42} className="mb-4 text-yt-sub" />
        <h1 className="text-xl font-bold text-yt-text">استوديو نقاء خاص بصنّاع الأشرطة</h1>
        <p className="mt-2 text-sm text-yt-sub">سجّل الدخول لمتابعة إحصاءاتك وإدارة أشرطتك.</p>
        <Link to="/login" className="btn-yt-primary mt-6 px-6">تسجيل الدخول</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-5 px-4 py-8 md:px-6">
        <div className="h-36 rounded-3xl bg-yt-hover" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 rounded-2xl bg-yt-hover" />)}
        </div>
      </div>
    );
  }

  const stats = studio?.stats;
  const maxActivity = Math.max(...(studio?.activity.map((day) => day.count) || [0]), 1);
  const statCards = [
    { label: 'إجمالي التشغيلات', value: formatPlayCount(stats?.playCount || 0), icon: Headphones },
    { label: 'إضافات للمكتبة', value: numberFormat.format(stats?.saveCount || 0), icon: Bookmark },
    { label: 'مستمعون مسجلون', value: numberFormat.format(stats?.listenerCount || 0), icon: AudioLines },
    { label: 'تعليقات على أشرطتك', value: numberFormat.format(stats?.commentCount || 0), icon: MessageCircle },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <section className="memory-hero">
        <div className="memory-hero-copy">
          <span className="memory-hero-kicker"><AudioLines size={14} /> استوديو نقاء</span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">مساحة أشرطتك وذكرياتك</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#f0dfc5] sm:text-base">
            تابع أثر أشرطتك، واعرف عدد مرات تشغيلها وحفظها، وأدر إعدادات النشر من مكان واحد.
          </p>
        </div>
        <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center sm:block">
          <p className="text-sm text-[#f0dfc5]">أشرطة منشورة</p>
          <p className="mt-1 text-3xl font-bold">{numberFormat.format(stats?.publicTapeCount || 0)}</p>
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-yt-border bg-yt-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-yt-border px-5 py-5 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-yt-text">
              <CircleDollarSign size={21} className="text-[#805536]" /> تحقيق الربح
            </h2>
            <p className="mt-1 text-sm text-yt-sub">ملخص أرباحك ومصادر الدخل من مكان واحد.</p>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            غير مفعّل
          </span>
        </div>

        <div className="grid gap-px bg-yt-border sm:grid-cols-2">
          <div className="bg-yt-card px-5 py-5 sm:px-6">
            <p className="text-sm text-yt-sub">إجمالي الأرباح</p>
            <p className="mt-2 text-3xl font-bold text-yt-text">—</p>
            <p className="mt-1 text-xs text-yt-muted">ستظهر البيانات بعد ربط مزودي الربح.</p>
          </div>
          <div className="bg-yt-card px-5 py-5 sm:px-6">
            <p className="text-sm text-yt-sub">الرصيد المتاح للدفع</p>
            <p className="mt-2 text-3xl font-bold text-yt-text">—</p>
            <p className="mt-1 text-xs text-yt-muted">لا توجد مدفوعات مفعّلة حاليًا.</p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex items-start gap-3 rounded-xl border border-yt-border bg-[#fffdf8] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yt-hover text-[#805536]">
              <AudioLines size={19} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-yt-text">أرباح الإعلانات</h3>
              <p className="mt-1 text-xs leading-relaxed text-yt-sub">غير متاحة قبل ربط خدمة الإعلانات وبدء تسجيل أرباحها.</p>
              <span className="mt-2 inline-block text-[11px] font-semibold text-amber-800">الخدمة غير متصلة</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-yt-border bg-[#fffdf8] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yt-hover text-[#805536]">
              <Users size={19} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-yt-text">دعم واشتراكات المستمعين</h3>
              <p className="mt-1 text-xs leading-relaxed text-yt-sub">إدارة دعم الجمهور والاشتراكات ستتوفر بعد ربط مزود المدفوعات.</p>
              <span className="mt-2 inline-block text-[11px] font-semibold text-amber-800">الخدمة غير متصلة</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-yt-border bg-[#fffdf8] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yt-hover text-[#805536]">
              <CreditCard size={19} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-yt-text">طريقة استلام الأرباح</h3>
              <p className="mt-1 text-xs leading-relaxed text-yt-sub">لن تُطلب أو تُخزّن بيانات دفع قبل اختيار مزود وربطه بأمان.</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-yt-muted"><Wallet size={13} /> غير مُعدّة</span>
            </div>
          </div>
        </div>
        <p className="mx-4 mb-4 rounded-lg bg-yt-hover/70 px-4 py-3 text-xs leading-relaxed text-yt-sub sm:mx-5">
          تنبيه: عدد الاستماعات وحده لا يحدد الأرباح. لن نعرض مبالغ تقديرية أو رصيدًا قابلًا للسحب قبل توصيل خدمات الإعلانات والمدفوعات فعليًا.
        </p>
      </section>

      <section aria-label="ملخص الأداء" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-yt-border bg-yt-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-yt-sub sm:text-sm">{label}</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yt-hover text-[#805536]">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-yt-text sm:text-3xl">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <section className="rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-yt-text">أشرطتي</h2>
              <p className="mt-1 text-sm text-yt-sub">
                {numberFormat.format(stats?.tapeCount || 0)} شريط · {numberFormat.format(stats?.publicTapeCount || 0)} منشور
              </p>
            </div>
            <Link to="/create" className="btn-yt-primary px-4 py-2">
              <Plus size={17} /> شريط جديد
            </Link>
          </div>

          {studio?.tapes.length ? (
            <div className="mt-5 space-y-3">
              {studio.tapes.map((tape) => (
                <article key={tape.id} className="rounded-xl border border-yt-border bg-[#fffdf8] p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/tape/${tape.id}`} className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-yt-border bg-yt-hover sm:h-20 sm:w-32">
                      {tape.coverImage ? (
                        <img src={tape.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-yt-muted"><AudioLines size={24} /></div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/tape/${tape.id}`} className="line-clamp-2 font-semibold text-yt-text hover:text-[#805536]">
                        {tape.title}
                      </Link>
                      <p className="mt-1 text-xs text-yt-sub">{tape.trackCount || 0} مقاطع</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-yt-sub">
                        <span className="inline-flex items-center gap-1"><Headphones size={14} /> {formatPlayCount(tape.playCount)} تشغيل</span>
                        <span className="inline-flex items-center gap-1"><Users size={14} /> {numberFormat.format(tape.listenerCount)} مستمع</span>
                        <span className="inline-flex items-center gap-1"><Bookmark size={14} /> {numberFormat.format(tape.saveCount)} حفظ</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {numberFormat.format(tape.commentCount || 0)} تعليق</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tape.isPublic ? 'bg-green-100 text-green-800' : 'bg-yt-hover text-yt-sub'}`}>
                      {tape.isPublic ? 'عام' : 'خاص'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-yt-border pt-3">
                    <button
                      type="button"
                      onClick={() => handleVisibility(tape)}
                      disabled={updatingTapeId === tape.id}
                      className="btn-yt-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {tape.isPublic ? <EyeOff size={15} /> : <Eye size={15} />}
                      {updatingTapeId === tape.id ? 'جارٍ التحديث...' : tape.isPublic ? 'اجعله خاصًا' : 'انشر الشريط'}
                    </button>
                    <Link to={`/edit/${tape.id}`} className="btn-yt-secondary px-3 py-1.5 text-xs">
                      <Pencil size={15} /> تعديل
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <AudioLines size={32} className="mx-auto text-yt-muted" />
              <p className="mt-3 font-semibold text-yt-text">لسه ما أنشأتش أي شريط</p>
              <p className="mt-1 text-sm text-yt-sub">ابدأ بتجميع أول مجموعة مقاطعك.</p>
              <Link to="/create" className="btn-yt-primary mt-4 px-5"><Plus size={16} /> أنشئ شريطًا</Link>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-yt-text">
              <AudioLines size={19} className="text-[#805536]" /> نشاط الاستماع
            </h2>
            <p className="mt-1 text-sm text-yt-sub">الاستماعات المسجلة خلال آخر 7 أيام</p>
            <div className="mt-6 flex h-36 items-end justify-between gap-2" role="img" aria-label="رسم بياني للاستماعات المسجلة خلال آخر سبعة أيام">
              {studio?.activity.map((day) => (
                <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] text-yt-sub">{day.count ? numberFormat.format(day.count) : ''}</span>
                  <div className="flex h-24 w-full items-end rounded-t-md bg-yt-hover">
                    <div
                      className="w-full rounded-t-md bg-[#a76e45] transition-all"
                      style={{ height: `${day.count ? Math.max((day.count / maxActivity) * 100, 8) : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-yt-sub">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-yt-text">
              <Settings size={19} className="text-[#805536]" /> إعدادات الملف الشخصي
            </h2>
            <p className="mt-1 text-sm text-yt-sub">المعلومات الظاهرة على صفحتك العامة.</p>
            <form onSubmit={handleProfileSave} className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-yt-sub">
                اسم المستخدم
                <input required maxLength={30} value={username} onChange={(event) => setUsername(event.target.value)} className="input-yt mt-1.5 text-sm" />
              </label>
              <label className="block text-xs font-medium text-yt-sub">
                رابط الصورة الشخصية
                <input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://..." dir="ltr" className="input-yt mt-1.5 text-sm" />
              </label>
              <label className="block text-xs font-medium text-yt-sub">
                نبذة تعريفية
                <textarea maxLength={300} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} className="input-yt mt-1.5 resize-y text-sm" />
              </label>
              <div className="flex items-center justify-between gap-2 pt-1">
                {profileSaved && <span className="flex items-center gap-1 text-xs text-green-700"><Check size={15} /> تم الحفظ</span>}
                <button type="submit" disabled={savingProfile} className="btn-yt-primary mr-auto px-4 py-2 text-xs disabled:opacity-50">
                  {savingProfile ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </div>
            </form>
          </section>

          <div className="flex items-center gap-2 rounded-xl border border-yt-border bg-yt-card px-4 py-3 text-sm text-yt-sub">
            <Users size={17} />
            <span>متابعوك</span>
            <strong className="mr-auto text-yt-text">{numberFormat.format(stats?.followersCount || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
