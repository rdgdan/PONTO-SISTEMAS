'use client';

import { useAuth } from './AuthContext';
import { Shield, Loader } from 'lucide-react';

/**
 * Este componente agora tem uma única responsabilidade: exibir uma tela de carregamento global
 * enquanto o estado de autenticação inicial está sendo resolvido. Toda a lógica de redirecionamento
 * foi movida para o AuthContext e para as próprias páginas do servidor para evitar conflitos.
 */
export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  // Mostra uma tela de carregamento em tela cheia enquanto o AuthProvider
  // verifica se um usuário está logado e sincroniza a sessão.
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white">
        <div className="rounded-full bg-zinc-800 p-4 ring-2 ring-blue-500/50">
          <Shield size={32} className="text-blue-400" />
        </div>
        <Loader className="mt-4 h-6 w-6 animate-spin text-blue-400" />
        <p className="mt-2 text-lg text-zinc-300">Carregando Sessão...</p>
      </div>
    );
  }

  // Assim que o carregamento terminar, ele simplesmente renderiza a página solicitada.
  return <>{children}</>;
}
