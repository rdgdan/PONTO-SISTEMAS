'use client';

import Link from 'next/link';
import { User, LogOut, Shield } from 'lucide-react';

type CurrentUser = {
    name: string;
    isAdmin: boolean;
};

export default function Header({ currentUser }: { currentUser: CurrentUser }) {

    const handleLogout = () => {
        // Apaga o cookie de sessão e redireciona para a página de login.
        document.cookie = '__session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        window.location.href = '/login';
    };

    return (
        <header className="bg-zinc-950/70 backdrop-blur-sm border-b border-zinc-800 p-4 sticky top-0 z-40">
            <div className="container mx-auto flex justify-between items-center">
                {/* Lado Esquerdo: Boas-vindas */}
                <div className="text-md text-zinc-400">
                    Bem-vindo, <span className="font-semibold text-zinc-100">{currentUser.name}</span>
                </div>

                {/* Centro: Título da Aplicação */}
                <div className="absolute left-1/2 -translate-x-1/2">
                     <h1 className="text-xl font-bold text-blue-400 hidden md:block">ChronoTrack</h1>
                </div>

                {/* Lado Direito: Ações */}
                <nav className="flex items-center gap-4 md:gap-6">
                    {currentUser.isAdmin && (
                        <Link 
                            href="/admin" 
                            className="flex items-center gap-2 text-zinc-300 hover:text-blue-400 transition-colors duration-200"
                        >
                            <Shield size={18} />
                            <span className="hidden sm:inline">Admin</span>
                        </Link>
                    )}
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 text-zinc-300 hover:text-red-400 transition-colors duration-200"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                </nav>
            </div>
        </header>
    );
}
