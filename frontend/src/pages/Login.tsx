import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Heart, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FieldErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setServerError('');
    setLoading(true);
    try {
      const response = await axios.post('/login', { email, password });
      login(response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (field: 'email' | 'password') => ({
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    background: '#FFFFFF',
    border: `1.5px solid ${touched[field] && errors[field] ? '#DC2626' : touched[field] && !errors[field] ? '#16A34A' : '#E2E8F0'}`,
    borderRadius: '0.875rem',
    color: '#0F172A',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
  });

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '430px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0F766E, #115E59)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(15, 118, 110, 0.25)'
          }}>
            <Heart size={30} color="white" fill="white" />
          </div>
          <h2 style={{ margin: 0, color: '#0F172A' }}>Welcome back!</h2>
          <p style={{ color: '#64748B', margin: '0.4rem 0 0' }}>Sign in to your GlucoTrack account</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF', borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
          border: '1px solid #E2E8F0'
        }}>
          {serverError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem'
            }}>
              <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
              <p style={{ margin: 0, color: '#DC2626', fontSize: '0.9rem' }}>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  style={fieldStyle('email')}
                />
                {touched.email && !errors.email && (
                  <CheckCircle2 size={17} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />
                )}
              </div>
              {touched.email && errors.email && (
                <p style={{ margin: '0.4rem 0 0 0.25rem', fontSize: '0.8rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={13} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  style={fieldStyle('password')}
                />
                {touched.password && !errors.password && (
                  <CheckCircle2 size={17} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />
                )}
              </div>
              {touched.password && errors.password && (
                <p style={{ margin: '0.4rem 0 0 0.25rem', fontSize: '0.8rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={13} /> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.9rem',
                borderRadius: '999px', border: 'none',
                background: loading || !isValid ? '#E2E8F0' : '#0F766E',
                color: loading || !isValid ? '#94A3B8' : 'white',
                fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !loading && isValid ? '0 4px 14px rgba(15, 118, 110, 0.25)' : 'none'
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: 0, fontSize: '0.9rem', color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
