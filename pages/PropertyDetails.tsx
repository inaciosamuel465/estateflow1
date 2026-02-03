import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../App';

// --- Interface de Dados ---
interface PropertyData {
    id: number | string;
    title: string;
    address: string;
    city: string;
    price: number;
    condoFee: number;
    tax: number;
    description: string;
    specs: {
        bedrooms: number;
        bathrooms: number;
        area: number;
        parking: number;
        year: number;
    };
    amenities: string[];
    images: string[];
    agency: {
        name: string;
        phoneDisplay: string;
        phoneNumber: string; // Formato raw para APIs
        email: string;
        logo: string;
        reviews: number;
        rating: number;
    };
    coords: { lat: number; lng: number; };
}

// --- Dados da Imobiliária (Fixo) ---
const AGENCY_DATA = {
    name: "EstateFlow Imobiliária",
    phoneDisplay: "(15) 99724-1175",
    phoneNumber: "5515997241175", // Número solicitado
    email: "contato@estateflow.com",
    logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop",
    reviews: 1240,
    rating: 4.9
};

// --- Base de Dados Mockada ---
const propertiesDB: PropertyData[] = [
    {
        id: 1,
        title: "Apartamento Luxo Augusta",
        address: "Rua Augusta, 1500",
        city: "São Paulo, SP",
        price: 450000,
        condoFee: 800,
        tax: 350,
        description: "Apartamento moderno na icônica Rua Augusta. Perfeito para quem busca vida noturna e facilidade de transporte. Acabamento de alto padrão e isolamento acústico.",
        specs: { bedrooms: 2, bathrooms: 2, area: 80, parking: 1, year: 2018 },
        amenities: ['Portaria 24h', 'Academia', 'Salão de Festas', 'Metrô Próximo'],
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop"
        ],
        agency: AGENCY_DATA,
        coords: { lat: -23.5583, lng: -46.6603 }
    },
    {
        id: 3,
        title: "Cobertura Av. Paulista",
        address: "Av. Paulista, 2000",
        city: "São Paulo, SP",
        price: 520000,
        condoFee: 1200,
        tax: 500,
        description: "Vista espetacular da Avenida Paulista. Espaço amplo, iluminado e no coração financeiro da cidade. Oportunidade única de investimento.",
        specs: { bedrooms: 3, bathrooms: 2, area: 110, parking: 2, year: 1995 },
        amenities: ['Vista Panorâmica', 'Metro na Porta', 'Segurança Reforçada'],
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1512918760513-95f192972701?q=80&w=1200&auto=format&fit=crop"
        ],
        agency: AGENCY_DATA,
        coords: { lat: -23.5595, lng: -46.6600 }
    },
    {
        id: 5,
        title: "Mansão Oscar Freire",
        address: "Rua Oscar Freire, 100",
        city: "São Paulo, SP",
        price: 890000,
        condoFee: 0,
        tax: 1500,
        description: "Casa exclusiva na rua mais charmosa de SP. Ideal para comércio de luxo ou residência de alto padrão. Jardim amplo e arquitetura clássica.",
        specs: { bedrooms: 4, bathrooms: 4, area: 250, parking: 4, year: 1980 },
        amenities: ['Jardim', 'Lareira', 'Área Gourmet', 'Localização Premium'],
        images: [
            "https://images.unsplash.com/photo-1600596542815-27b88e39e1d7?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1200&auto=format&fit=crop"
        ],
        agency: AGENCY_DATA,
        coords: { lat: -23.5650, lng: -46.6700 }
    },
    {
        id: 'cob-paulista-1234',
        title: "Cobertura de Luxo com Vista Panorâmica",
        address: "Av. Paulista, 1234, Bela Vista",
        city: "São Paulo, SP",
        price: 2450000,
        condoFee: 1200,
        tax: 850,
        description: `Experimente o auge da vida de luxo nesta cobertura deslumbrante localizada no coração do Centro. Com vistas panorâmicas de tirar o fôlego do horizonte da cidade, este imóvel oferece um estilo de vida inigualável.`,
        specs: { bedrooms: 4, bathrooms: 3.5, area: 285, parking: 2, year: 2021 },
        amenities: ['Ar Condicionado', 'Piscina Privativa', 'Academia', 'Portaria 24h', 'Lareira a Gás', 'Elevador Privativo', 'Pet Friendly', 'Piso de Madeira Nobre', 'Automação Residencial', 'Varanda Gourmet', 'Depósito', 'Vista Livre'],
        images: [
            "https://images.unsplash.com/photo-1512918760513-95f192972701?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfe1?q=80&w=1200&auto=format&fit=crop"
        ],
        agency: AGENCY_DATA,
        coords: { lat: -23.5615, lng: -46.6565 }
    }
];

interface PropertyDetailsProps {
    propertyId?: number | string | null;
    onBack?: () => void;
    isPublic?: boolean;
    onChatStart?: (propertyTitle: string) => void;
    currentUser?: User | null;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ propertyId, onBack, isPublic = false, onChatStart, currentUser }) => {
    const propertyData = useMemo(() => {
        if (!propertyId) return propertiesDB[propertiesDB.length - 1];
        const found = propertiesDB.find(p => p.id === propertyId);
        return found || propertiesDB[propertiesDB.length - 1];
    }, [propertyId]);

    const [activeTab, setActiveTab] = useState<'photos' | 'video' | 'tour' | 'floorplan'>('photos');
    const [showRealMap, setShowRealMap] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success'>('idle');

    // Estado para o Modal de Negociação
    const [showNegotiationModal, setShowNegotiationModal] = useState(false);

    // --- Handlers de Ação ---

    const handleShare = () => {
        // Cria o link direto para este imóvel usando o ID
        const url = `${window.location.origin}${window.location.pathname}?id=${propertyData.id}`;
        navigator.clipboard.writeText(url);
        alert(`Link do anúncio copiado!\n${url}`);
    };

    const handleCall = () => {
        // Abre o discador
        window.location.href = `tel:${propertyData.agency.phoneNumber}`;
    };

    const handleEmail = () => {
        // Abre cliente de email
        window.location.href = `mailto:${propertyData.agency.email}?subject=Interesse no Imóvel: ${propertyData.title}`;
    };

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const nextImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % propertyData.images.length);
    }, [propertyData.images.length]);

    const prevImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + propertyData.images.length) % propertyData.images.length);
    }, [propertyData.images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, nextImage, prevImage]);

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('sending');
        setTimeout(() => {
            setFormStatus('success');
            setTimeout(() => setFormStatus('idle'), 3000);
            setContactForm({ name: '', email: '', phone: '' });
        }, 1500);
    };

    // --- Handlers de Negociação ---

    const handleNegotiateClick = () => {
        // Abre o modal de escolha
        setShowNegotiationModal(true);
    };

    const handleWhatsApp = () => {
        // Monta mensagem pré-definida com dados do imóvel
        const message = `Olá, tenho interesse no imóvel: ${propertyData.title}. \nValor: R$ ${propertyData.price.toLocaleString('pt-BR')}. \nLocalização: ${propertyData.city}. \nGostaria de mais informações.`;

        // Cria link da API do WhatsApp
        const url = `https://wa.me/${propertyData.agency.phoneNumber}?text=${encodeURIComponent(message)}`;

        // Abre em nova aba
        window.open(url, '_blank');
        setShowNegotiationModal(false);
    };

    const handleInternalChat = () => {
        // Usa a função existente de chat interno
        if (onChatStart) {
            onChatStart(propertyData.title);
        } else {
            alert("Chat interno indisponível nesta visualização.");
        }
        setShowNegotiationModal(false);
    };

    return (
        <div className="bg-slate-50 h-full overflow-y-auto flex flex-col font-display text-slate-900 antialiased transition-colors duration-200">

            {/* Top Navigation */}
            <header className={`sticky top-0 z-40 w-full border-b border-solid border-slate-200 bg-white/90 backdrop-blur-md ${isPublic ? 'shadow-sm' : ''}`}>
                <div className="flex items-center justify-between whitespace-nowrap px-4 lg:px-10 py-3 max-w-[1440px] mx-auto">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined notranslate">arrow_back</span>
                                {isPublic && <span className="text-sm font-bold">Voltar</span>}
                            </button>
                        )}
                        {!isPublic && (
                            <div className="flex items-center gap-2 text-slate-900">
                                <div className="size-8 text-primary">
                                    <span className="material-symbols-outlined notranslate text-[32px]">roofing</span>
                                </div>
                                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">EstateFlow</h2>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {isPublic ? (
                            <button
                                onClick={handleNegotiateClick}
                                className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined notranslate text-[18px]">handshake</span>
                                Negociar Agora
                            </button>
                        ) : (
                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-slate-200 cursor-pointer" style={{ backgroundImage: `url("${propertyData.agency.logo}")` }}></div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
                    <button onClick={onBack} className="text-slate-500 hover:text-primary font-medium transition-colors">Imóveis</button>
                    <span className="material-symbols-outlined notranslate text-slate-400 text-[16px]">chevron_right</span>
                    <span className="text-slate-900 font-medium truncate max-w-[200px]">{propertyData.title}</span>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20 uppercase tracking-wide">Venda</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-600 uppercase tracking-wide">Imóvel #{propertyData.id}</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-2">{propertyData.title}</h1>
                        <div className="flex items-center gap-1 text-slate-500">
                            <span className="material-symbols-outlined notranslate text-[20px]">location_on</span>
                            <p className="text-base font-medium">{propertyData.address} - {propertyData.city}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleShare}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined notranslate text-[20px]">share</span> Compartilhar
                        </button>
                        <button
                            onClick={() => {
                                if (!currentUser) { alert("Faça login para salvar."); return; }
                                setIsSaved(!isSaved);
                            }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold transition-colors active:scale-95 ${isSaved ? 'text-rose-500' : 'text-slate-700'}`}
                        >
                            <span className={`material-symbols-outlined notranslate text-[20px] ${isSaved ? 'fill-current' : ''}`}>favorite</span> {isSaved ? 'Salvo' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Media Tabs */}
                <div className="border-b border-slate-200 mb-6">
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'photos', icon: 'image', label: 'Fotos' },
                            { id: 'video', icon: 'videocam', label: 'Vídeo' },
                            { id: 'tour', icon: 'view_in_ar', label: 'Tour 360°' },
                            { id: 'floorplan', icon: 'floor_lamp', label: 'Planta' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`group flex items-center gap-2 pb-3 border-b-[3px] transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <span className={`material-symbols-outlined notranslate text-[20px] ${activeTab === tab.id ? 'fill-current' : ''} group-hover:scale-110 transition-transform`}>{tab.icon}</span>
                                <span className="text-sm font-bold">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gallery / Media Content */}
                <div className="mb-8 h-[400px] md:h-[500px] bg-slate-100 rounded-2xl overflow-hidden relative shadow-md">
                    {activeTab === 'photos' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-full p-0 md:p-0">
                            <div
                                onClick={() => openLightbox(0)}
                                className="md:col-span-2 md:row-span-2 relative group overflow-hidden cursor-pointer h-full"
                            >
                                <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${propertyData.images[0]}")` }}></div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                            {propertyData.images.slice(1, 5).map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => openLightbox(idx + 1)}
                                    className="relative group overflow-hidden cursor-pointer h-full hidden md:block"
                                >
                                    <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${img}")` }}></div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                                    {idx === 3 && idx === propertyData.images.slice(1, 5).length - 1 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                            <span className="text-white font-bold text-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined notranslate">grid_view</span> Ver todas
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab !== 'photos' && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined notranslate text-6xl mb-4 opacity-20">
                                {activeTab === 'video' ? 'videocam_off' : activeTab === 'tour' ? '360' : 'architecture'}
                            </span>
                            <p className="font-medium">Mídia não disponível na demonstração</p>
                            <button onClick={() => setActiveTab('photos')} className="mt-4 text-primary font-bold hover:underline">Voltar para Fotos</button>
                        </div>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            {[
                                { icon: 'bed', label: 'Quartos', val: propertyData.specs.bedrooms },
                                { icon: 'bathtub', label: 'Banheiros', val: propertyData.specs.bathrooms },
                                { icon: 'square_foot', label: 'Área', val: `${propertyData.specs.area} m²` },
                                { icon: 'garage', label: 'Vagas', val: propertyData.specs.parking },
                                { icon: 'calendar_month', label: 'Ano', val: propertyData.specs.year }
                            ].map(stat => (
                                <div key={stat.label} className="flex flex-col items-center justify-center text-center gap-1">
                                    <span className="material-symbols-outlined notranslate text-primary text-[24px]">{stat.icon}</span>
                                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                                    <span className="text-lg font-bold text-slate-900">{stat.val}</span>
                                </div>
                            ))}
                        </div>

                        {/* About Section */}
                        <div id="about" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Sobre o Imóvel</h3>
                            <div className={`prose max-w-none text-slate-600 leading-relaxed overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[1000px]' : 'max-h-[150px] relative'}`}>
                                <p className="whitespace-pre-line">{propertyData.description}</p>
                                {!isExpanded && (
                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-2 text-primary font-bold text-sm flex items-center gap-1 hover:underline focus:outline-none"
                            >
                                {isExpanded ? 'Ler menos' : 'Ler mais'} <span className={`material-symbols-outlined notranslate text-[16px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>
                        </div>

                        {/* Amenities Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Características e Amenidades</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                                {propertyData.amenities.map(feat => (
                                    <div key={feat} className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <span className="material-symbols-outlined notranslate text-[14px] font-bold">check</span>
                                        </div>
                                        <span className="text-slate-700 text-sm">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financials Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Financeiro</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-slate-600">Preço de Venda</span>
                                    <span className="text-lg font-bold text-slate-900">R$ {propertyData.price.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-slate-600">Condomínio</span>
                                        <span className="text-xs text-slate-400">Mensal</span>
                                    </div>
                                    <span className="text-lg font-medium text-slate-900">R$ {propertyData.condoFee.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-slate-600">IPTU</span>
                                        <span className="text-xs text-slate-400">Mensal est.</span>
                                    </div>
                                    <span className="text-lg font-medium text-slate-900">R$ {propertyData.tax.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-slate-900 font-bold text-lg">Custo Mensal Total</span>
                                    <span className="text-2xl font-extrabold text-primary">R$ {(propertyData.condoFee + propertyData.tax).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Localização</h3>
                            <div className="w-full h-80 rounded-xl overflow-hidden relative bg-slate-200 border border-slate-200">
                                {showRealMap ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${propertyData.coords.lat},${propertyData.coords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        allowFullScreen
                                        loading="lazy"
                                        title="Localização do Imóvel"
                                    ></iframe>
                                ) : (
                                    <>
                                        <div className="w-full h-full bg-cover bg-center filter grayscale opacity-60" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=800&auto=format&fit=crop")' }}></div>
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                            <button
                                                onClick={() => setShowRealMap(true)}
                                                className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 group"
                                            >
                                                <span className="material-symbols-outlined notranslate text-primary group-hover:animate-bounce">map</span> Explorar Vizinhança
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 flex flex-col gap-6">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                                <div className="mb-6">
                                    <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">R$ {propertyData.price.toLocaleString('pt-BR')}</h2>
                                </div>
                                <div className="flex flex-col gap-3 mb-6">
                                    {isPublic ? (
                                        <button
                                            onClick={handleNegotiateClick}
                                            className="w-full py-3.5 px-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-primary/25 transition-all flex justify-center items-center gap-2 active:scale-95 animate-pulse-slow"
                                        >
                                            <span className="material-symbols-outlined notranslate text-[20px]">handshake</span> Negociar Agora
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                                            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base shadow-lg shadow-primary/25 transition-all flex justify-center items-center gap-2 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined notranslate">calendar_today</span> Agendar Visita
                                        </button>
                                    )}
                                    <button
                                        onClick={handleShare}
                                        className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-base transition-colors flex justify-center items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined notranslate">share</span> Compartilhar
                                    </button>
                                </div>
                                {/* Agency Profile */}
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <div className="size-14 rounded-full bg-slate-300 bg-cover bg-center border-2 border-white" style={{ backgroundImage: `url("${propertyData.agency.logo}")` }}></div>
                                            <div className="absolute -bottom-0 -right-0 size-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 leading-tight">{propertyData.agency.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">Imobiliária Parceira</p>
                                            <div className="flex gap-1 mt-1 text-yellow-400 text-sm items-center">
                                                <span className="material-symbols-outlined notranslate text-[16px] fill-current">star</span>
                                                <span className="font-bold text-slate-700 ml-1">{propertyData.agency.rating}</span>
                                                <span className="text-slate-400 ml-1 font-medium">({propertyData.agency.reviews} avaliações)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm gap-2">
                                        <button
                                            onClick={handleCall}
                                            className="flex-1 py-2 text-slate-600 bg-slate-50 hover:bg-primary hover:text-white rounded-lg font-bold flex justify-center items-center gap-2 transition-all"
                                        >
                                            <span className="material-symbols-outlined notranslate text-[18px]">call</span> Ligar
                                        </button>
                                        <button
                                            onClick={handleEmail}
                                            className="flex-1 py-2 text-slate-600 bg-slate-50 hover:bg-primary hover:text-white rounded-lg font-bold flex justify-center items-center gap-2 transition-all"
                                        >
                                            <span className="material-symbols-outlined notranslate text-[18px]">mail</span> Email
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="contact-form" className="bg-white border border-slate-200 rounded-2xl p-6">
                                <h4 className="font-bold text-slate-900 mb-4">Solicitar Informações</h4>
                                {formStatus === 'success' ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
                                        <div className="size-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-3">
                                            <span className="material-symbols-outlined notranslate text-2xl">check</span>
                                        </div>
                                        <p className="text-slate-900 font-bold">Mensagem Enviada!</p>
                                        <p className="text-sm text-slate-500">Nossa equipe entrará em contato em breve.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
                                        <input
                                            className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                            placeholder="Seu Nome"
                                            type="text"
                                            required
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        />
                                        <input
                                            className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                            placeholder="Email"
                                            type="email"
                                            required
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        />
                                        <input
                                            className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                            placeholder="Telefone"
                                            type="tel"
                                            required
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                        />
                                        <button
                                            className="mt-2 w-full h-10 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                                            type="submit"
                                            disabled={formStatus === 'sending'}
                                        >
                                            {formStatus === 'sending' ? (
                                                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                'Enviar Solicitação'
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 py-10 border-t border-slate-200 bg-white">
                <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-900">
                            <span className="material-symbols-outlined notranslate text-primary text-[24px]">roofing</span>
                            <span className="font-bold text-lg">EstateFlow</span>
                        </div>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <a className="hover:text-primary" href="#">Privacidade</a>
                            <a className="hover:text-primary" href="#">Termos</a>
                            <a className="hover:text-primary" href="#">Ajuda</a>
                        </div>
                        <p className="text-sm text-slate-400">© 2024 EstateFlow Inc.</p>
                    </div>
                </div>
            </footer>

            {/* Lightbox Overlay */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={closeLightbox}>
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2">
                        <span className="material-symbols-outlined notranslate text-3xl">close</span>
                    </button>

                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-50 hidden md:block"
                        onClick={prevImage}
                    >
                        <span className="material-symbols-outlined notranslate text-4xl">chevron_left</span>
                    </button>

                    <div className="max-w-[90vw] max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={propertyData.images[currentImageIndex]}
                            alt={`Gallery ${currentImageIndex}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-[-40px] left-0 right-0 text-center text-white text-sm font-medium">
                            {currentImageIndex + 1} / {propertyData.images.length}
                        </div>
                    </div>

                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-50 hidden md:block"
                        onClick={nextImage}
                    >
                        <span className="material-symbols-outlined notranslate text-4xl">chevron_right</span>
                    </button>
                </div>
            )}

            {/* Modal de Negociação */}
            {showNegotiationModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowNegotiationModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowNegotiationModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined notranslate">close</span>
                        </button>

                        <div className="text-center mb-6">
                            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <span className="material-symbols-outlined notranslate text-4xl">handshake</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Como deseja negociar?</h3>
                            <p className="text-sm text-slate-500 mt-2">Escolha a melhor forma de falar com nossos especialistas sobre o imóvel <b>{propertyData.title}</b>.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleWhatsApp}
                                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                            >
                                <span className="material-symbols-outlined notranslate text-2xl">chat</span>
                                Conversar pelo WhatsApp
                            </button>

                            <button
                                onClick={handleInternalChat}
                                className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-95"
                            >
                                <span className="material-symbols-outlined notranslate text-2xl">forum</span>
                                Usar Chat Interno
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-400">Nosso tempo médio de resposta é de 5 minutos.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetails;