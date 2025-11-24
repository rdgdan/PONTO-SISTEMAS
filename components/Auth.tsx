
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const Auth = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="h-10 w-24 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white">{user.email}</span>
        <button
          onClick={async () => {
            await logout();
          }}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    );
  }

  return null;
};

export default Auth;
