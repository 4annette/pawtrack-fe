import React, { useState, useEffect, useRef } from "react";
import { 
    Megaphone, 
    Plus, 
    Trash2, 
    Loader2, 
    X, 
    AlertTriangle, 
    Edit2, 
    ChevronDown, 
    Check, 
    Bell,
    Info,
    ShieldAlert,
    HelpCircle,
    Search,
    Calendar as CalendarIcon,
    RefreshCcw,
    Filter,
    ChevronLeft,
    ChevronRight,
    Tag
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Header from "@/pages/Header";
import { 
    filterAnnouncements, 
    deleteAnnouncement, 
    createAnnouncement, 
    updateAnnouncement, 
    translateText 
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

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, isMulti = false, staticDisplay = false }) => {
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
                <div className={`${staticDisplay ? 'relative' : 'absolute z-[9999] top-full'} left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95`}>
                    <div className="p-1.5 space-y-1">
                        {options.map((option) => {
                            const isSelected = isMulti ? value.includes(option.value) : value === option.value;
                            const config = typeConfigs[option.value] || typeConfigs.OTHER;
                            const TypeIcon = config.icon;
                            
                            return (
                                <div 
                                    key={option.value} 
                                    onClick={() => { 
                                        onChange(option.value); 
                                        if(!isMulti) setIsOpen(false); 
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
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
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
    const [formData, setFormData] = useState({ title: "", content: "", type: "LOCATION_ALERT" });

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

    const handleDelete = async (id) => {
        if (window.confirm(t('confirm_delete_announcement'))) {
            try {
                await deleteAnnouncement(id);
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                toast.success(t('announcement_deleted_success'));
                closeModal();
            } catch (error) {
                toast.error(t('error_deleting_announcement'));
            }
        }
    };

    const handleCardClick = (announcement) => {
        const isGreek = localStorage.getItem('i18nextLng')?.startsWith('el');
        setSelectedAnnouncement(announcement);
        setEditingId(announcement.id);
        setFormData({
            title: isGreek ? (announcement.titleEl || "") : (announcement.titleEn || ""),
            content: isGreek ? (announcement.contentEl || "") : (announcement.contentEn || ""),
            type: announcement.type
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEditClick = (e, announcement) => {
        e.stopPropagation();
        const isGreek = localStorage.getItem('i18nextLng')?.startsWith('el');
        setSelectedAnnouncement(announcement);
        setEditingId(announcement.id);
        setFormData({
            title: isGreek ? (announcement.titleEl || "") : (announcement.titleEn || ""),
            content: isGreek ? (announcement.contentEl || "") : (announcement.contentEn || ""),
            type: announcement.type
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setSelectedAnnouncement(null);
        setFormData({ title: "", content: "", type: "LOCATION_ALERT" });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedAnnouncement(null);
        setIsEditing(false);
        setFormData({ title: "", content: "", type: "LOCATION_ALERT" });
    };

    const containsGreek = (text) => /[\u0370-\u03FF]/.test(text);

    const translateOrFallback = async (text, fromLang, toLang) => {
        if (!text) return '';
        try {
            const translated = await translateText(text, fromLang, toLang);
            return translated || text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const title = formData.title.trim();
            const content = formData.content.trim();
            const isGreekInput = containsGreek(title) || containsGreek(content);

            const titleEl = isGreekInput ? title : await translateOrFallback(title, 'en', 'el');
            const titleEn = isGreekInput ? await translateOrFallback(title, 'el', 'en') : title;
            const contentEl = isGreekInput ? content : await translateOrFallback(content, 'en', 'el');
            const contentEn = isGreekInput ? await translateOrFallback(content, 'el', 'en') : content;

            const payload = { titleEn, contentEn, titleEl, contentEl, type: formData.type };

            if (editingId) {
                await updateAnnouncement(editingId, payload);
                toast.success(t('announcement_updated_success'));
            } else {
                await createAnnouncement(payload);
                toast.success(t('announcement_created_success'));
            }
            loadAnnouncements();
            closeModal();
        } catch (error) {
            toast.error(t('error_saving_announcement'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <Header 
                activeTab=""
                setActiveTab={() => {}}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={isOrganization}
                logoMenuRef={logoMenuRef}
            />

            <main className="container mx-auto px-4 py-8 max-w-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-indigo-600" />
                            {t('announcements_management')}
                        </h1>
                        <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">{t('announcements_management_subtitle')}</p>
                    </div>
                    
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> {t('new_announcement_btn', 'New Announcement')}
                    </button>
                </div>

                <div className="relative z-40 space-y-3 mb-8 w-full">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={t('filter_search_placeholder')} 
                                className="w-full h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-50 text-sm font-bold pl-11 pr-4" 
                                value={filters.search} 
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} 
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
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full max-w-[calc(100vw-2rem)] md:max-w-[600px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 z-50 animate-in slide-in-from-top-2 overflow-visible">
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
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-200 animate-spin mb-4" />
                        <p className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em]">{t('loading_data')}</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-indigo-100 w-full">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-black text-indigo-900 mb-1">{t('no_results_found')}</h3>
                        <p className="text-gray-400 text-sm font-bold">{t('try_adjusting_filters')}</p>
                    </div>
                ) : (
                    <div className="grid gap-4 w-full">
                        {announcements.map((announcement) => {
                            const config = typeConfigs[announcement.type] || typeConfigs.OTHER;
                            const Icon = config.icon;
                            return (
                                <div key={announcement.id} onClick={() => handleCardClick(announcement)} className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border flex items-center gap-1 ${config.color}`}>
                                                    <Icon className="w-3 h-3" /> {t(config.labelKey)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-normal break-words">
                                                {localStorage.getItem('i18nextLng')?.startsWith('el') ? announcement.titleEl : announcement.titleEn}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1 font-medium whitespace-normal break-words">
                                                {localStorage.getItem('i18nextLng')?.startsWith('el') ? announcement.contentEl : announcement.contentEn}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => handleEditClick(e, announcement)} className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
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

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4">
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-200 h-auto overflow-y-auto max-h-[90vh]">
                        
                        <button 
                            onClick={closeModal} 
                            className="absolute top-6 right-6 md:top-10 md:right-10 p-2 hover:bg-gray-100 rounded-full transition-colors z-[110]"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>

                        <div className="mb-6 md:mb-8 pr-12">
                            <h2 className="text-2xl md:text-3xl font-black text-indigo-900 uppercase tracking-tight break-words leading-tight">
                                {!editingId ? t('create_announcement_title') : isEditing ? t('edit_announcement_title') : t('announcement')}
                            </h2>
                        </div>

                        {!isEditing ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {(() => {
                                            const config = typeConfigs[formData.type] || typeConfigs.OTHER;
                                            const Icon = config.icon;
                                            return (
                                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${config.color}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {t(config.labelKey)}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-black text-gray-900 leading-tight whitespace-normal break-words">{formData.title}</h3>
                                    <div className="pt-2 md:pt-4 border-t border-gray-100 max-h-[30vh] overflow-y-auto">
                                        <p className="text-gray-600 text-sm md:text-lg font-bold leading-relaxed whitespace-pre-wrap break-words">{formData.content}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 md:gap-3 pt-4 pr-1">
                                    <button type="button" onClick={() => setIsEditing(true)} className="flex-1 bg-indigo-600 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-[10px] md:text-xs uppercase tracking-widest"><Edit2 className="w-4 h-4" /> {t('btn_edit')}</button>
                                    <button type="button" onClick={() => handleDelete(editingId)} className="px-4 md:px-6 bg-red-50 text-red-600 font-black rounded-2xl md:rounded-3xl hover:bg-red-100 transition-all flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4 pr-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest ml-1">{t('announcement_label_title')}</label>
                                        <input required className="w-full h-12 p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest ml-1">{t('announcement_label_content')}</label>
                                        <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm font-bold min-h-[100px] md:min-h-[150px] resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                                    </div>
                                </div>
                                <div className="pr-1">
                                    <CustomDropdown label={t('announcement_label_type')} icon={Tag} value={formData.type} options={typeOptions} onChange={val => setFormData({ ...formData, type: val })} staticDisplay={true} />
                                </div>
                                <div className="flex gap-2 md:gap-3 pt-4 pr-1">
                                    <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? t('btn_update_announcement') : t('btn_publish_announcement')}</button>
                                    {editingId && <button type="button" onClick={() => handleDelete(editingId)} className="px-4 md:px-6 bg-red-50 text-red-600 font-black rounded-2xl md:rounded-3xl hover:bg-red-100 transition-all flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsManagement;