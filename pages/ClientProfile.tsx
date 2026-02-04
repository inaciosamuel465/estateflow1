import React, { useState, useMemo } from 'react';

// --- Interfaces ---
interface TimelineEvent {
    id: number;
    type: 'visit' | 'view' | 'note' | 'update' | 'create' | 'call' | 'email';
    title: string;
    desc: string;
    date: string;
    meta?: any; // Para imagens ou dados extras
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string;
    status: 'Novo' | 'Ativo' | 'Negociação' | 'Fechado';
    leadScore: number; // 0-100
    scoreLabel: string;
    lastActivity: string;
    location: string;
    tags: string[];
    budget: string;
    lookingFor: string; // Ex: "3 Quartos, Centro"
    stats: {
        views: number;
        favorites: number;
        visits: number;
    };
    timeline: TimelineEvent[];
}

// --- Dados Iniciais Mockados ---
const initialClientsDB: Client[] = [
    {
        id: 1,
        name: "Sarah Jenkins",
        email: "sarah.j@exemplo.com",
        phone: "+55 (11) 99999-9999",
        image: "https://picsum.photos/100/100?random=15",
        status: "Ativo",
        leadScore: 85,
        scoreLabel: "Muito Alto",
        lastActivity: "2 horas atrás",
        location: "São Paulo, SP",
        tags: ["Lead Quente", "Pré-Aprovado", "Família de 4"],
        budget: "R$ 500k - 700k",
        lookingFor: "3 Quartos, Centro",
        stats: { views: 24, favorites: 8, visits: 2 },
        timeline: [
            { id: 1, type: 'visit', title: 'Visita agendada em "Vila Sol"', desc: 'Visita confirmada para amanhã às 14:00.', date: '2 horas atrás' },
            { id: 2, type: 'view', title: 'Visualizou 3 imóveis', desc: 'Interesse em região central.', date: 'Ontem', meta: [16, 17, 18] },
            { id: 3, type: 'create', title: 'Conta Criada', desc: 'Lead capturado via landing page.', date: '12 Out' }
        ]
    },
    {
        id: 2,
        name: "Roberto Almeida",
        email: "roberto.a@empresa.com",
        phone: "+55 (11) 98888-8888",
        image: "https://picsum.photos/100/100?random=40",
        status: "Negociação",
        leadScore: 92,
        scoreLabel: "Quente",
        lastActivity: "5 min atrás",
        location: "Rio de Janeiro, RJ",
        tags: ["Investidor", "Pagamento à Vista"],
        budget: "R$ 1.2M+",
        lookingFor: "Comercial / Alto Padrão",
        stats: { views: 45, favorites: 12, visits: 4 },
        timeline: [
            { id: 1, type: 'note', title: 'Proposta Enviada', desc: 'Enviou proposta de R$ 1.1M no imóvel #402.', date: '5 min atrás' },
            { id: 2, type: 'visit', title: 'Visita Realizada', desc: 'Gostou da área de lazer.', date: '3 dias atrás' }
        ]
    },
    {
        id: 3,
        name: "Júlia Costa",
        email: "julia.c@email.com",
        phone: "+55 (11) 97777-7777",
        image: "https://picsum.photos/100/100?random=41",
        status: "Novo",
        leadScore: 45,
        scoreLabel: "Médio",
        lastActivity: "1 dia atrás",
        location: "Campinas, SP",
        tags: ["Primeiro Imóvel"],
        budget: "R$ 300k - 400k",
        lookingFor: "Apartamento 2Q",
        stats: { views: 5, favorites: 1, visits: 0 },
        timeline: [
            { id: 1, type: 'create', title: 'Lead Cadastrado', desc: 'Entrou via Instagram Ads.', date: '1 dia atrás' }
        ]
    },
    {
        id: 4,
        name: "Michael Chen",
        email: "m.chen@tech.com",
        phone: "+55 (11) 96666-6666",
        image: "https://picsum.photos/100/100?random=42",
        status: "Ativo",
        leadScore: 78,
        scoreLabel: "Alto",
        lastActivity: "30 min atrás",
        location: "São Paulo, SP",
        tags: ["Urgente", "Mudança de Cidade"],
        budget: "R$ 800k",
        lookingFor: "Loft / Studio",
        stats: { views: 18, favorites: 5, visits: 1 },
        timeline: [
            { id: 1, type: 'view', title: 'Busca Recente', desc: 'Filtrou por "Pet Friendly".', date: '30 min atrás' }
        ]
    },
    {
        id: 5,
        name: "Fernanda Lima",
        email: "fer.lima@email.com",
        phone: "+55 (21) 95555-5555",
        image: "https://picsum.photos/100/100?random=43",
        status: "Fechado",
        leadScore: 100,
        scoreLabel: "Convertido",
        lastActivity: "1 semana atrás",
        location: "Niterói, RJ",
        tags: ["Contrato Assinado"],
        budget: "R$ 600k",
        lookingFor: "Casa 3Q",
        stats: { views: 50, favorites: 10, visits: 6 },
        timeline: [
            { id: 1, type: 'update', title: 'Venda Concluída', desc: 'Chaves entregues.', date: '1 semana atrás' }
        ]
    }
];

const ClientProfile: React.FC = () => {
    // --- Estados Principais ---
    // Usamos estado para 'clients' para permitir a modificação (adicionar notas, logs)
    const [clients, setClients] = useState<Client[]>(initialClientsDB);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    // --- Estados de Filtro e Input ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Novo' | 'Ativo' | 'Negociação'>('Todos');
    const [noteInput, setNoteInput] = useState("");

    // --- Derived Data ---
    const selectedClient = useMemo(() =>
        clients.find(c => c.id === selectedClientId),
        [selectedClientId, clients]);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const name = client.name || '';
            const email = client.email || '';
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Todos' || client.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, clients]);

    // --- Ações de Negócio ---

    const handleAddNote = () => {
        if (!noteInput.trim() || !selectedClientId) return;

        const newEvent: TimelineEvent = {
            id: Date.now(),
            type: 'note',
            title: 'Nota Adicionada',
            desc: noteInput,
            date: 'Agora'
        };

        setClients(prevClients => prevClients.map(c => {
            if (c.id === selectedClientId) {
                return {
                    ...c,
                    timeline: [newEvent, ...c.timeline],
                    lastActivity: 'Agora'
                };
            }
            return c;
        }));

        setNoteInput("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddNote();
        }
    };

    const handleCall = () => {
        if (!selectedClient) return;

        // Simula a ação de ligar
        window.location.href = `tel:${selectedClient.phone}`;
        alert(`Ligando para ${selectedClient.name} (${selectedClient.phone})...`);

        // Registra a chamada na timeline automaticamente
        const newEvent: TimelineEvent = {
            id: Date.now(),
            type: 'call',
            title: 'Chamada Efetuada',
            desc: 'Tentativa de contato via telefone.',
            date: 'Agora'
        };

        setClients(prevClients => prevClients.map(c => {
            if (c.id === selectedClient.id) {
                return {
                    ...c,
                    timeline: [newEvent, ...c.timeline],
                    lastActivity: 'Agora'
                };
            }
            return c;
        }));
    };

    const handleEmail = () => {
        if (!selectedClient) return;

        // Simula a ação de email
        window.location.href = `mailto:${selectedClient.email}`;

        // Registra o email na timeline
        const newEvent: TimelineEvent = {
            id: Date.now(),
            type: 'email',
            title: 'Email Enviado',
            desc: 'Iniciou composição de email.',
            date: 'Agora'
        };

        setClients(prevClients => prevClients.map(c => {
            if (c.id === selectedClient.id) {
                return {
                    ...c,
                    timeline: [newEvent, ...c.timeline],
                    lastActivity: 'Agora'
                };
            }
            return c;
        }));
    };

    // --- Helpers de UI ---

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Novo': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Ativo': return 'bg-green-100 text-green-700 border-green-200';
            case 'Negociação': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Fechado': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-rose-600';
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-slate-400';
    };

    const getTimelineIcon = (type: string) => {
        switch (type) {
            case 'visit': return { icon: 'calendar_month', bg: 'bg-primary' };
            case 'create': return { icon: 'person_add', bg: 'bg-green-500' };
            case 'note': return { icon: 'edit_note', bg: 'bg-amber-500' };
            case 'call': return { icon: 'call', bg: 'bg-purple-500' };
            case 'email': return { icon: 'mail', bg: 'bg-blue-500' };
            case 'view': return { icon: 'visibility', bg: 'bg-slate-400' };
            default: return { icon: 'circle', bg: 'bg-slate-400' };
        }
    };

    // --- TELA DE LISTA ---
    if (!selectedClient) {
        return (
            <div className="bg-slate-50 text-slate-900 font-display h-full flex flex-col overflow-hidden">
                {/* Header da Lista */}
                <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-xl font-bold">CRM Clientes</h2>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                            <span className="material-symbols-outlined text-[20px]">person_add</span> Novo Cliente
                        </button>
                    </div>
                </header>

                {/* Filtros e Busca */}
                <div className="p-6 pb-2">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                            {['Todos', 'Novo', 'Ativo', 'Negociação'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${statusFilter === st
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabela de Clientes */}
                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                                    <th className="p-4 font-bold">Cliente</th>
                                    <th className="p-4 font-bold hidden sm:table-cell">Status</th>
                                    <th className="p-4 font-bold hidden md:table-cell">Score</th>
                                    <th className="p-4 font-bold hidden lg:table-cell">Interesse</th>
                                    <th className="p-4 font-bold text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedClientId(client.id)}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url("${client.image}")` }}></div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{client.name}</p>
                                                    <p className="text-xs text-slate-500">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(client.status)}`}>
                                                {client.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full ${client.leadScore > 80 ? 'bg-rose-500' : client.leadScore > 50 ? 'bg-green-500' : 'bg-slate-400'}`} style={{ width: `${client.leadScore}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{client.leadScore}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <p className="text-sm font-medium text-slate-700">{client.lookingFor}</p>
                                            <p className="text-xs text-slate-500">{client.budget}</p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredClients.length === 0 && (
                            <div className="p-10 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                                <p>Nenhum cliente encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- TELA DE DETALHES DO CLIENTE ---
    const c = selectedClient; // Alias para facilitar

    return (
        <div className="bg-slate-50 text-slate-900 font-display h-full flex flex-col overflow-x-hidden">
            {/* Top Navigation */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-6 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedClientId(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        title="Voltar para lista"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-4 text-slate-900">
                        <div className="size-8 text-primary">
                            <span className="material-symbols-outlined text-3xl">roofing</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">CRM Detalhes</h2>
                    </div>
                </div>

                {/* Barra de busca rápida no header (opcional/desktop) */}
                <label className="flex flex-col min-w-40 !h-10 max-w-64 hidden md:flex opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-slate-200 bg-slate-50">
                        <div className="text-slate-400 flex border-none items-center justify-center pl-4 rounded-l-lg border-r-0">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input className="form-input flex w-full min-w-0 flex-1 bg-transparent border-none h-full placeholder:text-slate-400 px-4 text-sm focus:ring-0" placeholder="Busca rápida..." />
                    </div>
                </label>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                        <button onClick={() => setSelectedClientId(null)} className="text-slate-500 font-medium hover:text-primary">Clientes</button>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500 font-medium">{c.status}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-900 font-medium">{c.name}</span>
                    </div>

                    {/* Header do Perfil */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 items-center">
                                <div className="size-16 rounded-full bg-cover bg-center border-2 border-primary" style={{ backgroundImage: `url("${c.image}")` }}></div>
                                <div>
                                    <h1 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight">{c.name}</h1>
                                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span> Última atividade: {c.lastActivity}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Badge de Status */}
                                <div className={`flex h-7 items-center justify-center gap-x-1.5 rounded-full px-3 border ${getStatusColor(c.status)}`}>
                                    <p className="text-xs font-bold uppercase tracking-wide">{c.status}</p>
                                </div>
                                {/* Tags Dinâmicas */}
                                {c.tags.map(tag => (
                                    <div key={tag} className="flex h-7 items-center justify-center gap-x-1.5 rounded-full px-3 bg-slate-100 text-slate-600 border border-slate-200">
                                        <p className="text-xs font-bold uppercase tracking-wide">{tag}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleCall}
                                className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-blue-600 transition-colors text-white text-sm font-bold shadow-lg shadow-primary/20 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">call</span> <span>Ligar</span>
                            </button>
                            <button
                                onClick={handleEmail}
                                className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 text-sm font-bold active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">mail</span> <span>Email</span>
                            </button>
                            <button className="flex items-center justify-center rounded-lg size-10 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700">
                                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Imóveis Vistos', val: c.stats.views, icon: 'visibility', col: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Favoritos', val: c.stats.favorites, icon: 'favorite', col: 'text-green-500', bg: 'bg-green-50' },
                                { label: 'Visitas', val: c.stats.visits, icon: 'event', col: 'text-purple-500', bg: 'bg-purple-50' }
                            ].map(stat => (
                                <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                                    <div className={`size-10 rounded-full flex items-center justify-center ${stat.bg} ${stat.col}`}>
                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs font-medium uppercase">{stat.label}</p>
                                        <p className="text-slate-900 text-xl font-bold">{stat.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Activity Feed */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full shadow-sm">
                            <div className="border-b border-slate-200 px-6 flex gap-8">
                                <button className="py-4 text-primary text-sm font-bold border-b-2 border-primary">Timeline</button>
                                <button className="py-4 text-slate-500 hover:text-slate-900 text-sm font-medium border-b-2 border-transparent transition-colors">Notas</button>
                            </div>
                            <div className="p-6">
                                <div className="relative pl-4 border-l border-slate-200 space-y-8">
                                    {c.timeline.map((event) => {
                                        const ui = getTimelineIcon(event.type);
                                        return (
                                            <div key={event.id} className="relative pl-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className={`absolute -left-[23px] top-1 size-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${ui.bg} text-white`}>
                                                    <span className="material-symbols-outlined text-[10px]">{ui.icon}</span>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-slate-900 font-semibold">{event.title}</p>
                                                        <span className="text-slate-400 text-xs whitespace-nowrap">{event.date}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm">{event.desc}</p>

                                                    {/* Renderização condicional de meta-dados (ex: imagens de visualização) */}
                                                    {event.type === 'view' && event.meta && (
                                                        <div className="grid grid-cols-3 gap-3 max-w-md mt-1">
                                                            {(event.meta as number[]).map((imgId, i) => (
                                                                <div key={i} className="rounded-lg overflow-hidden relative group cursor-pointer border border-slate-200">
                                                                    <div className="bg-cover bg-center h-20 w-full" style={{ backgroundImage: `url("https://picsum.photos/200/200?random=${imgId}")` }}></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Quick Note Input */}
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <div className="flex gap-3 items-center">
                                    <div className="size-8 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url("https://picsum.photos/100/100?random=19")` }}></div>
                                    <input
                                        className="flex-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-primary px-4 py-2.5 transition-all"
                                        placeholder="Adicionar nota ou registrar chamada..."
                                        type="text"
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!noteInput.trim()}
                                        className={`p-2 rounded-lg transition-colors ${noteInput.trim() ? 'text-primary hover:bg-slate-200 hover:text-blue-700' : 'text-slate-300'}`}
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                        {/* Lead Score Widget */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 relative overflow-hidden shadow-sm">
                            <div className="flex justify-between items-center z-10">
                                <h3 className="text-slate-900 font-bold text-lg">Score Lead</h3>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{c.scoreLabel}</span>
                            </div>
                            <div className="flex items-center gap-6 z-10">
                                <div className="size-24 rounded-full flex items-center justify-center relative" style={{ background: `conic-gradient(#2b6cee ${c.leadScore}%, #f1f5f9 0)` }}>
                                    <div className="size-20 bg-white rounded-full flex items-center justify-center flex-col">
                                        <span className={`text-2xl font-black ${getScoreColor(c.leadScore)}`}>{c.leadScore}</span>
                                        <span className="text-[10px] text-slate-400 uppercase">Pontos</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {['Engajamento', 'Perfil', 'Orçamento'].map(item => (
                                        <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                            <span className="material-symbols-outlined text-base text-green-500">check</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Contact & Info */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                            <h3 className="text-slate-900 font-bold text-lg">Contato</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3 items-center">
                                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">phone</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Telefone</span>
                                        <span className="text-slate-900 text-sm font-medium">{c.phone}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Email</span>
                                        <span className="text-slate-900 text-sm font-medium">{c.email}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">home</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Endereço</span>
                                        <span className="text-slate-900 text-sm font-medium">{c.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences Tags */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                            <h3 className="text-slate-900 font-bold text-lg">Preferências</h3>
                            <div className="mb-2">
                                <p className="text-sm font-bold text-slate-700">Busca:</p>
                                <p className="text-sm text-slate-500">{c.lookingFor}</p>
                            </div>
                            <div className="mb-2">
                                <p className="text-sm font-bold text-slate-700">Orçamento:</p>
                                <p className="text-sm text-slate-500">{c.budget}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientProfile;