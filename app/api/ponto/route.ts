
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebaseAdmin'; // Correto: usa a instância centralizada
import { FieldValue } from 'firebase-admin/firestore';

// Garante que a rota seja dinâmica
export const dynamic = 'force-dynamic';

/**
 * @description Busca o histórico de pontos do usuário autenticado.
 * @returns {Promise<NextResponse>} Retorna a lista de registros de ponto.
 */
export async function GET() {
  try {
    // 1. **AUTENTICAÇÃO CORRIGIDA**: Verifica o cookie de sessão
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const { uid } = decodedToken;

    // 2. Busca os registros no Firestore ordenados por data
    const snapshot = await db.collection('pontos')
                             .where('userId', '==', uid)
                             .orderBy('checkIn', 'desc')
                             .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Converte Timestamps para strings ISO para serem serializáveis
        checkIn: data.checkIn.toDate().toISOString(),
        checkOut: data.checkOut ? data.checkOut.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(history);

  } catch (error) {
    console.error("Erro ao buscar registros de ponto:", error);
    const message = error instanceof Error ? error.message : 'Falha ao buscar registros';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * @description Cria um novo registro de ponto (entrada/saída).
 *              Funciona como um "toggle": se há um ponto aberto, ele fecha. Se não, abre um novo.
 * @returns {Promise<NextResponse>} Retorna o status da operação.
 */
export async function POST() {
  try {
    // 1. **AUTENTICAÇÃO CORRIGIDA**: Verifica o cookie de sessão
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const { uid } = decodedToken;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // 2. Procura por um registro de ponto aberto hoje
    const pontoAbertoQuery = await db.collection('pontos')
                                     .where('userId', '==', uid)
                                     .where('day', '==', todayStr)
                                     .where('checkOut', '==', null)
                                     .limit(1)
                                     .get();

    if (pontoAbertoQuery.empty) {
      // **CLOCK IN (ENTRADA)**: Não há ponto aberto, então cria um novo.
      const novoPonto = {
        userId: uid,
        day: todayStr,
        checkIn: FieldValue.serverTimestamp(), // Usa o timestamp do servidor
        checkOut: null,
        totalHours: null, // Será calculado no clock-out
      };
      await db.collection('pontos').add(novoPonto);
      return NextResponse.json({ status: 'clock-in', message: 'Entrada registrada com sucesso!' });
    } else {
      // **CLOCK OUT (SAÍDA)**: Existe um ponto aberto, então o fecha.
      const pontoDoc = pontoAbertoQuery.docs[0];
      await pontoDoc.ref.update({
        checkOut: FieldValue.serverTimestamp(), // Usa o timestamp do servidor
      });
      return NextResponse.json({ status: 'clock-out', message: 'Saída registrada com sucesso!' });
    }

  } catch (error) {
    console.error("Erro ao registrar ponto:", error);
    const message = error instanceof Error ? error.message : 'Falha ao registrar ponto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
