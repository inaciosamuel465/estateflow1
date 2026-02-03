import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

// --- Mock Data ---

const revenueData = [
    { name: 'Jan', revenue: 42000, profit: 12000 },
    { name: 'Fev', revenue: 58000, profit: 18000 },
    { name: 'Mar', revenue: 52000, profit: 15000 },
    { name: 'Abr', revenue: 65000, profit: 22000 },
    { name: 'Mai', revenue: 80000, profit: 28000 },
    { name: 'Jun', revenue: 95000, profit: 34000 },
    { name: 'Jul', revenue: 88000, profit: 31000 },
];

const leadsFunnelData = [
    { name: 'Visitantes', value: 4000 },
    { name: 'Leads', value: 850 },
    { name: 'Visitas Agendadas', value: 240 },
    { name: 'Propostas', value: 80 },
    { name: 'Fechamentos', value: 25 },
];

const propertyTypeData = [
    { name: 'Apartamentos', value: 45 },
    { name: 'Casas', value: 30 },
    { name: 'Comercial', value: 15 },
    { name: 'Terrenos', value: 10 },
];

const neighborhoodData = [
    { name: 'Centro', priceSqm: 8500, demand: 90 },
    { name: 'Jardins', priceSqm: 12000, demand: 75 },
    { name: 'Vila Nova', priceSqm: 9800, demand: 85 },
    { name: 'Bela Vista', priceSqm: 7200, demand: 60 },
    { name: 'Pinheiros', priceSqm: 11500, demand: 80 },
];

const COLORS = ['#2b6cee', '#10b981', '#f59e0b', '#8b5cf6'];

const Analytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState('6m');

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-background-dark overflow-y-auto">
            <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analytics & Insights</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Visualize o desempenho do seu negócio em tempo real.</p>
                    </div>
                    <div className="flex bg-white dark:bg-[#111318] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        {['1m', '3m', '6m', '1y'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${timeRange === range
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { title: 'Receita Total', value: 'R$ 480k', change: '+12.5%', icon: 'payments', color: 'text-emerald-500' },
                        { title: 'Leads Ativos', value: '854', change: '+24.0%', icon: 'group', color: 'text-blue-500' },
                        { title: 'Taxa de Conversão', value: '2.8%', change: '-0.5%', icon: 'percent', color: 'text-amber-500' },
                        { title: 'Tempo Médio Venda', value: '45 dias', change: '-10%', icon: 'timer', color: 'text-purple-500' }
                    ].map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${kpi.color} bg-opacity-10 dark:bg-opacity-20 bg-current`}>
                                    <span className={`material-symbols-outlined text-2xl ${kpi.color}`}>{kpi.icon}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {kpi.change}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{kpi.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Revenue Chart */}
                    <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Evolução Financeira</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2b6cee" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#2b6cee" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#2b6cee" fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="profit" name="Lucro Líquido" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                                    <Legend />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Funnel Chart (Composite) */}
                    <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Funil de Conversão</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leadsFunnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" stroke="#94a3b8" hide />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#2b6cee" radius={[0, 4, 4, 0]} barSize={20}>
                                        {leadsFunnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : index === 4 ? '#10b981' : '#2b6cee'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Type Distribution */}
                    <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Distribuição de Portfólio</h3>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={propertyTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {propertyTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Neighborhood Performance */}
                    <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Bairros (Valor m²)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={neighborhoodData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Preço m²']}
                                    />
                                    <Bar dataKey="priceSqm" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Analytics;
