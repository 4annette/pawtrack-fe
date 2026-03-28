import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    MapPin, Calendar, FileText, ChevronDown, Check,
    Loader2, Trash2, ChevronLeft, ChevronRight,
    Search, Mail, User, X, Filter, Dog, 
    CheckCircle, Hash, Map as MapIcon, Navigation
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { deleteLostReport, deleteFoundReport } from "@/services/api";
import api from "@/services/api";

import PawTrackLogo from "@/components/PawTrackLogo";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";
import AdminMenu from "@/components/admin/AdminMenu";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SimpleMapModal = ({ isOpen, onClose, position, title, activeTab }) => {
    if (!isOpen || !position) return null;
    const accentColor = activeTab === 'lost' ? 'orange' : 'emerald';

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[4000] p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className={`p-5 border-b border-gray-100 flex justify-between items-center bg-${accentColor}-50`}>
                    <h3 className={`font-black text-${accentColor}-900 uppercase text-xs tracking-widest truncate pr-4`}>{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="h-[350px] w-full">
                    <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position} />
                    </MapContainer>
                </div>
                <div className="p-4 bg-gray-50 flex justify-center">
                    <button onClick={onClose} className={`px-8 py-2 bg-${accentColor}-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest`}>
                        {activeTab === 'lost' ? 'Close Map' : 'Κλείσιμο'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialPosition, activeTab }) => {
    const { t } = useTranslation();
    const [selectedPos, setSelectedPos] = useState(initialPosition || { lat: 37.9838, lng: 23.7275 });
    const accentColor = activeTab === 'lost' ? 'orange' : 'emerald';

    useEffect(() => {
        if (isOpen && initialPosition) setSelectedPos(initialPosition);
    }, [isOpen, initialPosition]);

    if (!isOpen) return null;

    const LocationMarker = () => {
        useMapEvents({
            click(e) { setSelectedPos(e.latlng); },
        });
        return selectedPos ? <Marker position={selectedPos} /> : null;
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className={`p-6 border-b border-gray-100 flex justify-between items-center bg-${accentColor}-50`}>
                    <div>
                        <h3 className={`font-black text-${accentColor}-900 uppercase text-sm tracking-widest`}>{t('choose_location_title')}</h3>
                        <p className={`text-xs font-bold text-${accentColor}-600 uppercase`}>{t('radius_filter_info')} (25km)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="h-[400px] w-full relative">
                    <MapContainer center={selectedPos} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker />
                    </MapContainer>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold uppercase text-xs">{t('cancel')}</button>
                    <button
                        onClick={() => { onConfirm(selectedPos); onClose(); }}
                        className={`px-8 py-3 bg-${accentColor}-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg transition-all hover:scale-105`}
                    >
                        {t('apply_location')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const formatDate = (report, t) => {
    const dateValue = report.lostDate || report.dateLost || report.foundDate || report.dateFound;
    if (!dateValue) return t('date_not_set');
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? t('invalid_date') : date.toLocaleDateString();
};

const formatBackendDate = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    return isEndOfDay ? `${dateStr} 23:59:59` : `${dateStr} 00:00:00`;
};

const CustomDatePicker = ({ label, value, onChange, activeTab }) => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef(null);
    const currentLocale = i18n.language.startsWith('el') ? 'el-GR' : 'en-US';
    const accentColor = activeTab === 'lost' ? 'orange' : 'emerald';

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
                className={`w-full h-11 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? `ring-2 ring-${accentColor}-500` : ''}`}
            >
                <span className={`text-sm font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || "YYYY-MM-DD"}</span>
                <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className={`p-1 hover:bg-gray-50 rounded-full text-${accentColor}-600`}><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString(currentLocale, { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className={`p-1 hover:bg-gray-50 rounded-full text-${accentColor}-600`}><ChevronRight className="w-4 h-4" /></button>
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
                                    <button key={d} onClick={() => handleDateClick(d)} type="button" className={`h-7 w-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${value === thisDateStr ? `bg-${accentColor}-600 text-white shadow-md` : 'text-gray-700 hover:bg-gray-100'}`}>{d}</button>
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

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const accentColor = activeTab === 'lost' ? 'orange' : 'emerald';

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
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full h-11 px-3 bg-gray-50 border-none rounded-xl flex items-center justify-between transition-all ${isOpen ? `ring-2 ring-${accentColor}-500` : ''}`}>
                <span className="text-sm font-bold text-gray-900 truncate">{selectedOption.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                    <div className="max-h-60 overflow-y-auto p-1.5">
                        {options.map((option) => (
                            <div key={option.value === null ? "all-opt" : option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${option.value === value ? `bg-${accentColor}-50 text-${accentColor}-600 font-bold` : 'text-gray-700 hover:bg-gray-50'}`}>
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

const AddressDisplay = ({ lat, lng, activeTab, onClick }) => {
    const { t, i18n } = useTranslation();
    const [address, setAddress] = useState(t('loading_dots'));
    const colorClass = activeTab === 'lost' ? 'text-orange-600 hover:text-orange-800' : 'text-emerald-600 hover:text-emerald-800';

    useEffect(() => {
        if (!lat || !lng || (lat === 0 && lng === 0)) {
            setAddress(t('location_not_set'));
            return;
        }
        const fetchAddress = async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${i18n.language}`);
                if (response.status === 429) {
                    setAddress(t('view_on_map'));
                    return;
                }
                const data = await response.json();
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village || "";
                    const road = data.address.road || "";
                    const suburb = data.address.suburb || data.address.neighbourhood || "";
                    const locationParts = [road, suburb, city].filter(Boolean);
                    setAddress(locationParts.length > 0 ? locationParts.join(", ") : t('view_on_map'));
                }
            } catch (error) { setAddress(t('view_on_map')); }
        };
        const timer = setTimeout(fetchAddress, 1000);
        return () => clearTimeout(timer);
    }, [lat, lng, t, i18n.language]);

    return (
        <span onClick={(e) => { e.stopPropagation(); onClick(); }} className={`flex items-center gap-1 font-medium truncate cursor-pointer transition-colors max-w-[200px] ${colorClass}`}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{address}</span>
        </span>
    );
};

const ReportsManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState("lost");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterPanelRef = useRef(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [searchLocation, setSearchLocation] = useState(null);
    const [viewerMapData, setViewerMapData] = useState({ isOpen: false, pos: null, title: "" });

    const [filters, setFilters] = useState({ 
        search: "", species: "", condition: "", dateAfter: "", dateBefore: "", chipNumber: "", foundStatus: null 
    });

    const speciesOptions = [{ value: "", label: t('all') }, { value: "DOG", label: t('DOG') }, { value: "CAT", label: t('CAT') }, { value: "OTHER", label: t('OTHER') }];
    const conditionOptions = [{ value: "", label: t('any') }, { value: "EXCELLENT", label: t('EXCELLENT') }, { value: "GOOD", label: t('GOOD') }, { value: "BAD", label: t('BAD') }];
    const foundOptions = [{ value: null, label: t('all') }, { value: true, label: t('found_status_true') }, { value: false, label: t('found_status_false') }];

    const getSpeciesStyle = (species) => {
        const val = String(species || "").toUpperCase();
        if (val === 'DOG') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (val === 'CAT') return 'bg-purple-50 text-purple-600 border-purple-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    const getConditionStyle = (condition) => {
        const normalized = String(condition || "").toUpperCase();
        if (normalized === 'EXCELLENT') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (normalized === 'GOOD') return 'bg-sky-50 text-sky-600 border-sky-100';
        if (normalized === 'BAD') return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === "lost" ? "/admin/lost-reports/filter" : "/admin/found-reports/filter";
            let payload = {
                search: filters.search || null,
                species: filters.species ? [filters.species] : [],
                found: filters.foundStatus,
                latitude: searchLocation?.lat || null,
                longitude: searchLocation?.lng || null,
                radius: searchLocation ? 25.0 : null
            };
            if (activeTab === "lost") {
                payload = { ...payload, dateLostAfter: formatBackendDate(filters.dateAfter), dateLostBefore: formatBackendDate(filters.dateBefore, true) };
            } else {
                payload = { ...payload, chipNumber: filters.chipNumber ? parseInt(filters.chipNumber) : null, dateFoundAfter: formatBackendDate(filters.dateAfter), dateFoundBefore: formatBackendDate(filters.dateBefore, true), conditions: filters.condition ? [filters.condition] : [] };
            }
            const response = await api.post(endpoint, payload, { params: { page, size: pageSize, sortBy: activeTab === "lost" ? 'dateLost' : 'dateFound', sortDirection: 'DESC' } });
            if (response.data) {
                setReports(response.data.content || []);
                const pageData = response.data.page || response.data;
                setTotalPages(pageData.totalPages || 0);
            }
        } catch (error) { toast.error(t('failed_to_load_reports')); setReports([]); } finally { setLoading(false); }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => { loadReports(); }, 500);
        return () => clearTimeout(delayDebounce);
    }, [activeTab, page, filters, searchLocation]);

    useEffect(() => {
        const handleClickOutside = (e) => { if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(t('confirm_delete_report'))) return;
        try {
            if (activeTab === "lost") {
                await deleteLostReport(id);
            } else {
                await deleteFoundReport(id);
            }
            toast.success(t('report_deleted_success'));
            loadReports();
        } catch (error) { 
            toast.error(t('delete_failed')); 
            console.error(error);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const handleCardClick = (reportId) => {
        const route = activeTab === "lost" ? `/admin/reports/lost/${reportId}` : `/admin/reports/found/${reportId}`;
        navigate(route);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate('/dashboard')}><PawTrackLogo size="sm" /><span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('admin_panel')}</span></div>
                    <div className="flex items-center gap-4"><AdminMenu /><Notifications /><ProfileButton /></div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <FileText className={`w-8 h-8 ${activeTab === 'lost' ? 'text-orange-600' : 'text-emerald-600'}`} />
                            {t('reports_management')}
                        </h1>
                        <p className="text-gray-400 mt-1 font-black uppercase text-[10px] tracking-widest">{t('global_content_moderation')}</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex relative h-12 w-full md:w-64">
                            <div 
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-out z-0 ${activeTab === 'lost' ? 'left-1 bg-orange-600 shadow-orange-200' : 'left-[50%] bg-emerald-600 shadow-emerald-200'} shadow-lg`}
                            />
                            
                            <button 
                                onClick={() => { setActiveTab("lost"); setPage(0); setSearchLocation(null); setFilters({ search: "", species: "", condition: "", dateAfter: "", dateBefore: "", chipNumber: "", foundStatus: null }); }} 
                                className={`relative flex-1 text-center text-xs font-black uppercase tracking-widest transition-colors duration-200 z-10 ${activeTab === 'lost' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {t('lost')}
                            </button>
                            <button 
                                onClick={() => { setActiveTab("found"); setPage(0); setSearchLocation(null); setFilters({ search: "", species: "", condition: "", dateAfter: "", dateBefore: "", chipNumber: "", foundStatus: null }); }} 
                                className={`relative flex-1 text-center text-xs font-black uppercase tracking-widest transition-colors duration-200 z-10 ${activeTab === 'found' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {t('found')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative z-40 space-y-3 mb-8">
                    <div className="flex bg-white p-3 rounded-2xl border border-gray-100 items-center justify-between shadow-sm mb-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest"><MapIcon className={`w-4 h-4 ${searchLocation ? (activeTab === 'lost' ? 'text-orange-500' : 'text-emerald-500') : 'text-gray-300'}`} />{searchLocation ? t('area_filtered') : t('global_search')}</div>
                        <div className="flex gap-2">
                            {searchLocation && <button onClick={() => setSearchLocation(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-black uppercase"><X className="w-3 h-3" /> {t('clear')}</button>}
                            <button onClick={() => setIsPickerOpen(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all ${searchLocation ? (activeTab === 'lost' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600') : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}><Navigation className="w-3 h-3" /> {t('pick_on_map')}</button>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder={t('search_placeholder')} className={`w-full pl-11 pr-4 h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-${activeTab === 'lost' ? 'orange' : 'emerald'}-50 text-sm font-bold`} value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }} />
                        </div>
                        <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-2 shadow-sm ${showFilterPanel ? (activeTab === 'lost' ? 'bg-orange-600 border-orange-600' : 'bg-emerald-600 border-emerald-600') + ' text-white' : 'bg-white border-gray-200 text-gray-600'}`}><Filter className="w-5 h-5" /> <span className="hidden sm:inline font-bold text-sm">{t('filters_btn')}</span></button>
                    </div>
                    {showFilterPanel && (
                        <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 z-50 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50"><h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{t('filter_options_title')}</h3><button onClick={() => setFilters({ search: "", species: "", condition: "", dateAfter: "", dateBefore: "", chipNumber: "", foundStatus: null })} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700">{t('clear_all_btn')}</button></div>
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDropdown activeTab={activeTab} label={t('label_species')} icon={Dog} value={filters.species} options={speciesOptions} onChange={(val) => setFilters({ ...filters, species: val })} />
                                    {activeTab === 'found' ? <CustomDropdown activeTab={activeTab} label={t('label_condition')} icon={CheckCircle} value={filters.condition} options={conditionOptions} onChange={(val) => setFilters({ ...filters, condition: val })} /> : <CustomDropdown activeTab={activeTab} label={t('status')} icon={CheckCircle} value={filters.foundStatus} options={foundOptions} onChange={(val) => handleFilterChange("foundStatus", val)} />}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomDatePicker activeTab={activeTab} label={activeTab === 'lost' ? t('lost_after_label') : t('label_found_after')} value={filters.dateAfter} onChange={(val) => setFilters({ ...filters, dateAfter: val })} />
                                    <CustomDatePicker activeTab={activeTab} label={activeTab === 'lost' ? t('lost_before_label') : t('label_found_before')} value={filters.dateBefore} onChange={(val) => setFilters({ ...filters, dateBefore: val })} />
                                </div>
                                {activeTab === 'found' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1"><Hash className="w-3 h-3" /> {t('label_chip_number')}</label><input type="number" placeholder="e.g. 123456789" className={`w-full h-11 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-${activeTab === 'lost' ? 'orange' : 'emerald'}-50`} value={filters.chipNumber} onChange={(e) => setFilters({ ...filters, chipNumber: e.target.value })} /></div><CustomDropdown activeTab={activeTab} label={t('status')} icon={CheckCircle} value={filters.foundStatus} options={foundOptions} onChange={(val) => handleFilterChange("foundStatus", val)} /></div>}
                            </div>
                        </div>
                    )}
                </div>

                {loading ? <div className="flex flex-col items-center py-20 gap-3"><Loader2 className={`w-10 h-10 animate-spin ${activeTab === 'lost' ? 'text-orange-600' : 'text-emerald-600'}`} /><span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('loading_data')}</span></div> : (
                    <div className="grid grid-cols-1 gap-4">
                        {reports.length > 0 ? reports.map((report) => (
                            <div key={report.id} onClick={() => handleCardClick(report.id)} className="bg-white rounded-[2.5rem] border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative cursor-pointer">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${activeTab === 'lost' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-40 h-40 rounded-[1.5rem] bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-50">{report.imageUrl ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-10 h-10" /></div>}</div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`text-xl font-bold text-gray-900 truncate pr-4 group-hover:text-${activeTab === 'lost' ? 'orange' : 'emerald'}-600 transition-colors`}>{report.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => handleDelete(report.id, e)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-y-2 gap-x-4 mb-4"><span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase"><Calendar className="w-3.5 h-3.5" /> {formatDate(report, t)}</span><AddressDisplay activeTab={activeTab} lat={report.latitude} lng={report.longitude} onClick={() => setViewerMapData({ isOpen: true, pos: { lat: report.latitude, lng: report.longitude }, title: report.title })} /><span className={`px-4 py-1.5 rounded-xl text-[13px] font-black uppercase tracking-widest border shadow-sm transition-all ${getSpeciesStyle(report.species)}`}>{report.species || 'N/A'}</span>{activeTab === 'found' && report.condition && <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-sm transition-all ${getConditionStyle(report.condition)}`}>{t(report.condition)}</span>}</div>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{report.description || t('no_description_provided')}</p>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full bg-${activeTab === 'lost' ? 'orange' : 'emerald'}-50 flex items-center justify-center text-${activeTab === 'lost' ? 'orange' : 'emerald'}-600 font-bold text-xs uppercase border border-${activeTab === 'lost' ? 'orange' : 'emerald'}-100 shadow-sm`}>{report.creator?.firstName?.charAt(0) || <User className="w-4 h-4" />}</div><div className="flex flex-col"><span className="text-xs font-bold text-gray-900 leading-none">{report.creator?.firstName} {report.creator?.lastName}</span><span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {report.creator?.email}</span></div></div><span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">ID: #{report.id}</span></div>
                                    </div>
                                </div>
                            </div>
                        )) : <div className="bg-white rounded-[2.5rem] py-24 text-center border-2 border-dashed border-gray-100"><Search className="w-12 h-12 text-gray-200 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-800">{t('no_reports_found')}</h3><p className="text-gray-400 text-sm">{t('try_adjusting_filters')}</p></div>}
                    </div>
                )}
                {totalPages > 1 && <div className="flex justify-center items-center mt-12 gap-2"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-3 bg-white border border-gray-200 rounded-2xl disabled:opacity-20 hover:bg-gray-50 transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></button><div className="flex items-center gap-1">{[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => setPage(i)} className={`min-w-[44px] h-11 rounded-xl text-sm font-bold transition-all ${page === i ? (activeTab === 'lost' ? 'bg-orange-600' : 'bg-emerald-600') + ' text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>{i + 1}</button>))}</div><button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="p-3 bg-white border border-gray-200 rounded-2xl disabled:opacity-20 hover:bg-gray-50 transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></button></div>}
            </main>
            <LocationPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onConfirm={(pos) => { setSearchLocation(pos); setPage(0); }} initialPosition={searchLocation} activeTab={activeTab} />
            <SimpleMapModal isOpen={viewerMapData.isOpen} onClose={() => setViewerMapData({ ...viewerMapData, isOpen: false })} position={viewerMapData.pos} title={viewerMapData.title} activeTab={activeTab} />
        </div>
    );
};

export default ReportsManagement;