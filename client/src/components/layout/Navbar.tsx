import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, Plus, Bell, User, LogOut, X, Mic,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [unread, setUnread] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Poll notification count
  useEffect(() => {
    if (!user) return;
    api.getNotifications()
      .then((r) => setUnread(r.unreadCount))
      .catch(() => {});
    const id = setInterval(() => {
      api.getNotifications().then((r) => setUnread(r.unreadCount)).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [user]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    setSearchActive(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-yt-bg border-b border-yt-border flex items-center px-4 gap-4">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="btn-yt-icon"
          aria-label="القائمة"
        >
          <Menu size={22} />
        </button>
        <Link to="/" className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-naqaa-700 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-5 h-5">
              <path d="M30 35 Q30 30 35 30 L65 30 Q70 30 70 35 L70 55 Q70 65 60 65 L40 65 Q30 65 30 55 Z"
                fill="none" stroke="#8acaa6" strokeWidth="5"/>
              <circle cx="50" cy="48" r="8" fill="none" stroke="#54ab7d" strokeWidth="5"/>
              <circle cx="50" cy="48" r="3.5" fill="#54ab7d"/>
              <path d="M25 72 Q50 80 75 72" fill="none" stroke="#54ab7d" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="hidden sm:block font-bold text-yt-text text-[17px] leading-none">
            نقاء
          </span>
        </Link>
      </div>

      {/* Center: search */}
      {searchActive ? (
        /* Mobile full-width search */
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 md:hidden">
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث..."
            className="flex-1 bg-yt-hover border border-yt-border rounded-full px-4 py-2 text-sm text-yt-text outline-none"
          />
          <button type="button" onClick={() => setSearchActive(false)} className="btn-yt-icon">
            <X size={20} />
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl items-center"
        >
          <div className="flex flex-1 h-10 border border-yt-border rounded-r-full bg-yt-card focus-within:border-[#a76e45] overflow-hidden">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن الأشرطة والمقاطع..."
              className="flex-1 px-4 bg-transparent text-sm text-yt-text placeholder:text-yt-sub outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-16 border border-r-0 border-yt-border rounded-l-full bg-yt-hover text-yt-sub hover:bg-yt-line flex items-center justify-center"
          >
            <Search size={19} />
          </button>
        </form>
      )}

      {/* Right */}
      <div className="flex items-center gap-1 shrink-0 mr-auto">
        {/* Mobile search icon */}
        {!searchActive && (
          <button
            onClick={() => setSearchActive(true)}
            className="btn-yt-icon md:hidden"
          >
            <Search size={22} />
          </button>
        )}

        {user ? (
          <>
            <Link to="/create" className="btn-yt-secondary hidden sm:inline-flex gap-2">
              <Plus size={18} />
              إنشاء
            </Link>

            {/* Notifications */}
            <Link to="/notifications" className="relative btn-yt-icon">
              <Bell size={22} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-yt-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden bg-naqaa-700 flex items-center justify-center text-sm font-bold text-white">
              {user.avatar
                ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                : user.username.charAt(0)
              }
            </Link>

            <button onClick={() => { logout(); navigate('/'); }} className="btn-yt-icon hidden sm:flex">
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 border border-yt-border rounded-full px-3 py-1.5 text-sm font-medium text-naqaa-700 hover:bg-yt-hover transition-colors"
          >
            <User size={17} />
            تسجيل الدخول
          </Link>
        )}
      </div>
    </header>
  );
}
