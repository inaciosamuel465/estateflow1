import {
    addProperty,
    addContract,
    getProperties,
    getContracts,
    saveMessage
} from "../services/dataService";
import { Property, Contract, User, Conversation } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// --- DADOS MOCKADOS ORIGINAIS DO APP.TSX ---

const INITIAL_PROPERTIES: Property[] = [
    {
        id: 1,
        title: "Residencial Luxo Augusta",
        price: "R$ 450.000",
        location: "Consolação, SP",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
        beds: 2,
        baths: 2,
        area: 80,
        tag: "Destaque",
        type: "Apartamento",
        purpose: 'sale',
        ownerId: 101,
        status: 'active',
        stats: { views: 1240, likes: 45, leads: 12 }
    },
    {
        id: 'cob-paulista-1234',
        title: "Cobertura Panorâmica",
        price: "R$ 2.450.000",
        location: "Bela Vista, SP",
        image: "https://images.unsplash.com/photo-1512918760513-95f192972701?q=80&w=800&auto=format&fit=crop",
        beds: 4,
        baths: 4,
        area: 285,
        tag: "Luxo",
        type: "Apartamento",
        purpose: 'sale',
        ownerId: 102,
        status: 'active',
        stats: { views: 5400, likes: 320, leads: 50 }
    },
    {
        id: 3,
        title: "Studio Moderno Jardins",
        price: "R$ 3.200/mês",
        location: "Jardins, SP",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
        beds: 1,
        baths: 1,
        area: 45,
        tag: "Mobiliado",
        type: "Apartamento",
        purpose: 'rent',
        ownerId: 999,
        status: 'rented',
        stats: { views: 800, likes: 20, leads: 5 }
    },
    {
        id: 5,
        title: "Mansão Oscar Freire",
        price: "R$ 890.000",
        location: "Jardins, SP",
        image: "https://images.unsplash.com/photo-1600596542815-27b88e39e1d7?q=80&w=800&auto=format&fit=crop",
        beds: 3,
        baths: 3,
        area: 150,
        tag: "Novo",
        type: "Casa",
        purpose: 'sale',
        ownerId: 101,
        status: 'active',
        stats: { views: 2100, likes: 150, leads: 25 }
    },
    {
        id: 8,
        title: "Vila Charmosa",
        price: "R$ 5.500/mês",
        location: "Vila Madalena, SP",
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop",
        beds: 2,
        baths: 2,
        area: 110,
        tag: "Pet Friendly",
        type: "Casa",
        purpose: 'rent',
        ownerId: 102,
        status: 'active',
        stats: { views: 950, likes: 40, leads: 8 }
    },
];

const INITIAL_CONTRACTS: Contract[] = [
    {
        id: 1001,
        propertyId: 3,
        propertyTitle: "Studio Moderno Jardins",
        propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400&auto=format&fit=crop",
        type: 'rent',
        status: 'active',
        clientId: 200,
        clientName: "João Cliente",
        clientPhone: "5511977777777",
        ownerId: 101,
        ownerName: "Carlos Proprietário",
        ownerPhone: "5511999999999",
        value: 3200,
        commissionRate: 10,
        dueDay: 5,
        startDate: "2023-10-01",
        endDate: "2024-10-01",
        nextPaymentStatus: 'pending',
        templateType: 'rent_residential',
        signatureStatus: 'signed'
    },
    {
        id: 1002,
        propertyId: 99,
        propertyTitle: "Cobertura Jardins (Vendido)",
        propertyImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=400&auto=format&fit=crop",
        type: 'sale',
        status: 'active',
        clientId: 200,
        clientName: "João Cliente",
        clientPhone: "5511977777777",
        ownerId: 102,
        ownerName: "Ana Proprietária",
        ownerPhone: "5511988888888",
        value: 15000,
        commissionRate: 5,
        dueDay: 15,
        startDate: "2024-01-15",
        nextPaymentStatus: 'paid',
        installmentsTotal: 120,
        installmentsPaid: 12,
        templateType: 'sale_cash',
        signatureStatus: 'signed'
    },
    {
        id: 1003,
        propertyId: 8,
        propertyTitle: "Vila Charmosa",
        propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=400&auto=format&fit=crop",
        type: 'rent',
        status: 'active',
        clientId: 200,
        clientName: "João Cliente",
        clientPhone: "5511977777777",
        ownerId: 102,
        ownerName: "Ana Proprietária",
        ownerPhone: "5511988888888",
        value: 5500,
        commissionRate: 8,
        dueDay: 10,
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        nextPaymentStatus: 'paid',
        templateType: 'rent_residential',
        signatureStatus: 'signed'
    }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: 200, // ID do usuário
        userId: 200,
        userName: "João Cliente",
        userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
        userRole: 'client',
        lastMessage: "Poderia me enviar o boleto deste mês?",
        lastMessageTime: "10:30",
        unreadCount: 2,
        messages: [
            { id: 1, sender: 'agent', text: "Olá João, como posso ajudar?", time: "10:00", read: true },
            { id: 2, sender: 'user', text: "Bom dia! Tudo bem?", time: "10:05", read: true },
            { id: 3, sender: 'user', text: "Poderia me enviar o boleto deste mês?", time: "10:30", read: false }
        ]
    },
    {
        id: 101,
        userId: 101,
        userName: "Carlos Proprietário",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
        userRole: 'owner',
        lastMessage: "Obrigado pelo repasse!",
        lastMessageTime: "Ontem",
        unreadCount: 0,
        messages: [
            { id: 1, sender: 'agent', text: "Olá Carlos, o repasse foi efetuado.", time: "14:00", read: true },
            { id: 2, sender: 'user', text: "Obrigado pelo repasse!", time: "14:15", read: true }
        ]
    },
    {
        id: 999, // Lead sem cadastro completo
        userId: 999,
        userName: "Mariana Silva (Interessada)",
        userAvatar: "https://ui-avatars.com/api/?name=Mariana+Silva&background=random",
        userRole: 'lead',
        lastMessage: "Gostaria de visitar o imóvel Residencial Luxo.",
        lastMessageTime: "09:15",
        unreadCount: 1,
        propertyInterest: "Residencial Luxo Augusta",
        messages: [
            { id: 1, sender: 'user', text: "Olá, tenho interesse no Residencial Luxo Augusta.", time: "09:10", read: true },
            { id: 2, sender: 'user', text: "Gostaria de marcar uma visita.", time: "09:15", read: false }
        ]
    }
];

const INITIAL_USERS: User[] = [
    { id: 1, name: "Administrador", email: "admin@suite.com", role: "admin", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
    { id: 101, name: "Carlos Proprietário", email: "carlos@email.com", role: "owner", phone: "5511999999999", document: "123.456.789-00", address: "Av. Brasil, 100", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { id: 102, name: "Ana Proprietária", email: "ana@email.com", role: "owner", phone: "5511988888888", document: "987.654.321-99", address: "Rua das Flores, 50", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
    { id: 200, name: "João Cliente", email: "joao@email.com", role: "client", phone: "5511977777777", document: "456.123.789-11", address: "Al. Santos, 400", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" }
];

export const seedDatabase = async () => {
    // Verificar se já temos dados para não duplicar dados massivamente
    const existingProps = await getProperties();
    const existingContracts = await getContracts();

    // Se quiser permitir "re-seed" ou adicionar mesmo tendo
    if (existingProps.length > 0 && existingContracts.length > 0) {
        if (!window.confirm("Já existem dados no banco. Deseja adicionar os dados DE EXEMPLO originais (duplicando se já existirem)?")) {
            return;
        }
    }

    try {
        console.log("Iniciando Seed Completo...");

        // 1. Users
        // Para usuários, é melhor setar o ID para manter consistência nos testes
        for (const user of INITIAL_USERS) {
            await setDoc(doc(db, "users", String(user.id)), {
                ...user,
                createdAt: new Date().toISOString()
            }, { merge: true });
        }
        console.log("Usuários criados.");

        // 2. Properties
        for (const prop of INITIAL_PROPERTIES) {
            // Se o ID for numérico, vamos converter para string na chamada
            // addProperty remove o ID e deixa o FB criar novo
            // Mas para manter relações, talvez devêssemos forçar o ID antigo como ID do documento? 
            // O DataService.addProperty gera novo ID. Vamos usar setDoc para MANTER IDs DE TESTE
            // para que os contratos não quebrem (eles ligam propertyId)

            const { id, ...data } = prop;
            const docId = String(id);
            await setDoc(doc(db, "properties", docId), {
                ...data,
                createdAt: new Date().toISOString()
            });
        }
        console.log("Propriedades criadas.");

        // 3. Contracts
        for (const contract of INITIAL_CONTRACTS) {
            const { id, ...data } = contract;
            const docId = String(id);
            await setDoc(doc(db, "contracts", docId), {
                ...data,
                createdAt: new Date().toISOString()
            });
        }
        console.log("Contratos criados.");

        // 4. Conversations
        for (const conv of INITIAL_CONVERSATIONS) {
            const { id, messages, ...data } = conv;
            const docId = String(id);

            // Cria a conversa
            await setDoc(doc(db, "conversations", docId), {
                ...data,
                id: docId,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Cria as mensagens
            for (const msg of messages) {
                // Como subcoleção
                // O dataService.saveMessage já faz isso, podemos usar ou fazer manualmente
                // Vamos manual para garantir ordem ou ids
                // Para simplificar, usamos addDoc na subcoleção como no service
                await saveMessage(docId, msg, data);
            }
        }
        console.log("Conversas criadas.");

        alert("Todos os dados de exemplo foram migrados para o Firebase com sucesso! Recarregue a página.");
        window.location.reload();

    } catch (e) {
        console.error("Erro no Seed:", e);
        alert("Erro ao criar dados. Veja o console.");
    }
};
