import React, { useState } from 'react';
import {
    User, QrCode, Users, ClipboardList, PlusCircle,
    CalendarDays, Sunrise, Sun, Moon, X, Eye
} from 'lucide-react';
import MenuCard from '../components/MenuCard';

const HomeScreen = ({ user, setCurrentScreen, apelHistory, activityLog }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewImage, setViewImage] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace('.', ':');
    };

    const getApelData = (shift) => {
        const found = apelHistory.find(item => item.dateISO === selectedDate && item.shift === shift);
        return found ? found.total : '-';
    };

    const getFilteredActivities = () => {
        return activityLog
            .filter(item => item.dateISO === selectedDate)
            .sort((a, b) => {
                if (b.time !== a.time) return b.time.localeCompare(a.time);
                return b.id.toString().localeCompare(a.id.toString());
            });
    };

    const activities = getFilteredActivities();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0f1729] font-sans pb-10">
            {viewImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 rounded-full p-2 transition-all">
                        <X size={28} />
                    </button>
                    <img src={viewImage} alt="Full View" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain animate-scale-up" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            <div className="h-64 bg-[#0a1020] rounded-b-[3.5rem] relative overflow-hidden shadow-2xl shadow-black/50">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-15"></div>
                <div className="absolute top-10 -right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] opacity-15"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
            </div>

            <div className="px-6 -mt-44 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-1">Status: Aktif</p>
                        <h2 className="text-3xl font-black text-white leading-tight">{user.name}</h2>

                        <div className="mt-4 mb-2">
                            <p className="text-slate-400 text-xs font-medium opacity-80">{formatDate(currentTime)}</p>
                            <p className="text-white text-3xl font-mono font-bold tracking-tighter">{formatTime(currentTime)} <span className="text-sm font-sans text-teal-400">WIB</span></p>
                        </div>

                        <div className="mt-2 inline-flex items-center px-3 py-1 bg-white/5 backdrop-blur-md border border-[#2a3a4a] rounded-full">
                            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wide">{user.role}</span>
                        </div>
                    </div>
                    <button onClick={() => setCurrentScreen('profile')} className="w-14 h-14 bg-[#1a2332] backdrop-blur-lg border border-[#2a3a4a] rounded-2xl flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all shadow-lg overflow-hidden p-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} />
                        )}
                    </button>
                </div>

                <div className="bg-[#1a2332] rounded-3xl p-5 shadow-xl shadow-black/30 border border-[#2a3a4a] mb-6">
                    <div className="flex items-center justify-between mb-4 border-b border-[#2a3a4a] pb-3">
                        <h3 className="font-bold text-slate-200 text-sm flex items-center">
                            <CalendarDays className="w-4 h-4 mr-2 text-teal-400" />
                            Monitoring Harian
                        </h3>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs font-bold text-slate-400 bg-[#0d1420] border border-[#2a3a4a] rounded-lg p-1.5 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="bg-[#0d1420] p-3 rounded-2xl border border-teal-500/20 text-center">
                            <div className="flex justify-center text-teal-400 mb-1"><Sunrise size={18} /></div>
                            <p className="text-[10px] font-bold text-teal-400/70 uppercase">Pagi</p>
                            <p className="text-xl font-black text-slate-100">{getApelData('Pagi')}</p>
                        </div>
                        <div className="bg-[#0d1420] p-3 rounded-2xl border border-cyan-500/20 text-center">
                            <div className="flex justify-center text-cyan-400 mb-1"><Sun size={18} /></div>
                            <p className="text-[10px] font-bold text-cyan-400/70 uppercase">Siang</p>
                            <p className="text-xl font-black text-slate-100">{getApelData('Siang')}</p>
                        </div>
                        <div className="bg-[#0d1420] p-3 rounded-2xl border border-purple-500/20 text-center">
                            <div className="flex justify-center text-purple-400 mb-1"><Moon size={18} /></div>
                            <p className="text-[10px] font-bold text-purple-400/70 uppercase">Malam</p>
                            <p className="text-xl font-black text-slate-100">{getApelData('Malam')}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1">Timeline Kegiatan</h4>
                        <div className="space-y-0 h-96 overflow-y-auto pr-1 scrollbar-hide">
                            {activities.length === 0 ? (
                                <p className="text-center text-slate-500 text-xs py-10 italic bg-[#0d1420] rounded-xl border border-[#2a3a4a]">Tidak ada kegiatan pada tanggal ini.</p>
                            ) : (
                                activities.map((act, idx) => (
                                    <div key={idx} className="flex gap-4 pb-6 relative last:pb-0 group">
                                        <div className="w-12 text-right pt-0.5 flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-500">{act.time}</span>
                                        </div>
                                        <div className="relative flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-[#1a2332] shadow-sm z-10 relative">
                                                {idx === 0 && selectedDate === new Date().toISOString().split('T')[0] && (
                                                    <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-75"></div>
                                                )}
                                            </div>
                                            {idx !== activities.length - 1 && (
                                                <div className="absolute top-3 w-0.5 h-full bg-[#2a3a4a] group-hover:bg-teal-500/20 transition-colors"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 bg-[#0d1420] p-4 rounded-2xl border border-[#2a3a4a] hover:border-teal-500/20 hover:shadow-sm transition-all mb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-200">{act.name}</p>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{act.user}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed">{act.desc}</p>
                                            {((act.images && act.images.length > 0) || act.image) && (
                                                <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                    {(act.images || [act.image]).map((img, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setViewImage(img)}
                                                            className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#2a3a4a] shadow-sm group hover:ring-2 hover:ring-teal-400 focus:outline-none transition-all"
                                                        >
                                                            <img
                                                                src={img}
                                                                alt="Bukti"
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                                                                <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md scale-90 group-hover:scale-100 transition-all" size={20} />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {user.role !== 'Viewer' && (
                    <div className="grid grid-cols-3 gap-3">
                        <MenuCard
                            icon={QrCode}
                            title="Kontrol"
                            desc="Keliling"
                            color="text-teal-400"
                            onClick={() => setCurrentScreen('scan')}
                            variant="col"
                        />
                        <MenuCard
                            icon={Users}
                            title="Apel"
                            desc="Hunian"
                            color="text-cyan-400"
                            onClick={() => setCurrentScreen('apel')}
                            variant="col"
                        />
                        <MenuCard
                            icon={ClipboardList}
                            title="Kegiatan"
                            desc="Pos"
                            color="text-purple-400"
                            onClick={() => setCurrentScreen('activity')}
                            variant="col"
                        />
                    </div>
                )}

                {user.role === 'Super Admin' && (
                    <div className="mt-4 pt-4 border-t border-[#2a3a4a]">
                        <MenuCard
                            icon={PlusCircle}
                            title="Manajemen Titik (Admin)"
                            desc="Kelola QR Code"
                            color="text-purple-400"
                            onClick={() => setCurrentScreen('generator')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;
