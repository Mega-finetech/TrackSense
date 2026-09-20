import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0D2A4A 50%, #061020 100%)' }}
    >
      {/* Top decorative glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle at top right, #00B4D8, transparent 60%)' }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pt-safe pt-14 pb-8">
        <img src="/tracksenselogo.png" alt="TrackSense" className="h-8 w-auto" />
        <span className="text-lg font-bold text-white">TrackSense</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="bg-white rounded-t-3xl px-6 pt-8 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>

          <h1 className="text-2xl font-bold text-[#0A1628] mb-1">Welcome back</h1>
          <p className="text-sm text-[#4A6080] mb-8">Sign in to continue your journey</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full h-14 px-4 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-[#0A1628] text-base placeholder-[#CBD5E1] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full h-14 px-4 pr-12 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-[#0A1628] text-base placeholder-[#CBD5E1] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8BA3B8] w-auto h-auto min-h-0 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D3A5C 100%)' }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A6080] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#00B4D8]">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
