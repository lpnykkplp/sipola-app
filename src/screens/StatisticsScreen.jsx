import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, ShieldCheck, Activity, CalendarDays } from 'lucide-react';
import Header from '../components/Header';

const COLORS_STATUS = {
    Aman: '#22c55e',
    Rawan: '#eab308',
    Waspada: '#f97316',
    Bahaya: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="text-slate-400 font-bold mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-bold">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

const StatisticsScreen = ({ setCurrentScreen, apelHistory, scanHistory, activityLog }) => {
    const [days, setDays] = useState(7);

    // Generate last N days
    const dateRange = useMemo(() => {
        const arr = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            arr.push(d.toISOString().split('T')[0]);
        }
        return arr;
    }, [days]);

    const shortLabel = (iso) => {
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    // --- 1. WBP Trend (Area Chart) ---
    const wbpData = useMemo(() => {
        return dateRange.map(date => {
            const dayApels = apelHistory.filter(a => a.dateISO === date);
            const pagi = dayApels.find(a => a.shift === 'Pagi')?.total || 0;
            const siang = dayApels.find(a => a.shift === 'Siang')?.total || 0;
            const malam = dayApels.find(a => a.shift === 'Malam')?.total || 0;
            return { date: shortLabel(date), Pagi: pagi, Siang: siang, Malam: malam, Total: pagi + siang + malam };
        });
    }, [dateRange, apelHistory]);

    // --- 2. Patrol Status (Pie Chart) ---
    const statusData = useMemo(() => {
        const counts = { Aman: 0, Rawan: 0, Waspada: 0, Bahaya: 0 };
        scanHistory.forEach(s => {
            if (counts[s.status] !== undefined) counts[s.status]++;
        });
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value }));
    }, [scanHistory]);

    const totalScans = statusData.reduce((a, b) => a + b.value, 0);

    // --- 3. Activity Frequency (Bar Chart) ---
    const activityData = useMemo(() => {
        return dateRange.map(date => {
            const count = activityLog.filter(a => a.dateISO === date).length;
            return { date: shortLabel(date), Kegiatan: count };
        });
    }, [dateRange, activityLog]);

    // Summary stats
    const avgWbp = useMemo(() => {
        const totals = wbpData.map(d => d.Total).filter(t => t > 0);
        return totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
    }, [wbpData]);

    const totalActivities = activityLog.length;

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pb-4 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Statistik" subtitle="Analisis Data" onBack={() => setCurrentScreen('home')} />
                {/* Period selector */}
                <div className="flex bg-[#0d1420] p-1 rounded-2xl border border-[#2a3a4a]">
                    {[7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${days === d
                                ? 'bg-[#1a2332] text-teal-400 border border-teal-500/30'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {d} Hari
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-2xl p-4 text-center">
                        <TrendingUp size={18} className="text-teal-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-slate-100">{avgWbp}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Avg WBP/Hari</p>
                    </div>
                    <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-2xl p-4 text-center">
                        <ShieldCheck size={18} className="text-cyan-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-slate-100">{totalScans}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Patroli</p>
                    </div>
                    <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-2xl p-4 text-center">
                        <Activity size={18} className="text-purple-400 mx-auto mb-1" />
                        <p className="text-2xl font-black text-slate-100">{totalActivities}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Kegiatan</p>
                    </div>
                </div>

                {/* Chart 1: WBP Trend */}
                <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-3xl p-5">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center mr-3 border border-teal-500/20">
                            <TrendingUp size={16} className="text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200 text-sm">Tren Jumlah WBP</h3>
                            <p className="text-[10px] text-slate-500">{days} hari terakhir per shift</p>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={wbpData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradPagi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradSiang" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradMalam" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="Pagi" stroke="#2dd4bf" fill="url(#gradPagi)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="Siang" stroke="#22d3ee" fill="url(#gradSiang)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="Malam" stroke="#a855f7" fill="url(#gradMalam)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-3">
                        {[{ label: 'Pagi', color: '#2dd4bf' }, { label: 'Siang', color: '#22d3ee' }, { label: 'Malam', color: '#a855f7' }].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Patrol Status Distribution */}
                <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-3xl p-5">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center mr-3 border border-cyan-500/20">
                            <ShieldCheck size={16} className="text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200 text-sm">Status Patroli</h3>
                            <p className="text-[10px] text-slate-500">Distribusi seluruh scan</p>
                        </div>
                    </div>
                    {totalScans === 0 ? (
                        <p className="text-center text-slate-500 text-xs italic py-10 bg-[#0d1420] rounded-xl border border-[#2a3a4a]">Belum ada data patroli.</p>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-1/2 h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {statusData.map((entry) => (
                                                <Cell key={entry.name} fill={COLORS_STATUS[entry.name]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-2.5 pl-2">
                                {statusData.map(s => (
                                    <div key={s.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_STATUS[s.name] }}></div>
                                            <span className="text-xs font-bold text-slate-300">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-slate-100">{s.value}</span>
                                            <span className="text-[10px] text-slate-500 font-bold w-10 text-right">{Math.round(s.value / totalScans * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart 3: Activity Frequency */}
                <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-3xl p-5">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3 border border-purple-500/20">
                            <Activity size={16} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200 text-sm">Frekuensi Kegiatan</h3>
                            <p className="text-[10px] text-slate-500">{days} hari terakhir</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="Kegiatan" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsScreen;
