import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { USE_MOCK_DATA } from '../data/mockData';

interface LoginPageProps {
    onLogin: (userCode: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [userCode, setUserCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const passRef = useRef<HTMLInputElement>(null);

    // Check server status on mount
    useEffect(() => {
        const checkServer = async () => {
            if (USE_MOCK_DATA) {
                setServerStatus('online');
                return;
            }
            try {
                console.log('Checking server health...');
                const isOnline = await api.auth.checkHealth();
                console.log('Health check result:', isOnline);
                setServerStatus(isOnline ? 'online' : 'offline');
            } catch (error) {
                console.error('Health check error:', error);
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);

        if (!userCode.trim()) {
            setError('Please enter a username');
            return;
        }

        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        setLoading(true);

        try {
            // Use the proper login endpoint that returns JWT token
            const authResponse = await api.auth.login({
                username: userCode,
                password: password,
            });

            // Token is automatically saved by authService
            console.log('Login successful, token received');

            // Call parent's onLogin with the username
            onLogin(authResponse.user?.username || userCode);
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-6 bg-slate-50">
            <form className="flex flex-col items-center w-full max-w-md p-10 bg-white shadow-2xl rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700" onSubmit={handleLogin}>
                <div className="mb-8 text-center">
                    <div className="mb-4 text-4xl text-[#17316c]">👁️</div>
                    <h2 className="text-4xl font-black tracking-tighter text-primary">Vision Modern POS</h2>
                    <p className="font-medium text-slate-400">Inventory Intelligence & Management</p>
                </div>

                <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 border
                    ${serverStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' :
                        serverStatus === 'offline' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-50 text-slate-400 border-slate-100'}
                `}>
                    <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : serverStatus === 'offline' ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                    {serverStatus === 'checking' ? 'Checking Server Connection...' :
                        serverStatus === 'online' ? 'Cloud Server Connected' : 'Server Connection Lost'}
                </div>

                <div className="w-full space-y-6">
                    <div className="flex flex-col">
                        <label htmlFor="userCode" className="block mb-2 text-[10px] font-black tracking-widest text-[#17316c] uppercase">Operator Username</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors text-lg">👤</span>
                            <input
                                type="text"
                                id="userCode"
                                className="w-full py-4 pl-14 pr-6 font-bold transition-all border outline-none bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                                value={userCode}
                                onChange={(e) => setUserCode(e.target.value)}
                                placeholder="Enter your username"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="block mb-2 text-[10px] font-black tracking-widest text-[#17316c] uppercase">Secure Password</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors text-lg">🔐</span>
                            <input
                                ref={passRef}
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="w-full py-4 pl-14 pr-14 font-bold transition-all border outline-none bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-colors focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center w-full gap-3 p-4 mt-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl animate-in slide-in-from-top-4">
                        <span className="text-lg">⚠️</span>
                        <div className="text-xs font-bold">{error}</div>
                    </div>
                )}

                <button
                    type="submit"
                    className={`
                        w-full py-4 mt-10 font-black text-lg transition-all rounded-2xl shadow-2xl active:scale-95
                        ${loading || serverStatus === 'offline'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-primary text-white hover:bg-primary-dark hover:-translate-y-1 shadow-primary/20'}
                    `}
                    disabled={loading || serverStatus === 'offline'}
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>AUTHORISING...</span>
                        </div>
                    ) : (
                        'SIGN IN'
                    )}
                </button>

                <div className="mt-10 text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
                    Version 18.0.3.0
                </div>
            </form>
        </div>
    );
};
