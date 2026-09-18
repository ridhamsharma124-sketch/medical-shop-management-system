import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, Phone, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, verifyOtp, resendOtp, clearError } from '../../features/authSlice.js';
import CustomSelect from '../../components/ui/CustomSelect';

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register({ name, email, phone, password, role: 'pharmacist' }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Account created — OTP sent to your email');
      setOtpSentTo(email);
      setStep('otp');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await dispatch(verifyOtp({ email, otp }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Account verified — welcome to MedHeritage!');
      navigate('/pharmacist');
    } else {
      toast.error(result.payload || 'OTP verification failed');
    }
  };

  const handleResend = async () => {
    const result = await dispatch(resendOtp({ email }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('OTP re-sent to your email');
    } else {
      toast.error(result.payload || 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    setOtp('');
    dispatch(clearError());
    setStep('form');
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
            Start Managing Your
            <br />
            Pharmacy Today
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[15px] font-normal leading-relaxed text-white/80">
            Create your free pharmacist account and get instant access to billing and inventory.
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

          <h1 className="text-4xl font-bold text-heading">Create Account</h1>
          <p className="mt-2 text-[15px] text-body">Sign up as a pharmacist</p>

          {step === 'form' ? (
            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-name" className="text-[13px] font-medium text-heading">
                First name
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <User size={16} className="shrink-0 text-body" />
                <input
                  type="text"
                  id="signup-name"
                  placeholder="John"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[15px] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-[13px] font-medium text-heading">
                Email
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <Mail size={16} className="shrink-0 text-body" />
                <input
                  type="email"
                  id="signup-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[15px] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-phone" className="text-[13px] font-medium text-heading">
                Phone number
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <Phone size={16} className="shrink-0 text-body" />
                <input
                  type="tel"
                  id="signup-phone"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[15px] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-role" className="text-[13px] font-medium text-heading">
                Account role
              </label>
              <CustomSelect
                value="pharmacist"
                onChange={() => {}}
                size="lg"
                options={[{ value: 'pharmacist', label: 'Pharmacist' }]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-pass" className="text-[13px] font-medium text-heading">
                Password
              </label>
              <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                <Lock size={16} className="shrink-0 text-body" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="signup-pass"
                  placeholder="Create a strong password"
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
              <span className="text-xs text-body">8+ characters, uppercase, number and special character</span>
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
              {status === 'loading' ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          ) : (
            <div className="mt-8">
              <div className="rounded-[16px] border border-line bg-surface p-7">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-accent/10 text-accent">
                  <KeyRound size={26} strokeWidth={2} />
                </span>
                <h2 className="mt-5 text-center text-xl font-bold text-heading">Verify your email</h2>
                <p className="mt-2 text-center text-[14px] leading-relaxed text-body">
                  We've sent a 6-digit OTP to
                  <br />
                  <span className="font-semibold text-heading">{otpSentTo}</span>
                </p>

                <form className="mt-6 flex flex-col gap-4" onSubmit={handleVerify}>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="otp-input" className="text-[13px] font-medium text-heading">
                      Enter OTP
                    </label>
                    <div className="flex h-[52px] items-center gap-2.5 rounded-[10px] border border-line bg-bgprimary px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/10">
                      <KeyRound size={16} className="shrink-0 text-body" />
                      <input
                        type="text"
                        id="otp-input"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="h-full w-full border-none bg-transparent text-center text-2xl font-bold tracking-[0.5em] text-heading placeholder:text-[#B5A99A] focus:outline-none"
                      />
                    </div>
                    <span className="text-xs text-body">6-digit code, valid for 10 minutes</span>
                  </div>

                  {error && (
                    <div className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || otp.length !== 6}
                    className="mt-2 h-12 w-full rounded-[10px] bg-accent text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Verifying...' : 'Verify & Create Account'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={status === 'loading'}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 text-[14px] font-semibold text-accent transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    Resend OTP
                  </button>
                </form>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[14px] font-medium text-body transition-colors hover:text-heading"
              >
                <ArrowLeft size={15} />
                Back to registration form
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-[15px] text-body">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent transition-opacity hover:opacity-80">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}