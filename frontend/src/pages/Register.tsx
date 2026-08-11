import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { registerSchema, getZodFieldErrors } from '../utils/schemas';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

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
  const strengthColor = [
    '',
    'bg-danger text-danger',
    'bg-warning text-warning',
    'bg-secondary text-secondary',
    'bg-success text-success',
    'bg-primary text-primary'
  ][strength];

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

  const getBorderClass = (field: string) => {
    if (touched[field]) {
      return errors[field] ? 'border-danger focus-visible:ring-danger/20' : 'border-success focus-visible:ring-success/20';
    }
    return 'border-border-color';
  };

  const ErrorMsg = ({ field }: { field: string }) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
        <AlertCircle size={13} /> {errors[field]}
      </p>
    ) : null;

  const ValidIcon = ({ field }: { field: string }) =>
    touched[field] && !errors[field] ? (
      <CheckCircle2 size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success" />
    ) : null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-8">
      <div className="w-full max-w-[450px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-primary to-[#115E59] rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/20">
            <Heart size={30} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create Account</h2>
          <p className="text-text-secondary mt-1.5">Join GlucoTrack today</p>
        </div>

        <Card className="shadow-lg border border-border-color">
          <CardHeader className="pb-0" />
          <CardContent className="pt-0">
            {serverError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle size={16} />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <div className="relative">
                  <UserIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullname}
                    onChange={e => setFullname(e.target.value)}
                    onBlur={() => handleBlur('fullname')}
                    className={`pl-10 ${getBorderClass('fullname')}`}
                  />
                  <ValidIcon field="fullname" />
                </div>
                <ErrorMsg field="fullname" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`pl-10 ${getBorderClass('email')}`}
                  />
                  <ValidIcon field="email" />
                </div>
                <ErrorMsg field="email" />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`pl-10 pr-10 ${getBorderClass('password')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                            i <= strength ? strengthColor.split(' ')[0] : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${strengthColor.split(' ')[1]}`}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
                <ErrorMsg field="password" />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`pl-10 ${getBorderClass('confirmPassword')}`}
                  />
                  <ValidIcon field="confirmPassword" />
                </div>
                <ErrorMsg field="confirmPassword" />
              </div>

              <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full h-11 rounded-full text-base font-bold transition-all shadow-md shadow-primary/20 disabled:shadow-none"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center mt-5 text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
