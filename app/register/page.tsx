'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirebaseClient } from '@/lib/firebase';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';

// Componente do Ícone do Google
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = async (user: User) => {
    const { uid, displayName, email: userEmail } = user;
    const { db } = getFirebaseClient();

    await setDoc(doc(db, 'users', uid), {
      uid,
      email: userEmail,
      name: name || displayName || userEmail?.split('@')[0],
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    const idToken = await user.getIdToken(true);
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao criar a sessão no servidor.');
    }

    router.push('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { auth } = getFirebaseClient();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential.user);
    } catch (err: any) {
      console.error('Registro falhou:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Falha ao registrar. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      console.error('Google signup falhou:', err);
      setError('Falha ao registrar com Google. Tente novamente.');
    } finally {
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
           <p className="mt-2 text-lg">Crie sua conta e comece a usar.</p>
         </div>
         <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl shadow-purple-500/10 rounded-2xl p-8 mt-10">
          <form onSubmit={handleRegister}>
             <div className="space-y-6">
               <div>
                 <label className="text-sm font-medium tracking-wide">Nome</label>
                 <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="Seu nome" autoComplete="name" />
               </div>
               <div>
                 <label className="text-sm font-medium tracking-wide">E-mail</label>
                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="seu@email.com" required disabled={loading} autoComplete="email" />
               </div>
               <div>
                 <label className="text-sm font-medium tracking-wide">Senha</label>
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="********" required disabled={loading} autoComplete="new-password" />
               </div>
               <div>
                 <label className="text-sm font-medium tracking-wide">Confirmar Senha</label>
                 <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-700/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 mt-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300" placeholder="********" required disabled={loading} autoComplete="new-password" />
               </div>
             </div>
             {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium rounded-lg text-center p-3 mt-6">{error}</div>}
             <button type="submit" className="w-full bg-purple-600 text-white font-bold tracking-wider rounded-lg py-3 mt-8 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-600/40 active:scale-100 disabled:bg-gray-600 disabled:hover:scale-100 disabled:cursor-not-allowed" disabled={loading}>
               {loading ? 'Carregando...' : 'Registrar'}
             </button>
            </form>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-400">Já tem uma conta? </span>
              <Link href="/login" className="text-sm font-medium text-purple-400 hover:underline ml-1">Entrar</Link>
            </div>
           <div className="flex items-center justify-center space-x-2 my-6">
             <span className="h-px w-full bg-gray-600/50"></span>
             <span className="text-sm text-gray-400">OU</span>
             <span className="h-px w-full bg-gray-600/50"></span>
           </div>
           <button onClick={handleGoogleSignUp} className="w-full flex items-center justify-center bg-gray-700/80 border border-gray-600/60 text-white font-medium tracking-wider rounded-lg py-3 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:shadow-xl hover:shadow-gray-500/20 active:scale-100 disabled:bg-gray-600 disabled:hover:scale-100 disabled:cursor-not-allowed" disabled={loading}>
             <GoogleIcon />
             Registrar com o Google
           </button>
         </div>
       </div>
     </main>
   );
}
