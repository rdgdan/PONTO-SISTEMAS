import { cookies } from 'next/headers';
import { auth } from './firebaseAdmin';

/**
 * @description Verifica o cookie de sessão do Firebase a partir das requisições do servidor.
 * @returns O token decodificado do usuário, se a sessão for válida; caso contrário, null.
 */
export async function getServerSession() {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // Verifica o cookie de sessão usando o Firebase Admin SDK.
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
    return decodedToken;
  } catch (error) {
    console.error('Falha ao verificar o cookie de sessão:', error);
    return null;
  }
}
