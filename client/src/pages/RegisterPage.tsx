import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-yt-card border border-yt-border rounded-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-naqaa-700 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M30 35 Q30 30 35 30 L65 30 Q70 30 70 35 L70 55 Q70 65 60 65 L40 65 Q30 65 30 55 Z" fill="none" stroke="#8acaa6" strokeWidth="5"/>
                <circle cx="50" cy="48" r="8" fill="none" stroke="#54ab7d" strokeWidth="5"/>
                <circle cx="50" cy="48" r="3.5" fill="#54ab7d"/>
              </svg>
            </div>
          </div>
          <h1 className="text-yt-text text-xl font-bold text-center mb-1">إنشاء حساب</h1>
          <p className="text-yt-sub text-sm text-center mb-6">انضم إلى نقاء</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-yt-sub mb-1.5">اسم المستخدم</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="input-yt" placeholder="اسمك الظاهر" />
            </div>
            <div>
              <label className="block text-sm text-yt-sub mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="input-yt text-right" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-yt-sub mb-1.5">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-yt" placeholder="6 أحرف على الأقل" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-naqaa-700 hover:bg-naqaa-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center text-yt-sub text-sm mt-6">
            لديك حساب؟{' '}
            <Link to="/login" className="text-blue-400 hover:underline font-medium">سجّل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
