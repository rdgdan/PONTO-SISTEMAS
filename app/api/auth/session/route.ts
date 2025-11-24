import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebaseAdmin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Função auxiliar para garantir que o usuário exista no Firestore.
async function ensureUserInFirestore(decodedToken: DecodedIdToken) {
  const { uid, email, name } = decodedToken;
  const userDocRef = db.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    await userDocRef.set({
      uid,
      email,
      name: name || email?.split('@')[0] || 'Novo Usuário',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    });
  }
}

// Rota GET: Verifica a sessão do usuário a partir do cookie.
export async function GET(request: Request) {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userRecord = await auth.getUser(decodedToken.uid);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};

    const finalUserData = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || firestoreData?.name || 'Usuário',
      isAdmin: userRecord.customClaims?.admin === true,
    };

    return NextResponse.json({ user: finalUserData }, { status: 200 });

  } catch (error) {
    console.error('[API /api/auth/session GET] Erro ao verificar sessão:', error);
    // Limpa o cookie inválido se a verificação falhar.
    cookies().delete('__session');
    return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
  }
}

// Rota POST: Cria um cookie de sessão a partir de um ID token.
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização não fornecido.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    // Verifica o ID token com o Firebase Admin SDK.
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log(`[API POST] ID token verificado para: ${decodedToken.uid}`);

    // Garante que os dados do usuário estejam no Firestore.
    await ensureUserInFirestore(decodedToken);

    // Cria o cookie de sessão.
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 dias
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Configura o cookie na resposta.
    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('-------------------------------------------------------------');
    console.error('--- [API /api/auth/session POST] ERRO CRÍTICO NA SESSÃO ---');
    console.error(`--- Mensagem: ${error.message}`);
    if (error.code) {
      console.error(`--- Código do Erro: ${error.code}`);
    }
    console.error('--- CAUSA PROVÁVEL: Problema com as variáveis de ambiente do Firebase Admin (FIREBASE_PRIVATE_KEY) no ambiente de produção (Vercel).');
    console.error('-------------------------------------------------------------');
    return NextResponse.json({ error: 'Falha na autenticação do servidor.', details: error.message }, { status: 401 });
  }
}

// Rota DELETE: Expira o cookie de sessão (logout).
export async function DELETE(request: Request) {
  try {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[API /api/auth/session DELETE] Falha ao limpar sessão:', error);
    return NextResponse.json({ error: 'Falha ao fazer logout.' }, { status: 500 });
  }
}
