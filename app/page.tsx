
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Este é um Server Component que atua como o roteador principal da aplicação.

export default function RootPage() {
  // 1. Pega o cookie de sessão diretamente do header da requisição.
  const sessionCookie = cookies().get('__session')?.value;

  // 2. Decide para onde redirecionar o usuário.
  if (sessionCookie) {
    // Se o cookie de sessão existe, o usuário está potencialmente logado.
    // Redireciona para o dashboard, que fará a validação final do cookie.
    redirect('/dashboard');
  } else {
    // Se não há cookie, o usuário definitivamente não está logado.
    // Redireciona para a página de login.
    redirect('/login');
  }

  // Este componente não renderiza nada, apenas redireciona.
  return null;
}
