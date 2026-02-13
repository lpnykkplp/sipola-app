import { api } from '../services/api';
import React, { useState, useRef } from 'react';
import { Save, Camera, Trash2, Eye, X, History, CalendarDays, Image, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const ActivityScreen = ({ user, setCurrentScreen, setActivityLog, activityLog, refreshData }) => {
    const [desc, setDesc] = useState('');
    const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    const [imagePreviews, setImagePreviews] = useState([]);
    const fileInputRef = useRef(null); // Camera
    const galleryInputRef = useRef(null); // Gallery
    const [viewImage, setViewImage] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    const processFile = (file) => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} bukan gambar!`);
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // Watermark
                    const date = new Date();
                    const timestampText = date.toLocaleString('id-ID');
                    const fontSize = Math.max(24, Math.floor(img.height * 0.03));
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'bottom';
                    const x = canvas.width - (fontSize * 0.5);
                    const y = canvas.height - (fontSize * 0.5);

                    // Outline
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = fontSize / 6;
                    ctx.strokeText(timestampText, x, y);

                    // Text
                    ctx.fillStyle = 'white';
                    ctx.fillText(timestampText, x, y);

                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = () => {
                    alert(`Gagal memproses gambar ${file.name}`);
                    resolve(null);
                };
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsProcessing(true);
        try {
            const promises = files.map(file => processFile(file));
            const results = await Promise.all(promises);
            const validImages = results.filter(img => img !== null);

            if (validImages.length > 0) {
                setImagePreviews(prev => [...prev, ...validImages]);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Terjadi kesalahan saat memproses gambar.");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (galleryInputRef.current) galleryInputRef.current.value = '';
        }
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
            refreshData(); // Fetch latest from DB
            setDesc('');
            setImagePreviews([]);
        } catch (e) {
            alert("Gagal menyimpan kegiatan: " + e.message);
        }
    };

    // Filter activities by selected date and sort newest first
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
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <div className="bg-white p-6 pt-8 border-b border-slate-100 sticky top-0 z-20">
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
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Waktu</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Uraian Kegiatan</label>
                            <textarea
                                rows="3"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-orange-400"
                                placeholder="Jelaskan aktivitas..."
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dokumentasi Foto</label>
                            <input type="file" accept="image/*" multiple capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                            <input type="file" accept="image/*" multiple ref={galleryInputRef} className="hidden" onChange={handleImageUpload} />

                            <div className="flex gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition flex flex-col items-center justify-center bg-slate-50"
                                >
                                    <Camera className="mb-2" size={24} />
                                    <span>Ambil Foto</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current.click()}
                                    className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center bg-slate-50"
                                >
                                    <Image className="mb-2" size={24} />
                                    <span>Dari Galeri</span>
                                </button>
                            </div>

                            {isProcessing && (
                                <div className="flex justify-center my-4">
                                    <div className="flex items-center space-x-2 text-slate-500 text-sm font-bold bg-slate-100 px-4 py-2 rounded-full animate-pulse">
                                        <Loader2 className="animate-spin text-orange-500" size={16} />
                                        <span>Memproses gambar...</span>
                                    </div>
                                </div>
                            )}

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {imagePreviews.map((img, idx) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group h-32">
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
                        <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 rounded-2xl active:scale-95 transition flex items-center justify-center">
                            <Save size={20} className="mr-2" /> Simpan Laporan
                        </button>
                    </form>
                </GlassCard>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider">
                        <History size={18} className="mr-2 text-slate-400" /> Riwayat Kegiatan
                    </h3>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-orange-400"
                        />
                    </div>
                </div>
                <div className="space-y-4 pb-20">
                    {filteredActivities.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm italic py-4 bg-slate-100 rounded-xl">Belum ada kegiatan pada tanggal ini.</p>
                    ) : (
                        filteredActivities.map(l => (
                            <div key={l.id} className="flex relative pl-6 pb-6 last:pb-0 border-l-2 border-slate-200 ml-3">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-white"></div>
                                <div className="w-full">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 mr-2">{l.time}</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                                            Oleh: {l.user}
                                        </span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{l.desc}</p>
                                        {l.images && l.images.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {l.images.map((img, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setViewImage(img)}
                                                        className="rounded-xl overflow-hidden border border-slate-100 h-24 relative group"
                                                    >
                                                        <img src={img} alt="Bukti" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
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
