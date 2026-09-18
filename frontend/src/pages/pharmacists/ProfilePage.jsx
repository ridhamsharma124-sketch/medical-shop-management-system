import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Lock,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProfileData, updateProfileData, changeUserPassword } from '../../features/profileSlice';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getInitials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const inputCls =
  'h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10';

const cardCls = 'rounded-lgx border border-line bg-surface p-6 shadow-card';

function ProfileForm({ profile, role }) {
  const dispatch = useDispatch();
  const { saving } = useSelector((state) => state.profile);

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [profileError, setProfileError] = useState('');
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState('');
  const [changing, setChanging] = useState(false);

  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : role.charAt(0).toUpperCase() + role.slice(1);

  const handleSaveProfile = async () => {
    setProfileError('');
    const errMsg =
      !name.trim()
        ? 'Name is required'
        : !email.trim()
          ? 'Email is required'
          : !/^\S+@\S+\.\S+$/.test(email.trim())
            ? 'Please provide a valid email'
            : '';
    if (errMsg) {
      setProfileError(errMsg);
      toast.error(errMsg);
      return;
    }

    try {
      await dispatch(
        updateProfileData({
          role,
          payload: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined },
        })
      ).unwrap();
      toast.success('Profile updated successfully');
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to update profile';
      setProfileError(msg);
      toast.error(msg);
    }
  };

  const handleChangePassword = async () => {
    setPassError('');
    const { currentPassword, newPassword, confirmPassword } = passForm;
    if (!currentPassword) {
      setPassError('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPassError('New password must be at least 8 characters');
      return;
    }
    if (newPassword === currentPassword) {
      setPassError('New password must be different from current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirm password do not match');
      return;
    }

    setChanging(true);
    try {
      await dispatch(changeUserPassword({ role, payload: { currentPassword, newPassword } })).unwrap();
      toast.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to change password';
      setPassError(msg);
      toast.error(msg);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-[22px] font-bold text-accent">
            {getInitials(profile?.name || role)}
          </span>
          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[20px] font-bold text-heading">{profile?.name || '—'}</span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-emerald-600">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-[13.5px] text-body">Member since {formatDate(profile?.createdAt)}</p>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-bgprimary/60 px-3.5 py-2.5">
              <Mail size={15} className="shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-body">Email</div>
                <div className="truncate text-[13.5px] font-semibold text-heading">{profile?.email || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-bgprimary/60 px-3.5 py-2.5">
              <Phone size={15} className="shrink-0 text-accent" />
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-body">Phone</div>
                <div className="text-[13.5px] font-semibold text-heading">{profile?.phone || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-bgprimary/60 px-3.5 py-2.5">
              <ShieldCheck size={15} className="shrink-0 text-accent" />
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-body">Role</div>
                <div className="text-[13.5px] font-semibold text-heading">{roleLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Edit profile */}
        <div className={cardCls}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <User size={17} />
            </span>
            <div>
              <h3 className="text-base font-bold text-heading">Edit Profile</h3>
              <p className="text-[12px] text-body">Update your name, email and phone number</p>
            </div>
          </div>

          {profileError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
              {profileError}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Rajesh Kumar Verma" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="e.g. 9876543210" />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className={cardCls}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mustard-soft text-mustard-deep">
              <Lock size={17} />
            </span>
            <div>
              <h3 className="text-base font-bold text-heading">Change Password</h3>
              <p className="text-[12px] text-body">Enter your current password and set a new one</p>
            </div>
          </div>

          {passError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
              {passError}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">Current Password *</label>
              <input
                type="password"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className={inputCls}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">New Password *</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))}
                className={inputCls}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-heading">Confirm New Password *</label>
              <input
                type="password"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className={inputCls}
                placeholder="Re-enter new password"
              />
            </div>
            <p className="text-[11.5px] leading-relaxed text-body">
              New password must be at least 8 characters and different from your current password.
            </p>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={16} />
            {changing ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const role = 'pharmacist';
  const { user: profile, loading, error } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchProfileData(role));
  }, [dispatch, role]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          to={`/${role}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-heading transition-colors hover:bg-bgsecondary hover:text-accent"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-heading md:text-3xl">My Profile</h2>
          <p className="mt-1 text-[14px] text-body">View and update your account information.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lgx border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
          {error}
        </div>
      )}

      {loading && <div className="py-16 text-center text-[14px] text-body">Loading profile...</div>}

      {!loading && profile && (
        <ProfileForm key={`${role}-${profile._id || 'anon'}`} profile={profile} role={role} />
      )}
    </div>
  );
}