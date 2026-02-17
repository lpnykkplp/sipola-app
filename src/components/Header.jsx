import React from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Header = ({ title, subtitle, onBack }) => (
    <div className="flex items-center justify-between mb-8 pt-4 px-1">
        <div className="flex items-center">
            {onBack && (
                <button onClick={onBack} className="mr-4 w-10 h-10 bg-[#1a2332] rounded-full flex items-center justify-center text-slate-400 hover:bg-[#243044] hover:text-teal-400 transition-all active:scale-90 border border-[#2a3a4a]">
                    <ChevronLeft size={22} />
                </button>
            )}
            <div>
                <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">{title}</h1>
                {subtitle && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{subtitle}</p>}
            </div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white transform rotate-3 shadow-lg shadow-teal-500/20">
            <ShieldCheck size={24} />
        </div>
    </div>
);

export default Header;
