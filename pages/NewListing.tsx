import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Property, User } from '../App';

interface NewListingProps {
    onPublish?: (property: Property) => void;
    currentUser?: User | null;
    initialData?: Property | null; // Adicionado para edição
}

// Interfaces para as APIs Reais
interface IBGEUF {
    id: number;
    sigla: string;
    nome: string;
}

interface IBGECity {
    id: number;
    nome: string;
}

interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        suburb?: string;
        neighbourhood?: string;
        city_district?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
    };
}

const NewListing: React.FC<NewListingProps> = ({ onPublish, currentUser, initialData }) => {
  // Refs for Scroll Navigation
  const essentialsRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const amenitiesRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);
  
  // Ref para o input de arquivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: 'Novo Anúncio Imobiliário',
    transactionType: 'venda',
    price: '',
    propertyType: 'Apartamento',
    area: '',
    totalArea: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    livingRooms: '',
    yearBuilt: '',
    status: 'active', // Novo campo Status
    // Location Data Granular
    state: '',
    city: '',
    street: '',
    number: '',
    neighborhood: '',
    zip: '',
    lat: 0,
    lng: 0,
    
    amenities: ['Piscina', 'Academia'] as string[],
    newAmenity: ''
  });

  // --- Location Logic States (REAL DATA) ---
  const [statesList, setStatesList] = useState<IBGEUF[]>([]);
  const [citiesList, setCitiesList] = useState<IBGECity[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Imagens iniciais
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=400&auto=format&fit=crop"
  ]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(15);

  // --- Inicialização para Edição ---
  useEffect(() => {
      if (initialData) {
          // Extrair cidade e estado da string de localização (ex: "Consolação, SP") ou usar addressDetails se existir
          let extractedCity = "";
          let extractedState = "";
          if (initialData.addressDetails) {
              extractedCity = initialData.addressDetails.city;
              extractedState = initialData.addressDetails.state;
          } else if (initialData.location) {
              const parts = initialData.location.split(',');
              if (parts.length > 1) {
                  extractedState = parts[1].trim();
                  // Cidade pode estar misturada com bairro no mock antigo, tentamos extrair o melhor possível
                  extractedCity = parts[0].trim(); 
              }
          }

          setFormData({
              title: initialData.title || '',
              transactionType: initialData.purpose === 'rent' ? 'aluguel' : 'venda',
              price: initialData.price ? initialData.price.replace(/\D/g, '') : '', // Limpa R$
              propertyType: initialData.type || 'Apartamento',
              area: initialData.area?.toString() || '',
              totalArea: initialData.area?.toString() || '',
              bedrooms: initialData.beds?.toString() || '',
              bathrooms: initialData.baths?.toString() || '',
              parking: '1', // Default se não existir no mock simples
              livingRooms: '1',
              yearBuilt: '',
              status: initialData.status || 'active',
              
              state: extractedState,
              city: extractedCity,
              street: initialData.addressDetails?.street || '',
              number: initialData.addressDetails?.number || '',
              neighborhood: initialData.addressDetails?.neighborhood || '',
              zip: initialData.addressDetails?.zip || '',
              lat: 0, // Em um app real, salvaríamos lat/lng no objeto Property
              lng: 0,
              
              amenities: initialData.amenities || ['Piscina', 'Academia'],
              newAmenity: ''
          });

          if (initialData.images && initialData.images.length > 0) {
              setImages(initialData.images);
          } else if (initialData.image) {
              setImages([initialData.image]);
          }
          
          // Na edição, assumimos que o endereço estava correto, mas forçamos re-validação se o usuário editar a rua
          setAddressConfirmed(!!initialData.addressDetails);
      }
  }, [initialData]);

  // --- 1. Fetch Estados do IBGE ao montar o componente ---
  useEffect(() => {
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
          .then(res => res.json())
          .then((data: IBGEUF[]) => setStatesList(data))
          .catch(err => console.error("Erro ao buscar estados IBGE:", err));
  }, []);

  // Populate Cities when editing if State is present
  useEffect(() => {
      if (formData.state && citiesList.length === 0) {
          setIsLoadingCities(true);
          fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
              .then(res => res.json())
              .then((data: IBGECity[]) => {
                  setCitiesList(data);
                  setIsLoadingCities(false);
              })
              .catch(err => {
                  console.error("Erro ao buscar cidades na edição:", err);
                  setIsLoadingCities(false);
              });
      }
  }, [formData.state]);

  // Calculate Progress Logic
  useEffect(() => {
    const fieldsToCheck = [
      formData.price, formData.area, formData.bedrooms, 
      formData.bathrooms, formData.street, formData.city, formData.state, formData.number
    ];
    const filledFields = fieldsToCheck.filter(f => f && f.toString().length > 0).length;
    const hasImages = images.length > 0 ? 1 : 0;
    // Bônus se o endereço estiver confirmado
    const addressScore = addressConfirmed ? 1 : 0;
    
    const totalScore = filledFields + hasImages + addressScore;
    const maxScore = fieldsToCheck.length + 1 + 1;
    
    setProgress(Math.min(100, Math.round(10 + (totalScore / maxScore) * 90)));
  }, [formData, images, addressConfirmed]);

  // Handlers
  const handleScrollTo = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- REAL Location Logic Handlers ---

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedStateSigla = e.target.value;
      setFormData(prev => ({ 
          ...prev, 
          state: selectedStateSigla, 
          city: '', 
          street: '',
          neighborhood: '',
          zip: '',
          number: ''
      }));
      setCitiesList([]);
      setAddressConfirmed(false);

      if (selectedStateSigla) {
          setIsLoadingCities(true);
          // Busca Municípios do Estado selecionado via IBGE
          fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedStateSigla}/municipios`)
              .then(res => res.json())
              .then((data: IBGECity[]) => {
                  setCitiesList(data);
                  setIsLoadingCities(false);
              })
              .catch(err => {
                  console.error("Erro ao buscar cidades:", err);
                  setIsLoadingCities(false);
              });
      }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, city: e.target.value, street: '', neighborhood: '', zip: '', number: '' }));
      setAddressConfirmed(false);
  };

  // Busca de Endereço Real via Nominatim (OpenStreetMap)
  const handleStreetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setFormData(prev => ({ ...prev, street: val }));
      setAddressConfirmed(false); // Qualquer edição invalida a confirmação anterior

      // Debounce para não chamar a API a cada tecla
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (val.length > 4 && formData.city && formData.state) {
          setIsSearchingAddress(true);
          searchTimeoutRef.current = window.setTimeout(() => {
              // Constrói a query para a API do Nominatim
              const query = `street=${encodeURIComponent(val)}&city=${encodeURIComponent(formData.city)}&state=${encodeURIComponent(formData.state)}&country=Brazil&format=json&addressdetails=1&limit=5`;
              
              fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
                  headers: {
                      'User-Agent': 'EstateFlowApp/1.0' // Boa prática para API do OSM
                  }
              })
              .then(res => res.json())
              .then((data: NominatimResult[]) => {
                  setAddressSuggestions(data);
                  setIsSearchingAddress(false);
              })
              .catch(err => {
                  console.error("Erro na busca de endereço:", err);
                  setIsSearchingAddress(false);
              });
          }, 800); // 800ms delay
      } else {
          setAddressSuggestions([]);
          setIsSearchingAddress(false);
      }
  };

  const validateAddressManually = async () => {
      if (!formData.state || !formData.city || !formData.street) {
          alert("Preencha Estado, Cidade e Logradouro para validar.");
          return;
      }
      setIsSearchingAddress(true);
      const query = `street=${encodeURIComponent(formData.street)}&city=${encodeURIComponent(formData.city)}&state=${encodeURIComponent(formData.state)}&country=Brazil&format=json&addressdetails=1&limit=1`;
      
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
              headers: { 'User-Agent': 'EstateFlowApp/1.0' }
          });
          const data = await res.json();
          if (data && data.length > 0) {
              selectAddressSuggestion(data[0]);
          } else {
              alert("Endereço não localizado com precisão. Verifique a grafia.");
              setAddressConfirmed(false);
          }
      } catch (e) {
          alert("Erro de conexão ao validar endereço.");
      } finally {
          setIsSearchingAddress(false);
      }
  };

  const selectAddressSuggestion = (item: NominatimResult) => {
      // Mapeamento dos campos retornados pelo Nominatim para nosso formulário
      const addr = item.address;
      
      const street = addr.road || formData.street; // Mantém o digitado se a API não retornar rua exata
      const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || '';
      const zip = addr.postcode || '';
      
      setFormData(prev => ({
          ...prev,
          street: street,
          neighborhood: neighborhood,
          zip: zip,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
      }));
      
      setAddressSuggestions([]);
      setAddressConfirmed(true);
      
      // Foca automaticamente no campo Número
      setTimeout(() => document.getElementById('field-number')?.focus(), 100);
  };

  // --- End Location Logic ---

  const handleTransactionChange = (type: string) => {
    setFormData(prev => ({ ...prev, transactionType: type }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, propertyType: type }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  const handleAddAmenity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.newAmenity.trim()) {
      e.preventDefault();
      toggleAmenity(formData.newAmenity.trim());
      setFormData(prev => ({ ...prev, newAmenity: '' }));
    }
  };

  // --- Funcionalidade de Upload de Imagem REAL ---
  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  setImages(prev => [...prev, reader.result as string]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    // Validação de Campos Básicos
    if (!formData.price || !formData.area) {
        alert("Por favor, preencha o Preço e a Área do imóvel.");
        handleScrollTo(essentialsRef);
        return;
    }

    // Validação Rígida de Endereço
    if (!addressConfirmed) {
        alert("Atenção: O endereço não foi validado geograficamente. Para garantir a precisão no mapa, clique em 'Validar' ao lado do endereço.");
        handleScrollTo(locationRef);
        // Tenta auto-validar para ajudar o usuário
        validateAddressManually(); 
        return;
    }

    setIsPublishing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsPublishing(false);
      
      if (onPublish) {
          // Garante que os dados sejam strings válidas
          const fullAddress = `${formData.street}, ${formData.number || 'S/N'} - ${formData.neighborhood || ''}, ${formData.city} - ${formData.state}`;
          
          const propertyPayload: Property = {
              id: initialData ? initialData.id : Date.now(),
              title: formData.title || `${formData.propertyType} em ${formData.city}`,
              price: formData.price ? `R$ ${parseFloat(formData.price).toLocaleString('pt-BR')}` : 'Sob Consulta',
              location: fullAddress, // Formatted Location
              image: images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=400&auto=format&fit=crop",
              beds: parseInt(formData.bedrooms) || 0,
              baths: parseInt(formData.bathrooms) || 0,
              area: parseInt(formData.area) || 0,
              type: formData.propertyType,
              purpose: formData.transactionType === 'aluguel' ? 'rent' : 'sale',
              ownerId: currentUser?.id || (initialData ? initialData.ownerId : 1), 
              status: formData.status as 'active' | 'sold' | 'rented' | 'draft',
              stats: initialData ? initialData.stats : { views: 0, likes: 0, leads: 0 },
              
              // Dados detalhados para o App
              amenities: formData.amenities,
              images: images,
              addressDetails: {
                  street: formData.street,
                  number: formData.number,
                  neighborhood: formData.neighborhood,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip
              }
          };
          
          console.log("Publishing property:", propertyPayload); // Debug
          onPublish(propertyPayload);
          alert(initialData ? "Imóvel atualizado com sucesso!" : "Imóvel publicado com sucesso!");
      } else {
          alert("Erro interno: Função de publicação não encontrada.");
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden">
      {/* Top Header */}
      <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 dark:border-b-element-dark px-6 py-3 bg-white dark:bg-[#111318] z-20">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[24px]">real_estate_agent</span>
          </div>
          <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">GestorImóveis</h2>
          <div className="hidden md:flex h-6 w-[1px] bg-gray-200 dark:border-element-dark mx-2"></div>
          <span className="hidden md:block text-sm text-gray-500 dark:text-[#9da6b9]">{initialData ? 'Editar Anúncio' : 'Novo Anúncio'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            <button className="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-surface-dark text-[#111318] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#323945] transition-colors border border-transparent dark:border-element-dark">
              <span className="truncate">Salvar Rascunho</span>
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
            >
              {isPublishing ? (
                 <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                 <span className="truncate">{initialData ? 'Salvar Alterações' : 'Publicar'}</span>
              )}
            </button>
          </div>
          <div className="h-8 w-[1px] bg-gray-200 dark:border-element-dark mx-1"></div>
           <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-gray-100 dark:border-element-dark cursor-pointer" style={{ backgroundImage: `url("${currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop'}")` }}></div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-none hidden lg:flex flex-col border-r border-solid border-r-gray-200 dark:border-r-element-dark bg-white dark:bg-[#111318] pt-6 pb-4 px-4 overflow-y-auto">
          <h1 className="text-[#111318] dark:text-white text-xs font-bold uppercase tracking-wider mb-6 px-3 text-gray-500 dark:text-[#9da6b9]">Passos</h1>
          <div className="flex flex-col gap-1">
            <div onClick={() => handleScrollTo(essentialsRef)} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:border-l-primary border-l-4 border-transparent cursor-pointer transition-all">
              <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">grid_view</span>
              <div className="flex flex-col">
                <p className="text-[#111318] dark:text-white text-sm font-bold group-hover:text-primary">Essenciais</p>
                <span className="text-[10px] text-gray-500 dark:text-[#9da6b9]">Tipo, Preço, Status</span>
              </div>
            </div>
            
            <div onClick={() => handleScrollTo(detailsRef)} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:border-l-primary border-l-4 border-transparent cursor-pointer transition-all">
              <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">list_alt</span>
              <div className="flex flex-col">
                <p className="text-[#111318] dark:text-white text-sm font-bold group-hover:text-primary">Detalhes</p>
                <span className="text-[10px] text-gray-500 dark:text-[#9da6b9]">Quartos, Áreas</span>
              </div>
            </div>

            <div onClick={() => handleScrollTo(mediaRef)} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:border-l-primary border-l-4 border-transparent cursor-pointer transition-all">
              <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">perm_media</span>
              <div className="flex flex-col">
                <p className="text-[#111318] dark:text-white text-sm font-bold group-hover:text-primary">Mídia</p>
                <span className="text-[10px] text-gray-500 dark:text-[#9da6b9]">Fotos, Vídeo</span>
              </div>
            </div>

            <div onClick={() => handleScrollTo(amenitiesRef)} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:border-l-primary border-l-4 border-transparent cursor-pointer transition-all">
              <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">check_circle</span>
              <div className="flex flex-col">
                <p className="text-[#111318] dark:text-white text-sm font-bold group-hover:text-primary">Características</p>
                <span className="text-[10px] text-gray-500 dark:text-[#9da6b9]">Amenidades, Tags</span>
              </div>
            </div>

            <div onClick={() => handleScrollTo(locationRef)} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:border-l-primary border-l-4 border-transparent cursor-pointer transition-all">
              <span className={`material-symbols-outlined ${addressConfirmed ? 'text-green-500' : 'text-gray-500 group-hover:text-primary'}`}>location_on</span>
              <div className="flex flex-col">
                <p className="text-[#111318] dark:text-white text-sm font-bold group-hover:text-primary">Localização</p>
                <span className={`text-[10px] ${addressConfirmed ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                    {addressConfirmed ? 'Validado' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-auto">
            <div className="p-4 bg-gray-100 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-element-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#9da6b9]">Preenchimento</span>
                <span className="text-xs font-bold text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-[#111318] rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 lg:p-10 relative scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Page Heading */}
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">{initialData ? 'edit' : 'add_circle'}</span>
                <span>{initialData ? 'Editando Imóvel' : 'Novo Cadastro'}</span>
              </div>
              <h1 className="text-[#111318] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight">{initialData ? 'Editar Imóvel' : 'Adicionar Imóvel'}</h1>
              <input 
                type="text"
                placeholder="Título do Anúncio (Ex: Linda Casa no Centro)"
                className="text-gray-500 dark:text-[#9da6b9] text-base font-normal max-w-2xl bg-transparent border-b border-gray-200 focus:border-primary focus:ring-0 px-0 w-full"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Section: Essentials */}
            <section ref={essentialsRef} className="bg-white dark:bg-surface-dark rounded-xl p-6 md:p-8 border border-gray-200 dark:border-element-dark shadow-sm scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <span className="material-symbols-outlined">sell</span>
                </div>
                <h2 className="text-xl font-bold text-[#111318] dark:text-white">Transação & Tipo</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Selector (Important for Logic) */}
                <div className="md:col-span-2 space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#9da6b9]">Status do Anúncio</label>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { val: 'active', label: 'Ativo', color: 'bg-green-100 text-green-700 border-green-200' },
                            { val: 'sold', label: 'Vendido', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                            { val: 'rented', label: 'Alugado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                            { val: 'draft', label: 'Rascunho', color: 'bg-slate-100 text-slate-700 border-slate-200' }
                        ].map(st => (
                            <label key={st.val} className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center transition-all ${formData.status === st.val ? 'border-primary ring-1 ring-primary' : 'border-slate-100 hover:border-slate-300'}`}>
                                <input 
                                    type="radio" 
                                    name="status" 
                                    value={st.val} 
                                    checked={formData.status === st.val} 
                                    onChange={handleInputChange} 
                                    className="hidden"
                                />
                                <span className={`px-2 py-1 rounded text-xs font-bold ${st.color}`}>{st.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Transaction Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#9da6b9]">Finalidade</label>
                  <div className="flex p-1 bg-gray-100 dark:bg-[#111318] rounded-lg border border-gray-200 dark:border-element-dark">
                    {['Venda', 'Aluguel', 'Temporada'].map((type) => (
                        <label key={type} className="flex-1 cursor-pointer">
                            <input 
                                type="radio" 
                                name="transactionType" 
                                value={type.toLowerCase()} 
                                className="peer sr-only" 
                                checked={formData.transactionType === type.toLowerCase()}
                                onChange={() => handleTransactionChange(type.toLowerCase())}
                            />
                            <div className="flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium text-gray-500 dark:text-[#9da6b9] transition-all peer-checked:bg-white dark:peer-checked:bg-surface-dark peer-checked:text-primary peer-checked:shadow-sm dark:peer-checked:text-white">{type}</div>
                        </label>
                    ))}
                  </div>
                </div>
                 {/* Price */}
                 <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#9da6b9]">Valor do Imóvel</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 font-bold">R$</span>
                    </div>
                    <input 
                        type="number" 
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-12 py-2.5 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm font-bold" 
                        placeholder="0,00" 
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs">BRL</span>
                    </div>
                  </div>
                </div>
                {/* Property Type Grid */}
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#9da6b9]">Categoria</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Casa', 'Apartamento', 'Comercial', 'Terreno'].map((type) => (
                         <label key={type} className="cursor-pointer group relative">
                            <input 
                                type="radio" 
                                name="propertyType" 
                                value={type} 
                                className="peer sr-only" 
                                checked={formData.propertyType === type}
                                onChange={() => handleTypeChange(type)}
                            />
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-element-dark bg-gray-50 dark:bg-[#111318] hover:border-primary dark:hover:border-primary peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary peer-checked:text-primary">
                                    {type === 'Casa' ? 'house' : type === 'Apartamento' ? 'apartment' : type === 'Comercial' ? 'storefront' : 'landscape'}
                                </span>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-[#111318] dark:group-hover:text-white peer-checked:text-[#111318] dark:peer-checked:text-white">{type}</span>
                            </div>
                         </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Specs & Details */}
            <section ref={detailsRef} className="bg-white dark:bg-surface-dark rounded-xl p-6 md:p-8 border border-gray-200 dark:border-element-dark shadow-sm scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h2 className="text-xl font-bold text-[#111318] dark:text-white">Detalhes do Imóvel</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Área Construída</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        className="block w-full pl-3 pr-8 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm" 
                        placeholder="0" 
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-500">m²</span>
                  </div>
                </div>
                 <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Área Total</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        name="totalArea"
                        value={formData.totalArea}
                        onChange={handleInputChange}
                        className="block w-full pl-3 pr-8 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm" 
                        placeholder="0" 
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-500">m²</span>
                  </div>
                </div>
                {[
                    { label: 'Salas', name: 'livingRooms', icon: 'meeting_room' },
                    { label: 'Quartos', name: 'bedrooms', icon: 'bed' },
                    { label: 'Banheiros', name: 'bathrooms', icon: 'bathtub' },
                    { label: 'Vagas', name: 'parking', icon: 'garage' }
                ].map(item => (
                    <div key={item.name} className="space-y-2">
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">{item.label}</label>
                        <div className="flex items-center relative">
                            <span className="material-symbols-outlined text-gray-400 absolute left-3 text-lg">{item.icon}</span>
                            <input 
                                type="number" 
                                name={item.name}
                                value={formData[item.name as keyof typeof formData] as string}
                                onChange={handleInputChange}
                                className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm" 
                                placeholder="0" 
                            />
                        </div>
                    </div>
                ))}
                 <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Ano Construção</label>
                  <div className="flex items-center relative">
                    <span className="material-symbols-outlined text-gray-400 absolute left-3 text-lg">calendar_today</span>
                    <input 
                        type="number" 
                        name="yearBuilt"
                        value={formData.yearBuilt}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm" 
                        placeholder="AAAA" 
                    />
                  </div>
                </div>
              </div>
            </section>

             {/* Section: Media */}
             <section ref={mediaRef} className="bg-white dark:bg-surface-dark rounded-xl p-6 md:p-8 border border-gray-200 dark:border-element-dark shadow-sm scroll-mt-24">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#111318] dark:text-white">Galeria de Mídia</h2>
                </div>
              </div>
              
              {/* Image URL Input */}
              <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                      <input 
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Cole a URL da imagem aqui..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#111318] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                      />
                  </div>
                  <button 
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
              </div>

              {/* Drag & Drop Zone (Functional now) */}
              <div 
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-300 dark:border-element-dark rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111318]/50 hover:bg-gray-100 dark:hover:bg-[#111318] transition-colors cursor-pointer group mb-6"
              >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <p className="text-lg font-bold text-[#111318] dark:text-white mb-2">Clique para enviar ou arraste e solte</p>
                <p className="text-sm text-gray-500 dark:text-[#9da6b9] text-center max-w-sm">JPG, PNG ou GIF (max. 800x400px). Imagens de alta qualidade convertem mais.</p>
              </div>
              
              {/* Thumbnails Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg bg-gray-200 dark:bg-[#111318] relative overflow-hidden group animate-in fade-in zoom-in duration-300">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }}></div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        <div 
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-md text-white cursor-pointer hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <span className="material-symbols-outlined text-sm block">close</span>
                        </div>
                         {idx === 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-center">
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Capa</span>
                            </div>
                         )}
                    </div>
                ))}
                 <div onClick={handleUploadClick} className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-element-dark flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
              </div>
            </section>
             
             {/* Section: Amenities (Tags) */}
            <section ref={amenitiesRef} className="bg-white dark:bg-surface-dark rounded-xl p-6 md:p-8 border border-gray-200 dark:border-element-dark shadow-sm scroll-mt-24">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <span className="material-symbols-outlined">stars</span>
                </div>
                <h2 className="text-xl font-bold text-[#111318] dark:text-white">Comodidades</h2>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {['Piscina', 'Academia', 'Lareira', 'Garagem', 'Terraço', 'Portaria 24h', 'Ar Condicionado', 'Elevador', 'Mobiliado'].map((amenity) => (
                         <label key={amenity} className="cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="peer sr-only" 
                                checked={formData.amenities.includes(amenity)}
                                onChange={() => toggleAmenity(amenity)}
                            />
                            <div className="px-4 py-2 rounded-full border border-gray-200 dark:border-element-dark bg-gray-50 dark:bg-[#111318] text-sm text-gray-600 dark:text-gray-300 hover:border-primary peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all select-none flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">
                                    {amenity === 'Piscina' ? 'pool' : amenity === 'Academia' ? 'fitness_center' : amenity === 'Lareira' ? 'fireplace' : amenity === 'Garagem' ? 'local_parking' : amenity === 'Terraço' ? 'deck' : amenity === 'Portaria 24h' ? 'security' : amenity === 'Ar Condicionado' ? 'ac_unit' : 'check'}
                                </span>
                                {amenity}
                            </div>
                        </label>
                    ))}
                </div>
                <div className="mt-4">
                  <input 
                    type="text" 
                    name="newAmenity"
                    value={formData.newAmenity}
                    onChange={handleInputChange}
                    onKeyDown={handleAddAmenity}
                    className="bg-transparent border-b border-gray-300 dark:border-element-dark w-full py-2 text-sm text-[#111318] dark:text-white focus:border-primary focus:ring-0 placeholder:text-gray-500" 
                    placeholder="+ Digite e pressione Enter para adicionar" 
                  />
                </div>
              </div>
            </section>

            {/* Section: Location (ENHANCED - REAL DATA API) */}
            <section ref={locationRef} className="bg-white dark:bg-surface-dark rounded-xl p-6 md:p-8 border border-gray-200 dark:border-element-dark shadow-sm scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <span className="material-symbols-outlined">map</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#111318] dark:text-white">Localização Exata</h2>
                            {addressConfirmed ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 border border-green-200">
                                    <span className="material-symbols-outlined text-[14px]">verified</span> Validado
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-200">
                                    <span className="material-symbols-outlined text-[14px]">warning</span> Pendente
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">Validação obrigatória para garantir coordenadas precisas.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* Row 1: State and City */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Estado (UF)</label>
                            <select 
                                name="state" 
                                value={formData.state} 
                                onChange={handleStateChange}
                                className="block w-full px-3 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                            >
                                <option value="">Selecione...</option>
                                {statesList.map(s => <option key={s.id} value={s.sigla}>{s.sigla} - {s.nome}</option>)}
                            </select>
                        </div>
                        
                        <div className="md:col-span-3 space-y-2 relative">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Cidade</label>
                            <select 
                                name="city" 
                                value={formData.city} 
                                onChange={handleCityChange}
                                disabled={!formData.state || isLoadingCities}
                                className="block w-full px-3 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                            >
                                <option value="">{isLoadingCities ? 'Carregando cidades...' : (formData.state ? 'Selecione a cidade...' : 'Selecione um estado primeiro')}</option>
                                {citiesList.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>
                            {isLoadingCities && (
                                <div className="absolute right-3 top-[34px]">
                                    <span className="size-4 block border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Smart Address Search (Nominatim API) */}
                    <div className="space-y-2 relative">
                        <div className="flex justify-between">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Endereço / Logradouro</label>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    name="street"
                                    value={formData.street}
                                    onChange={handleStreetInput}
                                    autoComplete="off"
                                    className={`block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 ${addressConfirmed ? 'border-green-500 ring-1 ring-green-500/20' : 'border-amber-300'}`}
                                    placeholder="Digite o nome da rua..."
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {isSearchingAddress ? (
                                        <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <span className={`material-symbols-outlined text-[20px] ${addressConfirmed ? 'text-green-500' : 'text-gray-400'}`}>search</span>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={validateAddressManually}
                                type="button"
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold border border-slate-200 transition-colors flex items-center gap-1"
                                title="Validar manualmente se não encontrar na lista"
                            >
                                Validar
                            </button>
                        </div>

                        {/* Autocomplete Dropdown */}
                        {addressSuggestions.length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-element-dark rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                {addressSuggestions.map((item, idx) => (
                                    <li 
                                        key={item.place_id}
                                        onClick={() => selectAddressSuggestion(item)}
                                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252b3b] cursor-pointer border-b border-gray-100 dark:border-slate-800 last:border-0 flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 p-1.5 bg-primary/10 rounded text-primary">
                                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.address.road || item.display_name.split(',')[0]}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.address.suburb || item.address.neighbourhood || ''} 
                                                {item.address.city || item.address.town || item.address.village} - {item.address.state}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                            {formData.city ? 'Digite o nome da rua para buscar e validar automaticamente.' : ''}
                        </p>
                    </div>

                    {/* Row 3: Number, Neighborhood, Zip */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-4 md:col-span-3 space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Número</label>
                            <input 
                                id="field-number"
                                type="text" 
                                name="number"
                                value={formData.number}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 bg-white dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-[#111318] dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="123"
                            />
                        </div>
                        <div className="col-span-8 md:col-span-5 space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">Bairro</label>
                            <input 
                                type="text" 
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 bg-gray-50 dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-gray-700 dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Bairro"
                                readOnly={addressConfirmed} // Lock if confirmed
                            />
                        </div>
                        <div className="col-span-12 md:col-span-4 space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9]">CEP</label>
                            <input 
                                type="text" 
                                name="zip"
                                value={formData.zip}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 bg-gray-50 dark:bg-[#111318] border-gray-200 dark:border-element-dark rounded-lg text-gray-700 dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="00000-000"
                                readOnly={addressConfirmed} // Lock if confirmed
                            />
                        </div>
                    </div>

                    {/* Map Preview (Context Aware) */}
                    <div className={`w-full h-48 bg-gray-200 dark:bg-[#111318] rounded-lg overflow-hidden relative group border ${addressConfirmed ? 'border-green-500/50' : 'border-gray-200'}`}>
                        {addressConfirmed && formData.lat !== 0 ? (
                            <>
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    style={{ border: 0 }}
                                    src={`https://maps.google.com/maps?q=${formData.lat},${formData.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    allowFullScreen
                                    title="Localização Confirmada"
                                ></iframe>
                                <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-green-700 shadow-sm flex items-center gap-1 pointer-events-none">
                                    <span className="material-symbols-outlined text-[14px]">check</span> Localização Confirmada
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-cover bg-center opacity-60 grayscale" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=800&auto=format&fit=crop")' }}></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md shadow-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-400">warning</span>
                                        Valide o endereço para confirmar o mapa
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

             {/* Action Bar */}
             <div className="flex justify-end pt-4">
                <button 
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                    {isPublishing ? (
                         <>
                            <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>{initialData ? 'Salvando...' : 'Publicando...'}</span>
                         </>
                    ) : (
                        <>
                            <span>{initialData ? 'Atualizar Imóvel' : 'Publicar Imóvel'}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </>
                    )}
                </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewListing;