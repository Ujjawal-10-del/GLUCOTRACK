import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { registerSchema, getZodFieldErrors } from '../utils/schemas';

const Register: React.FC = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── Zod Schema Live Validation ──
  const validationResult = registerSchema.safeParse({ fullname, email, password, confirmPassword });
  const errors = !validationResult.success ? getZodFieldErrors(validationResult.error) : {};
  const isValid = validationResult.success;

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#DC2626', '#F59E0B', '#2563EB', '#16A34A', '#0F766E'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullname: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;
    setServerError('');
    setLoading(true);
    try {
      await axios.post('/register', { fullname, email, password });
      navigate('/login');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
    background: '#FFFFFF',
    border: `1.5px solid ${touched[field] && errors[field] ? '#DC2626' : touched[field] && !errors[field] ? '#16A34A' : '#E2E8F0'}`,
    borderRadius: '0.875rem',
    color: '#0F172A',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
  });

  const ErrorMsg = ({ field }: { field: string }) =>
    touched[field] && errors[field] ? (
      <p style={{ margin: '0.4rem 0 0 0.25rem', fontSize: '0.8rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <AlertCircle size={13} /> {errors[field]}
      </p>
    ) : null;

  const ValidIcon = ({ field }: { field: string }) =>
    touched[field] && !errors[field] ? (
      <CheckCircle2 size={17} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />
    ) : null;

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0F766E, #115E59)',
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(15, 118, 110, 0.25)'
          }}>
            <Heart size={30} color="white" fill="white" />
          </div>
          <h2 style={{ margin: 0, color: '#0F172A' }}>Create Account</h2>
          <p style={{ color: '#64748B', margin: '0.4rem 0 0' }}>Join GlucoTrack today</p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)', border: '1px solid #E2E8F0' }}>
          {serverError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
              <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
              <p style={{ margin: 0, color: '#DC2626', fontSize: '0.9rem' }}>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input id="fullname" type="text" placeholder="John Doe" value={fullname} onChange={e => setFullname(e.target.value)} onBlur={() => handleBlur('fullname')} style={inputStyle('fullname')} />
                <ValidIcon field="fullname" />
              </div>
              <ErrorMsg field="fullname" />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => handleBlur('email')} style={inputStyle('email')} />
                <ValidIcon field="email" />
              </div>
              <ErrorMsg field="email" />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onBlur={() => handleBlur('password')} style={{ ...inputStyle('password'), paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: '4px', borderRadius: '999px', background: i <= strength ? strengthColor : '#E2E8F0', transition: 'background 0.3s ease' }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                </div>
              )}
              <ErrorMsg field="password" />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => handleBlur('confirmPassword')} style={inputStyle('confirmPassword')} />
                <ValidIcon field="confirmPassword" />
              </div>
              <ErrorMsg field="confirmPassword" />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.9rem', borderRadius: '999px', border: 'none',
              background: loading || !isValid ? '#E2E8F0' : '#0F766E',
              color: loading || !isValid ? '#94A3B8' : 'white',
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: !loading && isValid ? '0 4px 14px rgba(15, 118, 110, 0.25)' : 'none'
            }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: 0, fontSize: '0.9rem', color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
