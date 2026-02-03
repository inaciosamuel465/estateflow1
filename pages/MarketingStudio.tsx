import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../src/types';
import { GoogleGenAI } from "@google/genai";

interface MarketingStudioProps {
    properties: Property[];
}

interface MarketingCampaign {
    id: number;
    propertyTitle: string;
    platform: 'instagram' | 'whatsapp';
    format: 'feed' | 'story';
    generatedText: string;
    headline: string; // Frase curta na imagem
    generatedImage: string;
    template: string;
    date: string;
}

type TemplateType = 'modern' | 'luxury' | 'urgent' | 'minimal';
type MobileTab = 'setup' | 'preview' | 'result';

const MarketingStudio: React.FC<MarketingStudioProps> = ({ properties }) => {
    // --- States ---
    const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('setup');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [platform, setPlatform] = useState<'instagram' | 'whatsapp'>('instagram');
    const [format, setFormat] = useState<'feed' | 'story'>('story');
    const [tone, setTone] = useState<'professional' | 'viral' | 'urgent'>('viral');
    const [template, setTemplate] = useState<TemplateType>('modern');

    // AI Content States
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCaption, setGeneratedCaption] = useState(''); // Texto do post
    const [generatedHeadline, setGeneratedHeadline] = useState(''); // Texto NA imagem

    // Download State
    const [isDownloading, setIsDownloading] = useState(false);

    // Refs
    const artboardRef = useRef<HTMLDivElement>(null);

    // History
    const [campaignHistory, setCampaignHistory] = useState<MarketingCampaign[]>([]);

    // Derived
    const selectedProperty = properties.find(p => p.id.toString() === selectedPropertyId);

    // Default Image (Placeholder)
    const displayImage = selectedProperty?.image || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop";

    // --- Actions ---

    const handleGenerate = async () => {
        setIsGenerating(true);
        // No mobile, muda para preview para ver o loading
        if (window.innerWidth < 1024) {
            setActiveMobileTab('preview');
        }

        const apiKey = process.env.API_KEY;

        // Contexto do Imóvel
        const propertyContext = selectedProperty
            ? `Imóvel: ${selectedProperty.title}, Preço: ${selectedProperty.price}, Local: ${selectedProperty.location}, Tipo: ${selectedProperty.type}. Benefícios: ${selectedProperty.amenities?.join(', ')}.`
            : "Imóvel de alto padrão, localização privilegiada, acabamento premium.";

        try {
            if (!apiKey) {
                // Mock Simulation
                await new Promise(resolve => setTimeout(resolve, 2000));
                setGeneratedCaption(platform === 'instagram'
                    ? `🚀 Oportunidade Incrível! \n\nConheça este ${selectedProperty?.type || 'imóvel'} espetacular em ${selectedProperty?.location?.split(',')[0] || 'região nobre'}. \n\n💎 Acabamento de primeira\n📍 Localização estratégica\n🔑 Pronto para morar\n\nAgende sua visita agora mesmo! 👇\n\n#Imoveis #Oportunidade #${selectedProperty?.type || 'RealEstate'} #Venda`
                    : `Olá! 👋 Separei este imóvel que é a sua cara: ${selectedProperty?.title}. \n\nEstá saindo por ${selectedProperty?.price}. As condições estão ótimas essa semana. Quer agendar uma visita?`);

                setGeneratedHeadline(tone === 'urgent' ? "ÚLTIMAS UNIDADES!" : tone === 'viral' ? "O APÊ DOS SONHOS 😍" : "ALTO PADRÃO E EXCLUSIVIDADE");
            } else {
                const ai = new GoogleGenAI({ apiKey });

                // 1. Gerar Legenda (Caption)
                const captionPrompt = `Atue como um especialista em marketing imobiliário. Crie uma legenda para ${platform} (${format}) com tom ${tone}.
                Imóvel: ${propertyContext}.
                Use emojis, quebras de linha e hashtags se for Instagram. Se for WhatsApp, seja direto e convide para visita.`;

                const captionResponse = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { parts: [{ text: captionPrompt }] }
                });

                // 2. Gerar Headline (Frase curta para a imagem)
                const headlinePrompt = `Crie UMA única frase curta (máximo 5 palavras) de alto impacto para colocar em cima da foto deste imóvel. Tom: ${tone}. Exemplo: "Sua Nova Vida Começa Aqui". Imóvel: ${propertyContext}`;

                const headlineResponse = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { parts: [{ text: headlinePrompt }] }
                });

                if (captionResponse.text) {
                    setGeneratedCaption(captionResponse.text);
                }
                if (headlineResponse.text) {
                    setGeneratedHeadline(headlineResponse.text.replace(/"/g, ''));
                }
            }

            // Se estiver no mobile, após gerar, sugere ir para resultados ou mantem preview
            if (window.innerWidth < 1024) {
                // Mantem no preview para ver a arte, o usuario navega para ver o texto
            }

        } catch (e) {
            console.error(e);
            alert("Erro na geração. Verifique a API Key.");
            setActiveMobileTab('setup');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!generatedCaption) return;
        const newCampaign: MarketingCampaign = {
            id: Date.now(),
            propertyTitle: selectedProperty?.title || 'Campanha Genérica',
            platform,
            format,
            generatedText: generatedCaption,
            headline: generatedHeadline,
            generatedImage: displayImage,
            template,
            date: new Date().toLocaleDateString()
        };
        setCampaignHistory([newCampaign, ...campaignHistory]);
        alert("Campanha salva na biblioteca!");
    };

    const handleCopy = () => {
        if (!generatedCaption) return;
        navigator.clipboard.writeText(generatedCaption);
        alert("Legenda copiada para a área de transferência!");
    };

    const handleShare = async () => {
        let url = window.location.href;
        try {
            new URL(url);
        } catch (e) {
            url = window.location.origin;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: selectedProperty?.title || 'Imóvel Incrível',
                    text: generatedCaption,
                    url: url
                });
            } catch (err: any) {
                console.error('Share failed', err);
                if (err.name !== 'AbortError') handleCopy();
            }
        } else {
            handleCopy();
            alert("Compartilhamento nativo não suportado. Texto copiado!");
        }
    };

    const handleDownload = async () => {
        if (!artboardRef.current) return;
        setIsDownloading(true);

        try {
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
                alert("Erro: Biblioteca de imagem não carregada. Recarregue a página.");
                setIsDownloading(false);
                return;
            }

            const canvas = await html2canvas(artboardRef.current, {
                useCORS: true, // Importante para imagens externas
                scale: 2, // Melhor qualidade
                backgroundColor: null,
            });

            const link = document.createElement('a');
            link.download = `anuncio-${selectedProperty?.title || 'imovel'}-${format}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Erro ao baixar imagem:', error);
            alert("Não foi possível gerar a imagem. Verifique se a imagem do imóvel permite acesso externo (CORS).");
        } finally {
            setIsDownloading(false);
        }
    };

    // --- Render Helpers (Templates) ---

    const renderImageOverlay = () => {
        const price = selectedProperty?.price || "Consulte";
        const title = selectedProperty?.title || "Imóvel Exclusivo";
        const location = selectedProperty?.location || "Localização Privilegiada";
        const headline = generatedHeadline || "Sua Nova Vida Começa Aqui";

        switch (template) {
            case 'luxury': // Estilo elegante, serifado, dourado/preto
                return (
                    <div className="absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-t from-black/90 via-transparent to-black/40">
                        <div className="text-center border-b border-yellow-500/50 pb-4">
                            <p className="text-yellow-400 text-xs font-serif tracking-[0.2em] uppercase">Collection</p>
                            <h2 className="text-white font-serif text-2xl mt-1 drop-shadow-md">{headline}</h2>
                        </div>
                        <div className="text-center">
                            <p className="text-white text-3xl font-serif italic mb-2">{price}</p>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-sm inline-block">
                                <p className="text-gray-200 text-xs uppercase tracking-widest">{location}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'urgent': // Estilo varejo, vermelho, chamativo
                return (
                    <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="absolute top-8 right-0 bg-red-600 text-white px-6 py-2 font-black uppercase text-lg shadow-lg transform translate-x-2">
                            Oportunidade
                        </div>
                        <div className="mt-auto bg-white/95 p-6 m-4 rounded-xl shadow-2xl">
                            <h2 className="text-red-600 font-black text-2xl uppercase leading-none mb-1">{headline}</h2>
                            <p className="text-slate-800 font-bold text-lg leading-tight mb-2">{title}</p>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                                <span className="text-slate-500 text-xs">{location}</span>
                                <span className="text-slate-900 font-black text-xl">{price}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'minimal': // Estilo clean, glassmorphism
                return (
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Destaque do Mês</p>
                                    <h2 className="text-white font-bold text-2xl leading-tight">{headline}</h2>
                                    <p className="text-white/90 text-sm mt-2">{title}</p>
                                </div>
                                <div className="bg-white text-slate-900 px-3 py-3 rounded-2xl font-bold text-sm text-center min-w-[80px]">
                                    {price.split(' ')[0]}<br />{price.split(' ')[1]}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'modern': // Default modern estate style
            default:
                return (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/20 flex flex-col justify-between p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-primary text-white px-3 py-1 rounded text-xs font-bold shadow-lg uppercase tracking-wide">
                                Venda
                            </div>
                            {selectedProperty && (
                                <div className="flex gap-1">
                                    <span className="bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[10px] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">bed</span> {selectedProperty.beds}
                                    </span>
                                    <span className="bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[10px] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">square_foot</span> {selectedProperty.area}m²
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-white font-extrabold text-3xl drop-shadow-lg leading-tight">{headline}</h2>
                            <div className="w-12 h-1 bg-primary rounded-full my-3"></div>
                            <p className="text-white/90 font-medium text-lg">{title}</p>
                            <p className="text-white/70 text-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">location_on</span> {location}
                            </p>
                            <div className="pt-2">
                                <span className="text-2xl font-bold text-white">{price}</span>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark overflow-hidden font-display relative">
            {/* Header Compacto Mobile / Full Desktop */}
            <header className="flex-none bg-white dark:bg-[#111318] border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 lg:py-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <button className="lg:hidden p-2 -ml-2 text-slate-500">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div>
                        <h1 className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl lg:text-2xl">campaign</span>
                            <span className="hidden lg:inline">Marketing Studio</span>
                            <span className="lg:hidden">Marketing</span>
                        </h1>
                        <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 hidden lg:block">Crie posts virais com design profissional e IA.</p>
                    </div>
                </div>
                <button className="flex px-3 lg:px-4 py-2 bg-slate-100 dark:bg-[#1a1d23] hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs lg:text-sm font-bold items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">history</span> <span className="hidden lg:inline">Biblioteca</span>
                </button>
            </header>

            {/* Main Content with Mobile Tabs Logic */}
            <main className="flex-1 overflow-hidden flex flex-col lg:flex-row pb-[60px] lg:pb-0 relative">

                {/* --- Left Panel: Controls (Setup Tab on Mobile) --- */}
                <div className={`
                    w-full lg:w-[380px] bg-white dark:bg-[#111318] border-r border-slate-200 dark:border-slate-800 
                    flex-col overflow-y-auto p-4 lg:p-6 gap-6 z-10 shadow-xl lg:h-full lg:flex
                    ${activeMobileTab === 'setup' ? 'flex' : 'hidden'}
                `}>

                    {/* 1. Seleção de Imóvel */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">home_work</span> 1. Imóvel Base
                        </label>
                        <select
                            className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1d23] text-sm focus:ring-primary focus:border-primary"
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                        >
                            <option value="">Selecione um imóvel...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Formato e Plataforma */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">aspect_ratio</span> 2. Formato
                        </label>
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[#1a1d23] rounded-xl">
                            <button
                                onClick={() => setFormat('story')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${format === 'story' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">smartphone</span>
                                Story (9:16)
                            </button>
                            <button
                                onClick={() => setFormat('feed')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${format === 'feed' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">crop_square</span>
                                Feed (1:1)
                            </button>
                        </div>
                    </div>

                    {/* 3. Estilo Visual (Templates) */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">palette</span> 3. Template Visual
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'modern', label: 'Moderno', color: 'bg-slate-800' },
                                { id: 'luxury', label: 'Luxo', color: 'bg-yellow-600' },
                                { id: 'urgent', label: 'Varejo', color: 'bg-red-600' },
                                { id: 'minimal', label: 'Clean', color: 'bg-blue-400' },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTemplate(t.id as TemplateType)}
                                    className={`relative h-12 rounded-lg border-2 overflow-hidden flex items-center justify-center transition-all ${template === t.id ? 'border-primary ring-1 ring-primary/30' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className={`absolute inset-0 opacity-10 ${t.color}`}></div>
                                    <span className={`text-xs font-bold ${template === t.id ? 'text-primary' : 'text-slate-600'}`}>{t.label}</span>
                                    {template === t.id && <span className="absolute top-1 right-1 size-2 bg-primary rounded-full"></span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Configuração de Texto e IA */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">psychology</span> 4. Inteligência Artificial
                        </label>

                        <div className="flex gap-2 mb-2">
                            {['viral', 'professional', 'urgent'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t as any)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border capitalize transition-all ${tone === t ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 group"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>Criando Arte e Copy...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined group-hover:animate-pulse">auto_awesome</span>
                                    <span>Gerar Campanha</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- Center Panel: Canvas Simulator (Preview Tab on Mobile) --- */}
                <div className={`
                    flex-1 bg-slate-100 dark:bg-[#0b0e14] relative flex-col items-center justify-center p-4 lg:p-8 overflow-hidden lg:flex
                    ${activeMobileTab === 'preview' ? 'flex' : 'hidden'}
                `}>

                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]"></div>

                    {/* Mobile Simulator Frame */}
                    <div
                        className={`
                            relative bg-black rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col shrink-0
                            ${format === 'story' ? 'w-full max-w-[360px] aspect-[9/16]' : 'w-full max-w-[400px] aspect-square'}
                            max-h-[85vh]
                        `}
                    >
                        {/* Status Bar Fake */}
                        <div className="absolute top-0 w-full h-8 px-6 flex justify-between items-center z-30 text-white/80 text-[10px] font-bold bg-gradient-to-b from-black/40 to-transparent">
                            <span>12:30</span>
                            <div className="flex gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                                <span className="material-symbols-outlined text-[14px]">wifi</span>
                                <span className="material-symbols-outlined text-[14px]">battery_full</span>
                            </div>
                        </div>

                        {/* --- THE ARTWORK (This is what is generated/shared) --- */}
                        <div
                            ref={artboardRef}
                            className="relative w-full h-full bg-slate-900 group overflow-hidden"
                        >
                            {/* Background Real Image with crossOrigin for capture */}
                            <img
                                crossOrigin="anonymous"
                                src={displayImage}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                alt="Propriedade"
                            />

                            {/* Overlay System (The "Marketing" Magic) */}
                            {renderImageOverlay()}

                            {/* Loading State Overlay */}
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white">
                                    <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                                    <p className="font-bold text-sm animate-pulse">A IA está desenhando...</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Actions Sim (Only for preview realism, outside artboard capture area) */}
                        {format === 'story' && (
                            <div className="absolute bottom-4 left-0 w-full px-4 z-30 flex items-center gap-2">
                                <div className="flex-1 h-10 rounded-full border border-white/30 bg-black/20 backdrop-blur text-white/70 text-xs px-4 flex items-center">Enviar mensagem...</div>
                                <span className="material-symbols-outlined text-white text-2xl">favorite</span>
                                <span className="material-symbols-outlined text-white text-2xl">send</span>
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-xs text-slate-400 font-medium">Preview em tempo real • {format === 'story' ? '9:16' : '1:1'}</p>
                </div>

                {/* --- Right Panel: Result & Actions (Result Tab on Mobile) --- */}
                <div className={`
                    w-full lg:w-[350px] bg-white dark:bg-[#111318] border-l border-slate-200 dark:border-slate-800 
                    flex-col p-6 gap-6 z-10 shadow-xl h-full overflow-y-auto lg:flex
                    ${activeMobileTab === 'result' ? 'flex' : 'hidden'}
                `}>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-600">chat</span> Legenda Gerada
                        </h3>

                        <div className="relative">
                            <textarea
                                className="w-full h-40 bg-slate-50 dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 resize-none focus:ring-primary focus:border-primary custom-scrollbar leading-relaxed"
                                value={generatedCaption}
                                onChange={(e) => setGeneratedCaption(e.target.value)}
                                placeholder="A legenda gerada pela IA aparecerá aqui..."
                            />
                            <button
                                onClick={handleCopy}
                                className="absolute bottom-3 right-3 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-primary transition-colors"
                                title="Copiar texto"
                            >
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">rocket_launch</span> Publicar
                        </h3>

                        <button onClick={handleShare} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#1a1d23] hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">share</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Compartilhar Agora</p>
                                    <p className="text-xs text-slate-500">Instagram, WhatsApp...</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#1a1d23] hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    {isDownloading ? <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <span className="material-symbols-outlined">download</span>}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Baixar Mídia</p>
                                    <p className="text-xs text-slate-500">Salvar imagem gerada</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                        </button>

                        <button onClick={handleSave} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#1a1d23] hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">bookmark</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Salvar Campanha</p>
                                    <p className="text-xs text-slate-500">Para uso futuro</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                        </button>
                    </div>

                </div>

            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111318] border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-[60px] z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setActiveMobileTab('setup')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeMobileTab === 'setup' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <span className="material-symbols-outlined text-[24px]">tune</span>
                    <span className="text-[10px] font-bold">Configurar</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('preview')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeMobileTab === 'preview' ? 'text-primary' : 'text-slate-400'}`}
                >
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                    <span className="text-[10px] font-bold">Preview</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('result')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeMobileTab === 'result' ? 'text-primary' : 'text-slate-400'} relative`}
                >
                    <span className="material-symbols-outlined text-[24px]">send</span>
                    <span className="text-[10px] font-bold">Publicar</span>
                    {generatedCaption && <span className="absolute top-2 right-8 size-2 bg-green-500 rounded-full"></span>}
                </button>
            </div>
        </div>
    );
};

export default MarketingStudio;