import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CreateTapePage from './pages/CreateTapePage';
import EditTapePage from './pages/EditTapePage';
import TapeDetailsPage from './pages/TapeDetailsPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import NotificationsPage from './pages/NotificationsPage';
import StudioPage from './pages/StudioPage';
import MiniPlayer from './components/player/MiniPlayer';
import FullPlayer from './components/player/FullPlayer';
import YouTubePlayer from './components/player/YouTubePlayer';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/create" element={<CreateTapePage />} />
          <Route path="/edit/:id" element={<EditTapePage />} />
          <Route path="/tape/:id" element={<TapeDetailsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/user/:username" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
      <MiniPlayer />
      <FullPlayer />
      <YouTubePlayer />
    </BrowserRouter>
  );
}
