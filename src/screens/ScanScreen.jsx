import { api } from '../services/api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, MapPin, CheckCircle, AlertTriangle, History
} from 'lucide-react';

const ScanScreen = ({ setCurrentScreen, qrDatabase, setScanHistory, scanHistory, refreshData }) => {
    const [result, setResult] = useState(null);
    const [tempScan, setTempScan] = useState(null);
    const [condition, setCondition] = useState('Aman');
    const [description, setDescription] = useState('');
    const scannerRef = useRef(null);
    const qrDatabaseRef = useRef(qrDatabase); // Always hold latest
    const [status, setStatus] = useState('idle');
    const [showHistory, setShowHistory] = useState(false);

    // Keep the ref in sync with the prop at all times
    useEffect(() => {
        qrDatabaseRef.current = qrDatabase;
        console.log("QR Database updated, count:", qrDatabase.length, qrDatabase.map(q => q.id));
    }, [qrDatabase]);

    // Whether the camera view should be visible (no overlays)
    const isCameraVisible = !result && !tempScan;

    const startCam = useCallback(async () => {
        if (!window.Html5Qrcode) return;
        try {
            // Always create a fresh instance for a clean DOM binding
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) await scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch { }
                scannerRef.current = null;
            }
            scannerRef.current = new window.Html5Qrcode("reader");

            await scannerRef.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250, aspectRatio: 1 },
                (txt) => handleScan(txt),
                () => { }
            );
            setStatus('scanning');
        } catch (e) {
            console.error("Camera start error:", e);
            scannerRef.current = null;
        }
    }, []);

    const stopCam = useCallback(async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                console.error("Stop cam error:", e);
            }
            scannerRef.current = null;
            setStatus('idle');
        }
    }, []);

    const handleScan = useCallback((txt) => {
        // Stop camera immediately
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().then(() => {
                try { scannerRef.current.clear(); } catch { }
                scannerRef.current = null;
            }).catch(() => { scannerRef.current = null; });
        }
        setStatus('idle');

        const scannedText = txt.trim();
        // Read from REF (always latest), not from the closure-captured prop
        const currentDb = qrDatabaseRef.current;
        console.log("Scanned QR text:", scannedText);
        console.log("QR Database IDs:", currentDb.map(q => q.id));

        // Robust matching: trim and compare (case-insensitive)
        const point = currentDb.find(q =>
            q.id.toString().trim() === scannedText ||
            q.id.toString().trim().toLowerCase() === scannedText.toLowerCase()
        );

        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const dateISO = new Date().toISOString().split('T')[0];

        if (point) {
            setTempScan({ ...point, time, dateISO });
        } else {
            setResult({ id: scannedText, valid: false });
        }
    }, []);

    const handleSaveScan = async () => {
        if (!tempScan) return;
        try {
            await api.addScanLog({
                id: Date.now(),
                loc: tempScan.location,
                status: condition,
                desc: description,
                time: tempScan.time,
                dateISO: tempScan.dateISO
            });
            refreshData();
            setResult({ ...tempScan, valid: true, status: condition });
            setTempScan(null);
            setCondition('Aman');
            setDescription('');
        } catch (e) {
            alert("Gagal menyimpan scan: " + e.message);
        }
    };

    // Initial camera start
    useEffect(() => {
        if (!window.Html5Qrcode) {
            const s = document.createElement('script');
            s.src = "https://unpkg.com/html5-qrcode";
            s.async = true;
            s.onload = () => setTimeout(startCam, 500);
            document.body.appendChild(s);
        } else {
            setTimeout(startCam, 300);
        }
        return () => stopCam();
    }, []);

    // Restart camera when user dismisses result/tempScan
    const resetScan = useCallback(() => {
        setResult(null);
        setTempScan(null);
        setCondition('Aman');
        setDescription('');
        // Give React a tick to re-render the #reader div, then start camera
        setTimeout(() => startCam(), 300);
    }, [startCam]);

    const statusColors = {
        'Aman': 'bg-green-500 hover:bg-green-600',
        'Rawan': 'bg-yellow-500 hover:bg-yellow-600',
        'Waspada': 'bg-orange-500 hover:bg-orange-600',
        'Bahaya': 'bg-red-600 hover:bg-red-700',
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition">
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold tracking-wider text-sm uppercase opacity-90">Scanner Mode</span>
                    <span className="text-[10px] text-white/50">{status === 'scanning' ? 'Mencari QR...' : 'Standby'}</span>
                </div>
                <button onClick={() => setShowHistory(true)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
                    <History size={20} className="text-white" />
                </button>
            </div>

            <div className="flex-1 relative flex flex-col">
                <div className="relative flex-1 bg-slate-900 overflow-hidden">
                    {/* Reader div: always rendered when no overlay, destroyed on overlay to release camera */}
                    {isCameraVisible && (
                        <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"></div>
                    )}
                    {isCameraVisible && (
                        <div className="absolute inset-0 flex flex-col items-end justify-end pointer-events-none pb-10">
                            <p className="text-sm font-medium text-white/70 bg-black/50 px-4 py-2 rounded-full backdrop-blur mx-auto">Arahkan kamera ke QR Code</p>
                        </div>
                    )}
                    {tempScan && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm z-30">
                            <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 text-blue-600">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{tempScan.location}</h3>
                                        <p className="text-xs text-slate-500">{tempScan.time}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status Keadaan</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Aman', 'Rawan', 'Waspada', 'Bahaya'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setCondition(opt)}
                                                className={`py-3 rounded-xl text-sm font-bold transition-all ${condition === opt
                                                    ? statusColors[opt] + ' text-white shadow-lg scale-105'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Catatan (Opsional)</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                                        rows="3"
                                        placeholder="Deskripsikan kondisi..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    ></textarea>
                                </div>
                                <button onClick={handleSaveScan} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl">
                                    Simpan Laporan
                                </button>
                                <button onClick={resetScan} className="w-full mt-3 text-slate-400 text-sm font-bold hover:text-slate-600">
                                    Batal Scan
                                </button>
                            </div>
                        </div>
                    )}
                    {result && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm z-30">
                            <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 text-center animate-fade-in-up">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {result.valid ? <CheckCircle size={40} /> : <AlertTriangle size={40} />}
                                </div>
                                <h3 className="text-xl font-bold mb-1">{result.valid ? 'Laporan Tersimpan' : 'QR Tidak Terdaftar'}</h3>
                                <p className="text-slate-500 text-sm mb-6">{result.valid ? result.location : `ID: ${result.id} belum ada di database.`}</p>
                                {result.valid && (
                                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-400">Waktu</span>
                                            <span className="font-bold font-mono">{result.time}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-400">Status</span>
                                            <span className={`font-bold ${result.status === 'Aman' ? 'text-green-600' :
                                                result.status === 'Rawan' ? 'text-yellow-600' :
                                                    result.status === 'Waspada' ? 'text-orange-600' :
                                                        'text-red-600'
                                                }`}>
                                                {result.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <button onClick={resetScan} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition">
                                    Scan Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Modal */}
                {showHistory && (
                    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-fade-in-up">
                        <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center text-slate-900">
                            <h3 className="font-bold text-lg flex items-center">
                                <History className="mr-2 text-slate-400" size={20} /> Riwayat Sesi Ini
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {scanHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <History size={48} className="mb-2" />
                                    <p className="text-sm font-bold">Belum ada data scan.</p>
                                </div>
                            ) : (
                                scanHistory.map(log => (
                                    <div key={log.id} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${log.status === 'Aman' ? 'bg-green-500' :
                                                    log.status === 'Rawan' ? 'bg-yellow-500' :
                                                        log.status === 'Waspada' ? 'bg-orange-500' :
                                                            'bg-red-600'
                                                    }`}></div>
                                                <p className="font-bold text-slate-800">{log.loc}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-1">{log.time}</span>
                                                <span className="block text-[10px] font-bold text-slate-400">
                                                    {new Date(log.dateISO).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-sm text-slate-600 mb-2 italic">"{log.desc || "Tidak ada catatan."}"</p>
                                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${log.status === 'Aman' ? 'bg-green-50 text-green-600' :
                                                log.status === 'Rawan' ? 'bg-yellow-50 text-yellow-600' :
                                                    log.status === 'Waspada' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-red-50 text-red-600'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanScreen;
