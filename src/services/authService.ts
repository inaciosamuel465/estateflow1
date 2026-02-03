import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // Corrigido caminho
import type { User } from "../types";
import type { RegisterData } from "../../pages/LoginPage";

// Tipos de resposta para facilitar o uso no Front
export interface AuthResponse {
    user: User | null;
    error?: string;
}

// Mapear usuário do Firebase para o nosso tipo User
const mapFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    // Buscar dados extras no Firestore (role, phone, etc)
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            id: firebaseUser.uid, // Agora ID é string
            name: userData.name || firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            role: userData.role || 'client',
            phone: userData.phone,
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${userData.name || 'User'}&background=random`,
            document: userData.document,
            address: userData.address,
            favorites: userData.favorites || []
        } as any; // Cast 'any' temporário para o ID number/string
    }

    // Fallback se não tiver no Firestore (ex: usuário antigo ou erro)
    // Se não existir, CRIAMOS o documento básico para evitar erros futuros
    const defaultUserData = {
        name: firebaseUser.displayName || 'Usuário',
        email: firebaseUser.email || '',
        role: 'client',
        createdAt: new Date().toISOString()
    };

    // Tenta criar (sem sobrescrever se existir magicamente agora)
    // Mas setDoc com merge: true é mais seguro
    try {
        await setDoc(userDocRef, defaultUserData, { merge: true });
    } catch (e) {
        console.error("Erro ao criar perfil de fallback:", e);
    }

    return {
        id: firebaseUser.uid,
        ...defaultUserData,
        avatar: firebaseUser.photoURL || undefined
    } as any;
};

// --- Funções de Autenticação ---

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;

        // Atualizar perfil básico no Auth
        await updateProfile(firebaseUser, {
            displayName: data.name
        });

        // Salvar dados extras no Firestore
        const userData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", firebaseUser.uid), userData);

        // Retorna o usuário formatado
        const appUser = await mapFirebaseUser(firebaseUser);
        return { user: appUser };

    } catch (error: any) {
        console.error("Erro ao registrar:", error);
        let message = "Erro ao criar conta.";
        if (error.code === 'auth/email-already-in-use') message = "Este email já está cadastrado.";
        if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
        return { user: null, error: message };
    }
};

export const loginUser = async (email: string, pass: string): Promise<AuthResponse> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const appUser = await mapFirebaseUser(userCredential.user);
        return { user: appUser };
    } catch (error: any) {
        console.error("Erro ao logar:", error);
        let message = "Erro ao fazer login.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === "auth/invalid-credential") {
            message = "Email ou senha incorretos.";
        }
        return { user: null, error: message };
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
};

// Hook para observar o estado (pode ser usado num useEffect global)
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const appUser = await mapFirebaseUser(firebaseUser);
            callback(appUser);
        } else {
            callback(null);
        }
    });
};
