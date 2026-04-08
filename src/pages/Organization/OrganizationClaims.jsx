import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Loader2, ChevronLeft, ChevronRight, Calendar, Search, 
    Building2, ChevronDown, X, Check, Clock, Filter, 
    ShieldCheck, Info, XCircle, CheckCircle, Dog, User
} from "lucide-react";
import { toast } from "sonner";
import { fetchOrgClaimVerifications, updateClaimVerificationStatus } from "../../services/api";
import ProfileButton from "@/components/topBar/ProfileButton";
import Notifications from "@/components/notifications/Notifications";
import PawTrackLogo from "@/components/PawTrackLogo";
import OrganizationMenu from "@/components/organization/OrganizationMenu";

const PortalDropdown = ({ isOpen, onClose, anchorRef, options, value, onChange }) => {
    const [coords, setCoords] = useState(null);
    const headerHeight = 64;

    const updatePosition = () => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            let finalTop = rect.bottom;
            let finalOpacity = 1;

            if (rect.bottom < headerHeight) {
                finalTop = headerHeight;
                finalOpacity = 0;
            } else if (rect.top < headerHeight) {
                finalTop = headerHeight;
            }

            setCoords({
                top: finalTop,
                left: rect.left,
                width: rect.width,
                opacity: finalOpacity
            });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    if (!isOpen || !coords) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[10001]" 
            style={{ pointerEvents: coords.opacity === 0 ? 'none' : 'auto' }}
            onClick={onClose}
        >
            <div
                className="fixed bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 transition-opacity duration-150"
                style={{
                    top: `${coords.top + 4}px`,
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                    opacity: coords.opacity,
                    visibility: coords.opacity === 0 ? 'hidden' : 'visible'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => { onChange(opt.value); onClose(); }}
                        className={`w-full text-left px-3 py-2 text-xs font-black uppercase rounded-lg transition-colors flex items-center justify-between ${value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        {opt.label}
                        {value === opt.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};

const CustomDropdown = ({ label, icon: Icon, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative space-y-1.5" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full h-11 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}>
                <span className="text-sm font-bold text-gray-900 truncate">{selectedOption.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                    <div className="max-h-60 overflow-y-auto p-1.5">
                        {options.map((option) => (
                            <div key={option.value === "" ? "all-opt" : option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${option.value === value ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <span>{option.label}</span>
                                {option.value === value && <Check className="w-4 h-4" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const OrganizationClaims = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({ search: "", status: "" });
    const [activeDropdown, setActiveDropdown] = useState({ id: null, type: null });
    const dropdownRefs = useRef({});
    const filterPanelRef = useRef(null);

    useEffect(() => {
        loadClaims();
    }, [filters.status]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadClaims = async () => {
        try {
            setLoading(true);
            const data = await fetchOrgClaimVerifications();
            let filtered = data;
            if (filters.status) filtered = data.filter(c => c.status === filters.status);
            if (filters.search) {
                const s = filters.search.toLowerCase();
                filtered = filtered.filter(c => 
                    c.foundReport.title.toLowerCase().includes(s) || 
                    c.foundReport.titleEl.toLowerCase().includes(s) ||
                    c.foundReport.creator.firstName.toLowerCase().includes(s)
                );
            }
            setClaims(filtered);
        } catch (err) {
            toast.error(t('error_loading_claims'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setProcessingId(id);
            await updateClaimVerificationStatus(id, newStatus);
            toast.success(t(`claim_${newStatus.toLowerCase()}_success`));
            setActiveDropdown({ id: null, type: null });
            loadClaims();
        } catch (err) {
            toast.error(t('error_updating_claim'));
        } finally {
            setProcessingId(null);
        }
    };

    const statusOptions = [
        { value: "PENDING", label: t('status_pending') },
        { value: "ACCEPTED", label: t('status_accepted') },
        { value: "REJECTED", label: t('status_rejected') }
    ];

    const getStatusStyle = (status) => {
        if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'REJECTED') return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-orange-50 text-orange-600 border-orange-100';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <PawTrackLogo size="sm" />
                        <span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('organization')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <OrganizationMenu />
                        <Notifications />
                        <ProfileButton />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            {t('manage_verifications_title')}
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">{t('manage_verifications_subtitle')}</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mb-2" />}
                </div>

                <div className="relative z-40 space-y-3 mb-8">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={t('name_email_placeholder')} 
                                className="w-full h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-50 text-sm font-bold pl-11 pr-4" 
                                value={filters.search} 
                                onChange={(e) => { setFilters(prev => ({...prev, search: e.target.value})); if(!e.target.value) loadClaims(); }}
                                onKeyDown={(e) => e.key === 'Enter' && loadClaims()}
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilterPanel(!showFilterPanel)} 
                            className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-2 shadow-sm ${showFilterPanel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            <Filter className="w-5 h-5" /> 
                            <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span>
                        </button>
                    </div>

                    {showFilterPanel && (
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 z-50 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3>
                                <button onClick={() => {setFilters({search:"", status:""}); loadClaims();}} className="text-[10px] font-black uppercase text-red-500">{t('clear_all_btn')}</button>
                            </div>
                            <CustomDropdown label={t('status')} icon={Clock} value={filters.status} options={[{ value: "", label: t('all') }, ...statusOptions]} onChange={(v) => setFilters(prev => ({...prev, status: v}))} />
                        </div>
                    )}
                </div>

                <div className="hidden lg:block bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-visible min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('pet_details')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('reported_by')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('submitted')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('status_updated')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {!loading && claims.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-gray-400 font-bold">{t('no_results_found')}</td>
                                    </tr>
                                ) : (
                                    claims.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                                        {claim.foundReport.imageUrl ? <img src={claim.foundReport.imageUrl} className="w-full h-full object-cover" /> : <Dog className="w-full h-full p-3 text-gray-300"/>}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block truncate max-w-[200px]">
                                                            {i18n.language.startsWith('el') ? claim.foundReport.titleEl : claim.foundReport.title}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter flex items-center gap-1">
                                                            <Calendar className="w-3 h-3"/> {new Date(claim.foundReport.foundDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>{claim.foundReport.creator.firstName} {claim.foundReport.creator.lastName}</span>
                                                    <span className="text-[10px] text-gray-400">@{claim.foundReport.creator.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div ref={el => dropdownRefs.current[`status-${claim.id}`] = el}>
                                                    <button
                                                        disabled={claim.status !== 'PENDING'}
                                                        onClick={() => setActiveDropdown({ id: claim.id, type: 'status' })}
                                                        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all w-32 ${getStatusStyle(claim.status)} shadow-sm ${claim.status !== 'PENDING' && 'cursor-default opacity-80'}`}
                                                    >
                                                        {t(`status_${claim.status.toLowerCase()}`)}
                                                        {claim.status === 'PENDING' && <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                    <PortalDropdown
                                                        isOpen={activeDropdown.id === claim.id && activeDropdown.type === 'status'}
                                                        onClose={() => setActiveDropdown({ id: null, type: null })}
                                                        anchorRef={{ current: dropdownRefs.current[`status-${claim.id}`] }}
                                                        options={statusOptions}
                                                        value={claim.status}
                                                        onChange={(v) => handleStatusUpdate(claim.id, v)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                                {new Date(claim.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-400">
                                                {claim.status !== 'PENDING' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-600 font-bold">{new Date(claim.updatedAt).toLocaleDateString()}</span>
                                                        <span className="text-[10px] uppercase font-black tracking-tight">{new Date(claim.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-gray-300">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => navigate(`/organization/reports/found/${claim.foundReport.id}`)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                    <Info className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:hidden space-y-4">
                    {claims.map((claim) => (
                        <div key={claim.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                                        {claim.foundReport.imageUrl ? <img src={claim.foundReport.imageUrl} className="w-full h-full object-cover" /> : <Dog className="w-full h-full p-3 text-gray-300"/>}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 block truncate max-w-[180px]">
                                            {i18n.language.startsWith('el') ? claim.foundReport.titleEl : claim.foundReport.title}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold block">{t('reported_by')}: {claim.foundReport.creator.firstName}</span>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/organization/reports/found/${claim.foundReport.id}`)} className="p-2 text-gray-400">
                                    <Info className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <label className="text-[8px] font-black uppercase text-gray-400 mb-1 ml-1">{t('submitted')}</label>
                                    <span className="text-[10px] font-bold text-gray-600">{new Date(claim.createdAt).toLocaleDateString()}</span>
                                </div>
                                {claim.status !== 'PENDING' && (
                                    <div className="flex flex-col">
                                        <label className="text-[8px] font-black uppercase text-gray-400 mb-1 ml-1">{t('status_updated')}</label>
                                        <span className="text-[10px] font-bold text-gray-600">{new Date(claim.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <div ref={el => dropdownRefs.current[`status-mob-${claim.id}`] = el}>
                                    <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block ml-1">{t('status')}</label>
                                    <button
                                        disabled={claim.status !== 'PENDING'}
                                        onClick={() => setActiveDropdown({ id: claim.id, type: 'status-mob' })}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all w-full ${getStatusStyle(claim.status)} shadow-sm`}
                                    >
                                        {t(`status_${claim.status.toLowerCase()}`)}
                                        {claim.status === 'PENDING' && <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    <PortalDropdown
                                        isOpen={activeDropdown.id === claim.id && activeDropdown.type === 'status-mob'}
                                        onClose={() => setActiveDropdown({ id: null, type: null })}
                                        anchorRef={{ current: dropdownRefs.current[`status-mob-${claim.id}`] }}
                                        options={statusOptions}
                                        value={claim.status}
                                        onChange={(v) => handleStatusUpdate(claim.id, v)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default OrganizationClaims;