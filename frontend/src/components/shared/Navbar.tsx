'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  title?: string;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function Navbar({ title, connectionStatus }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  const statusConfig = {
    connected: { dot: 'bg-green-500', label: 'Live', text: 'text-green-600' },
    connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'Connecting...', text: 'text-yellow-600' },
    disconnected: { dot: 'bg-red-400', label: 'Disconnected', text: 'text-red-500' },
    error: { dot: 'bg-red-500', label: 'Connection error', text: 'text-red-500' },
  };

  const conn = connectionStatus ? statusConfig[connectionStatus] : null;

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🍜</span>
          <div>
            <span className="font-bold text-gray-900 text-sm">FoodTracker</span>
            {title && <span className="text-gray-400 text-sm ml-2">/ {title}</span>}
          </div>
          {conn && (
            <div className={`flex items-center gap-1.5 ml-2 ${conn.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${conn.dot}`} />
              <span className="text-xs font-medium">{conn.label}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {user.role === 'restaurant' ? '🍳' : '👤'} {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium transition px-2.5 py-1 rounded-lg hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
