import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Loader2, Trash2, Shield, Users, Mail, ChevronLeft,
    ChevronRight, Calendar, UserCheck, Edit3, FileSearch,
    Search, Ban, AlertCircle, Building2, ChevronDown, X, Check, Clock
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
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
        const today = new Date();
        if (newDate > today && inc > 0) return;
        setViewDate(newDate);
    };

    const handleDateClick = (day) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const newDateStr = `${year}-${month}-${dayStr}`;
        onChange(newDateStr);
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

const PortalDropdown = ({ isOpen, onClose, anchorRef, options, value, onChange, placeholder }) => {
    const { t } = useTranslation();
    if (!isOpen || !anchorRef.current) return null;
    const rect = anchorRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY;
    const left = rect.left + window.scrollX;

    return createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={onClose}>
            <div
                className="absolute bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
                style={{
                    top: `${top + 4}px`,
                    left: `${left}px`,
                    minWidth: `${rect.width}px`
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

const UserManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        search: "",
        role: "",
        accountStatus: "",
        dateRegisterBefore: "",
        dateRegisterAfter: ""
    });

    const [activeDropdown, setActiveDropdown] = useState({ id: null, type: null });
    const [filterDropdown, setFilterDropdown] = useState(null);
    const dropdownRefs = useRef({});
    const filterRoleRef = useRef(null);
    const filterStatusRef = useRef(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [page, filters]);

    useEffect(() => {
        const handleGlobalClick = () => {
            setActiveDropdown({ id: null, type: null });
            setFilterDropdown(null);
        };
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
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
            await api.delete(`/admin/users/${userId}`);
            toast.success(t('user_deleted_success'));
            loadUsers();
        } catch (error) {
            toast.error(t('delete_user_failed'));
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
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
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
                            <Users className="w-8 h-8 text-indigo-600" />
                            {t('user_management_title')}
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">{t('database_control_center')}</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mb-2" />}
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{t('search')}</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                name="search"
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                placeholder={t('name_email_placeholder')}
                                className="w-full h-10 pl-9 pr-4 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1" ref={filterRoleRef}>
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{t('role')}</label>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFilterDropdown('role'); }}
                            className="w-full h-10 px-3 bg-gray-50 rounded-xl flex items-center justify-between text-sm font-bold text-gray-900 shadow-sm"
                        >
                            {filters.role ? t(filters.role) : t('all_roles')}
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        <PortalDropdown 
                            isOpen={filterDropdown === 'role'}
                            onClose={() => setFilterDropdown(null)}
                            anchorRef={filterRoleRef}
                            options={[{ value: "", label: t('all') }, ...roles]}
                            value={filters.role}
                            onChange={(v) => handleFilterChange("role", v)}
                        />
                    </div>

                    <div className="space-y-1" ref={filterStatusRef}>
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{t('status')}</label>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFilterDropdown('status'); }}
                            className="w-full h-10 px-3 bg-gray-50 rounded-xl flex items-center justify-between text-sm font-bold text-gray-900 shadow-sm"
                        >
                            {filters.accountStatus ? t(filters.accountStatus) : t('all_statuses')}
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        <PortalDropdown 
                            isOpen={filterDropdown === 'status'}
                            onClose={() => setFilterDropdown(null)}
                            anchorRef={filterStatusRef}
                            options={[{ value: "", label: t('all') }, ...statuses]}
                            value={filters.accountStatus}
                            onChange={(v) => handleFilterChange("accountStatus", v)}
                        />
                    </div>

                    <CustomDatePicker 
                        label={t('from_date')} 
                        value={filters.dateRegisterAfter} 
                        onChange={(v) => handleFilterChange("dateRegisterAfter", v)} 
                    />

                    <CustomDatePicker 
                        label={t('to_date')} 
                        value={filters.dateRegisterBefore} 
                        onChange={(v) => handleFilterChange("dateRegisterBefore", v)} 
                    />
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-visible min-h-[400px]">
                    <div className="overflow-x-auto overflow-visible">
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
                                                        <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3" /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium max-w-[150px] truncate">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 overflow-visible">
                                                <div className="flex flex-col gap-2 relative">
                                                    <div className="relative" ref={el => dropdownRefs.current[`role-${user.id}`] = el}>
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

                                                    <div className="relative" ref={el => dropdownRefs.current[`status-${user.id}`] = el}>
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
                                                        <FileSearch className="w-3 h-3" /> {t('lost')}
                                                    </button>
                                                    <button onClick={() => navigate(`/admin/users/${user.id}/found-reports`)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-all shadow-sm">
                                                        <Search className="w-3 h-3" /> {t('found')}
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

                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
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
                </div>
            </main>
        </div>
    );
};

export default UserManagement;