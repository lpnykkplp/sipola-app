import React, { useState } from 'react';
import { User, ChevronRight, Building2, RefreshCcw, Lock, Monitor } from 'lucide-react';
import { ACCOUNTS } from '../data/data';

import { api } from '../services/api';

const LoginScreen = ({ setUser, setCurrentScreen }) => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [loading, setLoading] = useState(false);
    // We could fetch users list here for the dropdown, but for now we rely on the static list + DB auth
    // to map to the accounts in the DB.

    const doLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // authenticate via supabase
            const user = await api.login(u, p);
            if (user) {
                setUser(user);
                setCurrentScreen('home');
            } else {
                alert("Login Gagal! Username atau password salah.");
            }
        } catch (error) {
            console.error(error);
            alert("Login Gagal! Koneksi error atau data salah.");
        } finally {
            setLoading(false);
        }
    };

    const doViewerLogin = async () => {
        setLoading(true);
        try {
            // Use real credentials from seed data
            const user = await api.login('viewer', 'viewer123');
            if (user) {
                setUser(user);
                setCurrentScreen('home');
            } else {
                alert("Akun Viewer tidak ditemukan di database.");
            }
        } catch (error) {
            console.error(error);
            alert("Gagal masuk sebagai Viewer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50vh] h-[50vh] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40vh] h-[40vh] bg-cyan-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            </div>
            <div className="w-full max-w-sm z-10 relative flex flex-col justify-center">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 mb-5">
                        <Building2 className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-1">SiPola</h1>
                    <div className="flex items-center justify-center space-x-2 opacity-80">
                        <div className="h-px w-8 bg-blue-400/50"></div>
                        <p className="text-blue-100 text-[10px] font-bold tracking-[0.25em] uppercase">Sistem Pelaporan Online</p>
                        <div className="h-px w-8 bg-blue-400/50"></div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 rounded-3xl">
                    <form onSubmit={doLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-blue-200/80 uppercase tracking-widest ml-1">Identitas Petugas</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="text-white/40 w-5 h-5 group-focus-within:text-blue-400 transition-colors duration-300" />
                                </div>
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-black/30 transition-all appearance-none font-medium text-sm"
                                    value={u}
                                    onChange={e => setU(e.target.value)}
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">Pilih Akun...</option>
                                    {ACCOUNTS.map(a => <option key={a.username} value={a.username} className="bg-slate-900 text-white">{a.username}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronRight className="text-white/20 w-4 h-4 rotate-90" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-blue-200/80 uppercase tracking-widest ml-1">Kode Akses</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-white/40 w-5 h-5 group-focus-within:text-blue-400 transition-colors duration-300" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-black/30 transition-all font-medium tracking-widest text-sm"
                                    placeholder="••••••"
                                    value={p}
                                    onChange={e => setP(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center ring-1 ring-white/20">
                            {loading ? <RefreshCcw className="animate-spin w-5 h-5 opacity-80" /> : <span className="tracking-wide">MASUK SISTEM</span>}
                        </button>
                        <div className="pt-2 border-t border-white/10">
                            <button type="button" onClick={doViewerLogin} className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-blue-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center text-xs tracking-wider">
                                <Monitor className="w-4 h-4 mr-2 opacity-80" /> MODE MONITORING (VIEWER)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
