'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Redirect handled by root page via auth state
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🍜</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FoodTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time order tracking</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium">Demo credentials</p>
            <div className="space-y-2">
              <div
                className="p-2.5 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition"
                onClick={() => { setEmail('restaurant@demo.com'); setPassword('password123'); }}
              >
                <p className="text-xs font-semibold text-orange-700">🍳 Restaurant</p>
                <p className="text-xs text-orange-600 mt-0.5">restaurant@demo.com / password123</p>
              </div>
              <div
                className="p-2.5 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition"
                onClick={() => { setEmail('customer@demo.com'); setPassword('password123'); }}
              >
                <p className="text-xs font-semibold text-blue-700">👤 Customer</p>
                <p className="text-xs text-blue-600 mt-0.5">customer@demo.com / password123</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link href="/auth/register" className="text-orange-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
