import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Loader2, Trash2, ShieldCheck, Mail, ChevronLeft,
    ChevronRight, Calendar, Building2, ChevronDown, Check, User, Search, X, Filter, Clock
} from "lucide-react";
import { toast } from "sonner";
import { 
    fetchVerificationRequests, 
    changeVerificationStatus, 
    deleteVerificationRequest 
} from "@/services/api";
import ProfileButton from "@/components/topBar/ProfileButton";
import Notifications from "@/components/notifications/Notifications";
import PawTrackLogo from "@/components/PawTrackLogo";
import AdminMenu from "@/components/admin/AdminMenu";

const CustomDatePicker = ({ label, value, onChange }) => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef(null);
    const currentLocale = i18n.language.startsWith('el') ? 'el-GR' : 'en-US';

    useEffect(() => {
        if (value) {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) setViewDate(dateObj);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changeMonth = (inc) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + inc, 1);
        setViewDate(newDate);
    };

    const handleDateClick = (day) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        onChange(`${year}-${month}-${dayStr}`);
        setIsOpen(false);
    };

    return (
        <div className="relative space-y-1" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{label}</label>
            <div 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className={`w-full h-10 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value || "YYYY-MM-DD"}
                </span>
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-1 hover:bg-gray-50 rounded-full text-indigo-600"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString(currentLocale, { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-1 hover:bg-gray-50 rounded-full text-indigo-600"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {(() => {
                            const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                            const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                            const days = [];
                            for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
                            for (let d = 1; d <= totalDays; d++) {
                                const thisDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                days.push(
                                    <button 
                                        key={d} 
                                        onClick={(e) => { e.stopPropagation(); handleDateClick(d); }} 
                                        type="button" 
                                        className={`h-7 w-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${value === thisDateStr ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {d}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

const PortalDropdown = ({ isOpen, onClose, anchorRef, options, value, onChange }) => {
    const [coords, setCoords] = useState(null);
    const headerHeight = 64;

    const updatePosition = () => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
                opacity: rect.bottom < headerHeight ? 0 : 1
            });
        }
    };

    useLayoutEffect(() => { if (isOpen) updatePosition(); }, [isOpen]);

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
        <div className="fixed inset-0 z-[10001]" onClick={onClose}>
            <div
                className="fixed bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 transition-opacity duration-150"
                style={{
                    top: `${coords.top + 4}px`,
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                    opacity: coords.opacity
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {options.map((opt) => (
                    <button
                        key={opt.value === null ? 'all' : opt.value}
                        onClick={() => { onChange(opt.value); onClose(); }}
                        className={`w-full text-left px-3 py-2 text-xs font-black uppercase rounded-lg transition-colors flex items-center justify-between ${value === opt.value ? 'bg-gray-50 text-indigo-600' : 'text-gray-900 hover:bg-gray-50'}`}
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

const VerificationRequestsManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        search: "",
        status: null,
        beforeDate: "",
        afterDate: ""
    });

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [filterDropdown, setFilterDropdown] = useState(false);
    const dropdownRefs = useRef({});
    const filterStatusRef = useRef(null);
    const filterPanelRef = useRef(null);

    useEffect(() => {
        const delayDebounce = setTimeout(() => { loadData(); }, 500);
        return () => clearTimeout(delayDebounce);
    }, [page, filters]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
                setFilterDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const payload = {
                search: filters.search || null,
                status: filters.status,
                beforeDate: filters.beforeDate || null,
                afterDate: filters.afterDate || null
            };
            const response = await fetchVerificationRequests(payload, { page, size: 10, sortBy: 'createdAt', sortDirection: 'DESC' });
            
            setRequests(response.content || []);
            if (response.page) {
                setTotalPages(response.page.totalPages || 0);
                setTotalElements(response.page.totalElements || 0);
            }
        } catch (error) {
            toast.error(t('failed_to_load_verifications'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await changeVerificationStatus(id, newStatus);
            toast.success(t('status_updated_success'));
            loadData();
        } catch (error) {
            toast.error(t('status_update_failed'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete_request'))) return;
        try {
            await deleteVerificationRequest(id);
            toast.success(t('request_deleted_success'));
            loadData();
        } catch (error) {
            toast.error(t('delete_failed'));
        }
    };

    const statusOptions = [
        { value: null, label: t('all') },
        { value: "PENDING", label: t('pending') },
        { value: "ACCEPTED", label: t('accepted') },
        { value: "REJECTED", label: t('rejected') }
    ];

    const getStatusStyle = (status) => {
        if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'REJECTED') return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    const handleClearFilters = () => {
        setFilters({ search: "", status: null, beforeDate: "", afterDate: "" });
        setPage(0);
        setFilterDropdown(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <PawTrackLogo size="sm" />
                        <span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('admin_panel')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminMenu />
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
                            {t('verification_management_title')}
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">{t('organization_request_moderation')}</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mb-2" />}
                </div>

                <div className="relative mb-8 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={t('org_name_email_placeholder')}
                            className="w-full pl-11 pr-4 h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-50 text-sm font-bold"
                            value={filters.search}
                            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }}
                        />
                    </div>
                    <div className="relative" ref={filterPanelRef}>
                        <button 
                            onClick={() => setFilterDropdown(!filterDropdown)}
                            className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-2 shadow-sm ${
                                filterDropdown || filters.beforeDate || filters.afterDate || filters.status !== null
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-600'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span>
                        </button>

                        {filterDropdown && (
                            <div className="absolute top-full right-0 mt-3 w-screen max-w-[400px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 z-[1000] animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3>
                                    <button onClick={handleClearFilters} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700">{t('clear_all')}</button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1" ref={filterStatusRef}>
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{t('status')}</label>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown('filter-status'); }}
                                            className="w-full h-10 px-3 bg-gray-50 rounded-xl flex items-center justify-between text-[10px] font-black uppercase text-gray-900 shadow-sm"
                                        >
                                            {filters.status ? t(filters.status.toLowerCase()) : t('all')}
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <PortalDropdown 
                                            isOpen={activeDropdown === 'filter-status'}
                                            onClose={() => setActiveDropdown(null)}
                                            anchorRef={filterStatusRef}
                                            options={statusOptions}
                                            value={filters.status}
                                            onChange={(v) => { setFilters({ ...filters, status: v, page: 0 }); }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CustomDatePicker label={t('after_date')} value={filters.afterDate} onChange={(v) => setFilters({...filters, afterDate: v, page: 0})} />
                                        <CustomDatePicker label={t('before_date')} value={filters.beforeDate} onChange={(v) => setFilters({...filters, beforeDate: v, page: 0})} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden lg:block bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-visible min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('organization')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('dates')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('status')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!loading && requests.length === 0 ? (
                                <tr><td colSpan="4" className="py-20 text-center"><p className="text-gray-400 font-bold">{t('no_results_found')}</p></td></tr>
                            ) : (
                                requests.map((req) => {
                                    const isDecided = req.createdAt !== req.updatedAt;
                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/verifications/${req.id}`)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100"><Building2 className="w-5 h-5" /></div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{req.organizationName}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Mail className="w-3 h-3" /> {req.organizationEmail}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase">
                                                        <Clock className="w-3 h-3" /> {t('created')}: {new Date(req.createdAt).toLocaleDateString()}
                                                    </div>
                                                    {isDecided && (
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase">
                                                            <Calendar className="w-3 h-3" /> {t('decision')}: {new Date(req.updatedAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.requestStatus === 'PENDING' ? (
                                                    <div ref={el => dropdownRefs.current[req.id] = el} onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            onClick={() => setActiveDropdown(req.id)}
                                                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border w-32 ${getStatusStyle(req.requestStatus)} shadow-sm`}
                                                        >
                                                            {t(req.requestStatus.toLowerCase())}
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <PortalDropdown 
                                                            isOpen={activeDropdown === req.id}
                                                            onClose={() => setActiveDropdown(null)}
                                                            anchorRef={{ current: dropdownRefs.current[req.id] }}
                                                            options={statusOptions.filter(o => o.value !== null)}
                                                            value={req.requestStatus}
                                                            onChange={(v) => handleStatusChange(req.id, v)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border w-32 justify-center ${getStatusStyle(req.requestStatus)}`}>
                                                        {t(req.requestStatus.toLowerCase())}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                {req.requestStatus !== 'ACCEPTED' && (
                                                    <button onClick={() => handleDelete(req.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="lg:hidden space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} onClick={() => navigate(`/admin/verifications/${req.id}`)} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${req.requestStatus === 'PENDING' ? 'bg-amber-400' : req.requestStatus === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100"><Building2 className="w-6 h-6" /></div>
                                    <div>
                                        <span className="font-bold text-gray-900 block truncate max-w-[180px]">{req.organizationName}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${getStatusStyle(req.requestStatus)}`}>{t(req.requestStatus.toLowerCase())}</span>
                                    </div>
                                </div>
                                {req.requestStatus !== 'ACCEPTED' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }} className="p-2 text-gray-300 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                                )}
                            </div>
                            <div className="pt-2 border-t border-gray-50 flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                                <span>{t('created')}: {new Date(req.createdAt).toLocaleDateString()}</span>
                                {req.createdAt !== req.updatedAt && <span className="text-indigo-500">{t('decision')}: {new Date(req.updatedAt).toLocaleDateString()}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 mt-8 bg-white lg:bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between lg:rounded-t-none lg:rounded-b-[2.5rem]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t('total')}: {totalElements} • {t('page')} {page + 1} / {Math.max(1, totalPages)}
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled={page <= 0} onClick={() => setPage(page - 1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <button disabled={page >= totalPages - 1 || totalPages === 0} onClick={() => setPage(page + 1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm transition-all"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VerificationRequestsManagement;