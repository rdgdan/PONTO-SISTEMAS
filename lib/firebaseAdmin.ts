import admin from 'firebase-admin';

// Inicialização robusta e segura do Firebase Admin SDK.
// Estratégia:
// 1) Se detectarmos que o ambiente possui Application Default Credentials (ADC)
//    (por exemplo: Cloud Functions / Cloud Run / GCP), inicializamos com ADC
//    chamando `admin.initializeApp()` sem passar credenciais explícitas.
// 2) Caso contrário, tentamos usar as variáveis de ambiente do serviço (FIREBASE_*)
//    para inicializar via `admin.credential.cert(...)`.
// 3) Se nenhuma fonte de credenciais estiver disponível, lançamos um erro claro.

if (!admin.apps.length) {
  try {
    const hasADC = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE ||
      process.env.FUNCTIONS_EMULATOR ||
      process.env.GCP_PROJECT ||
      process.env.FIREBASE_CONFIG
    );

    if (hasADC) {
      // Em ambientes GCP/Firebase o ADC estará disponível e é mais seguro.
      admin.initializeApp();
      console.log('Firebase Admin SDK inicializado usando Application Default Credentials.');
    } else {
      // Fallback para inicialização via variáveis de ambiente (service account fields)
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A chave privada pode vir com '\\n' no .env; convertemos em nova linha real.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('As variáveis de ambiente do Firebase Admin SDK (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão definidas. Em ambientes de produção prefira ADC; caso contrário, defina as variáveis corretamente.');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK inicializado com credenciais do arquivo/service account em variáveis de ambiente.');
    }
  } catch (error: any) {
    console.error('ERRO CRÍTICO AO INICIALIZAR O FIREBASE ADMIN SDK:', error?.message || error);
    throw new Error(`Falha na inicialização do Firebase Admin: ${error?.message || String(error)}`);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
