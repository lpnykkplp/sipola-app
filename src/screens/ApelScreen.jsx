import { api } from '../services/api';
import React, { useState } from 'react';
import { Save, CheckCircle, Building2, CalendarDays } from 'lucide-react';
import { BLOCK_CONFIG } from '../data/data';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const ApelScreen = ({ user, setCurrentScreen, apelHistory, setApelHistory, apelInputs, setApelInputs, selectedShift, setSelectedShift, refreshData }) => {
    const [viewMode, setViewMode] = useState('input');
    const [showConfirm, setShowConfirm] = useState(false);
    const blocks = Object.keys(BLOCK_CONFIG);

    const handleInput = (key, val) => {
        setApelInputs(p => ({ ...p, [key]: parseInt(val) || 0 }));
    };

    const total = Object.values(apelInputs).reduce((a, b) => a + b, 0);

    const getFormattedDate = (dateISO) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const d = new Date(dateISO + 'T00:00:00');
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getLocalISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayISO = getLocalISO(currentTime);
    const todayFormatted = getFormattedDate(todayISO);

    const save = async () => {
        try {
            await api.addApelLog({
                id: Date.now(),
                pic: user.name,
                shift: selectedShift,
                total,
                details: apelInputs,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                date_iso: todayISO,
                date_formatted: todayFormatted
            });
            refreshData();
            setShowConfirm(false);
            setApelInputs({});
            setViewMode('history');
        } catch (e) {
            alert("Gagal menyimpan data: " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pb-4 pt-8 border-b border-[#2a3a4a] z-20">
                <Header title="Apel Hunian" subtitle="Laporan WBP" onBack={() => setCurrentScreen('home')} />
                <div className="flex bg-[#0d1420] p-1 rounded-2xl border border-[#2a3a4a]">
                    {['input', 'history'].map(m => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${viewMode === m ? 'bg-[#1a2332] text-teal-400 border border-teal-500/30' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {m === 'input' ? 'Input Data' : 'Riwayat'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-48">
                {viewMode === 'input' ? (
                    <div className="space-y-4">
                        {/* Shift Selection */}
                        <div className="flex items-center justify-between bg-[#1a2332] p-3 rounded-2xl border border-[#2a3a4a]">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Jaga</span>
                            <div className="flex gap-1">
                                {['Pagi', 'Siang', 'Malam'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedShift(s)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedShift === s
                                            ? s === 'Pagi' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                                : s === 'Siang' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'bg-[#0d1420] border border-[#2a3a4a] text-slate-500'
                                            }`}
                                    >
                                        {s === 'Pagi' ? '🌅' : s === 'Siang' ? '☀️' : '🌙'} {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Per-block input */}
                        {blocks.map(block => {
                            const floors = BLOCK_CONFIG[block].floors;
                            return (
                                <div key={block} className="bg-[#1a2332] border border-[#2a3a4a] rounded-2xl p-4 hover:border-teal-500/20 transition-all">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-[#0d1420] rounded-xl flex items-center justify-center mr-3 text-cyan-400 border border-cyan-500/20">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-200 text-sm">{block}</h3>
                                            {block === 'Cempaka' && (
                                                <span className="text-[9px] font-bold text-red-400 uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Selker</span>
                                            )}
                                        </div>
                                    </div>
                                    {floors === 1 ? (
                                        <div className="flex items-center justify-between pl-13">
                                            <span className="text-sm text-slate-400 font-medium ml-13">Jumlah WBP</span>
                                            <input
                                                type="number"
                                                className="w-20 bg-[#0d1420] border border-[#2a3a4a] rounded-xl py-2.5 px-3 text-center font-bold text-slate-100 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                                                placeholder="0"
                                                value={apelInputs[block] || ''}
                                                onChange={e => handleInput(block, e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[1, 2].map(floor => (
                                                <div key={floor} className="flex flex-col bg-[#0d1420] rounded-xl p-3 items-center border border-[#2a3a4a]">
                                                    <span className="text-xs text-slate-500 font-bold uppercase mb-2">Lantai {floor}</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-[#1a2332] border border-[#2a3a4a] rounded-xl py-2 px-3 text-center font-bold text-slate-100 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                                                        placeholder="0"
                                                        value={apelInputs[`${block}-L${floor}`] || ''}
                                                        onChange={e => handleInput(`${block}-L${floor}`, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {apelHistory.length === 0 ? (
                            <p className="text-center text-slate-500 text-sm italic py-4 bg-[#1a2332] rounded-xl border border-[#2a3a4a]">Belum ada riwayat apel.</p>
                        ) : (
                            apelHistory.map(log => (
                                <GlassCard key={log.id} className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-200">{log.pic}</p>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                                {log.dateFormatted || log.dateISO}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 font-medium bg-[#0d1420] px-2 py-0.5 rounded-lg inline-block border border-[#2a3a4a]">
                                                {log.time} • Shift {log.shift}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-black text-teal-400">{log.total}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WBP</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                )}
            </div>

            {viewMode === 'input' && (
                <div className="fixed bottom-0 left-0 w-full p-6 bg-[#1a2332]/90 backdrop-blur-md border-t border-[#2a3a4a] z-30">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-sm font-medium text-slate-400">Total WBP Terhitung</span>
                        <span className="text-lg font-black text-slate-100">{total} Orang</span>
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-2xl hover:from-teal-400 hover:to-cyan-400 transition active:scale-95 flex items-center justify-center shadow-lg shadow-teal-500/20"
                    >
                        <Save className="w-5 h-5 mr-2" /> Simpan Laporan
                    </button>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a2332] w-full max-w-sm rounded-[2rem] p-6 animate-scale-up border border-[#2a3a4a] shadow-2xl shadow-black/50">
                        <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-100 mb-2">Konfirmasi Data</h3>
                        <p className="text-center text-slate-400 text-sm mb-2">
                            Pastikan data jumlah WBP sudah benar sebelum menyimpan.
                        </p>
                        <p className="text-center text-xs text-slate-500 font-medium mb-4">
                            {todayFormatted} — Shift {selectedShift}
                        </p>
                        <div className="bg-[#0d1420] p-4 rounded-2xl mb-6 text-center border border-[#2a3a4a]">
                            <p className="text-xs uppercase font-bold text-slate-500">Total Keseluruhan</p>
                            <p className="text-3xl font-black text-teal-400">{total}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="py-3 font-bold text-slate-400 bg-[#0d1420] border border-[#2a3a4a] rounded-xl hover:bg-[#243044] transition"
                            >
                                Batal
                            </button>
                            <button onClick={save} className="py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl hover:from-teal-400 hover:to-cyan-400 shadow-lg shadow-teal-500/20">
                                Ya, Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApelScreen;
