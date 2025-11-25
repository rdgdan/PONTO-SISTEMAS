// Importações de bibliotecas do Next.js e React
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

// Importações do Firebase Admin SDK para operações seguras no lado do servidor
import { auth } from '@/lib/firebaseAdmin';

// Importação de componentes da interface
import EditUserModal from '@/components/EditUserModal';

// Força a página a ser SEMPRE dinâmica e NUNCA usar cache de dados.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Interface para tipagem do objeto de usuário
export interface User {
  uid: string;
  email: string | null;
  name: string; 
  isAdmin: boolean;
}

// Trigger redeploy

// Função assíncrona para buscar todos os usuários do Firebase Auth
async function getUsers(): Promise<User[]> {
  const userRecords = await auth.listUsers();
  const users = userRecords.users.map(user => ({
    uid: user.uid,
    email: user.email || 'N/A',
    name: user.displayName || user.email?.split('@')[0] || 'Usuário',
    isAdmin: user.customClaims?.admin === true || false,
  }));
  return users;
}

// Componente da Página de Administração (React Server Component)
export default async function AdminPage() {
  const sessionCookie = cookies().get('__session')?.value || null;

  if (!sessionCookie) {
    redirect('/login');
  }

  let isAdmin = false;
  let currentUserId: string | null = null;

  try {
    // 1. Decodifica o cookie para obter o UID de forma segura.
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    currentUserId = decodedToken.uid;

    // 2. **CORREÇÃO CRÍTICA**: Busca os dados mais recentes do usuário no Firebase Auth.
    // Isso garante que os custom claims (permissões) estejam sempre atualizados.
    const user = await auth.getUser(currentUserId);
    isAdmin = user.customClaims?.admin === true;

  } catch (error) {
    // Se o cookie for inválido ou qualquer outra verificação falhar, o acesso é negado.
    isAdmin = false;
  }

  // 3. Redireciona se o usuário não for administrador.
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const users = await getUsers();

  return (
    <main className="relative w-full min-h-screen flex flex-col items-center bg-slate-950 p-8 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.1), transparent)' }}></div>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-soft-glow"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-sky-500 rounded-full filter blur-3xl opacity-5 animate-soft-glow [animation-delay:5s]"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <Link href="/dashboard" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            &larr; Voltar ao Dashboard
          </Link>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold">Usuário</th>
                  <th className="px-6 py-3 text-sm font-semibold">Permissão</th>
                  <th className="px-6 py-3 text-sm font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{user.name} ({user.email})</div>
                      <div className="text-xs text-gray-400">ID: {user.uid}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500 text-green-900">Admin</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500 text-gray-100">Usuário</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* O componente EditUserModal agora é "Gerenciar" */}
                      <EditUserModal user={user} disabled={user.uid === currentUserId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
