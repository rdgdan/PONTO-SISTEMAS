import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getPontoHistory, getNationalHolidays } from '@/app/actions';
import DashboardClient from '@/components/DashboardClient';
import { auth } from '@/lib/firebaseAdmin';
import type { PontoEntry } from '@/lib/types';

type Holiday = {
  date: string;
  name: string;
};

type CurrentUser = {
    uid: string;
    name: string;
    email: string;
    isAdmin: boolean;
};

export default async function DashboardPage() {
  const sessionCookie = cookies().get('__session')?.value || null;

  if (!sessionCookie) {
    redirect('/login');
  }

  let user: CurrentUser | null = null;

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const firebaseUser = await auth.getUser(decodedToken.uid);

    user = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email || 'N/A',
        isAdmin: firebaseUser.customClaims?.admin === true || false,
    };

  } catch (error) {
    console.error('Erro de autenticação:', error);
    redirect('/login');
  }

  if (!user) {
      redirect('/login');
  }

  const history: PontoEntry[] = await getPontoHistory();
  const holidays: Holiday[] = await getNationalHolidays(new Date().getFullYear());

  // A CORREÇÃO: Serializar o histórico para garantir que os tipos de data (Date -> string) correspondam ao que o cliente espera.
  const serializedHistory = JSON.parse(JSON.stringify(history));

  return (
    <DashboardClient 
      currentUser={user}
      initialHistory={serializedHistory}
      holidays={holidays}
    />
  );
}
