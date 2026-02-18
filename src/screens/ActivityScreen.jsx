import { api } from '../services/api';
import React, { useState, useRef, useMemo } from 'react';
import { Save, Trash2, Eye, History, CalendarDays, Image, Loader2, FileText, X, Download, Send, CheckCircle, Edit3, ArrowUpDown } from 'lucide-react';
import ZoomableImageViewer from '../components/ZoomableImageViewer';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const ActivityScreen = ({ user, setCurrentScreen, setActivityLog, activityLog, apelHistory = [], refreshData }) => {
    const [desc, setDesc] = useState('');
    const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    const [isRealTime, setIsRealTime] = useState(true);
    const [imagePreviews, setImagePreviews] = useState([]);
    const galleryInputRef = useRef(null);
    const [viewImage, setViewImage] = useState(null);
    const getLocalISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const [selectedDate, setSelectedDate] = useState(getLocalISO());
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [petugasJaga, setPetugasJaga] = useState(user?.name || '');
    const [sortNewestFirst, setSortNewestFirst] = useState(true);
    const [reportShift, setReportShift] = useState('Pagi');

    const SHIFT_CONFIG = {
        Pagi: { time: '07.00 - 13.00', icon: '🌅', color: 'from-amber-500 to-orange-500' },
        Siang: { time: '13.00 - 19.00', icon: '☀️', color: 'from-cyan-500 to-blue-500' },
        Malam: { time: '19.00 - 07.00', icon: '🌙', color: 'from-indigo-500 to-purple-500' },
    };

    const isRupam = user?.name?.toLowerCase().includes('rupam');

    // Reset petugasJaga when preview opens
    const openReportPreview = () => {
        setPetugasJaga(user?.name || '');
        setSendSuccess(false);
        setShowReportPreview(true);
    };

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
        const todayISO = getLocalISO();
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
                const cmp = a.time.localeCompare(b.time);
                const idCmp = a.id.toString().localeCompare(b.id.toString());
                if (sortNewestFirst) {
                    return cmp !== 0 ? -cmp : -idCmp;
                }
                return cmp !== 0 ? cmp : idCmp;
            });
    };

    const filteredActivities = getFilteredActivities();

    // --- Report data ---
    const reportDate = useMemo(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return {
            hari: days[d.getDay()],
            tanggal: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
            full: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
        };
    }, [selectedDate]);

    const latestWbpCount = useMemo(() => {
        const dayApels = apelHistory.filter(a => a.dateISO === selectedDate);
        if (dayApels.length === 0) return '-';
        const latest = dayApels.sort((a, b) => (b.time || '').localeCompare(a.time || ''))[0];
        return latest?.total || '-';
    }, [selectedDate, apelHistory]);

    // --- PDF Generation (returns base64) ---
    const buildPdf = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentW = pageW - margin * 2;
        let y = 20;

        const addNewPageIfNeeded = (needed) => {
            if (y + needed > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        };

        // === JUDUL ===
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LAPORAN KEGIATAN POS ANTARA', pageW / 2, y, { align: 'center' });
        y += 10;

        // === INFO HEADER ===
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const infoItems = [
            ['Hari / Tanggal', reportDate.full],
            ['Shift Jaga', `${reportShift} (${SHIFT_CONFIG[reportShift].time})`],
            ['Petugas Jaga', petugasJaga],
            ['Jumlah WBP', latestWbpCount === '-' ? 'Belum ada data apel' : `${latestWbpCount} orang`],
        ];

        infoItems.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}`, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(`: ${value}`, margin + 40, y);
            y += 6;
        });

        y += 6;

        // === TABLE ===
        const colNo = 10;
        const colTime = 22;
        const colDesc = contentW - colNo - colTime;

        doc.setFillColor(44, 62, 80);
        doc.rect(margin, y, contentW, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('No', margin + colNo / 2, y + 5.5, { align: 'center' });
        doc.text('Waktu', margin + colNo + colTime / 2, y + 5.5, { align: 'center' });
        doc.text('Uraian Kegiatan', margin + colNo + colTime + 4, y + 5.5);
        doc.setTextColor(0, 0, 0);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const activities = filteredActivities;

        if (activities.length === 0) {
            addNewPageIfNeeded(10);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y, contentW, 8, 'F');
            doc.setFont('helvetica', 'italic');
            doc.text('Tidak ada kegiatan pada tanggal ini', pageW / 2, y + 5.5, { align: 'center' });
            y += 8;
        } else {
            activities.forEach((item, idx) => {
                const descLines = doc.splitTextToSize(item.desc || '-', colDesc - 6);
                const rowH = Math.max(8, descLines.length * 4.5 + 3);
                addNewPageIfNeeded(rowH);

                if (idx % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(margin, y, contentW, rowH, 'F');
                }

                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.rect(margin, y, contentW, rowH);
                doc.line(margin + colNo, y, margin + colNo, y + rowH);
                doc.line(margin + colNo + colTime, y, margin + colNo + colTime, y + rowH);

                doc.setFont('helvetica', 'normal');
                doc.text(`${idx + 1}`, margin + colNo / 2, y + 5, { align: 'center' });
                doc.text(item.time || '-', margin + colNo + colTime / 2, y + 5, { align: 'center' });
                doc.text(descLines, margin + colNo + colTime + 3, y + 5);

                y += rowH;
            });
        }

        y += 12;

        // === FOOTER / TTD ===
        addNewPageIfNeeded(40);
        const ttdX = pageW - margin - 60;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Yogyakarta, ${reportDate.tanggal}`, ttdX, y);
        y += 5;
        doc.text('Petugas Jaga,', ttdX, y);
        y += 25;
        doc.setFont('helvetica', 'bold');
        doc.text(petugasJaga, ttdX, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setLineWidth(0.5);
        doc.line(ttdX, y - 1, ttdX + 50, y - 1);

        return doc;
    };

    // --- Download PDF ---
    const downloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = await buildPdf();
            const fileName = `Laporan_PosAntara_${selectedDate}_${petugasJaga.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Gagal membuat PDF: ' + err.message);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // --- Send Report to Admin (via Supabase) ---
    const sendReport = async () => {
        setIsSending(true);
        try {
            const report = {
                senderName: user.name,
                petugasJaga,
                date: selectedDate,
                dateFormatted: reportDate.full,
                wbpCount: String(latestWbpCount),
                activitiesCount: filteredActivities.length,
                activitiesSummary: filteredActivities.map(a => ({ time: a.time, desc: a.desc })),
                sentAt: new Date().toISOString(),
                status: 'pending'
            };

            await api.addReport(report);

            // Auto-clear activity logs for this date after sending
            try {
                await api.deleteActivityLogsByDate(selectedDate);
                refreshData();
            } catch (clearErr) {
                console.warn('Failed to clear activity logs:', clearErr);
            }

            setSendSuccess(true);
            setTimeout(() => {
                setShowReportPreview(false);
                setSendSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Send report error:', err);
            alert('Gagal mengirim laporan: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Pos Antara" subtitle="Catatan Kegiatan" onBack={() => setCurrentScreen('home')} />
            </div>

            {viewImage && (
                <ZoomableImageViewer src={viewImage} onClose={() => setViewImage(null)} />
            )}

            {/* Report Preview Modal */}
            {showReportPreview && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a2332] border border-[#2a3a4a] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl shadow-black/50 animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#2a3a4a]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
                                    <FileText size={20} className="text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100 text-sm">Preview Laporan</h3>
                                    <p className="text-[10px] text-slate-500">Periksa sebelum mengirim</p>
                                </div>
                            </div>
                            <button onClick={() => setShowReportPreview(false)} className="w-8 h-8 bg-[#0d1420] border border-[#2a3a4a] rounded-full flex items-center justify-center text-slate-400 hover:text-white transition">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Success overlay */}
                        {sendSuccess && (
                            <div className="absolute inset-0 z-10 bg-[#1a2332]/95 rounded-3xl flex flex-col items-center justify-center gap-4 animate-fade-in-up">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
                                    <CheckCircle size={40} className="text-green-400" />
                                </div>
                                <h3 className="font-bold text-green-400 text-lg">Laporan Terkirim!</h3>
                                <p className="text-slate-400 text-sm text-center">Laporan berhasil dikirim ke Admin</p>
                            </div>
                        )}

                        {/* Modal Body - Report Preview */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Shift Jaga selector */}
                            <div className="mb-3 bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Shift Jaga</label>
                                <div className="flex gap-1.5">
                                    {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setReportShift(key)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${reportShift === key
                                                    ? `bg-gradient-to-r ${cfg.color} text-white shadow-md`
                                                    : 'bg-[#1a2332] border border-[#2a3a4a] text-slate-500'
                                                }`}
                                        >
                                            {cfg.icon} {key}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-500 mt-1.5 text-center">Waktu: {SHIFT_CONFIG[reportShift].time}</p>
                            </div>

                            {/* Editable Petugas Jaga */}
                            <div className="mb-4 bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                    <Edit3 size={10} /> Nama Petugas Jaga (dapat diubah)
                                </label>
                                <input
                                    type="text"
                                    value={petugasJaga}
                                    onChange={e => setPetugasJaga(e.target.value)}
                                    className="w-full bg-[#1a2332] border border-[#2a3a4a] rounded-lg px-3 py-2 text-sm text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Masukkan nama petugas jaga"
                                />
                            </div>

                            {/* Simulated PDF preview */}
                            <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-inner">
                                <h4 className="text-center font-bold text-sm mb-3">LAPORAN KEGIATAN POS ANTARA</h4>

                                {/* Info */}
                                <div className="text-[10px] space-y-1 mb-3">
                                    <div className="flex">
                                        <span className="w-24 font-bold">Hari / Tanggal</span>
                                        <span>: {reportDate.full}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-24 font-bold">Shift Jaga</span>
                                        <span>: {reportShift} ({SHIFT_CONFIG[reportShift].time})</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-24 font-bold">Petugas Jaga</span>
                                        <span>: {petugasJaga}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-24 font-bold">Jumlah WBP</span>
                                        <span>: {latestWbpCount === '-' ? 'Belum ada data apel' : `${latestWbpCount} orang`}</span>
                                    </div>
                                </div>

                                {/* Table */}
                                <table className="w-full text-[9px] border-collapse mb-4">
                                    <thead>
                                        <tr className="bg-slate-800 text-white">
                                            <th className="border border-slate-300 px-1 py-1.5 w-6 text-center">No</th>
                                            <th className="border border-slate-300 px-1 py-1.5 w-12 text-center">Waktu</th>
                                            <th className="border border-slate-300 px-2 py-1.5 text-left">Uraian Kegiatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="border border-slate-200 px-2 py-3 text-center text-slate-400 italic">
                                                    Tidak ada kegiatan pada tanggal ini
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredActivities.map((item, idx) => (
                                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                                                    <td className="border border-slate-200 px-1 py-1.5 text-center">{idx + 1}</td>
                                                    <td className="border border-slate-200 px-1 py-1.5 text-center font-mono">{item.time}</td>
                                                    <td className="border border-slate-200 px-2 py-1.5">{item.desc}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* TTD */}
                                <div className="text-right text-[9px] mr-4 mt-4">
                                    <p>Yogyakarta, {reportDate.tanggal}</p>
                                    <p>Petugas Jaga,</p>
                                    <div className="h-12"></div>
                                    <p className="font-bold underline">{petugasJaga}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-[#2a3a4a] space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadPdf}
                                    disabled={isGeneratingPdf || isSending}
                                    className="flex-1 py-3 bg-[#0d1420] border border-[#2a3a4a] rounded-2xl text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#243044] transition disabled:opacity-50"
                                >
                                    {isGeneratingPdf ? (
                                        <><Loader2 size={14} className="animate-spin" /> PDF...</>
                                    ) : (
                                        <><Download size={14} /> Unduh PDF</>
                                    )}
                                </button>
                                <button
                                    onClick={sendReport}
                                    disabled={isSending || isGeneratingPdf || !petugasJaga.trim()}
                                    className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:from-teal-400 hover:to-cyan-400 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <><Loader2 size={14} className="animate-spin" /> Mengirim...</>
                                    ) : (
                                        <><Send size={14} /> Kirim ke Admin</>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => setShowReportPreview(false)}
                                className="w-full py-2.5 text-slate-500 font-bold text-xs hover:text-slate-300 transition"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
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
                        <button
                            onClick={() => setSortNewestFirst(prev => !prev)}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg bg-[#0d1420] border border-[#2a3a4a] text-slate-400 hover:border-teal-500/30 hover:text-teal-400 transition-all"
                            title={sortNewestFirst ? 'Terbaru di atas' : 'Terlama di atas'}
                        >
                            <ArrowUpDown size={12} />
                            {sortNewestFirst ? 'Terbaru' : 'Terlama'}
                        </button>
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs font-bold text-slate-400 bg-[#0d1420] border border-[#2a3a4a] rounded-lg p-1.5 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="space-y-4 pb-6">
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

                {/* Kirim Laporan button - only for Rupam accounts */}
                {isRupam && (
                    <div className="mt-2 pb-10">
                        <button
                            onClick={openReportPreview}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400"
                        >
                            <Send size={18} />
                            Kirim Laporan ke Admin
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityScreen;
