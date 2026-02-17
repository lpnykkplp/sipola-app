import React from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Header = ({ title, subtitle, onBack }) => (
    <div className="flex items-center justify-between mb-4 pt-1 px-1">
        <div className="flex items-center">
            {onBack && (
                <button onClick={onBack} className="mr-3 w-8 h-8 bg-[#1a2332] rounded-full flex items-center justify-center text-slate-400 hover:bg-[#243044] hover:text-teal-400 transition-all active:scale-90 border border-[#2a3a4a]">
                    <ChevronLeft size={18} />
                </button>
            )}
            <div>
                <h1 className="text-lg font-black text-slate-100 tracking-tight leading-none">{title}</h1>
                {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center text-white transform rotate-3 shadow-md shadow-teal-500/20">
            <ShieldCheck size={18} />
        </div>
    </div>
);

export default Header;
