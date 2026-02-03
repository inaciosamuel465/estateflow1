import React, { useState, useEffect } from 'react';

// Admin Components
import AdminDashboard from './pages/AdminDashboard';
import NewListing from './pages/NewListing';
import InteractiveMap from './pages/InteractiveMap';
import ClientProfile from './pages/ClientProfile';
import PropertyDetails from './pages/PropertyDetails';
import ImageStudio from './pages/ImageStudio';
import AreaSimulation from './pages/AreaSimulation';
import ListingsManagement from './pages/ListingsManagement';
import FinancialManagement from './pages/FinancialManagement';
import ChatManagement from './pages/ChatManagement';
import MarketingStudio from './pages/MarketingStudio';
import ContractsPage from './pages/ContractsPage';

// Public/Auth Components
import LoginPage, { RegisterData } from './pages/LoginPage';
import ClientHome from './pages/ClientHome';
import ClientChat from './pages/ClientChat';
import OwnerLanding from './pages/OwnerLanding';
import UserDashboard from './pages/UserDashboard';

// --- Types ---
export interface ChatMessage {
  id: number;
  sender: 'agent' | 'user';
  text: string;
  time: string;
  read: boolean;
}

export interface Conversation {
  id: number | string; // Geralmente o ID do usuário
  userId: number;
  userName: string;
  userAvatar: string;
  userRole: 'client' | 'owner' | 'lead';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  propertyInterest?: string; // Título do imóvel de interesse inicial
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'client';
  phone?: string;
  avatar?: string;
  document?: string; // CPF/CNPJ
  address?: string;
}

export interface Property {
  id: number | string;
  title: string;
  price: string;
  location: string;
  image: string;
  beds: number;
  baths: number;
  area: number;
  tag?: string;
  type: string;
  purpose: 'sale' | 'rent';
  ownerId?: number; // Link com o proprietário
  status?: 'active' | 'draft' | 'sold' | 'rented'; // Adicionado 'rented'
  stats?: {
    views: number;
    likes: number;
    leads: number;
  };
  // Campos detalhados para edição completa
  description?: string;
  amenities?: string[];
  images?: string[];
  addressDetails?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Contract {
  id: number | string;
  propertyId: number | string;
  propertyTitle: string;
  propertyImage: string;
  type: 'rent' | 'sale';
  status: 'active' | 'completed' | 'late' | 'draft' | 'expiring';

  // Partes Envolvidas
  clientId: number;
  clientName: string;
  clientPhone: string;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;

  // Financeiro
  value: number;
  commissionRate: number;
  dueDay: number;
  startDate: string;
  endDate?: string;

  // Controle de Financiamento
  installmentsTotal?: number;
  installmentsPaid?: number;

  // Controle de Pagamento
  lastPaymentDate?: string;
  nextPaymentStatus: 'pending' | 'paid' | 'overdue';

  // Jurídico (Novo)
  templateType?: 'rent_residential' | 'sale_cash' | 'season';
  signatureStatus?: 'pending' | 'signed';
}

// --- Mock Data Inicial (Imagens Reais Fixas) ---
const INITIAL_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Residencial Luxo Augusta", // Removido "Apartamento" para evitar duplicação visual
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

const INITIAL_USERS: User[] = [
  { id: 1, name: "Administrador", email: "admin@suite.com", role: "admin", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
  { id: 101, name: "Carlos Proprietário", email: "carlos@email.com", role: "owner", phone: "5511999999999", document: "123.456.789-00", address: "Av. Brasil, 100", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
  { id: 102, name: "Ana Proprietária", email: "ana@email.com", role: "owner", phone: "5511988888888", document: "987.654.321-99", address: "Rua das Flores, 50", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
  { id: 200, name: "João Cliente", email: "joao@email.com", role: "client", phone: "5511977777777", document: "456.123.789-11", address: "Al. Santos, 400", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" }
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

// Dados Iniciais de Conversas (WhatsApp Style)
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

// Wrapper de Scroll
const PublicLayout = ({ children }: { children?: React.ReactNode }) => (
  <div className="h-screen w-full overflow-y-auto bg-slate-50 scroll-smooth">
    {children}
  </div>
);

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);

  // --- Chat State (Replaces simple messages array) ---
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  // --- Navigation State ---
  const [currentView, setCurrentView] = useState('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | string | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  // --- Client Chat Modal State ---
  const [isClientChatOpen, setIsClientChatOpen] = useState(false);
  const [clientChatPropertyTitle, setClientChatPropertyTitle] = useState('');

  // --- Deep Linking Logic ---
  useEffect(() => {
    // Verifica se há um ID de imóvel na URL ao carregar
    const params = new URLSearchParams(window.location.search);
    const propId = params.get('id');
    if (propId) {
      // Tenta encontrar o imóvel (converte para número se possível)
      const idToSearch = isNaN(Number(propId)) ? propId : Number(propId);
      const property = properties.find(p => p.id === idToSearch);

      if (property) {
        setSelectedPropertyId(idToSearch);
        // Se o usuário for admin, vai pro admin details, senão public details
        setCurrentView('details');
      }
    }
  }, []);

  // --- CRUD Handlers ---

  const handleAddProperty = (newProperty: Property) => {
    setProperties(prev => [newProperty, ...prev]);
    setCurrentView('all-listings');
  };

  const handleUpdateProperty = (id: number | string, updatedData: Partial<Property>) => {
    setProperties(prev => prev.map(p =>
      p.id === id ? { ...p, ...updatedData } : p
    ));
    if (currentView === 'edit-listing') {
      setCurrentView('all-listings');
      setPropertyToEdit(null);
    }
  };

  const handleDeleteProperty = (id: number | string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleEditFull = (property: Property) => {
    setPropertyToEdit(property);
    setCurrentView('edit-listing');
  };

  // --- Handlers de Contratos ---
  const handleAddContract = (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
    if (newContract.type === 'rent') {
      handleUpdateProperty(newContract.propertyId, { status: 'rented' });
    } else {
      handleUpdateProperty(newContract.propertyId, { status: 'sold' });
    }
  };

  const handleUpdateContract = (id: number | string, updatedData: Partial<Contract>) => {
    setContracts(prev => prev.map(c =>
      c.id === id ? { ...c, ...updatedData } : c
    ));
  };

  const handleDeleteContract = (id: number | string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  // --- Handlers de Autenticação ---

  const handleLogin = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentView('dashboard');
      } else {
        if (currentView !== 'details') {
          setCurrentView('home');
        }
      }
    } else {
      alert("Usuário não encontrado (Mock)");
    }
  };

  const handleRegister = (data: RegisterData) => {
    const newUser: User = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setIsClientChatOpen(false);
  };

  // --- Handlers de Navegação e Ações ---

  const handlePropertySelect = (id: number | string) => {
    setSelectedPropertyId(id);
    if (currentUser?.role === 'admin') {
      setCurrentView('admin-details');
    } else {
      setCurrentView('details');
    }
  };

  const handleClientChatStart = (title: string) => {
    if (!currentUser) {
      alert("Você precisa fazer login para iniciar um chat.");
      setCurrentView('login');
      return;
    }
    setClientChatPropertyTitle(title);
    setIsClientChatOpen(true);
  };

  const handleFavoriteAction = (id: number | string) => {
    if (!currentUser) {
      alert("Você precisa fazer login para favoritar imóveis.");
      setCurrentView('login');
      return;
    }
    alert(`Imóvel ${id} adicionado aos favoritos de ${currentUser.name}!`);
  };

  // --- Centralized Message Handler ---
  const handleSendMessage = (text: string, sender: 'user' | 'agent', userId?: number | string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender,
      text,
      time,
      read: sender === 'agent' // Se admin manda, está lido
    };

    setConversations(prev => {
      // Se sender é agent, precisamos saber para quem estamos mandando (userId)
      // Se sender é user (via ClientChat), assumimos currentUser.id

      const targetUserId = userId || currentUser?.id || 999;

      const existingConvIndex = prev.findIndex(c => c.userId === targetUserId);

      if (existingConvIndex >= 0) {
        const updatedConversations = [...prev];
        const conv = updatedConversations[existingConvIndex];

        conv.messages.push(newMessage);
        conv.lastMessage = text;
        conv.lastMessageTime = time;
        if (sender === 'user') conv.unreadCount += 1; // Incrementa se usuário mandou

        // Move to top
        updatedConversations.splice(existingConvIndex, 1);
        updatedConversations.unshift(conv);
        return updatedConversations;
      } else {
        // Nova conversa (ex: usuário novo no chat)
        const newUser = users.find(u => u.id === targetUserId);
        const newConv: Conversation = {
          id: targetUserId,
          userId: targetUserId as number,
          userName: newUser?.name || "Novo Usuário",
          userAvatar: newUser?.avatar || `https://ui-avatars.com/api/?name=User`,
          userRole: newUser?.role === 'owner' ? 'owner' : 'client',
          lastMessage: text,
          lastMessageTime: time,
          unreadCount: sender === 'user' ? 1 : 0,
          messages: [newMessage]
        };
        return [newConv, ...prev];
      }
    });
  };

  const handleMarkAsRead = (conversationId: number | string) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  };

  // Helper para obter mensagens da conversa ativa do cliente logado
  const getCurrentUserMessages = () => {
    if (!currentUser) return [];
    const conv = conversations.find(c => c.userId === currentUser.id);
    return conv ? conv.messages : [];
  };

  // --- Render Logic ---

  // 1. Visão de Admin (Logado e role='admin')
  if (currentUser?.role === 'admin') {
    const renderAdminView = () => {
      switch (currentView) {
        case 'dashboard': return (
          <AdminDashboard
            onNavigate={setCurrentView}
            conversations={conversations}
          />
        );
        case 'listing': return <NewListing onPublish={handleAddProperty} currentUser={currentUser} />;
        case 'edit-listing': return (
          <NewListing
            onPublish={(data) => handleUpdateProperty(data.id, data)}
            currentUser={currentUser}
            initialData={propertyToEdit}
          />
        );
        case 'all-listings': return (
          <ListingsManagement
            onNavigate={setCurrentView}
            onSelectProperty={handlePropertySelect}
            properties={properties}
            onDelete={handleDeleteProperty}
            onUpdate={handleUpdateProperty}
            onEditFull={handleEditFull}
            currentUser={currentUser}
          />
        );
        case 'financial': return (
          <FinancialManagement
            contracts={contracts}
            properties={properties}
            users={users}
            onAddContract={handleAddContract}
            onUpdateContract={handleUpdateContract}
          />
        );
        case 'contracts': return (
          <ContractsPage
            contracts={contracts}
            properties={properties}
            users={users}
            onAddContract={handleAddContract}
            onDeleteContract={handleDeleteContract}
            onUpdateContract={handleUpdateContract} // Passando a função de update
          />
        );
        case 'chat': return (
          <ChatManagement
            conversations={conversations}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
          />
        );
        case 'marketing': return (
          <MarketingStudio properties={properties} />
        );
        case 'map': return <InteractiveMap onSelectProperty={handlePropertySelect} />;
        case 'crm': return <ClientProfile />;
        case 'admin-details': return (
          <PropertyDetails
            propertyId={selectedPropertyId}
            onBack={() => setCurrentView('all-listings')}
            isPublic={false}
          />
        );
        case 'ai': return <ImageStudio />;
        case 'simulation': return <AreaSimulation />;
        default: return <AdminDashboard onNavigate={setCurrentView} />;
      }
    };

    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Menu Lateral Admin */}
        <div className="w-16 md:w-20 flex flex-col items-center py-6 bg-white dark:bg-[#0b0e14] border-r border-slate-200 dark:border-slate-800 z-50 shrink-0">
          <div className="mb-8 p-2 bg-primary/20 rounded-xl text-primary" title="EstateFlow Suite">
            <span className="material-symbols-outlined notranslate text-2xl">roofing</span>
          </div>

          <div className="flex flex-col gap-4 w-full px-2">
            <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="dashboard" tooltip="Painel Administrativo" />
            <NavButton active={currentView === 'all-listings' || currentView === 'edit-listing'} onClick={() => setCurrentView('all-listings')} icon="inventory_2" tooltip="Meus Anúncios" />
            <NavButton active={currentView === 'contracts'} onClick={() => setCurrentView('contracts')} icon="gavel" tooltip="Gestão Jurídica & Contratos" />
            <NavButton active={currentView === 'chat'} onClick={() => setCurrentView('chat')} icon="chat" tooltip="Chat & Atendimento" />
            <NavButton active={currentView === 'financial'} onClick={() => setCurrentView('financial')} icon="payments" tooltip="Financeiro" />
            <NavButton active={currentView === 'marketing'} onClick={() => setCurrentView('marketing')} icon="campaign" tooltip="Marketing Studio" />
            <NavButton active={currentView === 'listing'} onClick={() => setCurrentView('listing')} icon="add_business" tooltip="Novo Anúncio" />
            <NavButton active={currentView === 'map'} onClick={() => setCurrentView('map')} icon="map" tooltip="Mapa Interativo" />
            <NavButton active={currentView === 'crm'} onClick={() => setCurrentView('crm')} icon="person" tooltip="CRM Clientes" />
            <NavButton active={currentView === 'ai'} onClick={() => setCurrentView('ai')} icon="auto_awesome" tooltip="Estúdio de IA" />
            <NavButton active={currentView === 'simulation'} onClick={() => setCurrentView('simulation')} icon="view_in_ar" tooltip="Simulação de Área" />
          </div>

          <div className="mt-auto w-full px-2">
            <button
              onClick={handleLogout}
              className="group relative flex items-center justify-center w-full aspect-square rounded-xl transition-all text-slate-500 hover:bg-rose-50 hover:text-rose-500"
              title="Sair do Sistema"
            >
              <span className="material-symbols-outlined notranslate text-[24px]">logout</span>
            </button>
          </div>
        </div>

        {/* O container principal DEVE usar flex-1 e overflow-hidden para conter o scroll dentro das Views */}
        <div className="flex-1 overflow-hidden relative flex flex-col h-full">
          {renderAdminView()}
        </div>
      </div>
    );
  }

  // 2. Visão Pública / Cliente / Proprietário

  if (currentView === 'login') {
    return (
      <PublicLayout>
        <LoginPage
          onLoginSuccess={handleLogin}
          onRegisterSuccess={handleRegister}
          onCancel={() => setCurrentView('home')}
        />
      </PublicLayout>
    );
  }

  if (currentView === 'advertise') {
    return (
      <PublicLayout>
        <OwnerLanding onBack={() => setCurrentView('home')} />
      </PublicLayout>
    );
  }

  if (currentView === 'user-dashboard' && currentUser) {
    return (
      <PublicLayout>
        <UserDashboard
          user={currentUser}
          onBack={() => setCurrentView('home')}
          properties={properties}
          onPropertySelect={handlePropertySelect}
          onLogout={handleLogout}
        />
      </PublicLayout>
    );
  }

  if (currentView === 'details') {
    return (
      <PublicLayout>
        <PropertyDetails
          propertyId={selectedPropertyId}
          onBack={() => setCurrentView('home')}
          isPublic={true}
          onChatStart={handleClientChatStart}
          currentUser={currentUser}
        />
        {isClientChatOpen && (
          <ClientChat
            propertyTitle={clientChatPropertyTitle}
            onClose={() => setIsClientChatOpen(false)}
            messages={getCurrentUserMessages()}
            onSendMessage={(text) => handleSendMessage(text, 'user')}
          />
        )}
      </PublicLayout>
    );
  }

  // Default: Home Page
  return (
    <PublicLayout>
      <ClientHome
        properties={properties}
        onPropertySelect={handlePropertySelect}
        onLoginClick={() => setCurrentView('login')}
        onAdvertiseClick={() => setCurrentView('advertise')}
        currentUser={currentUser}
        onUserDashboardClick={() => setCurrentView('user-dashboard')}
        onFavoriteClick={handleFavoriteAction}
        onChatClick={handleClientChatStart}
      />
      {isClientChatOpen && (
        <ClientChat
          propertyTitle={clientChatPropertyTitle || "Atendimento Geral"}
          onClose={() => setIsClientChatOpen(false)}
          messages={getCurrentUserMessages()}
          onSendMessage={(text) => handleSendMessage(text, 'user')}
        />
      )}
    </PublicLayout>
  );
};

const NavButton = ({ active, onClick, icon, tooltip }: { active: boolean; onClick: () => void; icon: string; tooltip: string }) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center w-full aspect-square rounded-xl transition-all ${active
      ? 'bg-primary text-white shadow-lg shadow-primary/30'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
  >
    <span className="material-symbols-outlined notranslate text-[24px]">{icon}</span>
    <span className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
      {tooltip}
    </span>
  </button>
);

export default App;