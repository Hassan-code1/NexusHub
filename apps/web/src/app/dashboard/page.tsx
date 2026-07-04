'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, checkAuth, user, isLoading } = useAuthStore();

  useEffect(() => {
    // After Google OAuth redirect, the backend sends ?token=<accessToken>
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      // Remove token from URL for security, then verify session
      window.history.replaceState({}, '', '/dashboard');
      checkAuth();
    } else {
      checkAuth();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Not authenticated — redirect to login
    router.replace('/login');
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600">{user.email}</p>
        <p className="text-sm text-gray-400">Dashboard — coming soon</p>
      </div>
    </main>
  );
}
