import React, { useState, useEffect, useMemo } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Download, X, ChevronDown, ChevronUp, Search, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

const ReportHistoryScreen = ({ user, setCurrentScreen }) => {
    const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
    const isRupam = user?.name?.toLowerCase().includes('rupam');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Load reports from Supabase
    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await api.getReports();
            // Map DB fields to app fields
            const mapped = (data || []).map(r => ({
                id: r.id,
                senderName: r.sender_name,
                petugasJaga: r.petugas_jaga,
                date: r.report_date,
                dateFormatted: r.date_formatted,
                wbpCount: r.wbp_count,
                activitiesCount: r.activities_count,
                activitiesSummary: r.activities_summary || [],
                status: r.status || 'pending',
                sentAt: r.sent_at || r.created_at
            }));
            // Rupam only sees their own reports
            if (isRupam && !isAdmin) {
                setReports(mapped.filter(r => r.senderName === user.name));
            } else {
                setReports(mapped);
            }
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const statusConfig = {
        pending: { label: 'Menunggu', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Clock },
        verified: { label: 'Diverifikasi', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
        rejected: { label: 'Ditolak', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
    };

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
            const matchesSearch = !searchQuery ||
                r.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.petugasJaga?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.dateFormatted?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [reports, filterStatus, searchQuery]);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.updateReportStatus(id, newStatus);
            setReports(prev => prev.map(r =>
                r.id === id ? { ...r, status: newStatus } : r
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Gagal memperbarui status: ' + err.message);
        }
    };

    // Generate and download PDF from report data
    const downloadPdf = async (report) => {
        try {
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

            // KOP SURAT
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN', pageW / 2, y, { align: 'center' });
            y += 7;
            doc.setFontSize(13);
            doc.text('LAPAS NARKOTIKA KELAS IIA YOGYAKARTA', pageW / 2, y, { align: 'center' });
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Jl. Kaliurang Km. 17, Pakembinangun, Pakem, Sleman, D.I. Yogyakarta', pageW / 2, y, { align: 'center' });
            y += 5;
            doc.setDrawColor(0);
            doc.setLineWidth(0.8);
            doc.line(margin, y, pageW - margin, y);
            y += 2;
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageW - margin, y);
            y += 10;

            // JUDUL
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text('LAPORAN KEGIATAN POS ANTARA', pageW / 2, y, { align: 'center' });
            y += 10;

            // INFO HEADER
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const infoItems = [
                ['Hari / Tanggal', report.dateFormatted],
                ['Petugas Jaga', report.petugasJaga],
                ['Jumlah WBP', report.wbpCount === '-' ? 'Belum ada data apel' : `${report.wbpCount} orang`],
            ];
            infoItems.forEach(([label, value]) => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}`, margin, y);
                doc.setFont('helvetica', 'normal');
                doc.text(`: ${value}`, margin + 40, y);
                y += 6;
            });
            y += 6;

            // TABLE
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

            const activities = report.activitiesSummary || [];
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

            // FOOTER / TTD
            addNewPageIfNeeded(40);
            const ttdX = pageW - margin - 60;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            // Parse tanggal from dateFormatted (e.g., "Selasa, 17 Februari 2026" -> "17 Februari 2026")
            const tanggalParts = (report.dateFormatted || '').split(', ');
            const tanggal = tanggalParts.length > 1 ? tanggalParts[1] : report.dateFormatted;
            doc.text(`Yogyakarta, ${tanggal}`, ttdX, y);
            y += 5;
            doc.text('Petugas Jaga,', ttdX, y);
            y += 25;
            doc.setFont('helvetica', 'bold');
            doc.text(report.petugasJaga || '', ttdX, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setLineWidth(0.5);
            doc.line(ttdX, y - 1, ttdX + 50, y - 1);

            const fileName = `Laporan_PosAntara_${report.date}_${(report.petugasJaga || '').replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Gagal membuat PDF: ' + err.message);
        }
    };

    const pendingCount = reports.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans flex flex-col">
            <div className="bg-[#1a2332] p-6 pt-8 border-b border-[#2a3a4a] sticky top-0 z-20">
                <Header title="Riwayat Laporan" subtitle={isAdmin ? 'Verifikasi Laporan Masuk' : 'Status Laporan Terkirim'} onBack={() => setCurrentScreen('home')} />

                {/* Stats */}
                <div className="flex gap-3 mt-4">
                    <div className="flex-1 bg-[#0d1420] border border-[#2a3a4a] rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-slate-100">{reports.length}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Total</p>
                    </div>
                    <div className="flex-1 bg-[#0d1420] border border-amber-500/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Menunggu</p>
                    </div>
                    <div className="flex-1 bg-[#0d1420] border border-green-500/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{reports.filter(r => r.status === 'verified').length}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Terverifikasi</p>
                    </div>
                </div>

                {/* Search, Filter, Refresh */}
                <div className="mt-3 flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari pengirim..."
                            className="w-full bg-[#0d1420] border border-[#2a3a4a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500"
                    >
                        <option value="all">Semua</option>
                        <option value="pending">Menunggu</option>
                        <option value="verified">Terverifikasi</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                    <button
                        onClick={loadReports}
                        disabled={loading}
                        className="bg-[#0d1420] border border-[#2a3a4a] rounded-xl px-3 py-2.5 text-slate-400 hover:text-teal-400 transition disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-teal-400 mb-3" />
                        <p className="text-slate-500 text-sm font-bold">Memuat laporan...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500 font-bold">Belum ada laporan</p>
                        <p className="text-slate-600 text-sm mt-1">Laporan dari Rupam akan muncul di sini</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-10">
                        {filteredReports.map(report => {
                            const isExpanded = expandedId === report.id;
                            const status = statusConfig[report.status] || statusConfig.pending;
                            const StatusIcon = status.icon;

                            return (
                                <GlassCard key={report.id} className="p-0 overflow-hidden">
                                    {/* Report header */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#0d1420]/30 transition"
                                    >
                                        <div className={`w-10 h-10 ${status.bg} rounded-xl flex items-center justify-center border ${status.border} flex-shrink-0`}>
                                            <StatusIcon size={18} className={status.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-bold text-slate-200 text-sm truncate">{report.senderName}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color} ${status.border} border flex-shrink-0 ml-2`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{report.dateFormatted}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                                                <span>Petugas: {report.petugasJaga}</span>
                                                <span>•</span>
                                                <span>WBP: {report.wbpCount}</span>
                                                <span>•</span>
                                                <span>{report.activitiesCount} kegiatan</span>
                                            </div>
                                        </div>
                                        {isExpanded ?
                                            <ChevronUp size={16} className="text-slate-500 flex-shrink-0" /> :
                                            <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
                                        }
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="border-t border-[#2a3a4a]">
                                            {/* Activity summary */}
                                            <div className="p-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ringkasan Kegiatan</p>
                                                {report.activitiesSummary && report.activitiesSummary.length > 0 ? (
                                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                                        {report.activitiesSummary.map((a, i) => (
                                                            <div key={i} className="flex gap-2 text-xs">
                                                                <span className="text-slate-500 font-mono flex-shrink-0">{a.time}</span>
                                                                <span className="text-slate-300">{a.desc}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 italic">Tidak ada kegiatan</p>
                                                )}

                                                <p className="text-[10px] text-slate-600 mt-3">
                                                    Dikirim: {new Date(report.sentAt).toLocaleString('id-ID')}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="p-4 border-t border-[#2a3a4a] flex gap-2">
                                                <button
                                                    onClick={() => downloadPdf(report)}
                                                    className="flex-1 py-2.5 bg-[#0d1420] border border-[#2a3a4a] rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#243044] transition"
                                                >
                                                    <Download size={14} /> Unduh PDF
                                                </button>
                                                {isAdmin && report.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(report.id, 'verified')}
                                                            className="flex-1 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-green-500/20 transition"
                                                        >
                                                            <CheckCircle size={14} /> Verifikasi
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(report.id, 'rejected')}
                                                            className="py-2.5 px-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-bold text-xs flex items-center justify-center hover:bg-red-500/20 transition"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                {isAdmin && report.status === 'rejected' && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, 'pending')}
                                                        className="flex-1 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition"
                                                    >
                                                        <Clock size={14} /> Reset
                                                    </button>
                                                )}
                                            </div>
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

export default ReportHistoryScreen;
