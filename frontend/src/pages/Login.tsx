import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Heart, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginSchema, getZodFieldErrors } from '../utils/schemas';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Zod Schema Live Validation ──
  const validationResult = loginSchema.safeParse({ email, password });
  const errors = !validationResult.success ? getZodFieldErrors(validationResult.error) : {};
  const isValid = validationResult.success;

  const handleBlur = (field: 'email' | 'password') => {
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

  const getBorderClass = (field: 'email' | 'password') => {
    if (touched[field]) {
      return errors[field] ? 'border-danger focus-visible:ring-danger/20' : 'border-success focus-visible:ring-success/20';
    }
    return 'border-border-color';
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-8">
      <div className="w-full max-w-[430px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-primary to-[#115E59] rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/20">
            <Heart size={30} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back!</h2>
          <p className="text-text-secondary mt-1.5">Sign in to your GlucoTrack account</p>
        </div>

        {/* Card */}
        <Card className="shadow-lg border border-border-color">
          <CardHeader className="pb-0" />
          <CardContent className="pt-0">
            {serverError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle size={16} />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  {touched.email && !errors.email && (
                    <CheckCircle2 size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success" />
                  )}
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                    <AlertCircle size={13} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`pl-10 ${getBorderClass('password')}`}
                  />
                  {touched.password && !errors.password && (
                    <CheckCircle2 size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success" />
                  )}
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                    <AlertCircle size={13} /> {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full h-11 rounded-full text-base font-bold transition-all shadow-md shadow-primary/20 disabled:shadow-none"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center mt-5 text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Register here</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
