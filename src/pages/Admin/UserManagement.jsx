import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Loader2, Trash2, Users, Mail, ChevronLeft,
    ChevronRight, Calendar, Edit3, FileSearch,
    Search, AlertCircle, Building2, ChevronDown, X, Check, Clock, Filter, RefreshCcw, Shield
} from "lucide-react";
import { toast } from "sonner";
import api, { deleteUserAccount } from "@/services/api";
import Header from "@/pages/Header";

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
        if (newDate > new Date() && inc > 0) return;
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
        <div className="relative space-y-1.5" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1">
                <Calendar className="w-3 h-3" /> {label}
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-11 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className={`text-sm font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || "YYYY-MM-DD"}</span>
                <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-50 rounded-full text-indigo-600"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString(currentLocale, { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-50 rounded-full text-indigo-600"><ChevronRight className="w-4 h-4" /></button>
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
                                    <button key={d} onClick={() => handleDateClick(d)} type="button" className={`h-7 w-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${value === thisDateStr ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>{d}</button>
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
                        className={`w-full text-left px-3 py-2 text-xs font-black uppercase rounded-lg transition-colors flex items-center justify-between ${value === opt.value ? 'bg-gray-50 text-indigo-600' : 'text-gray-900 hover:bg-gray-50'
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
                            <div key={option.value === null ? "all-opt" : option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${option.value === value ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
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

const UserManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterPanelRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoMenuRef = useRef(null);

    const initialFilters = {
        search: "",
        role: "",
        accountStatus: "",
        dateRegisterBefore: "",
        dateRegisterAfter: ""
    };

    const [filters, setFilters] = useState(initialFilters);
    const [activeDropdown, setActiveDropdown] = useState({ id: null, type: null });
    const dropdownRefs = useRef({});

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [page, filters]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).map(([k, v]) => [k, v === "" ? null : v])
            );

            const response = await api.post('/admin/users/filter', cleanFilters, {
                params: {
                    page: page,
                    size: 10,
                    sortBy: 'createdAt',
                    sortDirection: 'DESC'
                }
            });

            if (response && response.data) {
                setUsers(response.data.content || []);
                const pageInfo = response.data.page || {};
                setTotalPages(pageInfo.totalPages || 0);
                setTotalElements(pageInfo.totalElements || 0);
            }
        } catch (error) {
            toast.error(t('load_users_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const clearAllFilters = () => {
        setFilters(initialFilters);
        setPage(0);
        toast.info(t('filters_cleared'));
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, null, { params: { role: newRole } });
            toast.success(t('role_updated_success'));
            setActiveDropdown({ id: null, type: null });
            loadUsers();
        } catch (error) {
            toast.error(t('role_updated_failed'));
        }
    };

    const handleUpdateStatus = async (userId, newStatus) => {
        try {
            await api.patch(`/admin/users/${userId}/account-status`, null, {
                params: { accountStatus: newStatus }
            });
            toast.success(t('status_updated_success'));
            setActiveDropdown({ id: null, type: null });
            loadUsers();
        } catch (error) {
            toast.error(t('status_updated_failed'));
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm(t('confirm_delete_user'))) return;
        try {
            await deleteUserAccount(userId);
            toast.success(t('user_deleted_success'));
            loadUsers();
        } catch (error) {
            const rawMessage = error.response?.data?.message || "";
            if (rawMessage.includes("reflection") || rawMessage.includes("LostReport")) {
              toast.error("Δεν είναι δυνατή η διαγραφή του χρήστη επειδή υπάρχουν ενεργές αναφορές συνδεδεμένες με αυτόν.");
            } else {
              toast.error(rawMessage || t('delete_user_failed'));
            }
        }
    };

    const roles = [
        { value: "USER", label: t('USER') },
        { value: "ADMIN", label: t('ADMIN') },
        { value: "ORGANIZATIONS", label: t('ORGANIZATIONS') }
    ];

    const statuses = [
        { value: "ACTIVE", label: t('ACTIVE') },
        { value: "BANNED", label: t('BANNED') },
        { value: "INACTIVE", label: t('INACTIVE') }
    ];

    const getRoleStyle = (role) => {
        if (role === 'ADMIN') return 'bg-purple-50 text-purple-600 border-purple-100';
        if (role === 'ORGANIZATIONS') return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-blue-50 text-blue-600 border-blue-100';
    };

    const getStatusStyle = (status) => {
        if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'BANNED') return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <Header
                showNav={false}
                isAdmin={true}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                logoMenuRef={logoMenuRef}
            />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            {t('user_management_title')}
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">{t('database_control_center')}</p>
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
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-2 shadow-sm ${showFilterPanel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-600'}`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span>
                        </button>
                    </div>

                    {showFilterPanel && (
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 z-50 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3>
                                <button onClick={clearAllFilters} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                                    <RefreshCcw className="w-3 h-3" /> {t('clear_all_btn')}
                                </button>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDropdown label={t('role')} icon={Users} value={filters.role} options={[{ value: "", label: t('all') }, ...roles]} onChange={(v) => handleFilterChange("role", v)} />
                                    <CustomDropdown label={t('status')} icon={Shield} value={filters.accountStatus} options={[{ value: "", label: t('all') }, ...statuses]} onChange={(v) => handleFilterChange("accountStatus", v)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDatePicker label={t('from_date')} value={filters.dateRegisterAfter} onChange={(v) => handleFilterChange("dateRegisterAfter", v)} />
                                    <CustomDatePicker label={t('to_date')} value={filters.dateRegisterBefore} onChange={(v) => handleFilterChange("dateRegisterBefore", v)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:block bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-visible min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('user_created')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('email')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('role_status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('activity')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {!loading && users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-10 h-10 text-gray-200" />
                                                <p className="text-gray-400 font-bold">{t('no_results_found')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 uppercase text-xs">
                                                        {user.firstName?.charAt(0) || user.username?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block truncate max-w-[150px]">
                                                            {user.firstName} {user.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold block">@{user.username}</span>
                                                        <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                                            <Calendar className="w-3 h-3" /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium whitespace-nowrap">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div ref={el => dropdownRefs.current[`role-${user.id}`] = el}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown({ id: user.id, type: 'role' }); }}
                                                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all w-32 ${getRoleStyle(user.role)} shadow-sm`}
                                                        >
                                                            {t(user.role)}
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <PortalDropdown
                                                            isOpen={activeDropdown.id === user.id && activeDropdown.type === 'role'}
                                                            onClose={() => setActiveDropdown({ id: null, type: null })}
                                                            anchorRef={{ current: dropdownRefs.current[`role-${user.id}`] }}
                                                            options={roles}
                                                            value={user.role}
                                                            onChange={(v) => handleUpdateRole(user.id, v)}
                                                        />
                                                    </div>
                                                    <div ref={el => dropdownRefs.current[`status-${user.id}`] = el}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown({ id: user.id, type: 'status' }); }}
                                                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all w-32 ${getStatusStyle(user.accountStatus)} shadow-sm`}
                                                        >
                                                            {t(user.accountStatus)}
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <PortalDropdown
                                                            isOpen={activeDropdown.id === user.id && activeDropdown.type === 'status'}
                                                            onClose={() => setActiveDropdown({ id: null, type: null })}
                                                            anchorRef={{ current: dropdownRefs.current[`status-${user.id}`] }}
                                                            options={statuses}
                                                            value={user.accountStatus}
                                                            onChange={(v) => handleUpdateStatus(user.id, v)}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => navigate(`/admin/users/${user.id}/lost-reports`)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-100 text-orange-600 rounded-xl text-[9px] font-black uppercase hover:bg-orange-50 transition-all shadow-sm">
                                                        <FileSearch className="w-3.5 h-3.5" /> {t('lost')}
                                                    </button>
                                                    <button onClick={() => navigate(`/admin/users/${user.id}/found-reports`)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-all shadow-sm">
                                                        <Search className="w-3.5 h-3.5" /> {t('found')}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDelete(user.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                                                    <Trash2 className="w-5 h-5" />
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
                    {users.map((user) => (
                        <div key={user.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 uppercase text-sm">
                                        {user.firstName?.charAt(0) || user.username?.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 block truncate max-w-[200px]">
                                            {user.firstName} {user.lastName}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold block">@{user.username}</span>
                                        <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-gray-50/50 p-4 rounded-2xl">
                                <label className="text-[8px] font-black uppercase text-gray-400 mb-1.5 block">{t('email')}</label>
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-bold truncate">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    {user.email}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div ref={el => dropdownRefs.current[`role-mob-${user.id}`] = el}>
                                    <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block ml-1">{t('role')}</label>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveDropdown({ id: user.id, type: 'role-mob' }); }}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all w-full ${getRoleStyle(user.role)} shadow-sm`}
                                    >
                                        {t(user.role)}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <PortalDropdown
                                        isOpen={activeDropdown.id === user.id && activeDropdown.type === 'role-mob'}
                                        onClose={() => setActiveDropdown({ id: null, type: null })}
                                        anchorRef={{ current: dropdownRefs.current[`role-mob-${user.id}`] }}
                                        options={roles}
                                        value={user.role}
                                        onChange={(v) => handleUpdateRole(user.id, v)}
                                    />
                                </div>
                                <div ref={el => dropdownRefs.current[`status-mob-${user.id}`] = el}>
                                    <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block ml-1">{t('status')}</label>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveDropdown({ id: user.id, type: 'status-mob' }); }}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all w-full ${getStatusStyle(user.accountStatus)} shadow-sm`}
                                    >
                                        {t(user.accountStatus)}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <PortalDropdown
                                        isOpen={activeDropdown.id === user.id && activeDropdown.type === 'status-mob'}
                                        onClose={() => setActiveDropdown({ id: null, type: null })}
                                        anchorRef={{ current: dropdownRefs.current[`status-mob-${user.id}`] }}
                                        options={statuses}
                                        value={user.accountStatus}
                                        onChange={(v) => handleUpdateStatus(user.id, v)}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50/50 p-3 rounded-2xl">
                                <label className="text-[8px] font-black uppercase text-gray-400 mb-2 block text-center">{t('activity')}</label>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/admin/users/${user.id}/lost-reports`)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-orange-100 text-orange-600 rounded-xl text-[9px] font-black uppercase shadow-sm">
                                        <FileSearch className="w-3.5 h-3.5" /> {t('lost')}
                                    </button>
                                    <button onClick={() => navigate(`/admin/users/${user.id}/found-reports`)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase shadow-sm">
                                        <Search className="w-3.5 h-3.5" /> {t('found')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 mt-8 bg-white lg:bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between lg:rounded-t-none lg:rounded-b-[2.5rem] lg:border-t-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t('showing_users', { total: totalElements })} • {t('page_of', { current: page + 1, total: Math.max(1, totalPages) })}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 0}
                            onClick={() => setPage(page - 1)}
                            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page >= totalPages - 1 || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserManagement;