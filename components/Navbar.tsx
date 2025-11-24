
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, UserCircle, Shield } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (['/login', '/register'].includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-zinc-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
            <LayoutDashboard className="text-blue-400" size={28} />
            <span>Ponto App</span>
          </Link>

          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link href="/admin" 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors 
                ${pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-zinc-800 hover:text-white'}`}>
                <Shield size={18} />
                <span>Admin</span>
              </Link>
            )}

            {user && (
              <div className="relative">
                <div className="group">
                  <button className="flex items-center gap-3 p-2 rounded-full transition-colors hover:bg-zinc-800 focus:outline-none">
                    {/* Exibe o nome do usuário em vez do email */}
                    <span className="text-white font-medium text-sm hidden sm:block">{user.name}</span>
                    {/* Remove a lógica da photoURL e usa sempre o ícone padrão */}
                    <UserCircle className="h-9 w-9 text-zinc-500" />
                  </button>

                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md shadow-lg bg-zinc-900 ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-800"
                      >
                        <LogOut size={16} />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
