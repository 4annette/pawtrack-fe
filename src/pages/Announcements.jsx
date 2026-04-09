import React, { useState, useEffect, useRef } from "react";
import {
    Megaphone,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertTriangle,
    ShieldAlert,
    Bell,
    Info,
    Filter,
    Calendar as CalendarIcon,
    Tag,
    RefreshCcw,
    Check,
    ChevronDown,
    Building2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/pages/Header";
import { fetchPublicAnnouncements, fetchNearbyOrganizations } from "@/services/api";

const typeConfigs = {
    LOCATION_ALERT: { color: "bg-red-50 text-red-600 border-red-100", activeColor: "bg-red-600 text-white", icon: AlertTriangle, labelKey: 'type_location_alert' },
    URGENT_APPEAL: { color: "bg-orange-50 text-orange-600 border-orange-100", activeColor: "bg-orange-600 text-white", icon: ShieldAlert, labelKey: 'type_urgent_appeal' },
    PREVENTIVE_UPDATE: { color: "bg-blue-50 text-blue-600 border-blue-100", activeColor: "bg-blue-600 text-white", icon: Bell, labelKey: 'type_preventive_update' },
    OTHER: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", activeColor: "bg-indigo-600 text-white", icon: Info, labelKey: 'type_other' }
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
                className={`w-full h-11 px-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
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

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, isMulti = false, placeholder }) => {
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
            const opt = options.find(o => String(o.value) === String(value));
            return opt ? opt.label : (placeholder || t('select_type'));
        }
        if (!value || value.length === 0) return (placeholder || t('all_types'));
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
                className={`w-full min-h-[44px] py-2 px-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className="text-sm font-bold text-gray-900 text-left whitespace-normal break-words pr-2">
                    {getLabel()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
            </button>
            {isOpen && (
                <div className="absolute z-[9999] top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {options.length > 0 ? options.map((option) => {
                            const isSelected = isMulti ? value?.includes(option.value) : String(value) === String(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        if (!isMulti) setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50 font-bold'}`}
                                >
                                    <div className="flex items-center gap-3 whitespace-normal break-words pr-4 flex-1">
                                        <span className="leading-tight">{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-auto" />}
                                </div>
                            );
                        }) : (
                            <div className="px-4 py-3 text-xs text-gray-400 italic font-bold text-center">
                                {t('no_organizations_found', 'No organizations found')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Announcements = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOrganization, setIsOrganization] = useState(false);
    const [organizations, setOrganizations] = useState([]);

    const filterPanelRef = useRef(null);
    const logoMenuRef = useRef(null);

    const initialFilters = {
        search: "",
        type: [],
        dateAfter: "",
        dateBefore: "",
        organizationId: ""
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

        const fetchOrgs = async (lat = 37.9838, lng = 23.7275) => {
            try {
                const orgsData = await fetchNearbyOrganizations(lat, lng);
                if (orgsData && orgsData.content) {
                    setOrganizations(orgsData.content.map(org => ({
                        label: org.organizationName,
                        value: org.id
                    })));
                }
            } catch (err) { console.error("Error loading organizations:", err); }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    setUserLocation(loc);
                    fetchOrgs(loc.latitude, loc.longitude);
                },
                (error) => {
                    console.log("Location access denied", error);
                    fetchOrgs();
                }
            );
        } else {
            fetchOrgs();
        }
    }, []);

    useEffect(() => {
        loadAnnouncements();
    }, [currentPage, userLocation, filters]);

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
            const payload = {
                search: filters.search || null,
                type: filters.type.length > 0 ? filters.type : null,
                dateAfter: filters.dateAfter ? new Date(filters.dateAfter).toISOString() : null,
                dateBefore: filters.dateBefore ? new Date(filters.dateBefore).toISOString() : null,
                organizationIds: filters.organizationId ? [parseInt(filters.organizationId)] : null,
                latitude: userLocation ? userLocation.latitude : null,
                longitude: userLocation ? userLocation.longitude : null,
                radius: userLocation ? 15 : null
            };
            const data = await fetchPublicAnnouncements(payload, currentPage, 10);
            setAnnouncements(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const resetFilters = () => setFilters(initialFilters);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Header
                showNav={false}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={isOrganization}
                logoMenuRef={logoMenuRef}
            />

            <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
                <div className="mb-6 md:mb-8 text-left">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center justify-start gap-3 flex-wrap leading-tight">
                        <Megaphone className="w-6 h-6 md:w-8 h-8 text-indigo-600 flex-shrink-0" />
                        <span className="break-words">{t('public_announcements_title')}</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-left leading-relaxed">
                        {t('public_announcements_subtitle')}
                    </p>
                </div>

                <div className="relative z-40 space-y-3 mb-8 w-full">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('filter_search_placeholder')}
                                className="w-full h-11 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-bold pl-11 pr-4"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`h-11 px-4 rounded-2xl border transition-all flex items-center gap-2 shadow-sm ${showFilterPanel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-600'}`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span>
                        </button>
                    </div>

                    {showFilterPanel && (
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-2 w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 md:p-8 z-50 animate-in slide-in-from-top-2 overflow-visible">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3>
                                <button onClick={resetFilters} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                                    <RefreshCcw className="w-3 h-3" /> {t('clear_all_btn')}
                                </button>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDropdown
                                        label={t('announcement_label_type')}
                                        icon={Tag}
                                        value={filters.type}
                                        options={typeOptions}
                                        isMulti={true}
                                        onChange={(v) => handleFilterTypeToggle(v)}
                                    />
                                    <CustomDropdown
                                        label={t('filter_by_organization')}
                                        icon={Building2}
                                        value={filters.organizationId}
                                        options={organizations}
                                        onChange={(v) => setFilters(prev => ({ ...prev, organizationId: v }))}
                                        placeholder={t('all_organizations')}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDatePicker label={t('date_after')} value={filters.dateAfter} onChange={(v) => setFilters(prev => ({ ...prev, dateAfter: v }))} />
                                    <CustomDatePicker label={t('date_before')} value={filters.dateBefore} onChange={(v) => setFilters(prev => ({ ...prev, dateBefore: v }))} align="right" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">{t('loading_data')}</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-[24px] md:rounded-[32px] p-8 md:p-12 text-center border-2 border-dashed border-gray-200">
                        <h3 className="text-lg font-black text-gray-400">{t('no_results_found')}</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 mb-8">
                        {announcements.map((item) => (
                            <Link
                                key={item.id}
                                to={`/announcements/${item.id}`}
                                className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-transparent hover:border-indigo-100 transition-all group overflow-hidden block"
                            >
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border flex items-center gap-1 ${typeConfigs[item.type]?.color || 'bg-gray-50'}`}>
                                        {React.createElement(typeConfigs[item.type]?.icon || Info, { className: "w-3 h-3" })} {t(typeConfigs[item.type]?.labelKey || 'type_other')}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold ml-auto truncate max-w-[150px]">
                                        {item.organization?.organizationName}
                                    </span>
                                </div>
                                <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2 leading-tight break-words group-hover:text-indigo-600 transition-colors">
                                    {i18n.language.startsWith('el') ? item.titleEl : item.titleEn}
                                </h3>
                                <p className="text-gray-600 text-sm font-medium leading-relaxed truncate">
                                    {i18n.language.startsWith('el') ? item.contentEl : item.contentEn}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 md:gap-2 mt-6 md:mt-8 pb-10">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="p-2 md:p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 flex-shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
                        </button>

                        <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 py-1 max-w-[200px] sm:max-w-none">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i)}
                                    className={`min-w-[36px] md:min-w-[40px] h-9 md:h-10 px-2 rounded-xl font-black text-xs transition-all flex-shrink-0 ${currentPage === i ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                            className="p-2 md:p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 flex-shrink-0"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 h-5" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Announcements;