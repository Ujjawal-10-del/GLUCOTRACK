import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { User, Key } from 'lucide-react';

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/profile');
        const data = response.data;
        setProfileData({
          fullname: data.full_name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          age: data.age || '',
          height: data.height || '',
          weight: data.weight || ''
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
    setProfileData({ ...profileData, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/change-password', passwordData);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
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

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullname">Full Name</label>
              <input type="text" id="fullname" className="form-input" value={profileData.fullname} onChange={handleProfileChange} required />
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
                <input type="number" id="age" className="form-input" value={profileData.age} onChange={handleProfileChange} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="height">Height (cm)</label>
                <input type="number" id="height" className="form-input" value={profileData.height} onChange={handleProfileChange} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="weight">Weight (kg)</label>
                <input type="number" id="weight" className="form-input" value={profileData.weight} onChange={handleProfileChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>Save Changes</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h4 className="flex items-center gap-2 mb-6" style={{ color: '#0F172A' }}>
            <Key size={20} style={{ color: '#F59E0B' }} /> Change Password
          </h4>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="current_password">Current Password</label>
              <input type="password" id="current_password" className="form-input" value={passwordData.current_password} onChange={handlePasswordChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new_password">New Password</label>
              <input type="password" id="new_password" className="form-input" value={passwordData.new_password} onChange={handlePasswordChange} required minLength={6} />
            </div>

            <div className="form-group mb-6">
              <label className="form-label" htmlFor="confirm_password">Confirm New Password</label>
              <input type="password" id="confirm_password" className="form-input" value={passwordData.confirm_password} onChange={handlePasswordChange} required minLength={6} />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={saving}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
