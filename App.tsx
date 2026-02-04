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
import LegalChat from './pages/LegalChat';
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

  // --- Legal Chat State ---
  const [activeLegalContract, setActiveLegalContract] = useState<Contract | null>(null);
  const [isLegalChatOpen, setIsLegalChatOpen] = useState(false);

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

  const handleSignContractReal = async (contractId: number | string, signatureImage: string) => {
    try {
      if (handleUpdateContract) {
        await handleUpdateContract(contractId, {
          signatureStatus: 'signed',
          signatureImage: signatureImage,
          signedAt: new Date().toISOString()
        });
      }

      // Update local state for immediate feedback
      setContracts(prev => prev.map(c =>
        String(c.id) === String(contractId)
          ? { ...c, signatureStatus: 'signed' as const, signatureImage, signedAt: new Date().toISOString() }
          : c
      ));

      if (activeLegalContract && String(activeLegalContract.id) === String(contractId)) {
        setActiveLegalContract(prev => prev ? { ...prev, signatureStatus: 'signed' as const, signatureImage, signedAt: new Date().toISOString() } : null);
      }

    } catch (error) {
      console.error("Erro ao salvar assinatura:", error);
      alert("Houve um erro ao processar sua assinatura. Tente novamente.");
    }
  };


  // --- Centralized Message Handler ---
  const handleSendMessage = async (text: string, sender: 'user' | 'agent', conversationIdOrUserId?: number | string, attachment?: ChatMessage['attachment']) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender,
      text,
      time,
      read: sender === 'agent',
      attachment
    };

    // Identificar ID da conversa (sempre string)
    // Se conversationIdOrUserId começar com 'legal_', é um chat de contrato.
    // Senão, é o ID do usuário (chat de atendimento geral).
    let conversationId = "";
    let targetUserId: string | number = "anonymous";
    let isLegal = false;

    if (typeof conversationIdOrUserId === 'string' && conversationIdOrUserId.startsWith('legal_')) {
      conversationId = conversationIdOrUserId;
      isLegal = true;
      // Extrair ID do contrato se necessário, mas para conversa usamos o ID composto
    } else {
      targetUserId = conversationIdOrUserId || currentUser?.id || "anonymous";
      conversationId = String(targetUserId);
    }

    // Preparar dados da conversa para update/create
    const targetUser = users.find(u => String(u.id) === String(targetUserId));

    const conversationData: Partial<Conversation> = {
      userId: isLegal ? 0 : (Number(targetUserId) || 0),
      id: conversationId,
      userName: isLegal ? `Jurídico: ${text.substring(0, 20)}...` : (targetUser?.name || currentUser?.name || "Usuário"),
      userAvatar: isLegal ? "https://cdn-icons-png.flaticon.com/512/921/921347.png" : (targetUser?.avatar || currentUser?.avatar || "https://ui-avatars.com/api/?name=User"),
      userRole: isLegal ? 'client' : (targetUser?.role || currentUser?.role || 'client' as any),
      lastMessage: attachment ? `[Anexo: ${attachment.title}]` : text,
      lastMessageTime: time,
      unreadCount: sender === 'user' ? 1 : 0
    };

    // Especial check para conversa jurídica: se já existir, mantemos o nome/avatar original ou atualizamos
    const existingConv = conversations.find(c => c.id === conversationId);
    if (isLegal && existingConv) {
      conversationData.userName = existingConv.userName;
      conversationData.userAvatar = existingConv.userAvatar;
    } else if (isLegal) {
      // Tentar obter o título do contrato para o nome da conversa
      const contractIdAttr = conversationId.replace('legal_', '');
      const contract = contracts.find(c => String(c.id) === contractIdAttr);
      if (contract) {
        conversationData.userName = `Canal Jurídico: ${contract.propertyTitle}`;
      }
    }

    // Salvar no Firebase (Optimistic update on UI via subscription)
    await saveMessage(conversationId, newMessage, conversationData);

    // Create notification for new user messages (leads)
    if (sender === 'user' && currentUser?.role !== 'admin' && !isLegal) {
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
            onUpdateContract={handleUpdateContract}
            onOpenLegalChat={(contract) => {
              setActiveLegalContract(contract);
              setIsLegalChatOpen(true);
            }}
            onShareContractToChat={(contract) => {
              handleSendMessage(
                `Encaminhei o contrato de ${contract.type === 'rent' ? 'locação' : 'venda'} para sua conferência.`,
                'agent',
                `legal_${contract.id}`,
                {
                  type: 'contract',
                  id: contract.id,
                  title: `Contrato: ${contract.propertyTitle}`,
                  status: contract.status
                }
              );
              setActiveLegalContract(contract);
              setIsLegalChatOpen(true);
            }}
          />
        );
        case 'chat': return (
          <ChatManagement
            conversations={conversations}
            contracts={contracts}
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
        {/* Mobile Header (Admin) - More integrated */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#0b0e14]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-[70] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg">roofing</span>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">EstateFlow <span className="text-primary">Suite</span></span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="size-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'grid_view'}</span>
          </button>
        </div>

        {/* Mobile Menu Overlay / Module Selector */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[65] bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="absolute inset-x-0 top-0 pt-20 pb-10 px-6 bg-white dark:bg-[#0b0e14] rounded-b-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="mb-8">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Módulos do Sistema</p>
                <div className="grid grid-cols-2 gap-4">
                  <MobileAdminNavButton active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} icon="dashboard" label="Home" />
                  <MobileAdminNavButton active={currentView === 'all-listings'} onClick={() => { setCurrentView('all-listings'); setIsMobileMenuOpen(false); }} icon="inventory_2" label="Imóveis" />
                  <MobileAdminNavButton active={currentView === 'contracts'} onClick={() => { setCurrentView('contracts'); setIsMobileMenuOpen(false); }} icon="gavel" label="Jurídico" />
                  <MobileAdminNavButton active={currentView === 'chat'} onClick={() => { setCurrentView('chat'); setIsMobileMenuOpen(false); }} icon="chat" label="Mensagens" />
                  <MobileAdminNavButton active={currentView === 'marketing'} onClick={() => { setCurrentView('marketing'); setIsMobileMenuOpen(false); }} icon="campaign" label="Marketing" />
                  <MobileAdminNavButton active={currentView === 'financial'} onClick={() => { setCurrentView('financial'); setIsMobileMenuOpen(false); }} icon="payments" label="Financeiro" />
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url("${currentUser.avatar}")` }}></div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{currentUser.name}</p>
                    <button onClick={() => { setCurrentView('profile-settings'); setIsMobileMenuOpen(false); }} className="text-xs text-primary font-bold">Ver Perfil</button>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="size-10 flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </div>
            {/* Click outside to close */}
            <div className="flex-1 h-full" onClick={() => setIsMobileMenuOpen(false)}></div>
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
            <NavButton active={currentView === 'contracts'} onClick={() => setCurrentView('contracts')} icon="gavel" tooltip="Canal Jurídico & Contratos" />
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

        {/* Global Modals for Admin */}
        {isLegalChatOpen && activeLegalContract && (
          <LegalChat
            contract={activeLegalContract}
            currentUser={currentUser!}
            messages={conversations.find(c => c.id === `legal_${activeLegalContract.id}`)?.messages || []}
            onSendMessage={(text, sender, attachment) => handleSendMessage(text, sender, `legal_${activeLegalContract.id}`, attachment)}
            onSignContract={handleSignContractReal}
            onClose={() => setIsLegalChatOpen(false)}
          />
        )}
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
          contracts={contracts}
          onPropertySelect={handlePropertySelect}
          onLogout={handleLogout}
          onEditProfile={() => setCurrentView('profile-settings')}
          onUpdateContract={handleUpdateContract}
          onOpenLegalChat={(contract) => {
            setActiveLegalContract(contract);
            setIsLegalChatOpen(true);
          }}
        />
        {isLegalChatOpen && activeLegalContract && (
          <LegalChat
            contract={activeLegalContract}
            currentUser={currentUser}
            messages={conversations.find(c => c.id === `legal_${activeLegalContract.id}`)?.messages || []}
            onSendMessage={(text, sender, attachment) => handleSendMessage(text, sender, `legal_${activeLegalContract.id}`, attachment)}
            onSignContract={handleSignContractReal}
            onClose={() => setIsLegalChatOpen(false)}
          />
        )}
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
      {/* Teste de Sincronização */}
      <div className="fixed bottom-4 left-4 z-[100] bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg opacity-80 pointer-events-none">
        v1.0.1 - SYNC ACTIVE
      </div>
      {isLegalChatOpen && activeLegalContract && (
        <LegalChat
          contract={activeLegalContract}
          currentUser={currentUser!}
          messages={conversations.find(c => c.id === `legal_${activeLegalContract.id}`)?.messages || []}
          onSendMessage={(text, sender, attachment) => handleSendMessage(text, sender, `legal_${activeLegalContract.id}`, attachment)}
          onSignContract={handleSignContractReal}
          onClose={() => setIsLegalChatOpen(false)}
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

const MobileAdminNavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all ${active
      ? 'bg-primary text-white shadow-xl shadow-primary/30'
      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
      }`}
  >
    <span className="material-symbols-outlined text-[28px]">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

export default App;