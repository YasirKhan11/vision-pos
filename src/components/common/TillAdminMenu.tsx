import React from 'react';

interface TillAdminMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TillAdminMenu = ({ isOpen, onClose }: TillAdminMenuProps) => {
    const adminMenuItems = [
        { title: 'Cash-up', key: 'F7', disabled: false, icon: '📊' },
        { title: 'Swop Branches', key: '', disabled: false, icon: '🔄' },
        { title: 'LOCK / UNLOCK Till', key: '', disabled: false, icon: '🔒' },
        { title: 'Day End', key: '', disabled: true, icon: '📅' },
        { title: 'Reprint Last Invoice', key: '', disabled: true, icon: '🖨️' },
        { title: 'Till Settings', key: '', disabled: true, icon: '⚙️' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="bg-[#17316c] px-6 py-4 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                            <span className="text-xl">🛠️</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wider">Till Administration</h2>
                            <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">System Configuration & Tools</p>
                        </div>
                    </div>
                    <button
                        className="w-8 h-8 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all relative z-10"
                        onClick={onClose}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Grid */}
                <div className="p-6 bg-slate-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {adminMenuItems.map(item => (
                            <div
                                key={item.title}
                                className={`
                                    relative group rounded-xl p-6 border transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center min-h-[140px]
                                    ${item.disabled
                                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed selection:bg-transparent'
                                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-[#17316c]/30 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
                                    }
                                `}
                                onClick={!item.disabled ? onClose : undefined}
                                tabIndex={item.disabled ? -1 : 0}
                                role="button"
                                aria-disabled={item.disabled}
                            >
                                {item.key && (
                                    <div className={`
                                        absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border
                                        ${item.disabled
                                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                                            : 'bg-[#17316c]/5 text-[#17316c] border-[#17316c]/10 group-hover:bg-[#17316c] group-hover:text-white transition-colors'
                                        }
                                    `}>
                                        {item.key}
                                    </div>
                                )}
                                <div className={`text-4xl filter drop-shadow-sm transition-transform duration-300 ${!item.disabled && 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </div>
                                <h3 className={`
                                    text-[11px] font-black uppercase tracking-tight max-w-[80%] leading-tight
                                    ${item.disabled ? 'text-slate-400' : 'text-slate-700 group-hover:text-[#17316c]'}
                                `}>
                                    {item.title}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
                    <button
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm flex items-center gap-2"
                        onClick={onClose}
                    >
                        <span className="bg-slate-100 border border-slate-200 px-1.5 rounded text-[9px] text-slate-400 font-bold">ESC</span>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
