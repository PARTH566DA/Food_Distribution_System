import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Gradient from '../component/Gradient';
import {
    adminLogin,
    adminFetchZones,
    adminUpdateZoneStatus,
    isAdminAuthenticated,
    saveAdminToken,
    clearAdminToken,
} from '../api/admin';

const gradientProps = {
    color1: '#faaca2', color2: '#fcb594', color3: '#f88ca6',
    timeSpeed: 2.35, colorBalance: -0.02, warpStrength: 1.35,
    warpFrequency: 5, warpSpeed: 2, warpAmplitude: 50,
    blendAngle: 0, blendSoftness: 0.3, rotationAmount: 890,
    noiseScale: 2.25, grainAmount: 0.1, grainScale: 2,
    grainAnimated: false, contrast: 1.5, gamma: 1, saturation: 1,
    centerX: 0, centerY: 0, zoom: 1.65,
};

const STATUS_META = {
    ACTIVE:   { label: 'Active',   color: '#FF6B55', bg: '#FFF0EE', badge: 'bg-[#FFECEA] text-[#FF6B55]' },
    PENDING:  { label: 'Pending',  color: '#FFB347', bg: '#FFF9F0', badge: 'bg-orange-50 text-orange-500' },
    INACTIVE: { label: 'Inactive', color: '#BDBDBD', bg: '#F5F5F5', badge: 'bg-gray-100 text-gray-400'   },
};

const TABS = ['ALL', 'PENDING', 'ACTIVE', 'INACTIVE'];

const MotionDiv = motion.div;
const MotionP = motion.p;

const LoginScreen = ({ onSuccess }) => {
    const [adminId, setAdminId]     = useState('');
    const [password, setPassword]   = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [showPass, setShowPass]   = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!adminId.trim() || !password.trim()) { setError('All fields are required.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await adminLogin(adminId.trim(), password);
            saveAdminToken(res.data);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0"><Gradient {...gradientProps} /></div>

            <MotionDiv
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-full max-w-sm mx-4"
            >
                <div className="bg-[#FFF7F6] rounded-[28px] p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#FFECEA] flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Portal</h1>
                    <p className="text-sm text-gray-500 text-center mb-7">Zone verification dashboard</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin ID</label>
                            <input
                                type="text"
                                autoComplete="username"
                                placeholder="Enter admin ID"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                className="w-full rounded-[14px] border border-[#FFE0DB] bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF8B77] focus:ring-2 focus:ring-[#FFECEA] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-[14px] border border-[#FFE0DB] bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF8B77] focus:ring-2 focus:ring-[#FFECEA] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF8B77] transition-colors"
                                >
                                    {showPass ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <MotionP initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="text-xs text-red-500 font-medium text-center">{error}</MotionP>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="relative overflow-hidden w-full h-[52px] rounded-full font-bold text-base text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            style={{
                                background: 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)',
                                boxShadow: '0 8px 24px rgba(255,107,85,0.4)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Signing in…
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
            </MotionDiv>
        </div>
    );
};

const ZoneCard = ({ zone, onStatusChange, actionLoading }) => {
    const meta = STATUS_META[zone.status] ?? STATUS_META.INACTIVE;
    const isLoading = actionLoading === zone.needyZoneId;

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-[20px] border border-[#FFE0DB] p-4 flex flex-col gap-3"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{zone.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {zone.latitude?.toFixed(5)}, {zone.longitude?.toFixed(5)}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>
                        {meta.label}
                    </span>
                    {zone.reportCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                            ⚑ {zone.reportCount} report{zone.reportCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    {zone.createdByName}
                </div>
                {zone.createdAt && (
                    <div className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(zone.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-1">
                {zone.status !== 'ACTIVE' && (
                    <button
                        onClick={() => onStatusChange(zone.needyZoneId, 'ACTIVE')}
                        disabled={isLoading}
                        className="flex-1 h-9 rounded-full text-xs font-bold text-white transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #FF8B77, #FF6B55)', boxShadow: '0 4px 12px rgba(255,107,85,0.3)' }}
                    >
                        {isLoading ? '…' : '✓ Approve'}
                    </button>
                )}
                {zone.status !== 'INACTIVE' && (
                    <button
                        onClick={() => onStatusChange(zone.needyZoneId, 'INACTIVE')}
                        disabled={isLoading}
                        className="flex-1 h-9 rounded-full text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '…' : '✕ Reject'}
                    </button>
                )}
                {zone.status !== 'PENDING' && (
                    <button
                        onClick={() => onStatusChange(zone.needyZoneId, 'PENDING')}
                        disabled={isLoading}
                        className="flex-1 h-9 rounded-full text-xs font-bold text-orange-500 bg-orange-50 hover:bg-orange-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '…' : '↩ Pending'}
                    </button>
                )}
            </div>
        </MotionDiv>
    );
};

const Dashboard = ({ onLogout }) => {
    const [zones, setZones]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [activeTab, setActiveTab]     = useState('PENDING');
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast]             = useState('');

    const loadZones = useCallback(() => {
        adminFetchZones()
            .then(setZones)
            .catch((e) => setError(e.message || 'Failed to load zones.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadZones(); }, [loadZones]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const handleStatusChange = async (zoneId, newStatus) => {
        setActionLoading(zoneId);
        try {
            await adminUpdateZoneStatus(zoneId, newStatus);
            setZones((prev) =>
                prev.map((z) => z.needyZoneId === zoneId ? { ...z, status: newStatus } : z)
            );
            showToast(`Zone marked as ${newStatus.toLowerCase()}.`);
        } catch (e) {
            showToast(`Error: ${e.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = activeTab === 'ALL' ? zones : zones.filter((z) => z.status === activeTab);

    const counts = {
        ALL: zones.length,
        PENDING:  zones.filter((z) => z.status === 'PENDING').length,
        ACTIVE:   zones.filter((z) => z.status === 'ACTIVE').length,
        INACTIVE: zones.filter((z) => z.status === 'INACTIVE').length,
    };

    return (
        <div className="relative h-screen w-full overflow-hidden flex flex-col">
            <div className="absolute inset-0"><Gradient {...gradientProps} /></div>

            <div className="relative z-10 flex flex-col h-full p-4 gap-3">

                <div className="flex items-center justify-between bg-[#FFECEA] rounded-[22px] px-5 py-3 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FF8B77] flex items-center justify-center">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-[#C0ABA6] leading-tight">Admin Portal</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight">Zone Verification</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { clearAdminToken(); onLogout(); }}
                        className="px-4 py-2 rounded-full text-xs font-bold text-[#FF8B77] bg-white border border-[#FFE0DB] hover:bg-[#FFF0EE] transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    {[
                        { key: 'PENDING', label: 'Pending', color: '#FFB347' },
                        { key: 'ACTIVE',  label: 'Active',  color: '#FF6B55' },
                        { key: 'INACTIVE',label: 'Inactive',color: '#BDBDBD' },
                    ].map(({ key, label, color }) => (
                        <div key={key} className="flex-1 bg-[#FFF7F6] rounded-[16px] border border-[#FFE0DB] px-3 py-2.5 text-center">
                            <p className="text-xl font-bold" style={{ color }}>{counts[key]}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-1.5 bg-[#FFF7F6] rounded-[16px] p-1 border border-[#FFE0DB] flex-shrink-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-[12px] text-xs font-bold transition-all ${
                                activeTab === tab
                                    ? 'bg-[#FF8B77] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-[#FF8B77]'
                            }`}
                        >
                            {tab === 'ALL' ? `All (${counts.ALL})` : `${STATUS_META[tab]?.label} (${counts[tab]})`}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <div className="w-10 h-10 rounded-full border-4 border-[#FFECEA] border-t-[#FF8B77] animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Loading zones…</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-red-500 font-medium">⚠ {error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                            <div className="w-14 h-14 rounded-2xl bg-[#FFF0EE] flex items-center justify-center">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">No zones here</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {activeTab === 'PENDING' ? 'All zones have been reviewed.' : 'No zones with this status.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 pb-3">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((zone) => (
                                    <ZoneCard
                                        key={zone.needyZoneId}
                                        zone={zone}
                                        onStatusChange={handleStatusChange}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {toast && (
                    <MotionDiv
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl"
                    >
                        {toast}
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

const Admin = () => {
    const [loggedIn, setLoggedIn] = useState(isAdminAuthenticated());

    return loggedIn
        ? <Dashboard onLogout={() => setLoggedIn(false)} />
        : <LoginScreen onSuccess={() => setLoggedIn(true)} />;
};

export default Admin;
