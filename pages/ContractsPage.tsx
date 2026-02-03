import React, { useState, useMemo, useRef } from 'react';
import { Contract, Property, User } from '../App';

// --- Dados da Imobiliária (Fixo para o Cabeçalho) ---
const AGENCY_INFO = {
    name: "EstateFlow Negócios Imobiliários Ltda.",
    cnpj: "12.345.678/0001-90",
    creci: "J-12345",
    address: "Av. Paulista, 1000, 15º Andar - Jardins, São Paulo - SP",
    phone: "(11) 3000-0000",
    email: "juridico@estateflow.com",
    logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop"
};

// --- Templates Jurídicos Detalhados ---
const CONTRACT_TEMPLATES = {
    rent_residential: {
        id: 'rent_residential',
        title: 'Locação Residencial (Administração)',
        desc: 'Contrato completo entre Locador (via Imobiliária) e Locatário.',
        content: `CLÁUSULA PRIMEIRA - DAS PARTES:
De um lado, devidamente qualificado no sistema, doravante denominado LOCADOR, neste ato representado por sua administradora {{AGENCY_NAME}}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº {{AGENCY_CNPJ}}, com sede em {{AGENCY_ADDRESS}}, CRECI {{AGENCY_CRECI}}.
De outro lado, {{CLIENT_NAME}}, portador(a) do CPF/CNPJ nº {{CLIENT_DOC}}, doravante denominado LOCATÁRIO.

CLÁUSULA SEGUNDA - DO OBJETO:
O presente contrato tem como objeto a locação do imóvel residencial situado à {{PROPERTY_ADDR}}, de propriedade do LOCADOR, para fins exclusivamente residenciais.

CLÁUSULA TERCEIRA - DO PRAZO:
A locação terá vigência de 30 (trinta) meses, iniciando-se em {{START_DATE}} e terminando em {{END_DATE}}, data em que o LOCATÁRIO se obriga a restituir o imóvel inteiramente livre e desocupado, nas mesmas condições de habitabilidade em que o recebeu.

CLÁUSULA QUARTA - DO VALOR E PAGAMENTO:
O aluguel mensal livremente convencionado é de R$ {{VALUE}} ({{VALUE_EXTENSO}}), devendo ser pago até o dia {{DUE_DAY}} de cada mês subsequente ao vencido, diretamente à ADMINISTRADORA ou através de boleto bancário por ela emitido.
Parágrafo Primeiro: O aluguel será reajustado anualmente pelo índice IGPM-FGV ou outro que venha a substituí-lo.

CLÁUSULA QUINTA - DOS ENCARGOS:
Além do aluguel, o LOCATÁRIO pagará todos os impostos e taxas que recaiam ou venham a recair sobre o imóvel, seguro contra incêndio, despesas de condomínio, consumo de água, luz, gás e esgoto.

CLÁUSULA SEXTA - DA CONSERVAÇÃO:
O LOCATÁRIO declara ter vistoriado o imóvel, recebendo-o em perfeito estado de conservação e limpeza, obrigando-se a mantê-lo e restituí-lo nas mesmas condições (salvo deterioração decorrente do uso normal), conforme Laudo de Vistoria anexo.

CLÁUSULA SÉTIMA - DA MULTA:
Fica estipulada a multa contratual equivalente a 03 (três) aluguéis vigentes à época da infração, a ser aplicada à parte que infringir qualquer cláusula deste contrato, cobrada proporcionalmente ao tempo restante do contrato.

CLÁUSULA OITAVA - DO FORO:
As partes elegem o foro da Comarca de {{PROPERTY_CITY}} para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.`
    },
    sale_cash: {
        id: 'sale_cash',
        title: 'Compromisso de Compra e Venda',
        desc: 'Instrumento particular com intermediação da Imobiliária.',
        content: `CLÁUSULA PRIMEIRA - VENDEDOR(ES):
{{OWNER_NAME}}, inscrito no CPF/CNPJ sob nº {{OWNER_DOC}}, legítimo proprietário do imóvel objeto deste instrumento.

CLÁUSULA SEGUNDA - COMPRADOR(ES):
{{CLIENT_NAME}}, inscrito no CPF/CNPJ sob nº {{CLIENT_DOC}}.

CLÁUSULA TERCEIRA - DA INTERMEDIAÇÃO:
O presente negócio é realizado com a intermediação exclusiva da {{AGENCY_NAME}}, CRECI {{AGENCY_CRECI}}, que aproximou as partes e prestou a devida assessoria imobiliária.

CLÁUSULA QUARTA - DO IMÓVEL:
O objeto deste contrato é a venda do imóvel localizado à {{PROPERTY_ADDR}}, livre e desembaraçado de quaisquer ônus reais, judiciais ou extrajudiciais.

CLÁUSULA QUINTA - DO PREÇO E CONDIÇÕES:
O preço certo e ajustado para a venda é de R$ {{VALUE}} ({{VALUE_EXTENSO}}), a ser pago da seguinte forma:
a) Pagamento integral à vista na data da assinatura deste contrato, ou
b) Conforme cronograma de parcelamento anexo, se houver.

CLÁUSULA SEXTA - DA POSSE E ESCRITURA:
A posse do imóvel será transmitida ao COMPRADOR na data da quitação integral do preço. A Escritura Definitiva será outorgada em Cartório de Notas escolhido pelo COMPRADOR, correndo por conta deste todas as despesas de transmissão (ITBI, emolumentos e registros).

CLÁUSULA SÉTIMA - DA IRREVOGABILIDADE:
O presente instrumento é celebrado em caráter irrevogável e irretratável, obrigando as partes, seus herdeiros e sucessores.

CLÁUSULA OITAVA - DA COMISSÃO:
O VENDEDOR reconhece ser devida à INTERMEDIADORA a comissão de corretagem pactuada, a ser paga no ato do recebimento do sinal ou valor à vista.`
    },
    admin_service: {
        id: 'admin_service',
        title: 'Contrato de Administração (Proprietário)',
        desc: 'Contrato entre Proprietário e Imobiliária.',
        content: `CLÁUSULA PRIMEIRA - DAS PARTES:
CONTRATANTE (PROPRIETÁRIO): {{OWNER_NAME}}, CPF/CNPJ {{OWNER_DOC}}.
CONTRATADA (ADMINISTRADORA): {{AGENCY_NAME}}, CNPJ {{AGENCY_CNPJ}}, CRECI {{AGENCY_CRECI}}.

CLÁUSULA SEGUNDA - DO OBJETO:
O CONTRATANTE entrega à CONTRATADA, para fins de administração e locação, o imóvel de sua propriedade situado à {{PROPERTY_ADDR}}.

CLÁUSULA TERCEIRA - DOS SERVIÇOS:
A CONTRATADA compromete-se a:
a) Promover a divulgação do imóvel em seus canais de marketing;
b) Selecionar pretendentes à locação, exigindo garantias compatíveis;
c) Elaborar contratos de locação e laudos de vistoria;
d) Cobrar e receber aluguéis, repassando ao CONTRATANTE após dedução das taxas pactuadas.

CLÁUSULA QUARTA - DA TAXA DE ADMINISTRAÇÃO:
Pelos serviços prestados, a CONTRATADA fará jus a:
a) Uma taxa de intermediação no valor do primeiro aluguel integral;
b) Uma taxa de administração mensal de {{COMMISSION_RATE}}% sobre o valor do aluguel e encargos recebidos.

CLÁUSULA QUINTA - DA VIGÊNCIA:
O presente contrato vigorará pelo prazo de 12 (doze) meses, renovando-se automaticamente por iguais períodos, salvo manifestação em contrário por escrito com 30 dias de antecedência.

CLÁUSULA SEXTA - DA EXCLUSIVIDADE:
O CONTRATANTE concede à CONTRATADA exclusividade na promoção do imóvel pelo prazo de 90 dias a contar da assinatura deste.`
    }
};

interface ContractsPageProps {
    contracts: Contract[];
    properties: Property[];
    users: User[];
    onAddContract: (c: Contract) => void;
    onDeleteContract: (id: number | string) => void;
    onUpdateContract: (id: number | string, data: Partial<Contract>) => void;
}

const ContractsPage: React.FC<ContractsPageProps> = ({ contracts, properties, users, onAddContract, onDeleteContract, onUpdateContract }) => {
    // --- States ---
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
    const [filter, setFilter] = useState<'all' | 'expiring' | 'rent' | 'sale'>('all');

    // Create Mode States
    const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof CONTRACT_TEMPLATES>('rent_residential');
    const [formData, setFormData] = useState({
        propertyId: '',
        clientId: '',
        ownerId: '',
        value: '',
        startDate: '',
        endDate: '',
        dueDay: '5',
        commissionRate: '10'
    });

    // View Mode States
    const [viewingContract, setViewingContract] = useState<Contract | null>(null);
    const [generatedBody, setGeneratedBody] = useState(''); // Apenas o corpo do texto
    const [isEditingText, setIsEditingText] = useState(false);
    const [currentText, setCurrentText] = useState('');

    // --- Helpers ---

    const calculateDaysLeft = (dateString?: string) => {
        if (!dateString) return 999;
        const end = new Date(dateString);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Filter Logic
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            if (filter === 'all') return true;
            if (filter === 'rent') return c.type === 'rent';
            if (filter === 'sale') return c.type === 'sale';
            if (filter === 'expiring') {
                const days = calculateDaysLeft(c.endDate);
                return days <= 30 && days >= 0;
            }
            return true;
        });
    }, [contracts, filter]);

    const expiringCount = contracts.filter(c => {
        const days = calculateDaysLeft(c.endDate);
        return days <= 30 && days >= 0;
    }).length;

    // --- Actions ---

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const prop = properties.find(p => p.id.toString() === formData.propertyId);
        const cli = users.find(u => u.id.toString() === formData.clientId);
        const own = users.find(u => u.id.toString() === formData.ownerId);

        if (!prop || !cli || !own) {
            alert("Dados inválidos. Verifique as seleções.");
            return;
        }

        const newContract: Contract = {
            id: Date.now(),
            propertyId: prop.id,
            propertyTitle: prop.title,
            propertyImage: prop.image,
            type: selectedTemplate === 'sale_cash' ? 'sale' : 'rent',
            status: 'active',
            clientId: cli.id,
            clientName: cli.name,
            clientPhone: cli.phone || '',
            ownerId: own.id,
            ownerName: own.name,
            ownerPhone: own.phone || '',
            value: parseFloat(formData.value),
            commissionRate: parseFloat(formData.commissionRate),
            dueDay: parseInt(formData.dueDay),
            startDate: formData.startDate,
            endDate: formData.endDate,
            nextPaymentStatus: 'pending',
            templateType: selectedTemplate,
            signatureStatus: 'pending'
        };

        onAddContract(newContract);
        setViewMode('list');
        setFormData({ propertyId: '', clientId: '', ownerId: '', value: '', startDate: '', endDate: '', dueDay: '5', commissionRate: '10' });
    };

    const handleDelete = (id: number | string) => {
        if (confirm("Tem certeza que deseja excluir este contrato? Esta ação é irreversível.")) {
            onDeleteContract(id);
        }
    };

    const generateDocumentBody = (contract: Contract) => {
        const template = CONTRACT_TEMPLATES[contract.templateType || 'rent_residential'];
        if (!template) return "Template não encontrado.";

        const owner = users.find(u => u.id === contract.ownerId);
        const client = users.find(u => u.id === contract.clientId);
        const property = properties.find(p => p.id === contract.propertyId);

        let text = template.content;

        const replacements: Record<string, string> = {
            '{{AGENCY_NAME}}': AGENCY_INFO.name,
            '{{AGENCY_CNPJ}}': AGENCY_INFO.cnpj,
            '{{AGENCY_CRECI}}': AGENCY_INFO.creci,
            '{{AGENCY_ADDRESS}}': AGENCY_INFO.address,

            '{{OWNER_NAME}}': contract.ownerName.toUpperCase(),
            '{{OWNER_DOC}}': owner?.document || '000.000.000-00',

            '{{CLIENT_NAME}}': contract.clientName.toUpperCase(),
            '{{CLIENT_DOC}}': client?.document || '000.000.000-00',
            '{{CLIENT_ADDR}}': client?.address || 'Endereço não informado',

            '{{PROPERTY_ADDR}}': property ? `${property.location} - ${property.title}` : 'Endereço do Imóvel',
            '{{PROPERTY_CITY}}': property?.location.split(',')[1]?.trim() || 'São Paulo',

            '{{VALUE}}': contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            '{{VALUE_EXTENSO}}': 'Valor por extenso', // Em app real usaria biblioteca para extenso

            '{{START_DATE}}': new Date(contract.startDate).toLocaleDateString('pt-BR'),
            '{{END_DATE}}': contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : 'Indeterminado',
            '{{DUE_DAY}}': contract.dueDay.toString(),
            '{{COMMISSION_RATE}}': contract.commissionRate.toString(),
            '{{DAYS_COUNT}}': contract.endDate ? Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24)).toString() : '0'
        };

        Object.keys(replacements).forEach(key => {
            text = text.replace(new RegExp(key, 'g'), replacements[key]);
        });

        return text;
    };

    const handleViewContract = (contract: Contract) => {
        setViewingContract(contract);
        const bodyText = generateDocumentBody(contract);
        setGeneratedBody(bodyText);
        setCurrentText(bodyText);
        setIsEditingText(false);
        setViewMode('view');
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    const handleSaveEdit = () => {
        setGeneratedBody(currentText);
        setIsEditingText(false);
    };

    const handleFinalize = () => {
        if (!viewingContract) return;
        if (confirm("Deseja finalizar este contrato e marcá-lo como ASSINADO?")) {
            onUpdateContract(viewingContract.id, {
                signatureStatus: 'signed',
                status: 'active'
            });
            setViewingContract({ ...viewingContract, signatureStatus: 'signed', status: 'active' });
            alert("Contrato finalizado e assinado com sucesso!");
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display h-full flex flex-col overflow-hidden relative">

            {/* Header */}
            <header className="flex-none bg-surface-light dark:bg-[#111318] border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">gavel</span> Gestão Jurídica
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Emissão e controle de contratos oficiais.</p>
                    </div>
                    <div className="flex gap-3">
                        {viewMode === 'list' ? (
                            <button
                                onClick={() => setViewMode('create')}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span> Novo Contrato
                            </button>
                        ) : (
                            <button
                                onClick={() => setViewMode('list')}
                                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span> Voltar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-black/20">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8 h-full">

                    {/* VIEW: LIST MODE */}
                    {viewMode === 'list' && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* ... Stats Cards (Mantidos iguais) ... */}
                                <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Contratos Ativos</p>
                                        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{contracts.filter(c => c.status === 'active').length}</p>
                                    </div>
                                    <div className="size-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined">folder_shared</span>
                                    </div>
                                </div>
                                <div className={`bg-white dark:bg-[#1a1d23] p-5 rounded-xl border shadow-sm flex items-center justify-between ${expiringCount > 0 ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Renovação Pendente</p>
                                        <p className={`text-2xl font-bold mt-1 ${expiringCount > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{expiringCount}</p>
                                        {expiringCount > 0 && <p className="text-[10px] text-amber-600 font-bold">Vencendo em 30 dias</p>}
                                    </div>
                                    <div className={`size-10 rounded-lg flex items-center justify-center ${expiringCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                        <span className="material-symbols-outlined">alarm</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Pendentes Assinatura</p>
                                        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{contracts.filter(c => c.signatureStatus === 'pending').length}</p>
                                    </div>
                                    <div className="size-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined">ink_pen</span>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 bg-transparent">
                                {[
                                    { id: 'all', label: 'Todos' },
                                    { id: 'rent', label: 'Locação' },
                                    { id: 'sale', label: 'Venda' },
                                    { id: 'expiring', label: 'Expirando', icon: 'warning', color: 'text-amber-600' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id as any)}
                                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${filter === f.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t-lg'
                                            }`}
                                    >
                                        {f.icon && <span className={`material-symbols-outlined text-[16px] ${f.color}`}>{f.icon}</span>}
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
                                {filteredContracts.map(contract => {
                                    const daysLeft = calculateDaysLeft(contract.endDate);
                                    const isExpiring = daysLeft <= 30 && daysLeft >= 0;

                                    return (
                                        <div key={contract.id} className="bg-white dark:bg-[#1a1d23] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/50 transition-all">
                                            {isExpiring && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">VENCE EM {daysLeft} DIAS</div>}

                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700">
                                                        <span className="material-symbols-outlined text-[24px]">gavel</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight text-lg">{contract.propertyTitle}</h3>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {CONTRACT_TEMPLATES[contract.templateType || 'rent_residential']?.title || 'Contrato'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${contract.signatureStatus === 'signed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {contract.signatureStatus === 'signed' ? 'Assinado' : 'Pendente'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cliente</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{contract.clientName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Proprietário</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{contract.ownerName}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-auto pt-2">
                                                <button
                                                    onClick={() => handleViewContract(contract)}
                                                    className="flex-1 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-black/5 active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">print</span> Visualizar Documento
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(contract.id)}
                                                    className="px-3 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Excluir Contrato"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* VIEW: CREATE MODE */}
                    {viewMode === 'create' && (
                        <div className="bg-white dark:bg-[#1a1d23] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto w-full">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1d23] flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">post_add</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gerador de Contrato</h2>
                                    <p className="text-sm text-slate-500">Selecione o modelo jurídico adequado.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="p-8 space-y-8">
                                {/* Step 1: Template */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">1. Tipo de Contrato</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.values(CONTRACT_TEMPLATES).map(tmpl => (
                                            <div
                                                key={tmpl.id}
                                                onClick={() => setSelectedTemplate(tmpl.id as any)}
                                                className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col gap-3 ${selectedTemplate === tmpl.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                                            >
                                                <div className={`size-8 rounded-full flex items-center justify-center ${selectedTemplate === tmpl.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    <span className="material-symbols-outlined text-[18px]">description</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{tmpl.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-slate-800" />

                                {/* Step 2: Data */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">2. Dados das Partes</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Imóvel</label>
                                            <select
                                                required
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                value={formData.propertyId}
                                                onChange={e => {
                                                    const prop = properties.find(p => p.id.toString() === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        propertyId: e.target.value,
                                                        ownerId: prop?.ownerId?.toString() || ''
                                                    })
                                                }}
                                            >
                                                <option value="">Selecione o Imóvel...</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id}>{p.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Proprietário (Locador)</label>
                                            <select
                                                required
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                value={formData.ownerId}
                                                onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                {users.filter(u => u.role === 'owner' || u.role === 'admin').map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Cliente (Locatário/Comprador)</label>
                                            <select
                                                required
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                value={formData.clientId}
                                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                {users.filter(u => u.role === 'client').map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                placeholder="0.00"
                                                value={formData.value}
                                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Início</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Fim (Opcional)</label>
                                            <input
                                                type="date"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111318] h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setViewMode('list')} className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-white">Cancelar</button>
                                    <button type="submit" className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">save</span> Gerar Documento
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* VIEW: PREVIEW DOCUMENT (A4 SIMULATION) */}
                    {viewMode === 'view' && viewingContract && (
                        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
                            {/* Document Preview (A4 Simulado) - Scrollable */}
                            <div className="flex-1 rounded-2xl p-4 lg:p-8 overflow-y-auto flex justify-center bg-slate-200/50 dark:bg-black/20 custom-scrollbar">

                                {/* A4 Container Logic */}
                                <div id="printable-area" className="flex flex-col gap-8 print:block">
                                    {isEditingText ? (
                                        // MODO EDIÇÃO: Página Única Expansível
                                        <div className="bg-white text-black w-[210mm] min-h-[297mm] shadow-2xl relative mx-auto flex flex-col print:shadow-none">
                                            <div className="h-[40mm] px-[20mm] flex items-center border-b-2 border-slate-800 mt-[15mm]">
                                                <img src={AGENCY_INFO.logo} className="h-[25mm] object-contain mr-6" alt="Logo" />
                                                <div className="flex-1 text-right">
                                                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{AGENCY_INFO.name}</h2>
                                                    <p className="text-xs text-slate-600 mt-1">CNPJ: {AGENCY_INFO.cnpj} | CRECI: {AGENCY_INFO.creci}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 px-[25mm] py-[15mm]">
                                                <textarea
                                                    className="w-full h-full min-h-[500px] p-2 text-justify text-[11pt] leading-relaxed font-serif whitespace-pre-wrap bg-yellow-50 focus:outline-none resize-none border border-dashed border-slate-300"
                                                    value={currentText}
                                                    onChange={(e) => setCurrentText(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        // MODO VISUALIZAÇÃO: Paginação Automática
                                        (() => {
                                            // Lógica de Paginação Refinada
                                            // Reduzimos drasticamente os limites para evitar estouro visual
                                            const CHARS_PER_PAGE = 2100; // Limite seguro para página cheia
                                            const CHARS_FIRST_PAGE = 1450; // Limite reduzido devido ao cabeçalho grande

                                            const paragraphs = currentText.split('\n');
                                            const pages: string[] = [];
                                            let currentPageContent = '';
                                            let currentCount = 0;

                                            paragraphs.forEach((para) => {
                                                // Custo estimado: tamanho do texto + 'peso' para quebras de linha/espaçamento
                                                // Parágrafos curtos ocupam espaço vertical desproporcional ao nº de caracteres
                                                const paraCost = para.length + (para.length < 50 ? 50 : 10);

                                                const limit = pages.length === 0 ? CHARS_FIRST_PAGE : CHARS_PER_PAGE;

                                                if (currentCount + paraCost > limit && currentPageContent.length > 0) {
                                                    pages.push(currentPageContent);
                                                    currentPageContent = para + '\n';
                                                    currentCount = paraCost;
                                                } else {
                                                    currentPageContent += para + '\n';
                                                    currentCount += paraCost;
                                                }
                                            });
                                            if (currentPageContent) pages.push(currentPageContent);

                                            return pages.map((pageContent, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white text-black w-[210mm] h-[297mm] shadow-2xl relative mx-auto flex flex-col break-after-page print:break-after-page print:shadow-none print:mb-0 mb-8 last:mb-0 overflow-hidden"
                                                >

                                                    {/* Header apenas na primeira página */}
                                                    {idx === 0 ? (
                                                        <div className="h-[40mm] px-[20mm] flex items-center border-b-2 border-slate-800 mt-[15mm] shrink-0">
                                                            <img src={AGENCY_INFO.logo} className="h-[25mm] object-contain mr-6" alt="Logo" />
                                                            <div className="flex-1 text-right">
                                                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{AGENCY_INFO.name}</h2>
                                                                <p className="text-xs text-slate-600 mt-1">CNPJ: {AGENCY_INFO.cnpj} | CRECI: {AGENCY_INFO.creci}</p>
                                                                <p className="text-xs text-slate-600">{AGENCY_INFO.address}</p>
                                                                <p className="text-xs text-slate-600">{AGENCY_INFO.email} | {AGENCY_INFO.phone}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Margem superior para páginas seguintes
                                                        <div className="h-[25mm] w-full shrink-0"></div>
                                                    )}

                                                    <div className="flex-1 px-[25mm] py-[10mm] flex flex-col min-h-0">
                                                        {idx === 0 && (
                                                            <h1 className="text-center font-bold text-lg uppercase mb-8 border-b border-slate-300 pb-2 shrink-0">
                                                                {CONTRACT_TEMPLATES[viewingContract.templateType || 'rent_residential']?.title}
                                                            </h1>
                                                        )}

                                                        <div className="text-justify text-[11pt] leading-relaxed font-serif whitespace-pre-wrap">
                                                            {pageContent}
                                                        </div>

                                                        {/* Se for a última página, adiciona data e assinaturas */}
                                                        {idx === pages.length - 1 && (
                                                            <div className="mt-auto pt-10 pb-10">
                                                                <p className="text-right mb-12">
                                                                    São Paulo, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                                                                </p>

                                                                {/* Assinaturas */}
                                                                <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                                                                    <div className="text-center">
                                                                        <div className="border-t border-black w-full mb-2"></div>
                                                                        <p className="font-bold text-xs uppercase">{AGENCY_INFO.name}</p>
                                                                        <p className="text-[10px]">Administradora</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="border-t border-black w-full mb-2"></div>
                                                                        <p className="font-bold text-xs uppercase">{viewingContract.clientName}</p>
                                                                        <p className="text-[10px]">Locatário/Comprador</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="border-t border-black w-full mb-2"></div>
                                                                        <p className="font-bold text-xs uppercase">Testemunha 1</p>
                                                                        <p className="text-[10px]">CPF:</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="border-t border-black w-full mb-2"></div>
                                                                        <p className="font-bold text-xs uppercase">Testemunha 2</p>
                                                                        <p className="text-[10px]">CPF:</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer com paginação */}
                                                    <div className="px-[25mm] pb-[10mm] text-center text-[10px] text-slate-400 mt-auto shrink-0">
                                                        Página {idx + 1} de {pages.length}
                                                    </div>

                                                    {/* Marca D'água */}
                                                    {viewingContract.signatureStatus !== 'signed' && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-45">
                                                            <span className="text-[120px] font-black text-slate-400 uppercase border-8 border-slate-400 p-10 rounded-xl">Rascunho</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ));
                                        })()
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Actions */}
                            <div className="w-full lg:w-80 flex flex-col gap-4">
                                <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0">
                                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Ações do Documento</h3>
                                    <div className="flex flex-col gap-3">
                                        {isEditingText ? (
                                            <>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">save</span> Salvar Texto
                                                </button>
                                                <button
                                                    onClick={() => { setIsEditingText(false); setCurrentText(generatedBody); }}
                                                    className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                                                >
                                                    Cancelar Edição
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handlePrint}
                                                    className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined">print</span> Imprimir / PDF
                                                </button>

                                                {viewingContract.signatureStatus !== 'signed' && (
                                                    <button
                                                        onClick={handleFinalize}
                                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined">verified</span> Finalizar e Assinar
                                                    </button>
                                                )}

                                                <button
                                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                                    onClick={() => alert("Simulação: Link enviado para assinatura digital (DocuSign/ClickSign).")}
                                                >
                                                    <span className="material-symbols-outlined">send</span> Enviar p/ Assinatura
                                                </button>

                                                <button
                                                    onClick={() => setIsEditingText(true)}
                                                    className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                                                >
                                                    <span className="material-symbols-outlined">edit_note</span> Editar Cláusulas
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold mb-2 text-sm">
                                        <span className="material-symbols-outlined text-[18px]">verified_user</span> Validade Jurídica
                                    </div>
                                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                        Este documento segue o padrão da Lei do Inquilinato (8.245/91). A Imobiliária atua como administradora legal do imóvel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default ContractsPage;