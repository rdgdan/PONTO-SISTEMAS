# Blueprint da Aplicação de Ponto Eletrônico

## Visão Geral

O objetivo deste projeto é criar um sistema de ponto eletrônico flexível, moderno e eficiente, utilizando Next.js e Firebase. A aplicação permite que usuários registrem seus horários de trabalho manualmente através de um calendário, com cálculo automatizado de horas normais, horas extras e banco de horas, com base em regras de negócio predefinidas.

---

## Funcionalidades e Design Implementados

### v1.0 - Estrutura, Autenticação e Gestão de Usuários
*   **Autenticação Segura:** Login com email/senha e gerenciamento de sessão com cookies HTTP-only.
*   **Painel de Administração (`/admin`):** Interface para administradores visualizarem, atualizarem e excluírem usuários.
*   **Estrutura do Projeto:** Configuração inicial com Next.js (App Router), TypeScript e Firebase Admin SDK.

### v2.0 - Dashboard Interativo com Calendário
*   **Interface Centrada no Calendário:** O dashboard foi redesenhado para ter o `react-calendar` como elemento central.
*   **Modal de Registro/Edição:** Um modal é aberto ao clicar em um dia, pré-preenchendo dados existentes ou preparando um novo registro.
*   **Estilo Visual Coeso:** O calendário e todos os componentes foram estilizados para se integrarem ao tema escuro da aplicação.
*   **Correção de Fuso Horário:** A lógica de registro de ponto foi ajustada para lidar corretamente com fusos horários, garantindo que os horários sejam salvos e exibidos com precisão.

### v3.0 - Refatoração do Layout e Regras de Almoço
*   **Componente de Cabeçalho (`Header.tsx`):** Criação de um novo componente para a barra de navegação superior, simplificando a interface.
*   **Regra de Almoço Simplificada:** Para qualquer dia trabalhado, será automaticamente deduzida 1 hora de almoço se a duração total do trabalho for superior a 4 horas.

### v4.0 - Sistema de Banco de Horas e Formato Centesimal
*   **Banco de Horas:**
    *   **Débito (Sair Cedo):** Qualquer tempo faltante na jornada de 8 horas, mesmo que fracionado, é registrado como um valor negativo no banco de horas.
    *   **Crédito (Ficar a Mais):** O tempo excedente só é computado como "Hora Extra" a cada hora completa. Frações de tempo são desconsideradas.
*   **Representação Centesimal:** Todos os valores de horas são exibidos no formato centesimal (ex: 7 horas e 30 minutos é mostrado como `7.30h`).
*   **Arredondamento em Feriados/Fins de Semana:** Ao registrar um ponto em um feriado ou fim de semana, a hora de saída é arredondada para baixo para a hora cheia.
*   **Interface Atualizada:** A tabela de histórico agora exibe a coluna "Banco de Horas" com formatação de cor para fácil identificação.

### v4.1 - Correção Definitiva de Sincronização de Dados
*   **Diagnóstico:** Foi identificado que, ao atualizar um usuário, o nome era salvo corretamente no banco de dados **Firestore**, mas não era atualizado no perfil de **Autenticação do Firebase** (no campo `displayName`). A página `/admin` lia os dados da Autenticação, causando a exibição de dados desatualizados.
*   **Solução:** A `server action` `updateUser` foi corrigida para atualizar o nome do usuário em ambos os locais: na Autenticação do Firebase, usando `auth.updateUser()`, e no Firestore. Isso garante a consistência total dos dados em toda a aplicação.
*   **Desativação de Cache:** Para garantir que a lista de usuários esteja sempre 100% atualizada após uma alteração, as páginas que exibem dados sensíveis (como `/admin`) foram marcadas como totalmente dinâmicas, instruindo o servidor a nunca usar uma versão em cache.

---

## Plano de Ação

(Nenhuma ação em andamento no momento)
