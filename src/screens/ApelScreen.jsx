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

    // Format hari & tanggal Indonesia
    const getFormattedDate = (dateISO) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const d = new Date(dateISO + 'T00:00:00');
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const todayISO = new Date().toISOString().split('T')[0];
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
            refreshData(); // Fetch latest data from Supabase
            setShowConfirm(false);
            setApelInputs({});
            setViewMode('history');
        } catch (e) {
            alert("Gagal menyimpan data: " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <div className="bg-white p-6 pb-4 pt-8 border-b border-slate-100 z-20">
                <Header title="Apel Hunian" subtitle="Laporan WBP" onBack={() => setCurrentScreen('home')} />
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    {['input', 'history'].map(m => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${viewMode === m ? 'bg-white text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'
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
                        {/* Hari & Tanggal */}
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <CalendarDays size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari / Tanggal</p>
                                <p className="text-sm font-bold text-slate-800">{todayFormatted}</p>
                            </div>
                        </div>

                        {/* Shift */}
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                            <span className="text-blue-800 font-bold text-sm">Pilih Shift Jaga</span>
                            <select
                                value={selectedShift}
                                onChange={e => setSelectedShift(e.target.value)}
                                className="bg-white border-none text-sm font-bold text-slate-700 py-1.5 px-3 rounded-lg focus:ring-0 cursor-pointer"
                            >
                                <option>Pagi</option>
                                <option>Siang</option>
                                <option>Malam</option>
                            </select>
                        </div>

                        {/* Per-block input */}
                        {blocks.map(block => {
                            const floors = BLOCK_CONFIG[block].floors;
                            return (
                                <div key={block} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3 text-blue-500">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">{block}</h3>
                                            {block === 'Cempaka' && (
                                                <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">Selker</span>
                                            )}
                                        </div>
                                    </div>
                                    {floors === 1 ? (
                                        /* Dapur - single input */
                                        <div className="flex items-center justify-between pl-13">
                                            <span className="text-sm text-slate-500 font-medium ml-13">Jumlah WBP</span>
                                            <input
                                                type="number"
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-center font-bold text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                                                placeholder="0"
                                                value={apelInputs[block] || ''}
                                                onChange={e => handleInput(block, e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        /* 2-floor blocks */
                                        <div className="grid grid-cols-2 gap-3">
                                            {[1, 2].map(floor => (
                                                <div key={floor} className="flex flex-col bg-slate-50 rounded-xl p-3 items-center">
                                                    <span className="text-xs text-slate-400 font-bold uppercase mb-2">Lantai {floor}</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-center font-bold text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                            <p className="text-center text-slate-400 text-sm italic py-4 bg-slate-100 rounded-xl">Belum ada riwayat apel.</p>
                        ) : (
                            apelHistory.map(log => (
                                <GlassCard key={log.id} className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">{log.pic}</p>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                                {log.dateFormatted || log.dateISO}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded-lg inline-block">
                                                {log.time} • Shift {log.shift}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-black text-blue-600">{log.total}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WBP</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                )}
            </div>

            {viewMode === 'input' && (
                <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-sm font-medium text-slate-500">Total WBP Terhitung</span>
                        <span className="text-lg font-black text-slate-800">{total} Orang</span>
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition active:scale-95 flex items-center justify-center"
                    >
                        <Save className="w-5 h-5 mr-2" /> Simpan Laporan
                    </button>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-scale-up">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Konfirmasi Data</h3>
                        <p className="text-center text-slate-500 text-sm mb-2">
                            Pastikan data jumlah WBP sudah benar sebelum menyimpan.
                        </p>
                        <p className="text-center text-xs text-slate-400 font-medium mb-4">
                            {todayFormatted} — Shift {selectedShift}
                        </p>
                        <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-center border border-slate-100">
                            <p className="text-xs uppercase font-bold text-slate-400">Total Keseluruhan</p>
                            <p className="text-3xl font-black text-slate-800">{total}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="py-3 font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
                            >
                                Batal
                            </button>
                            <button onClick={save} className="py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
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
