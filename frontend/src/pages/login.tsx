import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Scale, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/utils/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.user, res.data.access_token);
      router.push('/profile');
    } catch (err: any) {
      console.error(err);
      // Fallback for demo if backend is offline
      if (email === 'demo@drivelegal.app' && password === 'password') {
        setAuth({ id: 1, email: 'demo@drivelegal.app', full_name: 'Demo User', country_code: 'IN' }, 'mock-token');
        router.push('/profile');
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password. Try demo@drivelegal.app / password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In — DriveLegal</title>
      </Head>

      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow-md mb-6 animate-float">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to access your legal dashboard</p>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="login-email"
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="relative">
                <Input
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/10 bg-surface-800 text-primary-500 focus:ring-offset-surface-900" />
                  Remember me
                </label>
                <Link href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                id="login-submit"
                type="submit"
                variant="primary"
                className="w-full py-6 text-base"
                loading={loading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-white font-semibold hover:text-primary-400 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
