import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    setDoc,
    getDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Property, Contract, User, Conversation, ChatMessage } from "../types";

// --- PROPRIEDADES ---

export const getProperties = async () => {
    try {
        const q = query(collection(db, "properties"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Property[];
    } catch (error) {
        console.error("Erro ao buscar propriedades:", error);
        return [];
    }
};

export const addProperty = async (property: Property) => {
    try {
        const { id, ...data } = property;
        const docRef = await addDoc(collection(db, "properties"), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { ...property, id: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar propriedade:", error);
        throw error;
    }
};

export const updateProperty = async (id: string, data: Partial<Property>) => {
    try {
        const docRef = doc(db, "properties", id);
        await updateDoc(docRef, data);
        return true;
    } catch (error) {
        console.error("Erro ao atualizar propriedade:", error);
        return false;
    }
};

export const deleteProperty = async (id: string) => {
    try {
        await deleteDoc(doc(db, "properties", id));
        return true;
    } catch (error) {
        console.error("Erro ao deletar propriedade:", error);
        return false;
    }
};

// --- CONTRATOS ---

export const getContracts = async () => {
    try {
        const q = query(collection(db, "contracts"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Contract[];
    } catch (error) {
        console.error("Erro ao buscar contratos:", error);
        return [];
    }
};

export const addContract = async (contract: Contract) => {
    try {
        const { id, ...data } = contract;
        const docRef = await addDoc(collection(db, "contracts"), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { ...contract, id: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar contrato:", error);
        throw error;
    }
};

export const updateContract = async (id: string, data: Partial<Contract>) => {
    try {
        const docRef = doc(db, "contracts", id);
        await updateDoc(docRef, data);
        return true;
    } catch (error) {
        console.error("Erro ao atualizar contrato:", error);
        return false;
    }
};

export const deleteContract = async (id: string) => {
    try {
        await deleteDoc(doc(db, "contracts", id));
        return true;
    } catch (error) {
        console.error("Erro ao deletar contrato:", error);
        return false;
    }
};

// --- USERS (ADMIN/LIST) ---

export const getUsers = async () => {
    try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as User[];
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
    }
};

export const toggleFavorite = async (userId: string, propertyId: string | number) => {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        let currentFavorites: (string | number)[] = [];

        if (userSnap.exists()) {
            const userData = userSnap.data();
            currentFavorites = (userData.favorites || []) as (string | number)[];
        }

        let newFavorites;
        if (currentFavorites.includes(propertyId)) {
            newFavorites = currentFavorites.filter(id => id !== propertyId);
        } else {
            newFavorites = [...currentFavorites, propertyId];
        }

        // setDoc com merge: true cria se não existir ou atualiza se existir
        await setDoc(userRef, { favorites: newFavorites }, { merge: true });
        return newFavorites;

    } catch (error) {
        console.error("Erro ao favoritar:", error);
    }
    return null;
}

// Função para marcar conversa como lida
export const markConversationAsRead = async (conversationId: string) => {
    try {
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
            unreadCount: 0
        });
    } catch (e) {
        console.error("Erro ao marcar como lida:", e);
    }
};

// --- CHAT / CONVERSATIONS ---

// Salva uma nova mensagem e atualiza a conversa
export const saveMessage = async (conversationId: string, message: ChatMessage, conversationData: Partial<Conversation>) => {
    try {
        const convRef = doc(db, "conversations", conversationId);

        // Atualiza a conversa principal (última mensagem, count, etc)
        // Se não existir, 'setDoc' cria com merge: true
        await setDoc(convRef, {
            ...conversationData,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Adiciona a mensagem na subcoleção 'messages'
        // Usamos addDoc para gerar ID único automático para a mensagem
        await addDoc(collection(convRef, "messages"), message);

        return true;
    } catch (error) {
        console.error("Erro ao salvar mensagem:", error);
        return false;
    }
}

// Observa conversas em tempo real
export const subscribeToConversations = (callback: (conversations: Conversation[]) => void) => {
    const q = query(collection(db, "conversations"));

    return onSnapshot(q, async (snapshot) => {
        const convs: Conversation[] = [];

        // Para cada conversa, precisamos pegar as mensagens (ou pelo menos as últimas)
        // Por simplicidade neste MVP, vamos pegar as mensagens de cada conversa aqui
        // O ideal seria carregar mensagens sob demanda ao abrir o chat

        for (const docSnap of snapshot.docs) {
            const convData = docSnap.data();
            const msgsQuery = query(collection(docSnap.ref, "messages")); // order by time?
            const msgsSnap = await getDocs(msgsQuery); // snapshot único por enquanto
            const messages = msgsSnap.docs.map(m => m.data() as ChatMessage).sort((a, b) => a.id - b.id);

            convs.push({
                id: docSnap.id,
                ...convData,
                messages: messages
            } as any);
        }

        callback(convs);
    });
}

// --- NOTIFICAÇÕES ---

export const getNotifications = async (userId?: string) => {
    try {
        const q = userId
            ? query(collection(db, "notifications"), where("userId", "==", userId))
            : query(collection(db, "notifications"));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
    }
};

export const addNotification = async (notification: any) => {
    try {
        const docRef = await addDoc(collection(db, "notifications"), {
            ...notification,
            timestamp: new Date().toISOString(),
            read: false
        });
        return { ...notification, id: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar notificação:", error);
        throw error;
    }
};

export const markNotificationAsRead = async (id: string) => {
    try {
        const notifRef = doc(db, "notifications", id);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
    }
};

export const markAllNotificationsAsRead = async (userId?: string) => {
    try {
        const q = userId
            ? query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))
            : query(collection(db, "notifications"), where("read", "==", false));

        const querySnapshot = await getDocs(q);
        const updates = querySnapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );
        await Promise.all(updates);
    } catch (error) {
        console.error("Erro ao marcar todas como lidas:", error);
    }
};

export const deleteNotification = async (id: string) => {
    try {
        await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
        console.error("Erro ao deletar notificação:", error);
    }
};

export const clearAllNotifications = async (userId?: string) => {
    try {
        const q = userId
            ? query(collection(db, "notifications"), where("userId", "==", userId))
            : query(collection(db, "notifications"));

        const querySnapshot = await getDocs(q);
        const deletes = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletes);
    } catch (error) {
        console.error("Erro ao limpar notificações:", error);
    }
};

export const subscribeToNotifications = (callback: (notifications: any[]) => void, userId?: string) => {
    const q = userId
        ? query(collection(db, "notifications"), where("userId", "==", userId))
        : query(collection(db, "notifications"));

    return onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(notifs);
    });
};
