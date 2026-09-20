import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.js';
import { useAuthStore } from '../stores';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const setAuth = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const password = watch('password', '');
  const passwordStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 || !/[A-Z]/.test(password) ? 2
    : 3;
  const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError('');
    try {
      const response = await authService.register(values.name, values.email, values.password);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = ['Academic tracking', 'Goal setting', 'Spiritual discipline', 'Focus timer'];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0D2A4A 50%, #061020 100%)' }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle at top left, #00B4D8, transparent 60%)' }}
      />

      {/* Logo + Features */}
      <div className="px-6 pt-safe pt-12 pb-6">
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/tracksenselogo.png" alt="TrackSense" className="h-8 w-auto" />
          <span className="text-lg font-bold text-white">TrackSense</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Start your journey</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-1.5">
              <Check size={12} className="text-[#00B4D8]" strokeWidth={2.5} />
              <span className="text-xs text-[#90E0EF]">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-end">
        <div
          className="bg-white rounded-t-3xl px-6 pt-8"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <h2 className="text-xl font-bold text-[#0A1628] mb-6">Create your account</h2>

          {serverError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                {...register('name', { required: 'Name is required' })}
                className="w-full h-14 px-4 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-[#0A1628] text-base placeholder-[#CBD5E1] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition-all"
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' } })}
                className="w-full h-14 px-4 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-[#0A1628] text-base placeholder-[#CBD5E1] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition-all"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
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
              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map((level) => (
                      <div
                        key={level}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: passwordStrength >= level ? strengthColors[passwordStrength] : '#E8F4F8' }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strengthColors[passwordStrength] }}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-[#4A6080] uppercase tracking-wide mb-2 block">
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className="w-full h-14 px-4 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-[#0A1628] text-base placeholder-[#CBD5E1] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition-all"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #00B4D8 0%, #0A1628 100%)' }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A6080] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#00B4D8]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
