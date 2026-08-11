import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { User as UserIcon, Key, AlertCircle, Edit, X, ShieldCheck, Mail, Calendar, Ruler, Weight } from 'lucide-react';
import { profileSchema, changePasswordSchema, getZodFieldErrors } from '../utils/schemas';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const Profile: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [profileData, setProfileData] = useState({
    fullname: '',
    phone: '',
    gender: '',
    age: '',
    height: '',
    weight: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ── Zod Live Validation ──
  const profileValidation = profileSchema.safeParse(profileData);
  const profileErrors = !profileValidation.success ? getZodFieldErrors(profileValidation.error) : {};
  const isProfileValid = profileValidation.success;

  const passwordValidation = changePasswordSchema.safeParse(passwordData);
  const passwordErrors = !passwordValidation.success ? getZodFieldErrors(passwordValidation.error) : {};
  const isPasswordValid = passwordValidation.success;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/profile');
        const data = response.data;
        setProfileData({
          fullname: data.full_name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          age: data.age !== null && data.age !== undefined ? String(data.age) : '',
          height: data.height !== null && data.height !== undefined ? String(data.height) : '',
          weight: data.weight !== null && data.weight !== undefined ? String(data.weight) : ''
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const id = e.target.id;
    setProfileData(prev => ({ ...prev, [id]: e.target.value }));
    setProfileTouched(prev => ({ ...prev, [id]: true }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    setPasswordData(prev => ({ ...prev, [id]: e.target.value }));
    setPasswordTouched(prev => ({ ...prev, [id]: true }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileTouched({ fullname: true, phone: true, age: true, height: true, weight: true });
    if (!isProfileValid) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/profile', profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditingProfile(false);
      checkAuth();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched({ current_password: true, new_password: true, confirm_password: true });
    if (!isPasswordValid) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/change-password', passwordData);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordTouched({});
      setIsChangingPassword(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const getProfileBorderClass = (field: string) => {
    if (profileTouched[field] && profileErrors[field]) {
      return 'border-danger focus-visible:ring-danger/20';
    }
    return 'border-border-color';
  };

  const getPasswordBorderClass = (field: string) => {
    if (passwordTouched[field] && passwordErrors[field]) {
      return 'border-danger focus-visible:ring-danger/20';
    }
    return 'border-border-color';
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  if (loading) return <div className="text-center mt-12 text-text-secondary font-medium">Loading profile...</div>;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">My Profile</h2>
        <p className="text-text-secondary mt-1">Manage your personal information and account security.</p>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'success'}>
          <AlertCircle size={16} />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* User Summary Header Banner */}
      <Card className="p-6 bg-linear-to-r from-white via-slate-50 to-teal-50/30 border border-border-color shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              {getInitials(profileData.fullname || user?.full_name || '')}
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">
                {profileData.fullname || user?.full_name || 'User'}
              </h3>
              <p className="text-sm text-text-secondary flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail size={14} className="text-text-muted" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => {
                setIsEditingProfile(true);
                setIsChangingPassword(false);
              }}
              variant={isEditingProfile ? "default" : "outline"}
              className="rounded-full gap-2 font-semibold cursor-pointer"
            >
              <Edit size={16} />
              Update Profile
            </Button>
            <Button
              onClick={() => {
                setIsChangingPassword(true);
                setIsEditingProfile(false);
              }}
              variant={isChangingPassword ? "default" : "outline"}
              className="rounded-full gap-2 font-semibold cursor-pointer"
            >
              <Key size={16} />
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Section 1: Update Profile Form (Appears when Update Profile is clicked) ── */}
      {isEditingProfile && (
        <Card className="p-8 border-2 border-primary/20 shadow-md animate-slide-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-color">
            <h4 className="flex items-center gap-2 font-bold text-lg text-text-primary">
              <UserIcon size={20} className="text-primary" /> Update Profile Details
            </h4>
            <Button
              onClick={() => setIsEditingProfile(false)}
              variant="ghost"
              size="sm"
              className="rounded-full cursor-pointer text-text-muted hover:text-text-primary"
            >
              <X size={18} /> Cancel
            </Button>
          </div>

          <form onSubmit={handleProfileSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  type="text"
                  id="fullname"
                  value={profileData.fullname}
                  onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, fullname: true }))}
                  className={getProfileBorderClass('fullname')}
                />
                {profileTouched.fullname && profileErrors.fullname && (
                  <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                    <AlertCircle size={12} /> {profileErrors.fullname}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-100 cursor-not-allowed opacity-75"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="e.g. +1 234 567 890"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, phone: true }))}
                  className={getProfileBorderClass('phone')}
                />
                {profileTouched.phone && profileErrors.phone && (
                  <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                    <AlertCircle size={12} /> {profileErrors.phone}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  id="gender"
                  value={profileData.gender}
                  onChange={handleProfileChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  type="number"
                  id="age"
                  placeholder="e.g. 35"
                  value={profileData.age}
                  onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, age: true }))}
                  className={getProfileBorderClass('age')}
                />
                {profileTouched.age && profileErrors.age && (
                  <p className="mt-1 text-xs text-danger pl-1">{profileErrors.age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  type="number"
                  id="height"
                  placeholder="e.g. 175"
                  value={profileData.height}
                  onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, height: true }))}
                  className={getProfileBorderClass('height')}
                />
                {profileTouched.height && profileErrors.height && (
                  <p className="mt-1 text-xs text-danger pl-1">{profileErrors.height}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  type="number"
                  id="weight"
                  placeholder="e.g. 70"
                  value={profileData.weight}
                  onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, weight: true }))}
                  className={getProfileBorderClass('weight')}
                />
                {profileTouched.weight && profileErrors.weight && (
                  <p className="mt-1 text-xs text-danger pl-1">{profileErrors.weight}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
                className="rounded-full cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !isProfileValid}
                className="rounded-full cursor-pointer px-6 font-bold shadow-md"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Section 2: Change Password Form (Appears when Change Password is clicked) ── */}
      {isChangingPassword && (
        <Card className="p-8 border-2 border-amber-200 shadow-md animate-slide-up max-w-[600px] mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-color">
            <h4 className="flex items-center gap-2 font-bold text-lg text-text-primary">
              <Key size={20} className="text-warning" /> Change Account Password
            </h4>
            <Button
              onClick={() => setIsChangingPassword(false)}
              variant="ghost"
              size="sm"
              className="rounded-full cursor-pointer text-text-muted hover:text-text-primary"
            >
              <X size={18} /> Cancel
            </Button>
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                type="password"
                id="current_password"
                placeholder="Enter current password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, current_password: true }))}
                className={getPasswordBorderClass('current_password')}
              />
              {passwordTouched.current_password && passwordErrors.current_password && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                  <AlertCircle size={12} /> {passwordErrors.current_password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                type="password"
                id="new_password"
                placeholder="Enter new password (min. 6 characters)"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, new_password: true }))}
                className={getPasswordBorderClass('new_password')}
              />
              {passwordTouched.new_password && passwordErrors.new_password && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                  <AlertCircle size={12} /> {passwordErrors.new_password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                type="password"
                id="confirm_password"
                placeholder="Confirm new password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, confirm_password: true }))}
                className={getPasswordBorderClass('confirm_password')}
              />
              {passwordTouched.confirm_password && passwordErrors.confirm_password && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                  <AlertCircle size={12} /> {passwordErrors.confirm_password}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangingPassword(false)}
                className="rounded-full cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={saving || !isPasswordValid}
                className="rounded-full cursor-pointer px-6 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Section 3: Profile Overview Cards (Displayed when not editing) ── */}
      {!isEditingProfile && !isChangingPassword && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 space-y-6">
            <h4 className="flex items-center gap-2 font-bold text-text-primary border-b border-border-color pb-3">
              <UserIcon size={18} className="text-primary" /> Personal Details
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-text-secondary font-medium">Full Name</p>
                <p className="text-base font-semibold text-text-primary">{profileData.fullname || 'Not specified'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-text-secondary font-medium">Email Address</p>
                <p className="text-base font-semibold text-text-primary">{user?.email || 'Not specified'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-text-secondary font-medium">Phone Number</p>
                <p className="text-base font-semibold text-text-primary">{profileData.phone || 'Not specified'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-text-secondary font-medium">Gender</p>
                <p className="text-base font-semibold text-text-primary">{profileData.gender || 'Not specified'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h4 className="flex items-center gap-2 font-bold text-text-primary border-b border-border-color pb-3">
              <ShieldCheck size={18} className="text-primary" /> Vitals Summary
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-border-color">
                <span className="text-xs text-text-secondary font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-primary" /> Age
                </span>
                <span className="font-bold text-text-primary text-sm">
                  {profileData.age ? `${profileData.age} yrs` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-border-color">
                <span className="text-xs text-text-secondary font-medium flex items-center gap-2">
                  <Ruler size={14} className="text-primary" /> Height
                </span>
                <span className="font-bold text-text-primary text-sm">
                  {profileData.height ? `${profileData.height} cm` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-border-color">
                <span className="text-xs text-text-secondary font-medium flex items-center gap-2">
                  <Weight size={14} className="text-primary" /> Weight
                </span>
                <span className="font-bold text-text-primary text-sm">
                  {profileData.weight ? `${profileData.weight} kg` : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
