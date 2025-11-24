import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // Tenta gerar um token customizado — se falhar, provavelmente as credenciais do Admin não estão corretas
    const token = await auth.createCustomToken(`diag-${Date.now()}`);

    // Opcional: tenta acessar o Firestore (lista coleções, se permitido)
    let collections = [] as string[];
    try {
      const cols = await db.listCollections();
      collections = cols.map((c) => c.id).slice(0, 10);
    } catch (e) {
      // Pode não ter permissão para listar coleções; não é fatal para o diagnóstico de credenciais
      console.warn('Firestore listCollections falhou (pode ser permissão):', e);
    }

    return NextResponse.json({ ok: true, tokenSampleLength: token.length, projectId: process.env.FIREBASE_PROJECT_ID || null, collections });
  } catch (error) {
    console.error('DEBUG: falha ao inicializar Firebase Admin:', error);
    const message = (error as any)?.message || String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
