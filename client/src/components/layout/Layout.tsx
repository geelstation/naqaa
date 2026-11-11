import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { usePlayerStore } from '../../stores/playerStore';

export default function Layout() {
  const currentTape = usePlayerStore((s) => s.currentTape);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTapePage = useLocation().pathname.startsWith('/tape/');

  return (
    <div className="min-h-screen bg-yt-bg">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex pt-14">
        <Sidebar open={sidebarOpen} />

        <main
          className={[
            'flex-1 min-w-0 transition-all duration-200',
            sidebarOpen ? 'md:mr-60' : 'md:mr-[72px]',
            currentTape && !isTapePage ? 'pb-32 md:pb-24' : 'pb-4',
          ].filter(Boolean).join(' ')}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
