# Instruções para colaboradores

Este repositório foi importado a partir de um backup e limpo para remover dependências e artefatos de build (por exemplo `node_modules` e binários grandes). Siga as instruções abaixo para sincronizar seu clone local ou começar a contribuir.

## O que mudou
- Os diretórios `node_modules/` e arquivos binários grandes foram removidos antes do push.
- Há um `.gitignore` configurado para evitar que artefatos sejam versionados.

Se você tinha um clone antigo deste projeto, o histórico remoto pode ser diferente do que você tem localmente — a forma mais segura é re-clonar o repositório.

## Recomendações (recomendado: re-clonar)
1. Fazer backup de alterações locais (se houver):
```powershell
# dentro do seu clone local existente
git stash push -m "backup before reclone"  # ou crie um patch com git format-patch
```

2. Re-clonar (mais simples e seguro):
```powershell
cd C:\pasta\onde\quer\clonar
git clone https://github.com/rdgdan/PONTO-SISTEMAS.git
cd PONTO-SISTEMAS
```

3. Instalar dependências e rodar localmente (ajuste se usar `yarn` ou `pnpm`):
```powershell
npm install
cd functions
npm install
cd ..
npm run dev      # ou o comando definido em package.json para desenvolvimento
```

## Atualizar um clone existente (não recomendado, mas possível)
Se você não pode re-clonar, sincronize seu clone existente com o remoto (atenção: isto sobrescreverá alterações locais não salvas):
```powershell
cd C:\caminho\do\seu\clone
git fetch origin
git reset --hard origin/main
git clean -fdx
```

Antes disso, faça backup de qualquer trabalho não comitado (`git stash` ou `git format-patch`).

## E-mails/identidade de commit
Se o GitHub bloquear pushes por causa de email privado (GH007), use seu endereço noreply do GitHub ou torne seu e-mail público nas configurações. Para alterar o email apenas neste repositório:
```powershell
git config user.email "SEU_NOREPLY@users.noreply.github.com"
git commit --amend --author="Seu Nome <SEU_NOREPLY@users.noreply.github.com>" --no-edit
git push --force origin main
```

## Boas práticas de contribuição
- Nunca commitar `node_modules/` ou binários grandes. O `.gitignore` já contempla isso.
- Se precisar versionar binários grandes, use Git LFS:
```powershell
git lfs install
git lfs track "*.node"
git add .gitattributes
git commit -m "Track .node with Git LFS"
```
- Antes de abrir PR: rode os testes e garanta que `npm run build` funcione.

## Deploy / Firebase
Existem arquivos de configuração do Firebase (`firebase.json`, `.firebaserc`). Para deploy, siga os passos usuais:
```powershell
npm i -g firebase-tools
firebase login
firebase deploy
```

Observação: Recrie dependências localmente (não commitá-las). Se quiser, posso adicionar um `README` de setup com passos mais detalhados para o ambiente de desenvolvimento.

## Contato
Se houver problemas para sincronizar seu clone, envie o erro/saída do terminal e eu ajudo a resolver.

---
Arquivo gerado automaticamente: instruções para facilitar a colaboração após a importação limpa.
