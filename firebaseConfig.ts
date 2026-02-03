import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Configuração do Firebase usando variáveis de ambiente
// Isso mantém suas chaves seguras e flexíveis
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializa o app do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore (Banco de dados)
const db = getFirestore(app);

// Inicializa a Autenticação
const auth = getAuth(app);

// Inicializa o Analytics (opcional, pode remover se não usar)
// Verificamos se estamos no navegador para evitar erros no servidor/build
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, db, auth, analytics };
