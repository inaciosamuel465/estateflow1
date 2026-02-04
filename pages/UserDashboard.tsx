import React, { useState } from 'react';
import { User, Property } from '../src/types';

interface UserDashboardProps {
    user: User;
    onBack: () => void;
    properties: Property[];
    onPropertySelect: (id: number | string) => void;
    onLogout: () => void;
    onEditProfile?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, properties, onPropertySelect, onLogout, onEditProfile }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'listings'>('profile');

    // Filtrar imóveis do proprietário (se for owner)
    const myListings = properties.filter(p => p.ownerId === user.id);

    const myFavorites = properties.filter(p => user.favorites?.includes(String(p.id)));

    return (
        <div className="min-h-screen bg-slate-50 font-display">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span className="hidden sm:inline font-medium">Voltar para Home</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user.role === 'owner' ? 'Anunciante' : 'Cliente'}</p>
                        </div>
                        <div className="size-10 rounded-full bg-slate-200 bg-cover bg-center border border-slate-300" style={{ backgroundImage: `url("${user.avatar}")` }}></div>
                        <button onClick={onLogout} className="ml-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="Sair">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    {/* Sidebar Navigation (Desktop) & Mobile Header */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
                            <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-0 mb-6 lg:mb-6">
                                <div className="size-16 lg:size-24 rounded-full bg-slate-200 bg-cover bg-center border-2 lg:border-4 border-slate-50 lg:mb-3 shrink-0" style={{ backgroundImage: `url("${user.avatar}")` }}></div>
                                <div className="flex flex-col items-start lg:items-center">
                                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{user.name}</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-1 lg:mt-2 ${user.role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {user.role === 'owner' ? 'Proprietário' : 'Cliente VIP'}
                                    </span>
                                </div>
                            </div>

                            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="material-symbols-outlined">person</span> <span className="hidden sm:inline">Meu Perfil</span><span className="sm:hidden">Perfil</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('favorites')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'favorites' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="material-symbols-outlined">favorite</span> Favoritos
                                </button>

                                {/* Apenas para Proprietários */}
                                {user.role === 'owner' && (
                                    <button
                                        onClick={() => setActiveTab('listings')}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'listings' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="material-symbols-outlined">real_estate_agent</span> Imóveis
                                    </button>
                                )}

                                <button
                                    onClick={onLogout}
                                    className="flex items-center lg:mt-4 gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined">logout</span> Sair
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900">Dados Pessoais</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                                            <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-medium border border-slate-200">{user.name}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                            <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-medium border border-slate-200">{user.email}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                            <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-medium border border-slate-200">{user.phone || 'Não informado'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Conta</label>
                                            <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-medium border border-slate-200 capitalize">{user.role}</div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button
                                            onClick={onEditProfile}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                                        >
                                            Editar Perfil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-900">Meus Favoritos ({myFavorites.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {myFavorites.map(property => (
                                        <div key={property.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                                            <div className="h-48 bg-cover bg-center cursor-pointer" onClick={() => onPropertySelect(property.id)} style={{ backgroundImage: `url("${property.image}")` }}></div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-slate-900 truncate">{property.title}</h4>
                                                <p className="text-primary font-bold">{property.price}</p>
                                                <div className="mt-4 flex gap-2">
                                                    <button onClick={() => onPropertySelect(property.id)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition-colors">Ver Detalhes</button>
                                                    <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remover"><span className="material-symbols-outlined">delete</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'listings' && user.role === 'owner' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-900">Meus Anúncios ({myListings.length})</h3>
                                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                                        <span className="material-symbols-outlined">add</span> Novo Anúncio
                                    </button>
                                </div>

                                {myListings.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">home_work</span>
                                        <p className="text-slate-500 font-medium">Você ainda não tem imóveis anunciados.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {myListings.map(property => (
                                            <div key={property.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                                                <div className="w-full md:w-64 h-48 md:h-auto bg-cover bg-center cursor-pointer" onClick={() => onPropertySelect(property.id)} style={{ backgroundImage: `url("${property.image}")` }}></div>
                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-lg text-slate-900 cursor-pointer hover:text-primary" onClick={() => onPropertySelect(property.id)}>{property.title}</h4>
                                                                <p className="text-slate-500 text-sm">{property.location}</p>
                                                            </div>
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wide border border-green-200">Ativo</span>
                                                        </div>

                                                        {/* Stats do Proprietário (Read Only) */}
                                                        <div className="flex gap-6 mt-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-slate-400 font-bold uppercase">Visualizações</span>
                                                                <span className="text-xl font-bold text-slate-900">{property.stats?.views || 0}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-slate-400 font-bold uppercase">Favoritos</span>
                                                                <span className="text-xl font-bold text-slate-900">{property.stats?.likes || 0}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-slate-400 font-bold uppercase">Interessados</span>
                                                                <span className="text-xl font-bold text-slate-900 text-primary">{property.stats?.leads || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                                                        <button onClick={() => onPropertySelect(property.id)} className="text-sm font-bold text-primary hover:underline">Ver Anúncio</button>
                                                        <button className="text-sm font-bold text-slate-500 hover:text-slate-800">Editar</button>
                                                        <button className="text-sm font-bold text-rose-500 hover:text-rose-700 ml-auto">Pausar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main >
        </div >
    );
};

export default UserDashboard;