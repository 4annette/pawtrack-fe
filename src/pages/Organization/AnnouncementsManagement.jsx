import React, { useState, useEffect, useRef } from "react";
import {
    Megaphone,
    Plus,
    Trash2,
    Loader2,
    Search,
    Calendar as CalendarIcon,
    RefreshCcw,
    Filter,
    ChevronLeft,
    ChevronRight,
    Tag,
    AlertTriangle,
    ShieldAlert,
    Bell,
    Info,
    Edit2,
    ChevronDown,
    Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/pages/Header";
import {
    filterAnnouncements,
    deleteAnnouncement
} from "@/services/api";

const typeConfigs = {
    LOCATION_ALERT: {
        color: "bg-red-50 text-red-600 border-red-100",
        activeColor: "bg-red-600 text-white",
        icon: AlertTriangle,
        labelKey: 'type_location_alert'
    },
    URGENT_APPEAL: {
        color: "bg-orange-50 text-orange-600 border-orange-100",
        activeColor: "bg-orange-600 text-white",
        icon: ShieldAlert,
        labelKey: 'type_urgent_appeal'
    },
    PREVENTIVE_UPDATE: {
        color: "bg-blue-50 text-blue-600 border-blue-100",
        activeColor: "bg-blue-600 text-white",
        icon: Bell,
        labelKey: 'type_preventive_update'
    },
    OTHER: {
        color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        activeColor: "bg-indigo-600 text-white",
        icon: Info,
        labelKey: 'type_other'
    }
};

const CustomDatePicker = ({ label, value, onChange, align = "left" }) => {
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
        <div className="relative space-y-1.5" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1">
                <CalendarIcon className="w-3 h-3" /> {label}
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-11 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className={`text-sm font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || "YYYY-MM-DD"}</span>
                <CalendarIcon className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className={`absolute top-full mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95 ${align === 'right' ? 'right-0' : 'left-0'}`}>
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

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, isMulti = false }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getLabel = () => {
        if (!isMulti) {
            const opt = options.find(o => o.value === value);
            return opt ? opt.label : t('select_type');
        }
        if (value.length === 0) return t('all_types');
        const labels = options.filter(o => value.includes(o.value)).map(o => o.label);
        return labels.join(", ");
    };

    return (
        <div className="relative space-y-1.5 w-full" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full min-h-[44px] py-2 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className="text-sm font-bold text-gray-900 text-left whitespace-normal break-words pr-2">
                    {getLabel()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
            </button>
            {isOpen && (
                <div className="absolute z-[9999] top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = isMulti ? value.includes(option.value) : value === option.value;
                            const config = typeConfigs[option.value] || typeConfigs.OTHER;
                            const TypeIcon = config.icon;

                            return (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        if (!isMulti) setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${isSelected ? config.activeColor : 'text-gray-700 hover:bg-gray-50 font-bold'}`}
                                >
                                    <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden pr-4">
                                        <TypeIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                                        <span>{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-auto" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const AnnouncementsManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOrganization, setIsOrganization] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const logoMenuRef = useRef(null);
    const filterPanelRef = useRef(null);

    const initialFilters = {
        search: "",
        type: [],
        dateAfter: "",
        dateBefore: ""
    };

    const [filters, setFilters] = useState(initialFilters);

    const typeOptions = Object.keys(typeConfigs).map(key => ({
        label: t(typeConfigs[key].labelKey),
        value: key
    }));

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user.role === "ADMIN") setIsAdmin(true);
                if (user.role === "ORGANIZATIONS") setIsOrganization(true);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadAnnouncements();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const cleanFilters = {
                search: filters.search || null,
                type: filters.type.length > 0 ? filters.type : null,
                dateAfter: filters.dateAfter ? new Date(filters.dateAfter).toISOString() : null,
                dateBefore: filters.dateBefore ? new Date(filters.dateBefore).toISOString() : null
            };
            const response = await filterAnnouncements(cleanFilters, 0, 50);
            setAnnouncements(response.content || []);
        } catch (error) {
            toast.error(t('error_loading_announcements'));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterTypeToggle = (type) => {
        setFilters(prev => ({
            ...prev,
            type: prev.type.includes(type)
                ? prev.type.filter(t => t !== type)
                : [...prev.type, type]
        }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm(t('confirm_delete_announcement'))) {
            try {
                await deleteAnnouncement(id);
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                toast.success(t('announcement_deleted_success'));
            } catch (error) {
                toast.error(t('error_deleting_announcement'));
            }
        }
    };

    const handleCardClick = (announcementId) => {
        navigate(`/organization/announcements/${announcementId}`);
    };

    const handleEditClick = (e, announcementId) => {
        e.stopPropagation();
        navigate(`/organization/announcements/${announcementId}?edit=true`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 w-full overflow-x-hidden">
            <Header
                activeTab=""
                setActiveTab={() => { }}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={isOrganization}
                logoMenuRef={logoMenuRef}
            />

            <main className="w-full max-w-5xl mx-auto px-4 py-8 box-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">{t('announcements_management')}</span>
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest truncate">{t('announcements_management_subtitle')}</p>
                    </div>

                    <button
                        onClick={() => navigate("/organization/announcements/create")}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" /> {t('new_announcement_btn', 'New Announcement')}
                    </button>
                </div>

                <div className="relative z-40 space-y-3 mb-8 w-full box-border">
                    <div className="flex gap-3 items-center w-full">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('filter_search_placeholder')}
                                className="w-full h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-50 text-sm font-bold pl-11 pr-4 box-border"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-2 shadow-sm flex-shrink-0 ${showFilterPanel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-600'}`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span>
                        </button>
                    </div>

                    {showFilterPanel && (
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 md:p-8 z-50 animate-in slide-in-from-top-2 overflow-visible max-w-[calc(100vw-2rem)] box-border">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3>
                                <button onClick={resetFilters} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                                    <RefreshCcw className="w-3 h-3" /> {t('clear_all_btn')}
                                </button>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                    <div className="w-full">
                                        <CustomDropdown
                                            label={t('announcement_label_type')}
                                            icon={Tag}
                                            value={filters.type}
                                            options={typeOptions}
                                            isMulti={true}
                                            onChange={(v) => handleFilterTypeToggle(v)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDatePicker label={t('date_after')} value={filters.dateAfter} onChange={(v) => setFilters(prev => ({ ...prev, dateAfter: v }))} />
                                    <CustomDatePicker label={t('date_before')} value={filters.dateBefore} onChange={(v) => setFilters(prev => ({ ...prev, dateBefore: v }))} align="right" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {loading && announcements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 w-full">
                        <Loader2 className="w-10 h-10 text-indigo-200 animate-spin mb-4" />
                        <p className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em]">{t('loading_data')}</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-indigo-100 w-full box-border">
                        <Megaphone className="w-12 h-12 text-indigo-100 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-indigo-900 mb-1">{t('no_results_found')}</h3>
                        <p className="text-gray-400 text-sm font-bold">{t('try_adjusting_filters')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 w-full box-border">
                        {announcements.map((announcement) => {
                            const config = typeConfigs[announcement.type] || typeConfigs.OTHER;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={announcement.id}
                                    onClick={() => handleCardClick(announcement.id)}
                                    className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer w-full box-border"
                                >
                                    <div className="flex items-start justify-between gap-4 w-full">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border flex items-center gap-1 shrink-0 ${config.color}`}>
                                                    <Icon className="w-3 h-3" /> {t(config.labelKey)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-normal break-words leading-tight mb-1">
                                                {localStorage.getItem('i18nextLng')?.startsWith('el') ? announcement.titleEl : announcement.titleEn}
                                            </h3>
                                            <p className="text-gray-500 text-sm font-medium truncate w-full">
                                                {localStorage.getItem('i18nextLng')?.startsWith('el') ? announcement.contentEl : announcement.contentEn}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={(e) => handleEditClick(e, announcement.id)} className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button onClick={(e) => handleDelete(announcement.id, e)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnnouncementsManagement;