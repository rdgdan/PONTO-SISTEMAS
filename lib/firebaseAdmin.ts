import admin from 'firebase-admin';

// Esta verificação garante que a inicialização ocorra apenas uma vez, 
// mesmo que este módulo seja importado várias vezes em diferentes partes do servidor.
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A chave privada do Firebase vem com caracteres de nova linha como '\\n' no .env,
      // que precisam ser substituídos por um caractere de nova linha real.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validação robusta para garantir que todas as variáveis de ambiente necessárias estão presentes.
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('As variáveis de ambiente do Firebase Admin SDK (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão definidas. Verifique seu arquivo .env.local e reinicie o servidor.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");

  } catch (error: any) {
    console.error("ERRO CRÍTICO AO INICIALIZAR O FIREBASE ADMIN SDK:", error.message);
    // Lançar o erro aqui é crucial. Impede que a aplicação continue rodando
    // em um estado quebrado e não configurado, o que poderia levar a erros mais obscuros.
    throw new Error(`Falha na inicialização do Firebase Admin: ${error.message}`);
  }
}

// Agora que a inicialização está garantida, podemos exportar com segurança as instâncias
// dos serviços do Firebase. Qualquer arquivo que importar 'auth' ou 'db'
// receberá uma instância pronta para uso.
export const auth = admin.auth();
export const db = admin.firestore();
