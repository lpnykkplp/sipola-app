import { api } from '../services/api';
import React, { useState, useEffect, useRef } from 'react';
import {
    X, MapPin, CheckCircle, AlertTriangle, History
} from 'lucide-react';

const ScanScreen = ({ setCurrentScreen, qrDatabase, setScanHistory, scanHistory, refreshData }) => {
    const [result, setResult] = useState(null);
    const [tempScan, setTempScan] = useState(null);
    const [condition, setCondition] = useState('Aman');
    const [description, setDescription] = useState('');
    const scannerRef = useRef(null);
    const [status, setStatus] = useState('idle');

    const startCam = async () => {
        if (!window.Html5Qrcode) return;
        if (!scannerRef.current) scannerRef.current = new window.Html5Qrcode("reader");
        try {
            await scannerRef.current.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: 250, aspectRatio: 1 },
                (txt) => handleScan(txt),
                () => { }
            );
            setStatus('scanning');
        } catch (e) {
            console.error(e);
        }
    };

    const stopCam = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
            setStatus('idle');
        }
    };

    const handleScan = (txt) => {
        stopCam();
        const point = qrDatabase.find(q => q.id === txt);
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const dateISO = new Date().toISOString().split('T')[0];
        if (point) {
            setTempScan({ ...point, time, dateISO });
        } else {
            setResult({ id: txt, valid: false });
            setStatus('error');
        }
    };

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
            refreshData(); // Fetch latest from DB
            setResult({ ...tempScan, valid: true, status: condition });
            setTempScan(null);
            setCondition('Aman');
            setDescription('');
        } catch (e) {
            alert("Gagal menyimpan scan: " + e.message);
        }
    };

    useEffect(() => {
        if (!window.Html5Qrcode) {
            const s = document.createElement('script');
            s.src = "https://unpkg.com/html5-qrcode";
            s.async = true;
            s.onload = () => setTimeout(startCam, 500);
            document.body.appendChild(s);
        } else {
            setTimeout(startCam, 100);
        }
        return () => stopCam();
    }, []);

    const resetScan = () => {
        setResult(null);
        setTempScan(null);
        startCam();
    };

    const statusColors = {
        'Aman': 'bg-green-500 hover:bg-green-600',
        'Rawan': 'bg-yellow-500 hover:bg-yellow-600',
        'Waspada': 'bg-orange-500 hover:bg-orange-600',
        'Bahaya': 'bg-red-600 hover:bg-red-700',
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20">
                    <X size={20} />
                </button>
                <span className="font-bold tracking-wider text-sm uppercase opacity-80">Scanner Mode</span>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 relative flex flex-col">
                <div className="relative flex-1 bg-slate-900 overflow-hidden">
                    {!result && !tempScan && (
                        <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"></div>
                    )}
                    {!result && !tempScan && (
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
                                <h3 className="text-xl font-bold mb-1">{result.valid ? 'Laporan Tersimpan' : 'Tidak Dikenal'}</h3>
                                <p className="text-slate-500 text-sm mb-6">{result.location || `ID: ${result.id}`}</p>
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

                <div className="h-1/3 bg-white text-slate-900 rounded-t-3xl -mt-6 z-10 p-6 flex flex-col">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                    <h4 className="font-bold text-lg mb-4 flex items-center">
                        <History className="mr-2 text-slate-400" size={18} /> Riwayat Sesi Ini
                    </h4>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {scanHistory.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4 italic">Belum ada data scan.</p>
                        ) : (
                            scanHistory.map(log => (
                                <div key={log.id} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${log.status === 'Aman' ? 'bg-green-500' :
                                                log.status === 'Rawan' ? 'bg-yellow-500' :
                                                    log.status === 'Waspada' ? 'bg-orange-500' :
                                                        'bg-red-600'
                                                }`}></div>
                                            <p className="font-bold text-sm text-slate-700">{log.loc}</p>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{log.time}</span>
                                    </div>
                                    <div className="pl-4 flex justify-between items-end">
                                        <p className="text-xs text-slate-500 line-clamp-1 italic">{log.desc || "Tidak ada catatan."}</p>
                                        <span className={`text-[10px] font-bold uppercase ${log.status === 'Aman' ? 'text-green-600' :
                                            log.status === 'Rawan' ? 'text-yellow-600' :
                                                log.status === 'Waspada' ? 'text-orange-600' :
                                                    'text-red-600'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanScreen;
