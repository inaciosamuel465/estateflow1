# Guia de Implantação no Firebase

Este projeto está configurado para ser implantado no **Firebase Hosting**.

## Pré-requisitos

1.  Ter o **Node.js** instalado.
2.  Ter uma conta no Google/Firebase.

## Passo a Passo

### 1. Instalar o Firebase CLI
Abra o terminal e execute:
```bash
npm install -g firebase-tools
```

### 2. Login no Firebase
Conecte o CLI à sua conta do Google:
```bash
firebase login
```

### 3. Inicializar o Projeto (Apenas na primeira vez)
Se você já não tem um projeto criado no console do Firebase (https://console.firebase.google.com/), crie um.
Depois, no terminal, na pasta do projeto:
```bash
firebase init hosting
```
- Selecione **Use an existing project** (se já criou no console) ou **Create a new project**.
- Quando perguntar "What do you want to use as your public directory?", digite: **dist**
- Quando perguntar "Configure as a single-page app (rewrite all urls to /index.html)?", digite: **Yes** (Y)
- Quando perguntar "Set up automatic builds and deploys with GitHub?", responda conforme sua preferência (geralmente No para começar).
- **Importante:** Se ele perguntar se quer sobrescrever o `index.html` ou `firebase.json`, diga **No**, pois já configuramos isso para você.

### 4. Build e Deploy
Sempre que quiser publicar uma nova versão:

1.  Gere a versão de produção:
    ```bash
    npm run build
    ```
2.  Envie para o Firebase:
    ```bash
    firebase deploy
    ```

Após o comando terminar, ele mostrará a **Hosting URL** onde seu site está no ar.
