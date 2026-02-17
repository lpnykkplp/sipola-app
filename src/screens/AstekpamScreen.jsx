import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, CalendarDays, Clock, CheckCircle, AlertTriangle, Loader2, RefreshCw, Pencil, Trash2, X, Save } from 'lucide-react';
import { api } from '../services/api';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const RUPAM_ACCOUNTS = ['RUPAM I', 'RUPAM II', 'RUPAM III', 'RUPAM IV'];

const INVENTARIS_ITEMS = [
    { key: 'ht', label: 'HT (Handie Talkie)', options: ['Baik', 'Rusak', 'Tidak Ada'] },
    { key: 'kunci_blok', label: 'Kunci Blok', options: ['Lengkap', 'Kurang', 'Tidak Ada'] },
    { key: 'senter', label: 'Senter', options: ['Baik', 'Rusak', 'Tidak Ada'] },
    { key: 'buku_jaga', label: 'Buku Jaga', options: ['Ada', 'Tidak Ada'] },
    { key: 'televisi', label: 'Televisi', options: ['Baik', 'Rusak', 'Tidak Ada'] },
    { key: 'dispenser', label: 'Dispenser', options: ['Baik', 'Rusak', 'Tidak Ada'] },
    { key: 'kipas_angin', label: 'Kipas Angin', options: ['Baik', 'Rusak', 'Tidak Ada'] },
];

const DEFAULT_INVENTARIS = Object.fromEntries(INVENTARIS_ITEMS.map(i => [i.key, i.options[0]]));

const AstekpamScreen = ({ user, setCurrentScreen }) => {
    // Form state
    const [shift, setShift] = useState('Pagi');
    const petugasLama = user?.name || '';
    const [petugasBaru, setPetugasBaru] = useState('');
    const [inventaris, setInventaris] = useState({ ...DEFAULT_INVENTARIS });
    const [wbpTotal, setWbpTotal] = useState('');
    const [wbpSakit, setWbpSakit] = useState('');
    const [wbpBon, setWbpBon] = useState('');
    const [catatan, setCatatan] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // History state
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const getLocalISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const [selectedDate, setSelectedDate] = useState(getLocalISO());
    const [expandedId, setExpandedId] = useState(null);

    // Edit modal state
    const [editingLog, setEditingLog] = useState(null);
    const [editShift, setEditShift] = useState('Pagi');
    const [editPetugasLama, setEditPetugasLama] = useState('');
    const [editPetugasBaru, setEditPetugasBaru] = useState('');
    const [editInventaris, setEditInventaris] = useState({ ...DEFAULT_INVENTARIS });
    const [editWbpTotal, setEditWbpTotal] = useState('');
    const [editWbpSakit, setEditWbpSakit] = useState('');
    const [editWbpBon, setEditWbpBon] = useState('');
    const [editCatatan, setEditCatatan] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Available receivers (Rupam I-IV excluding current user)
    const receiverOptions = RUPAM_ACCOUNTS.filter(
        name => name.toLowerCase() !== petugasLama.toLowerCase()
    );

    // Load logs
    const loadLogs = async () => {
        setLoadingLogs(true);
        try {
            const data = await api.getAstekpamLogs();
            const mapped = (data || []).map(r => ({
                id: r.id,
                shift: r.shift,
                petugasLama: r.petugas_lama,
                petugasBaru: r.petugas_baru,
                inventaris: r.inventaris || {},
                wbpTotal: r.wbp_total,
                wbpSakit: r.wbp_sakit,
                wbpBon: r.wbp_bon,
                catatan: r.catatan,
                dateISO: r.date_iso,
                status: r.status || 'pending',
                createdAt: r.created_at
            }));
            setLogs(mapped);
        } catch (err) {
            console.error('Error loading astekpam logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => { loadLogs(); }, []);

    // Check if current user already submitted a pending handover today
    const todayISO = getLocalISO();
    const myPendingHandover = logs.find(
        l => l.petugasLama.toLowerCase() === petugasLama.toLowerCase() && l.dateISO === todayISO && l.status === 'pending'
    );

    // Check if there's a pending handover targeting current user
    const incomingHandover = logs.find(
        l => l.petugasBaru.toLowerCase() === petugasLama.toLowerCase() && l.dateISO === todayISO && l.status === 'pending'
    );

    // Button states
    const canMenyerahkan = !myPendingHandover;
    const canMenerima = !!incomingHandover;

    const filteredLogs = useMemo(() => {
        return logs.filter(l => l.dateISO === selectedDate);
    }, [logs, selectedDate]);

    // Handle Menyerahkan
    const handleMenyerahkan = async () => {
        if (!petugasBaru) return alert('Pilih petugas penerima!');
        if (!wbpTotal) return alert('Isi jumlah total WBP!');

        setIsSaving(true);
        try {
            await api.addAstekpamLog({
                shift, petugasLama, petugasBaru, inventaris,
                wbpTotal: parseInt(wbpTotal) || 0,
                wbpSakit: parseInt(wbpSakit) || 0,
                wbpBon: parseInt(wbpBon) || 0,
                catatan, dateISO: todayISO, status: 'pending'
            });
            setSuccessMsg('Penyerahan Berhasil!');
            setSaveSuccess(true);
            setPetugasBaru(''); setWbpTotal(''); setWbpSakit(''); setWbpBon('');
            setCatatan(''); setInventaris({ ...DEFAULT_INVENTARIS });
            await loadLogs();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            alert('Gagal menyerahkan: ' + err.message);
        } finally { setIsSaving(false); }
    };

    // Handle Menerima
    const handleMenerima = async () => {
        if (!incomingHandover) return;
        setIsSaving(true);
        try {
            await api.updateAstekpamStatus(incomingHandover.id, 'completed');
            setSuccessMsg('Penerimaan Berhasil!');
            setSaveSuccess(true);
            await loadLogs();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            alert('Gagal menerima: ' + err.message);
        } finally { setIsSaving(false); }
    };

    // Open edit modal
    const openEditModal = (log) => {
        setEditingLog(log);
        setEditShift(log.shift);
        setEditPetugasLama(log.petugasLama);
        setEditPetugasBaru(log.petugasBaru);
        setEditInventaris({ ...DEFAULT_INVENTARIS, ...log.inventaris });
        setEditWbpTotal(String(log.wbpTotal || ''));
        setEditWbpSakit(String(log.wbpSakit || ''));
        setEditWbpBon(String(log.wbpBon || ''));
        setEditCatatan(log.catatan || '');
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editPetugasBaru.trim()) return alert('Isi nama petugas penerima!');
        setIsEditing(true);
        try {
            await api.updateAstekpamLog(editingLog.id, {
                shift: editShift,
                petugasLama: editPetugasLama,
                petugasBaru: editPetugasBaru,
                inventaris: editInventaris,
                wbpTotal: parseInt(editWbpTotal) || 0,
                wbpSakit: parseInt(editWbpSakit) || 0,
                wbpBon: parseInt(editWbpBon) || 0,
                catatan: editCatatan
            });
            setEditingLog(null);
            setSuccessMsg('Berhasil Diperbarui!');
            setSaveSuccess(true);
            await loadLogs();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            alert('Gagal memperbarui: ' + err.message);
        } finally { setIsEditing(false); }
    };

    // Delete
    const handleDelete = async (id) => {
        try {
            await api.deleteAstekpamLog(id);
            setDeleteConfirmId(null);
            setExpandedId(null);
            setSuccessMsg('Data Dihapus!');
            setSaveSuccess(true);
            await loadLogs();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            alert('Gagal menghapus: ' + err.message);
        }
    };

    const updateInventaris = (key, val) => setInventaris(prev => ({ ...prev, [key]: val }));
    const updateEditInventaris = (key, val) => setEditInventaris(prev => ({ ...prev, [key]: val }));

    const getStatusColor = (val) => {
        if (['Baik', 'Lengkap', 'Ada'].includes(val)) return 'text-green-400 bg-green-500/10 border-green-500/30';
        if (['Rusak', 'Kurang'].includes(val)) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    const shiftConfig = {
        Pagi: { color: 'from-amber-500 to-orange-500', icon: '🌅', time: '07:00 - 13:00' },
        Siang: { color: 'from-cyan-500 to-blue-500', icon: '☀️', time: '13:00 - 19:00' },
        Malam: { color: 'from-indigo-500 to-purple-500', icon: '🌙', time: '19:00 - 07:00' },
    };

    const handoverStatusConfig = {
        pending: { label: 'Menunggu Penerima', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        completed: { label: 'Selesai', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    };

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Serah Terima" subtitle="Astekpam — Penjagaan" onBack={() => setCurrentScreen('home')} />
            </div>

            {/* Success overlay */}
            {saveSuccess && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-[#1a2332] border border-green-500/30 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50 mx-auto mb-4">
                            <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h3 className="font-bold text-green-400 text-lg mb-1">{successMsg}</h3>
                        <p className="text-slate-400 text-sm">Data telah disimpan</p>
                    </div>
                </div>
            )}

            {/* Delete confirmation overlay */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-[#1a2332] border border-red-500/30 rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50 mx-auto mb-4">
                            <Trash2 size={28} className="text-red-400" />
                        </div>
                        <h3 className="font-bold text-red-400 text-lg mb-2">Hapus Data?</h3>
                        <p className="text-slate-400 text-sm mb-5">Data serah terima ini akan dihapus permanen.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="py-3 bg-[#0d1420] border border-[#2a3a4a] rounded-xl text-slate-300 font-bold text-sm hover:bg-[#243044] transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-bold text-sm hover:bg-red-500/30 transition"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingLog && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
                    <div className="bg-[#1a2332] border border-teal-500/30 rounded-3xl shadow-2xl max-w-md w-full mx-4 my-6">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#2a3a4a]">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Pencil size={16} className="text-teal-400" /> Edit Serah Terima
                            </h3>
                            <button onClick={() => setEditingLog(null)} className="text-slate-500 hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Shift */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Shift</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(shiftConfig).map(([key, cfg]) => (
                                        <button key={key} type="button" onClick={() => setEditShift(key)}
                                            className={`py-2 rounded-xl font-bold text-xs text-center transition-all ${editShift === key
                                                ? `bg-gradient-to-r ${cfg.color} text-white`
                                                : 'bg-[#0d1420] border border-[#2a3a4a] text-slate-500'
                                                }`}
                                        >
                                            {cfg.icon} {key}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Petugas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-red-400 uppercase mb-1">Menyerahkan</label>
                                    <input type="text" value={editPetugasLama} onChange={e => setEditPetugasLama(e.target.value)}
                                        className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold focus:ring-1 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-teal-400 uppercase mb-1">Menerima</label>
                                    <select value={editPetugasBaru} onChange={e => setEditPetugasBaru(e.target.value)}
                                        className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold focus:ring-1 focus:ring-teal-500">
                                        <option value="">Pilih...</option>
                                        {RUPAM_ACCOUNTS.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Inventaris */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Inventaris</label>
                                <div className="space-y-1.5">
                                    {INVENTARIS_ITEMS.map(item => (
                                        <div key={item.key} className="flex items-center justify-between bg-[#0d1420] border border-[#2a3a4a] rounded-lg px-3 py-2">
                                            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 mr-2">{item.label}</span>
                                            <div className="flex gap-1">
                                                {item.options.map(opt => (
                                                    <button key={opt} type="button" onClick={() => updateEditInventaris(item.key, opt)}
                                                        className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${editInventaris[item.key] === opt
                                                            ? getStatusColor(opt)
                                                            : 'bg-transparent border-[#2a3a4a] text-slate-600'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* WBP */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total WBP</label>
                                    <input type="number" value={editWbpTotal} onChange={e => setEditWbpTotal(e.target.value)}
                                        className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold text-center focus:ring-1 focus:ring-teal-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sakit</label>
                                    <input type="number" value={editWbpSakit} onChange={e => setEditWbpSakit(e.target.value)}
                                        className="w-full bg-[#0d1420] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-bold text-center focus:ring-1 focus:ring-amber-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Di-Bon</label>
                                    <input type="number" value={editWbpBon} onChange={e => setEditWbpBon(e.target.value)}
                                        className="w-full bg-[#0d1420] border border-cyan-500/20 rounded-xl px-3 py-2.5 text-xs text-cyan-400 font-bold text-center focus:ring-1 focus:ring-cyan-500" placeholder="0" />
                                </div>
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan</label>
                                <textarea rows="2" value={editCatatan} onChange={e => setEditCatatan(e.target.value)}
                                    className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-teal-500 placeholder-slate-600"
                                    placeholder="Catatan tambahan..." />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="p-5 border-t border-[#2a3a4a] flex gap-3">
                            <button onClick={() => setEditingLog(null)}
                                className="flex-1 py-3 bg-[#0d1420] border border-[#2a3a4a] rounded-xl text-slate-300 font-bold text-sm hover:bg-[#243044] transition">
                                Batal
                            </button>
                            <button onClick={handleSaveEdit} disabled={isEditing}
                                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50">
                                {isEditing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">
                {/* Incoming handover banner */}
                {incomingHandover && (
                    <div className="mb-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <ArrowLeft size={20} className="text-teal-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-teal-300 font-bold text-sm">Serah terima masuk!</p>
                            <p className="text-teal-400/70 text-xs">{incomingHandover.petugasLama} menyerahkan ke Anda (Shift {incomingHandover.shift})</p>
                        </div>
                    </div>
                )}

                {/* My pending status banner */}
                {myPendingHandover && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock size={20} className="text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-amber-300 font-bold text-sm">Menunggu penerimaan</p>
                            <p className="text-amber-400/70 text-xs">Anda sudah menyerahkan ke {myPendingHandover.petugasBaru}</p>
                        </div>
                    </div>
                )}

                {/* === FORM === */}
                {/* Shift Selection */}
                <GlassCard className="p-5 mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={14} /> Pilih Shift Jaga
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(shiftConfig).map(([key, cfg]) => (
                            <button key={key} type="button" onClick={() => setShift(key)}
                                className={`py-3 rounded-xl font-bold text-sm text-center transition-all ${shift === key
                                    ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg scale-105`
                                    : 'bg-[#0d1420] border border-[#2a3a4a] text-slate-500 hover:border-slate-500'
                                    }`}
                            >
                                <span className="text-lg block">{cfg.icon}</span>
                                <span className="text-xs">{key}</span>
                                {shift === key && <p className="text-[9px] mt-0.5 opacity-80">{cfg.time}</p>}
                            </button>
                        ))}
                    </div>
                </GlassCard>

                {/* Petugas - Side by Side */}
                <GlassCard className="p-5 mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ArrowLeftRight size={14} /> Petugas Jaga
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0d1420] border border-red-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <ArrowRight size={12} className="text-red-400" />
                                <label className="text-[9px] font-bold text-red-400 uppercase">Menyerahkan</label>
                            </div>
                            <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-lg px-3 py-2.5">
                                <p className="text-sm text-slate-200 font-bold">{petugasLama}</p>
                            </div>
                        </div>
                        <div className="bg-[#0d1420] border border-teal-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <ArrowLeft size={12} className="text-teal-400" />
                                <label className="text-[9px] font-bold text-teal-400 uppercase">Menerima</label>
                            </div>
                            <select value={petugasBaru} onChange={e => setPetugasBaru(e.target.value)}
                                className="w-full bg-[#1a2332] border border-[#2a3a4a] rounded-lg px-3 py-2 text-sm text-slate-200 font-bold focus:ring-1 focus:ring-teal-500">
                                <option value="">Pilih Rupam...</option>
                                {receiverOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </GlassCard>

                {/* Inventaris Checklist */}
                <GlassCard className="p-5 mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        📋 Checklist Inventaris
                    </h3>
                    <div className="space-y-2">
                        {INVENTARIS_ITEMS.map(item => (
                            <div key={item.key} className="flex items-center justify-between bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5">
                                <span className="text-xs font-bold text-slate-300 flex-shrink-0 mr-3">{item.label}</span>
                                <div className="flex gap-1.5">
                                    {item.options.map(opt => (
                                        <button key={opt} type="button" onClick={() => updateInventaris(item.key, opt)}
                                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${inventaris[item.key] === opt
                                                ? getStatusColor(opt)
                                                : 'bg-transparent border-[#2a3a4a] text-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Keadaan WBP */}
                <GlassCard className="p-5 mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        👥 Keadaan WBP
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total WBP</label>
                            <input type="number" value={wbpTotal} onChange={e => setWbpTotal(e.target.value)}
                                className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-3 text-sm text-slate-200 font-bold text-center focus:ring-2 focus:ring-teal-500" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sakit</label>
                            <input type="number" value={wbpSakit} onChange={e => setWbpSakit(e.target.value)}
                                className="w-full bg-[#0d1420] border border-amber-500/20 rounded-xl px-3 py-3 text-sm text-amber-400 font-bold text-center focus:ring-2 focus:ring-amber-500" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Di-Bon</label>
                            <input type="number" value={wbpBon} onChange={e => setWbpBon(e.target.value)}
                                className="w-full bg-[#0d1420] border border-cyan-500/20 rounded-xl px-3 py-3 text-sm text-cyan-400 font-bold text-center focus:ring-2 focus:ring-cyan-500" placeholder="0" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Khusus</label>
                        <textarea rows="2" value={catatan} onChange={e => setCatatan(e.target.value)}
                            className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500 placeholder-slate-600"
                            placeholder="Catatan tambahan (opsional)..." />
                    </div>
                </GlassCard>

                {/* Two Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button type="button" onClick={handleMenyerahkan} disabled={!canMenyerahkan || isSaving}
                        className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${canMenyerahkan && !isSaving
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white active:scale-95 shadow-red-500/20'
                            : 'bg-[#1a2332] border border-[#2a3a4a] text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        <span className="text-sm">Menyerahkan</span>
                    </button>
                    <button type="button" onClick={handleMenerima} disabled={!canMenerima || isSaving}
                        className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${canMenerima && !isSaving
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white active:scale-95 shadow-teal-500/20'
                            : 'bg-[#1a2332] border border-[#2a3a4a] text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
                        <span className="text-sm">Menerima</span>
                    </button>
                </div>

                {/* === RIWAYAT === */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-300 flex items-center text-sm uppercase tracking-wider">
                        📜 Riwayat
                    </h3>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="text-xs font-bold text-slate-400 bg-[#0d1420] border border-[#2a3a4a] rounded-lg p-1.5 focus:ring-1 focus:ring-teal-500" />
                        <button onClick={loadLogs} disabled={loadingLogs}
                            className="bg-[#0d1420] border border-[#2a3a4a] rounded-lg p-1.5 text-slate-500 hover:text-teal-400 transition disabled:opacity-50">
                            <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {loadingLogs ? (
                    <div className="flex flex-col items-center py-10">
                        <Loader2 size={24} className="animate-spin text-teal-400 mb-2" />
                        <p className="text-slate-500 text-xs font-bold">Memuat riwayat...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8 bg-[#1a2332] rounded-2xl border border-[#2a3a4a]">
                        <ArrowLeftRight size={32} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-slate-500 font-bold text-sm">Belum ada serah terima</p>
                        <p className="text-slate-600 text-xs mt-1">pada tanggal ini</p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-10">
                        {filteredLogs.map(log => {
                            const isExpanded = expandedId === log.id;
                            const sCfg = shiftConfig[log.shift] || shiftConfig.Pagi;
                            const hasIssues = Object.values(log.inventaris || {}).some(v => ['Rusak', 'Kurang', 'Tidak Ada'].includes(v));
                            const hStatus = handoverStatusConfig[log.status] || handoverStatusConfig.pending;

                            return (
                                <GlassCard key={log.id} className="p-0 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#0d1420]/30 transition"
                                    >
                                        <div className={`w-10 h-10 bg-gradient-to-br ${sCfg.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg`}>
                                            {sCfg.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-bold text-slate-200 text-sm">Shift {log.shift}</h4>
                                                {hasIssues && <AlertTriangle size={12} className="text-amber-400" />}
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${hStatus.bg} ${hStatus.color} ${hStatus.border} ml-auto flex-shrink-0`}>
                                                    {hStatus.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">
                                                {log.petugasLama} → {log.petugasBaru}
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-0.5">
                                                WBP: {log.wbpTotal} • {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {isExpanded ?
                                            <ChevronUp size={16} className="text-slate-500 flex-shrink-0" /> :
                                            <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
                                        }
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-[#2a3a4a] p-4 space-y-4">
                                            {/* Petugas */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-[#0d1420] border border-red-500/20 rounded-xl p-3">
                                                    <p className="text-[9px] text-red-400 uppercase font-bold mb-1">Menyerahkan</p>
                                                    <p className="text-xs text-slate-300 font-bold">{log.petugasLama}</p>
                                                </div>
                                                <div className="bg-[#0d1420] border border-teal-500/20 rounded-xl p-3">
                                                    <p className="text-[9px] text-teal-400 uppercase font-bold mb-1">Menerima</p>
                                                    <p className="text-xs text-teal-300 font-bold">{log.petugasBaru}</p>
                                                </div>
                                            </div>

                                            {/* Inventaris */}
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase font-bold mb-2">Inventaris</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {INVENTARIS_ITEMS.map(item => {
                                                        const val = log.inventaris?.[item.key] || '-';
                                                        return (
                                                            <div key={item.key} className="flex items-center justify-between bg-[#0d1420] border border-[#2a3a4a] rounded-lg px-3 py-2">
                                                                <span className="text-[10px] text-slate-400">{item.label}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(val)}`}>
                                                                    {val}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* WBP */}
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase font-bold mb-2">Keadaan WBP</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-2 text-center">
                                                        <p className="text-lg font-bold text-slate-100">{log.wbpTotal}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold">Total</p>
                                                    </div>
                                                    <div className="bg-[#0d1420] border border-amber-500/20 rounded-xl p-2 text-center">
                                                        <p className="text-lg font-bold text-amber-400">{log.wbpSakit}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold">Sakit</p>
                                                    </div>
                                                    <div className="bg-[#0d1420] border border-cyan-500/20 rounded-xl p-2 text-center">
                                                        <p className="text-lg font-bold text-cyan-400">{log.wbpBon}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold">Di-Bon</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Catatan */}
                                            {log.catatan && (
                                                <div className="bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3">
                                                    <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">Catatan</p>
                                                    <p className="text-xs text-slate-300">{log.catatan}</p>
                                                </div>
                                            )}

                                            {/* Edit / Delete buttons - only for the user who submitted */}
                                            {log.petugasLama.toLowerCase() === petugasLama.toLowerCase() && <div className="flex gap-2 pt-2 border-t border-[#2a3a4a]">
                                                <button
                                                    onClick={() => openEditModal(log)}
                                                    className="flex-1 py-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-500/20 transition"
                                                >
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(log.id)}
                                                    className="py-2.5 px-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition"
                                                >
                                                    <Trash2 size={13} /> Hapus
                                                </button>
                                            </div>}
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AstekpamScreen;
