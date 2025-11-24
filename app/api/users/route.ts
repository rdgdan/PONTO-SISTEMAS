
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { headers } from 'next/headers';

// Garante que esta rota seja sempre executada dinamicamente
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Validação da sessão do administrador
    const authorization = headers().get('Authorization');
    const idToken = authorization?.split('Bearer ')[1];

    if (!idToken) {
        return NextResponse.json({ error: 'Não autorizado: Nenhum token fornecido.' }, { status: 401 });
    }

    // Usa o adminAuth (já inicializado) para verificar o token.
    const decodedToken = await auth.verifyIdToken(idToken);

    // Se autorizado, busca todos os usuários
    const userRecords = await auth.listUsers();
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      customClaims: user.customClaims,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    // Distingue entre erros de token inválido e outros erros de servidor
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Não autorizado: Token inválido ou expirado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao listar usuários.', details: error.message }, { status: 500 });
  }
}
