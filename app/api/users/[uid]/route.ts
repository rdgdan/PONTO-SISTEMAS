
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { headers } from 'next/headers';

async function verifyAdmin(authorization: string | null) {
    if (!authorization) {
        throw new Error('Authorization header missing');
    }
    const token = authorization.split('Bearer ')[1];
    if (!token) {
        throw new Error('Bearer token missing');
    }
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    if (userRecord.customClaims?.['role'] !== 'admin') {
        throw new Error('Acesso não autorizado');
    }
    return decodedToken;
}

// Resetar a senha do usuário
export async function POST(request: Request, { params }: { params: { uid: string } }) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    await verifyAdmin(authorization);

    const { uid } = params;
    const user = await auth.getUser(uid);
    const email = user.email as string;
    await auth.generatePasswordResetLink(email);

    return NextResponse.json({ message: `Link de redefinição de senha enviado para ${email}` });

  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    const message = error instanceof Error ? error.message : 'Falha ao resetar senha';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


// Atualizar dados do usuário
export async function PUT(request: Request, { params }: { params: { uid: string } }) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    await verifyAdmin(authorization);

    const { uid } = params;
    const { displayName, sector } = await request.json();

    // Atualiza no Auth
    await auth.updateUser(uid, { displayName });

    // Atualiza no Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ displayName, sector });

    return NextResponse.json({ message: 'Usuário atualizado com sucesso' });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    const message = error instanceof Error ? error.message : 'Falha ao atualizar usuário';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Excluir usuário
export async function DELETE(request: Request, { params }: { params: { uid: string } }) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    await verifyAdmin(authorization);

    const { uid } = params;

    // Exclui do Auth
    await auth.deleteUser(uid);

    // Exclui do Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.delete();

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });

  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    const message = error instanceof Error ? error.message : 'Falha ao excluir usuário';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
