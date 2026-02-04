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
import Analytics from './pages/Analytics';
import NotificationCenter from './components/NotificationCenter';
import WhatsAppButton from './components/WhatsAppButton';

import {
  subscribeToAuthChanges,
  logoutUser
} from './src/services/authService';
import {
  getProperties,
  getContracts,
  getUsers,
  addProperty,
  updateProperty,
  deleteProperty,
  addContract,
  deleteContract,
  updateContract as updateContractService,
  toggleFavorite,
  saveMessage,
  subscribeToConversations,
  markConversationAsRead,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} from './src/services/dataService';
import LoginPage, { RegisterData } from './pages/LoginPage';
import ClientHome from './pages/ClientHome';
import ClientChat from './pages/ClientChat';
import OwnerLanding from './pages/OwnerLanding';
import UserDashboard from './pages/UserDashboard';
import ProfileSettings from './pages/ProfileSettings';
import {
  updateUser
} from './src/services/dataService';
import {
  createContractNotification,
  createPropertyNotification,
  createLeadNotification
} from './src/services/notificationHelpers';

// --- Types ---
import { ChatMessage, Conversation, User, Property, Contract } from './src/types';

// Wrapper de Scroll
const PublicLayout = ({ children }: { children?: React.ReactNode }) => (
  <div className="h-screen w-full overflow-y-auto bg-slate-50 scroll-smooth">
    {children}
  </div>
);

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // --- Auth Subscription & Data Loading ---
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    const unsubscribeChat = subscribeToConversations((convs) => {
      setConversations(convs);
    });

    const unsubscribeNotifications = subscribeToNotifications((notifs) => {
      setNotifications(notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    // Carregar dados reais
    const loadData = async () => {
      const props = await getProperties();
      setProperties(props);

      const conts = await getContracts();
      setContracts(conts);

      const userList = await getUsers();
      setUsers(userList);
    }
    loadData();

    return () => {
      unsubscribeAuth();
      unsubscribeChat();
      unsubscribeNotifications();
    };
  }, []);

  // --- Chat State (Replaces simple messages array) ---
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // --- Notifications State ---
  const [notifications, setNotifications] = useState<any[]>([]);

  // --- Navigation State ---
  const [currentView, setCurrentView] = useState('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | string | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Check for expiring contracts ---
  useEffect(() => {
    const checkExpiringContracts = async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (const contract of contracts) {
        if (contract.endDate && contract.status === 'active') {
          const endDate = new Date(contract.endDate);
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Notificar se faltam 30, 15 ou 7 dias
          if (daysLeft === 30 || daysLeft === 15 || daysLeft === 7) {
            // Verificar se já existe notificação para este contrato neste período
            const existingNotif = notifications.find(n =>
              n.type === 'contract' &&
              n.message.includes(contract.propertyTitle) &&
              n.message.includes('vence')
            );

            if (!existingNotif) {
              await createContractNotification(contract.id, contract.propertyTitle, 'expiring');
            }
          }
        }
      }
    };

    // Verificar ao carregar e depois a cada 24 horas
    if (contracts.length > 0 && currentUser?.role === 'admin') {
      checkExpiringContracts();
      const interval = setInterval(checkExpiringContracts, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [contracts, currentUser, notifications]);

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


  // --- CRUD Handlers ---

  const handleAddProperty = async (newProperty: Property) => {
    // Optimistic Update
    setProperties(prev => [newProperty, ...prev]);
    setCurrentView('all-listings');

    // Save to Firebase
    await addProperty(newProperty);

    // Create notification
    await createPropertyNotification(newProperty.title, 'created');
  };

  const handleUpdateProperty = async (id: number | string, updatedData: Partial<Property>) => {
    setProperties(prev => prev.map(p =>
      p.id === id ? { ...p, ...updatedData } : p
    ));
    if (currentView === 'edit-listing') {
      setCurrentView('all-listings');
      setPropertyToEdit(null);
    }
    // Update Firebase
    await updateProperty(String(id), updatedData);
  };

  const handleDeleteProperty = async (id: number | string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    await deleteProperty(String(id));
  };

  const handleEditFull = (property: Property) => {
    setPropertyToEdit(property);
    setCurrentView('edit-listing');
  };

  // --- Handlers de Contratos ---
  const handleAddContract = async (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
    if (newContract.type === 'rent') {
      handleUpdateProperty(newContract.propertyId, { status: 'rented' });
    } else {
      handleUpdateProperty(newContract.propertyId, { status: 'sold' });
    }
    await addContract(newContract);

    // Create notifications
    await createContractNotification(newContract.id, newContract.propertyTitle, 'created');
    await createPropertyNotification(
      newContract.propertyTitle,
      newContract.type === 'rent' ? 'rented' : 'sold'
    );
  };

  const handleUpdateContract = async (id: number | string, updatedData: Partial<Contract>) => {
    setContracts(prev => prev.map(c =>
      c.id === id ? { ...c, ...updatedData } : c
    ));
    await updateContractService(String(id), updatedData);
  };

  const handleDeleteContract = async (id: number | string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    await deleteContract(String(id));
  };

  // --- Handlers de Autenticação ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('home');
    }
  };

  const handleRegister = (user: User) => {
    setCurrentUser(user);
    setCurrentView('home');
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentView('home');
    setIsClientChatOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const success = await updateUser(String(currentUser.id), updatedData);
    if (success) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
    }
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

  const handleFavoriteAction = async (id: number | string) => {
    if (!currentUser) {
      alert("Você precisa fazer login para favoritar imóveis.");
      setCurrentView('login');
      return;
    }

    const newFavorites = await toggleFavorite(String(currentUser.id), id);
    // Atualiza estado local para feedback imediato
    setCurrentUser(prev => prev ? { ...prev, favorites: newFavorites } : null);
    // alert(`Ação de favoritos salva para ${currentUser.name}!`); // Alert opcional, visual é melhor
  };

  // --- Centralized Message Handler ---
  const handleSendMessage = async (text: string, sender: 'user' | 'agent', userId?: number | string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender,
      text,
      time,
      read: sender === 'agent'
    };

    // Identificar ID da conversa (sempre string)
    const targetUserId = userId || currentUser?.id || "anonymous";
    const conversationId = String(targetUserId);

    // Preparar dados da conversa para update/create
    const targetUser = users.find(u => String(u.id) === String(targetUserId));

    const conversationData: Partial<Conversation> = {
      userId: Number(targetUserId) || 0, // Fallback se não for número (ex: string hash)
      id: conversationId,
      userName: targetUser?.name || currentUser?.name || "Usuário",
      userAvatar: targetUser?.avatar || currentUser?.avatar || "https://ui-avatars.com/api/?name=User",
      userRole: targetUser?.role || currentUser?.role || 'client',
      lastMessage: text,
      lastMessageTime: time,
      unreadCount: sender === 'user' ? 1 : 0
    };

    // Salvar no Firebase (Optimistic update on UI via subscription)
    await saveMessage(conversationId, newMessage, conversationData);

    // Create notification for new user messages (leads)
    if (sender === 'user' && currentUser?.role !== 'admin') {
      await createLeadNotification(
        conversationData.userName || 'Usuário',
        clientChatPropertyTitle || undefined
      );
    }
  };

  const handleMarkAsRead = async (conversationId: number | string) => {
    // Atualização Otimista
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
    // Persistência
    await markConversationAsRead(String(conversationId));
  };

  // Helper para obter mensagens da conversa ativa do cliente logado
  const getCurrentUserMessages = () => {
    if (!currentUser) return [];
    // Comparação frouxa (string vs number) pois IDs do FB são string e mock são number
    const conv = conversations.find(c => String(c.userId) === String(currentUser.id));
    return conv ? conv.messages : [];
  };

  // --- Notification Handlers ---
  const handleMarkNotificationAsRead = async (id: string | number) => {
    await markNotificationAsRead(String(id));
  };

  const handleMarkAllNotificationsAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleClearAllNotifications = async () => {
    if (confirm('Tem certeza que deseja limpar todas as notificações?')) {
      await clearAllNotifications();
    }
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
            properties={properties}
            contracts={contracts}
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
            properties={properties}
            onBack={() => setCurrentView('all-listings')}
            isPublic={false}
          />
        );
        case 'ai': return <ImageStudio />;
        case 'simulation': return <AreaSimulation />;
        case 'analytics': return <Analytics />;
        case 'profile-settings': return (
          <ProfileSettings
            user={currentUser}
            onSave={handleUpdateUser}
            onBack={() => setCurrentView('dashboard')}
          />
        );
        default: return <AdminDashboard onNavigate={setCurrentView} />;
      }
    };

    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Mobile Header (Admin) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0b0e14] border-b border-slate-200 dark:border-slate-800 z-[60] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">roofing</span>
            <span className="font-bold text-slate-800 dark:text-white">EstateFlow</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile Menu Overlay/Drawer (Admin) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute top-16 right-0 bottom-0 w-64 bg-white dark:bg-[#0b0e14] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="size-10 rounded-full bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url("${currentUser.avatar}")` }}></div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{currentUser.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <MobileAdminNavButton active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} icon="dashboard" label="Dashboard" />
                <MobileAdminNavButton active={currentView === 'all-listings'} onClick={() => { setCurrentView('all-listings'); setIsMobileMenuOpen(false); }} icon="inventory_2" label="Imóveis" />
                <MobileAdminNavButton active={currentView === 'contracts'} onClick={() => { setCurrentView('contracts'); setIsMobileMenuOpen(false); }} icon="gavel" label="Contratos" />
                <MobileAdminNavButton active={currentView === 'chat'} onClick={() => { setCurrentView('chat'); setIsMobileMenuOpen(false); }} icon="chat" label="Mensagens" />
                <MobileAdminNavButton active={currentView === 'profile-settings'} onClick={() => { setCurrentView('profile-settings'); setIsMobileMenuOpen(false); }} icon="settings" label="Minha Conta" />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sair do Sistema
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Lateral Admin (Desktop) */}
        <div className="hidden lg:flex w-20 flex-col items-center py-6 bg-white dark:bg-[#0b0e14] border-r border-slate-200 dark:border-slate-800 z-50 shrink-0">
          <div className="mb-4 p-2 bg-primary/20 rounded-xl text-primary" title="EstateFlow Suite">
            <span className="material-symbols-outlined notranslate text-2xl">roofing</span>
          </div>

          {/* Notification Center */}
          <div className="mb-4 w-full flex justify-center">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onClearAll={handleClearAllNotifications}
              position="left"
            />
          </div>

          <div className="flex flex-col gap-4 w-full px-2">
            <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="dashboard" tooltip="Painel Administrativo" />
            <NavButton active={currentView === 'all-listings' || currentView === 'edit-listing'} onClick={() => setCurrentView('all-listings')} icon="inventory_2" tooltip="Meus Anúncios" />
            <NavButton active={currentView === 'contracts'} onClick={() => setCurrentView('contracts')} icon="gavel" tooltip="Gestão Jurídica & Contratos" />
            <NavButton active={currentView === 'chat'} onClick={() => setCurrentView('chat')} icon="chat" tooltip="Chat & Atendimento" />
            <NavButton active={currentView === 'profile-settings'} onClick={() => setCurrentView('profile-settings')} icon="settings" tooltip="Configurações da Conta" />
            <NavButton active={currentView === 'marketing'} onClick={() => setCurrentView('marketing')} icon="campaign" tooltip="Marketing Studio" />
            <NavButton active={currentView === 'financial'} onClick={() => setCurrentView('financial')} icon="payments" tooltip="Financeiro" />
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
        <div className="flex-1 overflow-hidden relative flex flex-col h-full pt-16 lg:pt-0">
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
          onEditProfile={() => setCurrentView('profile-settings')}
        />
      </PublicLayout>
    );
  }

  if (currentView === 'profile-settings' && currentUser) {
    return (
      <PublicLayout>
        <ProfileSettings
          user={currentUser}
          onSave={handleUpdateUser}
          onBack={() => setCurrentView(currentUser.role === 'admin' ? 'dashboard' : 'user-dashboard')}
        />
      </PublicLayout>
    );
  }

  if (currentView === 'details') {
    return (
      <PublicLayout>
        <PropertyDetails
          propertyId={selectedPropertyId}
          properties={properties}
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
        <WhatsAppButton
          phoneNumber="5515997241175"
          propertyTitle={properties.find(p => p.id === selectedPropertyId)?.title}
        />
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
        onLogoutClick={handleLogout}
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
      <WhatsAppButton phoneNumber="5515997241175" />
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

const MobileAdminNavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active
      ? 'bg-primary text-white shadow-lg shadow-primary/30'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    {label}
  </button>
);

export default App;