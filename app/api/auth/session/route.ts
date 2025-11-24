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
      isAdmin: false, 
      createdAt: new Date().toISOString(),
    });
  }
}

export async function GET(request: Request) {
  // ... (código GET existente sem alterações)
}

export async function POST(request: Request) {
  console.log('[API /api/auth/session POST] Início da requisição.');
  let idToken: string | undefined;

  const authorizationHeader = request.headers.get('Authorization');
  if (authorizationHeader?.startsWith('Bearer ')) {
    idToken = authorizationHeader.split('Bearer ')[1];
    console.log('[API /api/auth/session POST] ID token extraído do cabeçalho Authorization.');
  }

  if (!idToken) {
    try {
      const body = await request.json();
      idToken = body.idToken;
      if (idToken) {
        console.log('[API /api/auth/session POST] ID token extraído do corpo da requisição.');
      } 
    } catch (error) {
        console.log('[API /api/auth/session POST] Corpo da requisição não é JSON ou está vazio. Ignorando.');
    }
  }

  if (!idToken) {
    console.error('[API /api/auth/session POST] ERRO: ID token não fornecido nem no cabeçalho, nem no corpo.');
    return NextResponse.json({ error: 'ID token não fornecido' }, { status: 401 });
  }

  try {
    console.log('[API /api/auth/session POST] Tentando verificar o ID token com o Firebase Admin SDK...');
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log(`[API /api/auth/session POST] ID token verificado com sucesso para o UID: ${decodedToken.uid}`);

    await ensureUserInFirestore(decodedToken);
    console.log(`[API /api/auth/session POST] Usuário ${decodedToken.uid} garantido no Firestore.`);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
    console.log('[API /api/auth/session POST] Criando o cookie de sessão...');
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log('[API /api/auth/session POST] Cookie de sessão criado com sucesso.');

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    console.log('[API /api/auth/session POST] Cookie de sessão configurado no navegador.');

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    // Log detalhado do erro de verificação
    console.error('-------------------------------------------------------------');
    console.error('--- [API /api/auth/session POST] ERRO CRÍTICO NA SESSÃO ---');
    console.error(`--- Mensagem: ${error.message}`);
    if (error.code) {
      console.error(`--- Código do Erro: ${error.code}`);
    }
    console.error('--- CAUSA PROVÁVEL: Se o código for \'auth/argument-error\', pode indicar um problema com as variáveis de ambiente (FIREBASE_PRIVATE_KEY, etc.) no ambiente de produção (Vercel). Verifique se elas estão configuradas corretamente.');
    console.error('-------------------------------------------------------------');
    
    return NextResponse.json({ error: 'Token inválido, expirado ou erro de configuração do servidor.', details: error.message }, { status: 401 });
  }
}

export async function DELETE() {
  // ... (código DELETE existente sem alterações)
}
