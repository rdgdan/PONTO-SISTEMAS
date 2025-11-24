import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebaseAdmin';

// GET: Verifica a sessão do usuário e retorna seus dados mais recentes.
export async function GET() {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.warn('GET /api/auth/session: cookie __session não encontrado');
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }

    // 1. Decodifica o cookie para obter o UID de forma segura.
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. **CORREÇÃO DEFINITIVA**: Busca os dados mais recentes do usuário diretamente do Firebase Auth.
    //    Isso garante que `customClaims` (como `isAdmin`) estejam sempre atualizados para o cliente.
    const userRecord = await auth.getUser(decodedToken.uid);

    // 3. Busca dados complementares do perfil no Firestore (ex: nome personalizado).
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};

    // 4. Constrói a resposta final, priorizando os dados do Auth para permissões.
    const finalUserData = {
      uid: userRecord.uid,
      email: userRecord.email,
      // Usa o nome de exibição do Auth, fallback para o nome no Firestore, depois para o email.
      name: userRecord.displayName || firestoreData?.name || userRecord.email?.split('@')[0] || 'Usuário',
      // A fonte da verdade para `isAdmin` é o custom claim do Firebase Auth.
      isAdmin: userRecord.customClaims?.admin === true,
    };

    return NextResponse.json({ user: finalUserData });

  } catch (error) {
    console.error("Erro na rota GET /api/auth/session:", error);
    // Se for um erro de configuração do Admin SDK, retornamos 500 para indicar problema server-side
    const message = (error as any)?.message || String(error);
    if (message && /credential|credentials|initialize/i.test(message)) {
      return NextResponse.json({ error: 'Erro do servidor ao validar sessão' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
  }
}

// POST: Cria o cookie de sessão e garante que o usuário exista no Firestore
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token é obrigatório' }, { status: 400 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      await userDocRef.set({
        uid: uid,
        email: email,
        name: email?.split('@')[0] || 'Novo Usuário',
        isAdmin: false, // Novo usuário nunca é admin por padrão
        createdAt: new Date().toISOString(),
      });
    }

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
    const message = (error as any)?.message || String(error);
    if (message && /credential|credentials|initialize/i.test(message)) {
      return NextResponse.json({ error: 'Erro do servidor ao criar sessão' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Falha ao criar sessão' }, { status: 401 });
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
