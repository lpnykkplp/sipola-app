import { api } from '../services/api';
import React, { useState } from 'react';
import { PlusCircle, MapPin, Printer } from 'lucide-react';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { handlePrintSingle, handlePrintAll } from '../utils/printHelpers';

const GeneratorScreen = ({ user, setCurrentScreen, qrDatabase, setQrDatabase, refreshData }) => {
    if (user.role !== 'Super Admin') {
        setTimeout(() => setCurrentScreen('home'), 0);
        return null;
    }

    const [loc, setLoc] = useState('');

    const add = async (e) => {
        e.preventDefault();
        if (loc) {
            try {
                await api.addQrPoint({ id: `QR_${Date.now()}`, location: loc });
                refreshData();
                setLoc('');
            } catch (e) {
                alert("Gagal menambah titik: " + e.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Admin QR" subtitle="Manajemen Titik" onBack={() => setCurrentScreen('home')} />
            </div>
            <div className="p-6 flex-1 flex flex-col relative pb-32">
                <GlassCard className="p-5 mb-6">
                    <form onSubmit={add} className="flex gap-3">
                        <input
                            value={loc}
                            onChange={e => setLoc(e.target.value)}
                            placeholder="Nama Lokasi Baru..."
                            className="flex-1 bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 text-slate-200 font-medium placeholder-slate-600"
                        />
                        <button className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-purple-400 hover:to-purple-500 active:scale-90 transition shadow-lg shadow-purple-500/20">
                            <PlusCircle />
                        </button>
                    </form>
                </GlassCard>
                <div className="space-y-3">
                    {qrDatabase.map((q, i) => (
                        <div key={i} className="bg-[#1a2332] p-4 rounded-2xl border border-[#2a3a4a] flex justify-between items-center group hover:border-purple-500/30 transition">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#0d1420] rounded-full flex items-center justify-center mr-3 text-slate-500 group-hover:text-purple-400 transition border border-[#2a3a4a]">
                                    <MapPin size={18} />
                                </div>
                                <span className="font-bold text-slate-300">{q.location}</span>
                            </div>
                            <button
                                onClick={() => handlePrintSingle(q)}
                                className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                            >
                                <Printer size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Fixed bottom footer for print all button */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-[#1a2332]/90 backdrop-blur-md border-t border-[#2a3a4a] z-30">
                <button
                    onClick={() => handlePrintAll(qrDatabase)}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-500/20 hover:from-purple-400 hover:to-purple-500 transition active:scale-95 flex items-center justify-center"
                >
                    <Printer className="mr-3 w-6 h-6" /> Cetak Semua Titik
                </button>
            </div>
        </div>
    );
};

export default GeneratorScreen;
