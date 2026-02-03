# Guia de Conexão com Firebase Database

Este guia ajuda você a configurar a conexão do seu projeto web com o banco de dados Firebase (Firestore).

## 1. Criar Projeto e App no Firebase Console

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Clique em **Adicionar projeto** (ou selecione um existente).
3.  Siga os passos para criar o projeto.
4.  Na tela inicial do projeto, clique no ícone de **Web** (</>).
5.  Registre o app com um apelido (ex: `EstateFlow Web`).
6.  O Firebase mostrará um objeto de configuração (`firebaseConfig`). **Não copie o código agora**, apenas mantenha essa tela aberta ou copie os valores individuais.

## 2. Configurar Variáveis de Ambiente

1.  Abra o arquivo `.env.local` no seu editor de código.
2.  Preencha as variáveis começando com `VITE_FIREBASE_` com os valores fornecidos pelo Firebase Console.

Exemplo de como preencher:

```env
VITE_FIREBASE_API_KEY=AIzaSyD... (sua API Key)
VITE_FIREBASE_AUTH_DOMAIN=estateflow-xyz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=estateflow-xyz
VITE_FIREBASE_STORAGE_BUCKET=estateflow-xyz.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF123
```

> **Nota:** Não use aspas nos valores dentro do arquivo `.env.local`.

## 3. Configurar o Banco de Dados (Firestore)

1.  No menu lateral do Firebase Console, vá em **Criação** > **Firestore Database**.
2.  Clique em **Criar banco de dados**.
3.  Escolha o local do servidor (ex: `nam5 (us-central)` ou `sao-paulo` se disponível/preferir).
4.  Comece no **modo de teste** (para desenvolvimento) ou **modo de produção**.
    *   *Modo de teste*: Permite leitura e escrita livre por 30 dias. Bom para testar agora.
    *   *Modo de produção*: Bloqueia tudo por padrão. Você precisará configurar as Regras de Segurança.

## 4. Testar a Conexão

O arquivo `firebaseConfig.ts` já exporta a instância `db`. Você pode usá-la em qualquer componente para ler/gravar dados.

Exemplo de uso (teste simples):

```typescript
import { db } from './firebaseConfig';
import { collection, addDoc } from "firebase/firestore";

async function testarConexao() {
  try {
    const docRef = await addDoc(collection(db, "testes"), {
      mensagem: "Olá Firebase!",
      data: new Date()
    });
    console.log("Documento gravado com ID: ", docRef.id);
    alert("Conexão bem sucedida! Veja o console.");
  } catch (e) {
    console.error("Erro ao adicionar documento: ", e);
    alert("Erro na conexão. Verifique o console.");
  }
}
```

## Resumo dos Arquivos Criados

*   `firebaseConfig.ts`: Código que inicializa o Firebase usando as variáveis de ambiente.
*   `.env.local`: Onde você coloca suas chaves secretas.
