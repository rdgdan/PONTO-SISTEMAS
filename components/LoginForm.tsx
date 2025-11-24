
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Autenticação bem-sucedida, redireciona para o dashboard
        router.push('/dashboard');
      } else {
        // Falha na autenticação, exibe a mensagem de erro da API
        const data = await response.json();
        setError(data.message || 'Falha no login. Verifique suas credenciais.');
      }
    } catch (err) {
      // Erro de rede ou outro problema inesperado
      setError('Ocorreu um erro ao tentar conectar. Tente novamente.');
      console.error('Login fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            id="email"
            type="email"
            placeholder="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-zinc-700 bg-transparent py-3 pl-12 pr-4 text-white transition-colors placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            id="password"
            type="password"
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-zinc-700 bg-transparent py-3 pl-12 pr-4 text-white transition-colors placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>

      {/* A funcionalidade de login com Google foi removida pois não está mais implementada no backend */}
    </div>
  );
}
