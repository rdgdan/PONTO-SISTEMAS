import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebaseAdmin';
import { DecodedIdToken } from 'firebase-admin/auth';

async function ensureUserInFirestore(decodedToken: DecodedIdToken) {
  const { uid, email, name } = decodedToken;
  const userDocRef = db.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    await userDocRef.set({
      uid,
      email,
      name: name || email?.split('@')[0] || 'Novo Usuário',
      isAdmin: false, // Por padrão, novos usuários não são administradores
      createdAt: new Date().toISOString(),
    });
  }
}

// GET: Verifica a sessão do usuário e retorna seus dados mais recentes.
export async function GET() {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userRecord = await auth.getUser(decodedToken.uid);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};

    const finalUserData = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || firestoreData?.name || userRecord.email?.split('@')[0] || 'Usuário',
      isAdmin: userRecord.customClaims?.admin === true,
    };

    return NextResponse.json({ user: finalUserData });
  } catch (error) {
    console.error("Erro na rota GET /api/auth/session:", error);
    return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
  }
}


// POST: Cria o cookie de sessão a partir de um ID token do Firebase
export async function POST(request: Request) {
  let idToken: string | undefined;

  // Tenta extrair o token do cabeçalho de autorização
  const authorizationHeader = request.headers.get('Authorization');
  if (authorizationHeader?.startsWith('Bearer ')) {
    idToken = authorizationHeader.split('Bearer ')[1];
  }

  // Se não estiver no cabeçalho, tenta obter do corpo da requisição
  if (!idToken) {
    try {
      const body = await request.json();
      idToken = body.idToken;
    } catch (error) {
      // Ignora o erro se o corpo não for JSON ou estiver vazio
    }
  }

  if (!idToken) {
    return NextResponse.json({ error: 'ID token não fornecido' }, { status: 401 });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    await ensureUserInFirestore(decodedToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Falha ao criar sessão:', error);
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
  }
}


// DELETE: Invalida e remove o cookie de sessão
export async function DELETE() {
  try {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Falha ao limpar sessão:', error);
    return NextResponse.json({ error: 'Falha ao limpar sessão' }, { status: 500 });
  }
}
