import { api } from '../services/api';
import React, { useState, useRef } from 'react';
import { Save, Trash2, Eye, X, History, CalendarDays, Image, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const ActivityScreen = ({ user, setCurrentScreen, setActivityLog, activityLog, refreshData }) => {
    const [desc, setDesc] = useState('');
    const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    const [isRealTime, setIsRealTime] = useState(true);
    const [imagePreviews, setImagePreviews] = useState([]);
    const galleryInputRef = useRef(null);
    const [viewImage, setViewImage] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Real-time Clock Sync
    React.useEffect(() => {
        let interval;
        if (isRealTime) {
            interval = setInterval(() => {
                setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRealTime]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} bukan gambar!`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                // Only compress if file >= 5MB
                if (file.size >= 5 * 1024 * 1024) {
                    const img = new window.Image();
                    img.onload = () => {
                        let w = img.width, h = img.height;
                        const max = 600;
                        if (w > max || h > max) {
                            if (w > h) { h = Math.round(h * max / w); w = max; }
                            else { w = Math.round(w * max / h); h = max; }
                        }
                        const c = document.createElement('canvas');
                        c.width = w; c.height = h;
                        c.getContext('2d').drawImage(img, 0, 0, w, h);
                        setImagePreviews(prev => [...prev, c.toDataURL('image/jpeg', 0.5)]);
                    };
                    img.src = dataUrl;
                } else {
                    setImagePreviews(prev => [...prev, dataUrl]);
                }
            };
            reader.readAsDataURL(file);
        });

        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const save = async (e) => {
        e.preventDefault();
        if (!desc) return alert("Isi uraian kegiatan!");
        const todayISO = new Date().toISOString().split('T')[0];
        try {
            await api.addActivityLog({
                id: Date.now(),
                time,
                name: user.name,
                desc,
                user: user.name,
                images: imagePreviews,
                dateISO: todayISO
            });
            refreshData();
            setDesc('');
            setImagePreviews([]);
        } catch (e) {
            alert("Gagal menyimpan kegiatan: " + e.message);
        }
    };

    const getFilteredActivities = () => {
        return activityLog
            .filter(item => item.dateISO === selectedDate)
            .sort((a, b) => {
                if (b.time !== a.time) return b.time.localeCompare(a.time);
                return b.id.toString().localeCompare(a.id.toString());
            });
    };

    const filteredActivities = getFilteredActivities();

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Pos Antara" subtitle="Catatan Kegiatan" onBack={() => setCurrentScreen('home')} />
            </div>

            {viewImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 rounded-full p-2 transition-all">
                        <X size={28} />
                    </button>
                    <img src={viewImage} alt="Full View" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain animate-scale-up" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">
                <GlassCard className="p-5 mb-8">
                    <form onSubmit={save}>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Waktu</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => {
                                    setTime(e.target.value);
                                    setIsRealTime(false);
                                }}
                                className={`w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3 font-bold text-slate-200 focus:ring-2 focus:ring-teal-500 ${isRealTime ? 'opacity-70' : ''}`}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Uraian Kegiatan</label>
                            <textarea
                                rows="3"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-teal-500 placeholder-slate-600"
                                placeholder="Jelaskan aktivitas..."
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dokumentasi Foto</label>
                            <input type="file" accept="image/*" multiple ref={galleryInputRef} className="hidden" onChange={handleImageUpload} />

                            <button
                                type="button"
                                onClick={() => galleryInputRef.current.click()}
                                className="w-full py-4 border-2 border-dashed border-[#2a3a4a] rounded-2xl text-slate-500 font-bold hover:border-teal-500/50 hover:text-teal-400 hover:bg-teal-500/5 transition flex flex-col items-center justify-center bg-[#0d1420] mb-3"
                            >
                                <Image className="mb-2" size={24} />
                                <span>Pilih Foto dari Galeri</span>
                            </button>

                            {isProcessing && (
                                <div className="flex justify-center my-4">
                                    <div className="flex items-center space-x-2 text-slate-400 text-sm font-bold bg-[#0d1420] px-4 py-2 rounded-full animate-pulse border border-[#2a3a4a]">
                                        <Loader2 className="animate-spin text-teal-400" size={16} />
                                        <span>Memproses gambar...</span>
                                    </div>
                                </div>
                            )}

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {imagePreviews.map((img, idx) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-[#2a3a4a] group h-32">
                                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Save size={20} className="mr-2" /> Simpan Laporan
                        </button>
                    </form>
                </GlassCard>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-300 flex items-center text-sm uppercase tracking-wider">
                        <History size={18} className="mr-2 text-slate-500" /> Riwayat Kegiatan
                    </h3>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs font-bold text-slate-400 bg-[#0d1420] border border-[#2a3a4a] rounded-lg p-1.5 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="space-y-4 pb-20">
                    {filteredActivities.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm italic py-4 bg-[#1a2332] rounded-xl border border-[#2a3a4a]">Belum ada kegiatan pada tanggal ini.</p>
                    ) : (
                        filteredActivities.map(l => (
                            <div key={l.id} className="flex relative pl-6 pb-6 last:pb-0 border-l-2 border-[#2a3a4a] ml-3">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-400 border-4 border-[#0f1729]"></div>
                                <div className="w-full">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 mr-2">{l.time}</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-[#0d1420] px-2 py-0.5 rounded text-slate-500 border border-[#2a3a4a]">
                                            Oleh: {l.user}
                                        </span>
                                    </div>
                                    <div className="bg-[#1a2332] p-4 rounded-2xl border border-[#2a3a4a] hover:border-teal-500/20 transition-all">
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{l.desc}</p>
                                        {l.images && l.images.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {l.images.map((img, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setViewImage(img)}
                                                        className="rounded-xl overflow-hidden border border-[#2a3a4a] h-24 relative group hover:border-teal-500/30 transition-all"
                                                    >
                                                        <img src={img} alt="Bukti" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                            <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={20} />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityScreen;
