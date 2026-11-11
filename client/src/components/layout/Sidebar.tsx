import { Link, useLocation } from 'react-router-dom';
import {
  Home, Flame, Library, History, ThumbsUp,
  User, Plus, Rss, LogIn, AudioLines,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const mainLinks = [
    { to: '/', label: 'الرئيسية', icon: Home, exact: true },
    { to: '/feed', label: 'التغذية', icon: Rss, auth: true },
  ];

  const libraryLinks = [
    { to: '/library', label: 'مكتبتي', icon: Library, auth: true },
    { to: '/library?tab=history', label: 'السجل', icon: History, auth: true },
    { to: '/library?tab=liked', label: 'المُعجَب به', icon: ThumbsUp, auth: true },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={[
          'fixed right-0 top-14 bottom-0 z-40 hidden md:flex flex-col overflow-y-auto overflow-x-hidden',
          'bg-yt-bg border-l border-yt-border transition-[width] duration-200',
          open ? 'w-60' : 'w-[72px]',
        ].join(' ')}
      >
        <div className="py-3">
          {/* Main nav */}
          {mainLinks.map((link) => {
            if (link.auth && !user) return null;
            const Icon = link.icon;
            const active = isActive(link.to, link.exact);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'flex items-center py-2.5 rounded-xl mx-2 text-sm transition-colors',
                  open ? 'gap-5 px-4' : 'justify-center px-0',
                  active
                    ? 'bg-yt-hover text-yt-text font-semibold'
                    : 'text-yt-sub hover:bg-yt-hover hover:text-yt-text',
                ].join(' ')}
              >
                <Icon size={21} />
                {open && link.label}
              </Link>
            );
          })}

          {open && <div className="border-t border-yt-border my-3 mx-4" />}
          {!open && <div className="border-t border-yt-border my-3 mx-3" />}

          {/* Library */}
          {user && (
            <>
              {open && <p className="px-6 pb-2 text-xs font-semibold text-yt-muted uppercase tracking-wide">المكتبة</p>}
              {libraryLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname + location.search === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={[
                      'flex items-center py-2.5 rounded-xl mx-2 text-sm transition-colors',
                      open ? 'gap-5 px-4' : 'justify-center px-0',
                      active
                        ? 'bg-yt-hover text-yt-text font-semibold'
                        : 'text-yt-sub hover:bg-yt-hover hover:text-yt-text',
                    ].join(' ')}
                  >
                    <Icon size={21} />
                    {open && link.label}
                  </Link>
                );
              })}
            </>
          )}

          {open && <div className="border-t border-yt-border my-3 mx-4" />}
          {!open && <div className="border-t border-yt-border my-3 mx-3" />}

          {/* User links */}
          {user ? (
            <>
              {open && <p className="px-6 pb-2 text-xs font-semibold text-yt-muted uppercase tracking-wide">حسابي</p>}
              <Link
                to="/profile"
                className={[
                  'flex items-center py-2.5 rounded-xl mx-2 text-sm transition-colors',
                  open ? 'gap-5 px-4' : 'justify-center px-0',
                  isActive('/profile') || isActive('/user/')
                    ? 'bg-yt-hover text-yt-text font-semibold'
                    : 'text-yt-sub hover:bg-yt-hover hover:text-yt-text',
                ].join(' ')}
              >
                <User size={21} />
                {open && 'قناتي'}
              </Link>
              <Link
                to="/studio"
                className={[
                  'flex items-center py-2.5 rounded-xl mx-2 text-sm transition-colors',
                  open ? 'gap-5 px-4' : 'justify-center px-0',
                  isActive('/studio')
                    ? 'bg-yt-hover text-yt-text font-semibold'
                    : 'text-yt-sub hover:bg-yt-hover hover:text-yt-text',
                ].join(' ')}
              >
                <AudioLines size={21} />
                {open && 'استوديو نقاء'}
              </Link>
              <Link
                to="/create"
                className={[
                  'flex items-center py-2.5 rounded-xl mx-2 text-sm text-yt-sub hover:bg-yt-hover hover:text-yt-text transition-colors',
                  open ? 'gap-5 px-4' : 'justify-center px-0',
                ].join(' ')}
              >
                <Plus size={21} />
                {open && 'شريط جديد'}
              </Link>
            </>
          ) : (
            open && (
              <div className="mx-4 p-4 rounded-xl bg-yt-hover">
                <p className="text-sm text-yt-text mb-3 leading-relaxed">
                  سجّل الدخول لمتابعة المنشئين وإنشاء أشرطتك
                </p>
                <Link
                  to="/login"
                  className="flex items-center gap-2 border border-[#a76e45] text-[#805536] rounded-full px-4 py-1.5 text-sm hover:bg-[#a76e45]/10 transition-colors"
                >
                  <LogIn size={17} />
                  تسجيل الدخول
                </Link>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50 bg-yt-bg border-t border-yt-border flex items-center">
        <Link to="/" className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 ${isActive('/', true) ? 'text-yt-text' : 'text-yt-muted'}`}>
          <Home size={22} />
          الرئيسية
        </Link>
        {user && (
          <Link to="/feed" className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 ${isActive('/feed') ? 'text-yt-text' : 'text-yt-muted'}`}>
            <Rss size={22} />
            التغذية
          </Link>
        )}
        <Link to="/create" className="flex-1 flex flex-col items-center gap-1 text-xs py-2 text-yt-muted">
          <div className="w-9 h-9 -mt-2 rounded-full bg-naqaa-700 flex items-center justify-center text-white">
            <Plus size={20} />
          </div>
          إنشاء
        </Link>
        <Link to="/library" className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 ${isActive('/library') ? 'text-yt-text' : 'text-yt-muted'}`}>
          <Library size={22} />
          مكتبتي
        </Link>
        <Link to={user ? '/profile' : '/login'} className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 ${isActive('/profile') ? 'text-yt-text' : 'text-yt-muted'}`}>
          <User size={22} />
          {user ? 'أنا' : 'دخول'}
        </Link>
      </nav>
    </>
  );
}
