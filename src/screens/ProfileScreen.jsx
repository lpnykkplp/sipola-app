import React, { useState, useRef } from 'react';
import { User, CheckCircle, Edit, LogOut, Camera, Save, X, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const ProfileScreen = ({ user, setUser, setCurrentScreen }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || null); // Base64 string
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Resize image to avoid huge payload
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300; // Small profile pic
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setAvatar(compressedDataUrl);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("Nama tidak boleh kosong!");
        setLoading(true);
        try {
            // Optimistic update
            const updates = {
                name: name,
                avatar: avatar
            };

            // Call API
            const updatedUser = await api.updateProfile(user.id, updates);

            // Update local state
            setUser(updatedUser);
            setIsEditing(false);
            alert("Profil berhasil diperbarui!");
        } catch (e) {
            console.error(e);
            alert("Gagal memperbarui profil: " + e.message);
            // If column 'avatar' is missing, likely error code 42703 (undefined column)
            if (e.message.includes("avatar")) {
                alert("Kolom 'avatar' belum ada di database. Silakan jalankan script SQL tambahan.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sipola_user');
        localStorage.removeItem('sipola_screen');
        setUser(null);
        setCurrentScreen('login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 flex flex-col items-center pt-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-100/50 to-transparent z-0"></div>

            <div className="relative z-10 w-full flex flex-col items-center max-w-md">
                {/* Avatar Section */}
                <div className="relative mb-6 group">
                    <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center relative border-4 border-white shadow-lg overflow-hidden">
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-slate-300" />
                        )}


                        {isEditing && (
                            <>
                                <div
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity hover:bg-black/50"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <Camera className="text-white opacity-80" size={32} />
                                </div>
                                {avatar && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Hapus foto profil?")) setAvatar(null);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition z-10"
                                        title="Hapus Foto"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>

                {/* Name & Role Section */}
                {isEditing ? (
                    <div className="w-full mb-8 space-y-4 animate-fade-in-up">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nama Petugas</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nama Lengkap"
                            />
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
                                {user.role} (Tidak dapat diubah)
                            </span>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight text-center">{user.name}</h2>
                        <p className="text-slate-500 font-bold bg-white px-6 py-2 rounded-full text-sm mb-12 border border-slate-100 uppercase tracking-wide shadow-sm">
                            {user.role}
                        </p>
                    </>
                )}

                {/* Action Buttons */}
                <div className="w-full space-y-4">
                    {isEditing ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsEditing(false); setName(user.name); setAvatar(user.avatar); }}
                                className="flex-1 bg-white border border-slate-200 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-50 transition active:scale-95"
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition active:scale-95 flex items-center justify-center shadow-lg shadow-blue-200"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Simpan</>}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-sm"
                            >
                                <Edit size={18} className="mr-2 text-slate-400" /> Edit Profil
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition flex items-center justify-center active:scale-95 border border-red-100"
                            >
                                <LogOut size={18} className="mr-2" /> Keluar Aplikasi
                            </button>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <button onClick={() => setCurrentScreen('home')} className="mt-8 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest transition-colors">
                        Kembali
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileScreen;
