'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, startTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Interface que define a estrutura de dados do usuário
export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  isAdmin: boolean;
}

// Interface para o valor do contexto
interface AuthContextType {
  user: AppUser | null;
  loading: boolean; // Mantém o estado de carregamento para UI
  logout: () => Promise<void>;
}

// Criação do contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook customizado para usar o contexto de autenticação
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

// Componente Provedor de Autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true); // Começa como true
  const router = useRouter();
  const pathname = usePathname();

  // Função de Logout: invalida a sessão no servidor e redireciona
  const logout = useCallback(async () => {
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error("Erro durante o logout:", error);
    } finally {
        setUser(null);
      setTimeout(() => startTransition(() => router.push('/login')));
    }
  }, [router]);

  // Efeito que executa na montagem e quando a rota muda
  useEffect(() => {
    let isMounted = true; // Flag para evitar atualizações em componente desmontado

    const checkUserSession = async () => {
        // Não precisa verificar a sessão na página de login
        if (pathname === '/login') {
            setLoading(false);
            setUser(null);
            return;
        }

        try {
            const response = await fetch('/api/auth/session');
          const sessionData = await response.json();

          if (isMounted) {
            if (response.ok && sessionData.user) {
              setUser(sessionData.user);
            } else {
              console.warn('AuthContext: /api/auth/session respondeu:', response.status, sessionData);
              setUser(null);
              // Se não estivermos na página de login e não houver usuário, redireciona (pequeno atraso para evitar hydration issues).
              setTimeout(() => startTransition(() => router.push('/login')), 60);
            }
          }
        } catch (error) {
            if (isMounted) {
                console.error("Falha ao verificar a sessão:", error);
                setUser(null);
                if (pathname !== '/login') {
                setTimeout(() => startTransition(() => router.push('/login')), 60);
                }
            }
        } finally {
            if (isMounted) {
                // Finaliza o estado de carregamento após a verificação
                setLoading(false);
            }
        }
    };

    checkUserSession();

    // Função de limpeza para o useEffect
    return () => {
      isMounted = false;
    };
  }, [pathname, router]); // Re-executa quando o caminho da URL muda

  const value = { user, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
