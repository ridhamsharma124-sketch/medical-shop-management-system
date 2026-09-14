import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { login } from '../../features/authSlice.js';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate(result.payload.user.role === 'admin' ? '/admin' : '/pharmacist');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      {/* Left — image with overlay + bottom-aligned text */}
      <div className="relative hidden h-screen overflow-hidden lg:block">
        <img
          src="/auth-bg.jpg"
          alt="Medicine shelf in a pharmacy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 backdrop-blur-md">
            <Shield size={15} className="text-white" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white">
              MedHeritage
            </span>
          </span>

          <h2 className="max-w-[420px] text-4xl font-bold leading-[1.15] text-white">
            Manage Your Pharmacy
            <br />
            with Confidence
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[15px] font-normal leading-relaxed text-white/80">
            Billing, inventory, and customer records — everything your medical shop needs in one place.
          </p>
        </div>
      </div>

      {/* Right — form on cream background */}
      <div className="flex min-h-screen items-center justify-center bg-bgprimary px-5 py-12 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-accent text-white">
              <Shield size={22} strokeWidth={2.5} />
            </span>
            <span className="mt-2 text-lg font-bold tracking-tight text-heading">MedHeritage</span>
          </div>

          <h1 className="text-4xl font-bold text-heading">Welcome back</h1>
          <p className="mt-2 text-[15px] text-body">Sign in to your MedHeritage account</p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-[13px] font-medium text-heading">
                Email address
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <Mail size={16} className="shrink-0 text-body" />
                <input
                  type="email"
                  id="login-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[15px] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-pass" className="text-[13px] font-medium text-heading">
                Password
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <Lock size={16} className="shrink-0 text-body" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="login-pass"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[15px] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="text-body transition-colors hover:text-heading"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <a href="#" className="mt-1 text-right text-[13px] font-medium text-accent transition-opacity hover:opacity-80">
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-2 h-12 w-full rounded-[10px] bg-accent text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-[15px] text-body">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-accent transition-opacity hover:opacity-80">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}