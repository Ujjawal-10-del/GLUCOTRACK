import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { User, Key, AlertCircle } from 'lucide-react';
import { profileSchema, changePasswordSchema, getZodFieldErrors } from '../utils/schemas';

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
    setProfileTouched({ fullname: true, age: true, height: true, weight: true });
    if (!isProfileValid) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/profile', profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mt-8 text-center text-muted">Loading profile...</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="mb-8">
        <h2 style={{ margin: 0, color: '#0F172A' }}>My Profile</h2>
        <p style={{ margin: '0.4rem 0 0', color: '#64748B' }}>Manage your personal information and security settings.</p>
      </div>

      {message.text && (
        <div className={`badge ${message.type === 'error' ? 'badge-danger' : 'badge-success'} mb-6 p-3 block w-full text-center`} style={{ display: 'block' }}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="card">
          <h4 className="flex items-center gap-2 mb-6" style={{ color: '#0F172A' }}>
            <User size={20} style={{ color: '#0F766E' }} /> Personal Information
          </h4>

          <form onSubmit={handleProfileSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fullname">Full Name</label>
              <input
                type="text" id="fullname" className="form-input"
                value={profileData.fullname} onChange={handleProfileChange}
                onBlur={() => setProfileTouched(prev => ({ ...prev, fullname: true }))}
                style={{ borderColor: profileTouched.fullname && profileErrors.fullname ? '#DC2626' : undefined }}
              />
              {profileTouched.fullname && profileErrors.fullname && (
                <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {profileErrors.fullname}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input type="email" id="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.65, cursor: 'not-allowed' }} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" className="form-input" value={profileData.phone} onChange={handleProfileChange} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select id="gender" className="form-input" value={profileData.gender} onChange={handleProfileChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="age">Age</label>
                <input
                  type="number" id="age" className="form-input"
                  value={profileData.age} onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, age: true }))}
                  style={{ borderColor: profileTouched.age && profileErrors.age ? '#DC2626' : undefined }}
                />
                {profileTouched.age && profileErrors.age && (
                  <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626' }}>{profileErrors.age}</p>
                )}
              </div>

              <div className="form-group mb-0">
                <label className="form-label" htmlFor="height">Height (cm)</label>
                <input
                  type="number" id="height" className="form-input"
                  value={profileData.height} onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, height: true }))}
                  style={{ borderColor: profileTouched.height && profileErrors.height ? '#DC2626' : undefined }}
                />
                {profileTouched.height && profileErrors.height && (
                  <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626' }}>{profileErrors.height}</p>
                )}
              </div>

              <div className="form-group mb-0">
                <label className="form-label" htmlFor="weight">Weight (kg)</label>
                <input
                  type="number" id="weight" className="form-input"
                  value={profileData.weight} onChange={handleProfileChange}
                  onBlur={() => setProfileTouched(prev => ({ ...prev, weight: true }))}
                  style={{ borderColor: profileTouched.weight && profileErrors.weight ? '#DC2626' : undefined }}
                />
                {profileTouched.weight && profileErrors.weight && (
                  <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626' }}>{profileErrors.weight}</p>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving || !isProfileValid}>Save Changes</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h4 className="flex items-center gap-2 mb-6" style={{ color: '#0F172A' }}>
            <Key size={20} style={{ color: '#F59E0B' }} /> Change Password
          </h4>

          <form onSubmit={handlePasswordSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="current_password">Current Password</label>
              <input
                type="password" id="current_password" className="form-input"
                value={passwordData.current_password} onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, current_password: true }))}
                style={{ borderColor: passwordTouched.current_password && passwordErrors.current_password ? '#DC2626' : undefined }}
              />
              {passwordTouched.current_password && passwordErrors.current_password && (
                <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {passwordErrors.current_password}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new_password">New Password</label>
              <input
                type="password" id="new_password" className="form-input"
                value={passwordData.new_password} onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, new_password: true }))}
                style={{ borderColor: passwordTouched.new_password && passwordErrors.new_password ? '#DC2626' : undefined }}
              />
              {passwordTouched.new_password && passwordErrors.new_password && (
                <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {passwordErrors.new_password}
                </p>
              )}
            </div>

            <div className="form-group mb-6">
              <label className="form-label" htmlFor="confirm_password">Confirm New Password</label>
              <input
                type="password" id="confirm_password" className="form-input"
                value={passwordData.confirm_password} onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(prev => ({ ...prev, confirm_password: true }))}
                style={{ borderColor: passwordTouched.confirm_password && passwordErrors.confirm_password ? '#DC2626' : undefined }}
              />
              {passwordTouched.confirm_password && passwordErrors.confirm_password && (
                <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {passwordErrors.confirm_password}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-secondary" disabled={saving || !isPasswordValid}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
