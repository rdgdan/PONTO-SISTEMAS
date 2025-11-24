# Blueprint do Projeto PONTO-SISTEMAS

## Visão Geral

O PONTO-SISTEMAS é uma aplicação web construída com Next.js e Firebase, projetada para fornecer um sistema de ponto eletrônico para empresas. A aplicação permite que os funcionários registrem seus pontos de entrada e saída, e que os administradores gerenciem os registros e usuários.

## Design e Estilo

- **Framework UI:** Tailwind CSS
- **Componentes:** Headless UI e componentes personalizados em `components/`
- **Estilo Visual:** Moderno e limpo, com um tema escuro predominante (`bg-slate-950`). Usa gradientes e efeitos de blur para um visual mais sofisticado. Paleta de cores focada em roxo e azul.
- **Responsividade:** O layout é projetado para ser responsivo e funcionar bem em dispositivos móveis e desktops.

## Funcionalidades Implementadas

### Autenticação

- **Fluxo de Autenticação:** A autenticação é gerenciada pelo Firebase, usando um fluxo híbrido (cliente/servidor).
  1. **Lado do Cliente (Client-side):** O login (email/senha e Google) e o registro acontecem no navegador usando o SDK do Firebase (`firebase/auth`).
  2. **Geração de Token:** Após a autenticação bem-sucedida no cliente, um `idToken` do Firebase é gerado.
  3. **Criação de Sessão (Server-side):** O `idToken` é enviado para a API do Next.js no endpoint `/api/auth/session`.
  4. **Cookie de Sessão:** O servidor valida o `idToken` usando o Firebase Admin SDK, cria um cookie de sessão (`__session`) seguro e `HttpOnly`, e o armazena no navegador do usuário. Isso estabelece uma sessão persistente e segura.
- **Provedores de Autenticação:**
  - Email e Senha
  - Google
- **Gerenciamento de Usuários:**
  - Os dados dos usuários (UID, email, nome, `isAdmin`) são armazenados na coleção `users` do Firestore.
  - A criação de novos usuários no Firestore acontece automaticamente no primeiro login.

### Dashboard

- **Página Principal (`/dashboard`):** Exibe informações relevantes para o usuário logado, como um relógio em tempo real, um cronômetro e atalhos para ações rápidas.
- **Página de Administração (`/admin`):** Acessível apenas por usuários com a flag `isAdmin` como `true`. Permite a visualização e gerenciamento de todos os usuários.

## Mudanças Realizadas (Sessão Atual)

Nesta sessão, as seguintes alterações foram implementadas para corrigir o fluxo de autenticação e reintroduzir a funcionalidade de login com Google:

1.  **Refatoração do `LoginForm.tsx`:**
    - Reintroduzido o botão e a lógica para **Login com Google** (`handleGoogleSignIn`).
    - A função `handleSubmit` (para login com email/senha) foi modificada para usar `signInWithEmailAndPassword` do SDK do Firebase no cliente, em vez de enviar as credenciais diretamente para a API.
    - Criada a função `handleAuthSuccess` para unificar a lógica pós-autenticação (envio do `idToken` para a API de sessão).

2.  **Robustez da API de Sessão (`app/api/auth/session/route.ts`):**
    - A rota `POST` foi aprimorada para aceitar o `idToken` tanto do **corpo da requisição** (`body.idToken`) quanto do **cabeçalho de autorização** (`Authorization: Bearer <token>`). Isso torna a API mais flexível e alinhada com as melhores práticas.

3.  **Otimização da Página de Registro (`app/register/page.tsx`):**
    - O código foi refatorado para usar uma função unificada `handleAuthSuccess` para lidar com o pós-registro (criação de usuário no Firestore e criação da sessão).
    - A operação de escrita no Firestore agora usa a opção `{ merge: true }`, o que previne a sobrescrita acidental de dados caso o documento do usuário já exista.

## Próximos Passos (Sugestões)

- **Variáveis de Ambiente no Vercel:** Para que o deploy no Vercel funcione corretamente, as seguintes variáveis de ambiente precisam ser configuradas no painel do projeto no Vercel:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PROJECT_ID`

- **Segurança do Firestore:** Revisar as regras de segurança do Firestore (`firestore.rules`) para garantir que apenas usuários autorizados possam ler e escrever dados.

- **Feedback ao Usuário:** Melhorar o feedback visual durante o carregamento e em caso de erros, usando componentes como toasts ou spinners mais elaborados.
