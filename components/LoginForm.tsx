
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';
import { getFirebaseClient } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = async (idToken: string) => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      const data = await response.json();
      setError(data.message || 'Falha ao iniciar a sessão.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { auth } = getFirebaseClient();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await handleAuthSuccess(idToken);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Ocorreu um erro ao tentar fazer login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await handleAuthSuccess(token);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Ocorreu um erro ao tentar fazer login com o Google.');
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

      <div className="my-6 flex items-center">
        <hr className="w-full border-zinc-700" />
        <span className="px-4 text-zinc-400">OU</span>
        <hr className="w-full border-zinc-700" />
      </div>

      <div>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center rounded-full bg-white px-4 py-3 text-base font-bold text-zinc-900 shadow-lg shadow-white/10 transition-all hover:scale-105 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
        >
          <Image src="/google-logo.svg" alt="Google" width={24} height={24} className="mr-3" />
          Entrar com Google
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-zinc-400">
          Não tem uma conta?{' '}
          <button onClick={() => router.push('/register')} className="font-bold text-blue-500 hover:underline">
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
}
