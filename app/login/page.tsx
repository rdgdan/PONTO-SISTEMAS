'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseClient } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// CORRIGIDO: Envia o idToken no header Authorization, como o servidor espera.
async function createSessionCookie(idToken: string): Promise<boolean> {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    try {
      const body = await response.json();
      console.warn('createSessionCookie falhou:', response.status, body);
    } catch (e) {
      console.warn('createSessionCookie falhou e não foi possível ler o corpo da resposta', response.status);
    }
  }
  return response.ok;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        <path d="M1 1h22v22H1z" fill="none"/>
    </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { auth } = getFirebaseClient();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      const sessionCreated = await createSessionCookie(idToken);
      if (!sessionCreated) throw new Error('Falha ao criar a sessão no servidor.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro de Autenticação do Firebase:', error);
      setError('E-mail ou senha inválidos. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { auth, db } = getFirebaseClient();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, { uid: result.user.uid, email: result.user.email, name: result.user.displayName, isAdmin: false, createdAt: new Date().toISOString() });
      }
      const sessionCreated = await createSessionCookie(idToken);
      if (!sessionCreated) throw new Error('Falha ao criar a sessão do Google no servidor.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro de Autenticação do Firebase (Google):', error);
      setError('Falha ao fazer login com o Google. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="relative w-full h-screen flex flex-col items-center justify-center bg-slate-950 px-4 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.1), transparent)' }}></div>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-soft-glow-animation"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-sky-500 rounded-full filter blur-3xl opacity-5 animate-soft-glow-animation [animation-delay:5s]"></div>
      <div className="relative z-10 max-w-md w-full text-gray-300">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white">Ponto Sistemas</h1>
            <p className="mt-2 text-lg">Bem-vindo de volta! Faça login para continuar.</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl shadow-purple-500/10 rounded-2xl p-8 mt-10">
            <form onSubmit={handleLogin}>
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium tracking-wide">E-mail</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="seu@email.com" required disabled={loading} autoComplete="email" />
                    </div>
                    <div>
                        <label className="text-sm font-medium tracking-wide">Senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="********" required disabled={loading} autoComplete="current-password" />
                    </div>
                </div>
                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium rounded-lg text-center p-3 mt-6">{error}</div>}
                <button type="submit" className="w-full bg-purple-600 text-white font-bold tracking-wider rounded-lg py-3 mt-8 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-600/40 active:scale-100 disabled:bg-gray-600 disabled:hover:scale-100 disabled:cursor-not-allowed" disabled={loading}>
                    {loading ? 'Carregando...' : 'Entrar'}
                </button>
            </form>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-400">Ainda não tem uma conta? </span>
              <Link href="/register" className="text-sm font-medium text-purple-400 hover:underline ml-1">Registrar</Link>
            </div>
            <div className="flex items-center justify-center space-x-2 my-6">
                <span className="h-px w-full bg-gray-600/50"></span>
                <span className="text-sm text-gray-400">OU</span>
                <span className="h-px w-full bg-gray-600/50"></span>
            </div>
            <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center bg-gray-700/80 border border-gray-600/60 text-white font-medium tracking-wider rounded-lg py-3 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:shadow-xl hover:shadow-gray-500/20 active:scale-100 disabled:bg-gray-600 disabled:hover:scale-100 disabled:cursor-not-allowed" disabled={loading}>
                <GoogleIcon />
                Entrar com o Google
            </button>
        </div>
      </div>
    </main>
  );
}
