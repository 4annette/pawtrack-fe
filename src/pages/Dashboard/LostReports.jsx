import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, Search, Filter, Dog, Eye, MapPin, 
    Loader2, Clock, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, ChevronDown, Check,
    Navigation
} from "lucide-react";
import { toast } from "sonner";
import { fetchLostReports } from "@/services/api";
import { 
    CustomDropdown, CustomDatePicker, ReportDetailsModal, 
    AddSightingModal, MapModal 
} from "@/components/DashboardComponents";

const AddressDisplay = ({ lat, lng, onClick }) => {
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!lat || !lng) {
            setAddress("No location provided");
            return;
        }

        let isMounted = true;
        const fetchAddress = async () => {
            setLoading(true);
            try {
                await new Promise(r => setTimeout(r, Math.random() * 1500));
                
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                const data = await response.json();

                if (isMounted && data.address) {
                    const city = data.address.city || data.address.town || data.address.village || "";
                    const country = data.address.country || "";
                    const locString = [city, country].filter(Boolean).join(", ");
                    setAddress(locString || "Location details available");
                }
            } catch (error) {
                if (isMounted) setAddress("View Map Location");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAddress();
        return () => { isMounted = false; };
    }, [lat, lng]);

    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full flex items-center text-xs text-gray-600 hover:text-emerald-700 transition-colors text-left group-hover:text-emerald-600"
        >
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-500 flex-shrink-0" /> 
            <span className="truncate font-medium">
                {loading ? "Loading address..." : address}
            </span>
        </button>
    );
};

const ToolbarDropdown = ({ label, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 bg-white border px-4 py-2.5 rounded-xl transition-all shadow-sm ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}
            >
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700">{selectedLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-30 animate-in fade-in zoom-in-95">
                    <div className="p-1.5">
                        {options.map((option) => (
                            <div 
                                key={option.value} 
                                onClick={() => { onChange(option.value); setIsOpen(false); }} 
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${option.value === value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {option.label}
                                {option.value === value && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LostReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(9);
    const [sortBy, setSortBy] = useState("dateLost");
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterPanelRef = useRef(null);

    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState("idle");

    const [filters, setFilters] = useState({
        search: "",
        species: "",
        status: "", 
        dateAfter: "",
        dateBefore: "",
        radius: 10      //radious 10 km
    });

    const [sightingReportId, setSightingReportId] = useState(null); 
    const [mapLocation, setMapLocation] = useState(null);
    const [detailReport, setDetailReport] = useState(null);

    const parseDate = (dateInput) => {
        if (!dateInput) return null;
        if (Array.isArray(dateInput)) {
            return new Date(
                dateInput[0], dateInput[1] - 1, dateInput[2], 
                dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0
            );
        }
        if (typeof dateInput === 'string') {
            return new Date(dateInput.replace(" ", "T"));
        }
        return new Date(dateInput);
    };

    const formatDateTime = (dateObj) => {
        if (!dateObj) return null;
        const pad = (num) => String(num).padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ` +
               `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
    };

    const formatDateForBackend = (dateString) => dateString ? `${dateString} 00:00:00` : null;

    function getLostStatus(dateInput) {
        if (!dateInput) return "MORE_THAN_1_MONTH";
        const lostDate = parseDate(dateInput);
        const now = new Date();
        if (isNaN(lostDate.getTime())) return "MORE_THAN_1_MONTH";
        const diffInMilliseconds = now - lostDate;
        const hours = diffInMilliseconds / (1000 * 60 * 60);
        const days = hours / 24;
        if (hours < 3) return "LESS_THAN_3_HOURS";
        if (hours < 10) return "LESS_THAN_10_HOURS";
        if (days < 1) return "LESS_THAN_1_DAY";
        if (days < 7) return "LESS_THAN_1_WEEK";
        if (days < 30) return "LESS_THAN_1_MONTH";
        return "MORE_THAN_1_MONTH";
    }

    function getStatusColor(status) {
        switch (status) {
            case "LESS_THAN_3_HOURS": return "bg-red-500 text-white border-red-600";
            case "LESS_THAN_10_HOURS": return "bg-orange-500 text-white border-orange-600";
            case "LESS_THAN_1_DAY": return "bg-amber-400 text-black border-amber-500";
            case "LESS_THAN_1_WEEK": return "bg-blue-500 text-white border-blue-600";
            case "LESS_THAN_1_MONTH": return "bg-gray-400 text-white border-gray-500";
            case "MORE_THAN_1_MONTH": return "bg-slate-600 text-white border-slate-700";
            default: return "bg-emerald-500 text-white border-emerald-600";
        }
    }

    const statusOptions = [
        { label: "All Statuses", value: "" },
        { label: "Less than 3 Hours", value: "LESS_THAN_3_HOURS" },
        { label: "Less than 10 Hours", value: "LESS_THAN_10_HOURS" },
        { label: "Less than 1 Day", value: "LESS_THAN_1_DAY" },
        { label: "Less than 1 Week", value: "LESS_THAN_1_WEEK" },
        { label: "Less than 1 Month", value: "LESS_THAN_1_MONTH" },
        { label: "More than 1 Month", value: "MORE_THAN_1_MONTH" }
    ];

    useEffect(() => {
        if ("geolocation" in navigator) {
            setLocationStatus("loading");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationStatus("success");
                },
                (error) => {
                    console.error("Location error:", error);
                    setLocationStatus("error");
                }
            );
        }
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            if (locationStatus === "loading") return;

            setLoading(true);
            try {
                let calculatedDateAfter = null;
                let calculatedDateBefore = null;
                const now = new Date();

                if (filters.status) {
                    switch (filters.status) {
                        case "LESS_THAN_3_HOURS": calculatedDateAfter = new Date(now.getTime() - (3 * 60 * 60 * 1000)); break;
                        case "LESS_THAN_10_HOURS": calculatedDateAfter = new Date(now.getTime() - (10 * 60 * 60 * 1000)); break;
                        case "LESS_THAN_1_DAY": calculatedDateAfter = new Date(now.getTime() - (24 * 60 * 60 * 1000)); break;
                        case "LESS_THAN_1_WEEK": calculatedDateAfter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); break;
                        case "LESS_THAN_1_MONTH": calculatedDateAfter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); break;
                        case "MORE_THAN_1_MONTH": calculatedDateBefore = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); break;
                    }
                    calculatedDateAfter = formatDateTime(calculatedDateAfter);
                    calculatedDateBefore = formatDateTime(calculatedDateBefore);
                } else {
                    calculatedDateAfter = formatDateForBackend(filters.dateAfter);
                    calculatedDateBefore = formatDateForBackend(filters.dateBefore);
                }

                const payload = {
                    search: filters.search || null,
                    species: filters.species ? [filters.species] : null,
                    dateLostAfter: calculatedDateAfter,
                    dateLostBefore: calculatedDateBefore,
                    latitude: userLocation?.lat || null,
                    longitude: userLocation?.lng || null,
                    radius: userLocation ? filters.radius : null
                };
                
                const data = await fetchLostReports(page, pageSize, payload, sortBy);
                setReports(data.content || []);
                
                if (data.page) {
                    setTotalPages(data.page.totalPages || 0);
                    setTotalElements(data.page.totalElements || 0);
                } else {
                    setTotalPages(data.totalPages || 0);
                    setTotalElements(data.totalElements || 0);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load lost reports");
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(() => { fetchReports(); }, 300);
        return () => clearTimeout(timer);
    }, [page, filters, pageSize, sortBy, userLocation, locationStatus]);

    const handleStatusChange = (val) => {
        setFilters(prev => ({ ...prev, status: val, dateAfter: "", dateBefore: "" }));
        setPage(0);
    };

    const handleDateChange = (field, val) => {
        setFilters(prev => ({ ...prev, [field]: val, status: "" }));
        setPage(0);
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-12">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-orange-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-orange-900 mb-2">Lost your pet?</h2>
                    <p className="text-orange-800 max-w-xl opacity-90">Report your missing pet immediately to notify the community and get help.</p>
                </div>
                <button onClick={() => navigate("/create-lost-report")} className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-orange-200 transition-transform hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Report Lost Pet
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">Lost Reports</h1>
                        {locationStatus === "success" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                                <Navigation className="w-3 h-3" /> Near you ({filters.radius}km)
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">{loading ? "Searching..." : `${totalElements} reports found.`}</p>
                </div>

                <div className="flex items-center gap-3">
                    <ToolbarDropdown 
                        label="Show" 
                        value={pageSize} 
                        options={[{label:"6",value:6},{label:"9",value:9},{label:"12",value:12},{label:"15",value:15}]} 
                        onChange={(val) => { setPageSize(val); setPage(0); }} 
                    />
                    <ToolbarDropdown 
                        label="Sort" 
                        value={sortBy} 
                        options={[{label:"Newest",value:"dateLost"},{label:"Distance",value:"distance"},{label:"Title",value:"title"},{label:"Species",value:"species"}]} 
                        onChange={(val) => { setSortBy(val); setPage(0); }} 
                    />
                </div>
            </div>

            <div className="relative z-20">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" value={filters.search} onChange={(e) => {setFilters({...filters, search: e.target.value}); setPage(0);}} />
                    </div>
                    <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 shadow-md ${showFilterPanel ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'}`}>
                        <Filter className="w-5 h-5 text-white" /> <span className="hidden sm:inline font-medium text-sm">Filters</span>
                    </button>
                </div>
                {showFilterPanel && (
                    <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-white rounded-xl shadow-xl border border-emerald-100 p-6 z-50 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomDropdown label="Species" icon={Dog} value={filters.species} options={[{label:"All",value:""},{label:"Dog",value:"DOG"},{label:"Cat",value:"CAT"},{label:"Other",value:"OTHER"}]} onChange={(val) => {setFilters({...filters, species: val}); setPage(0);}} />
                            
                            <CustomDropdown 
                                label="Distance Radius" 
                                icon={Navigation} 
                                value={filters.radius} 
                                options={[
                                    {label:"5 km",value:5},
                                    {label:"10 km",value:10},
                                    {label:"25 km",value:25},
                                    {label:"50 km",value:50},
                                    {label:"Anywhere",value:10000}
                                ]} 
                                onChange={(val) => {setFilters({...filters, radius: val}); setPage(0);}} 
                            />

                            <CustomDropdown label="Time Status" icon={Clock} value={filters.status} options={statusOptions} onChange={handleStatusChange} />
                            <CustomDatePicker label="Lost After" value={filters.dateAfter} onChange={(val) => handleDateChange('dateAfter', val)} />
                            <CustomDatePicker label="Lost Before" value={filters.dateBefore} onChange={(val) => handleDateChange('dateBefore', val)} />
                        </div>
                    </div>
                )}
            </div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => {
                        const dateValue = report.dateLost || report.lostDate;
                        const currentStatus = getLostStatus(dateValue);
                        return (
                            <div 
                                key={report.id} 
                                onClick={() => setDetailReport({
                                    ...report, 
                                    dateLost: dateValue,
                                    status: currentStatus, 
                                    statusColor: getStatusColor(currentStatus), 
                                    statusSentence: currentStatus.replace(/_/g, ' ')
                                })} 
                                className="bg-emerald-50 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1"
                            >
                                <div className="relative h-64 bg-emerald-100 overflow-hidden">
                                    {report.imageUrl ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-emerald-300"><Dog className="w-12 h-12 opacity-50" /></div>}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border uppercase ${getStatusColor(currentStatus)}`}>
                                            {report.species}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">{report.title}</h3>
                                        {dateValue && (
                                            <span className="text-xs font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-md whitespace-nowrap ml-2">
                                                {parseDate(dateValue)?.toLocaleDateString() || "Unknown"}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{report.description || "No description provided."}</p>
                                    <div className="mt-auto pt-4 space-y-3 border-t border-emerald-200">
                                        
                                        <AddressDisplay 
                                            lat={report.latitude} 
                                            lng={report.longitude} 
                                            onClick={() => {
                                                if (report.latitude && report.longitude) {
                                                    setMapLocation({ lat: report.latitude, lng: report.longitude });
                                                } else {
                                                    toast.error("No map coordinates available");
                                                }
                                            }}
                                        />

                                        <button onClick={(e) => { e.stopPropagation(); setSightingReportId(report.id); }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"><Eye className="w-4 h-4" /> I Found This Pet</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-20">
                    <nav className="flex items-center gap-1 md:gap-2 p-2 bg-white border border-gray-100 rounded-[28px] shadow-2xl shadow-emerald-900/10 transition-all duration-500">
                        <button disabled={page === 0} onClick={() => setPage(0)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"><ChevronsLeft className="w-5 h-5" /></button>
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="flex items-center gap-1 mx-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setPage(i)} className={`min-w-[46px] h-[46px] rounded-full text-sm font-black transition-all duration-300 relative overflow-hidden ${page === i ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-110' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-700'}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(totalPages - 1)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"><ChevronsRight className="w-5 h-5" /></button>
                    </nav>
                </div>
            )}

            <ReportDetailsModal isOpen={!!detailReport} onClose={() => setDetailReport(null)} report={detailReport} onViewMap={(loc) => { setDetailReport(null); setMapLocation(loc); }} />
            <AddSightingModal isOpen={!!sightingReportId} onClose={() => setSightingReportId(null)} baseReportId={sightingReportId} type="LOST_REPORT_VIEW" />
            <MapModal isOpen={!!mapLocation} onClose={() => setMapLocation(null)} location={mapLocation} />
        </div>
    );
};

export default LostReports;