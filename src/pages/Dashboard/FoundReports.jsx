import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, Search, Filter, Dog, CheckCircle, Eye, MapPin, 
    Loader2, Hash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Check,
    Navigation, Map as MapIcon, X, Calendar, Clock
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { fetchFoundReports, addLostReportToFoundReport } from "@/services/api";
import { 
    CustomDropdown, ReportDetailsModal, 
    ClaimModal, AddSightingModal, MapModal 
} from "@/components/DashboardComponents";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CustomDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) setViewDate(dateObj);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
      }
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
    
    const checkDate = new Date(year, viewDate.getMonth(), day);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (checkDate > today) return;

    onChange(newDateStr);
    setIsOpen(false);
  };

  const isNextMonthDisabled = () => {
      const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      const today = new Date();
      return nextMonth > today;
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Calendar className="w-3 h-3" /> {label}</label>
        <div onClick={() => setIsOpen(!isOpen)} className={`w-full p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm`}>
            <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || 'Select date'}</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
        </div>

        {isOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 w-64 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button 
                        type="button" 
                        onClick={() => changeMonth(1)} 
                        disabled={isNextMonthDisabled()}
                        className={`p-1 rounded-full ${isNextMonthDisabled() ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-emerald-50 text-emerald-600'}`}
                    >
                        <ChevronRight className="w-4 h-4"/>
                    </button>
                </div>

                <div className="grid grid-cols-7 mb-2 text-center">
                    {['S','M','T','W','T','F','S'].map((d,i) => (<span key={i} className="text-xs font-bold text-emerald-400">{d}</span>))}
                </div>

                <div className="grid grid-cols-7 gap-1 place-items-center">
                    {(() => {
                        const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                        const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                        const days = [];
                        
                        const today = new Date();
                        today.setHours(0,0,0,0);

                        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
                        for (let d = 1; d <= totalDays; d++) {
                            const thisDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                            const thisDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSelected = value === thisDateStr;
                            const isFuture = thisDate > today;

                            days.push(
                                <button 
                                    key={d} 
                                    onClick={() => !isFuture && handleDateClick(d)} 
                                    type="button" 
                                    disabled={isFuture}
                                    className={`h-7 w-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors 
                                        ${isFuture ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-700 hover:bg-emerald-100'}`}
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

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position ? (
        <Marker position={position}>
            <Popup>Search Center</Popup>
        </Marker>
    ) : null;
};

const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 13);
        }
    }, [lat, lng, map]);
    return null;
};

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialPosition }) => {
    const [selectedPos, setSelectedPos] = useState(initialPosition || { lat: 37.9838, lng: 23.7275 }); 

    useEffect(() => {
        if(isOpen && initialPosition) {
            setSelectedPos(initialPosition);
        }
    }, [isOpen, initialPosition]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                    <div>
                        <h3 className="font-bold text-emerald-900">Choose Search Location</h3>
                        <p className="text-xs text-emerald-600">Click on the map to set the center point</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-emerald-700" />
                    </button>
                </div>
                
                <div className="h-[400px] w-full relative z-10">
                    <MapContainer 
                        center={selectedPos} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <RecenterAutomatically lat={selectedPos.lat} lng={selectedPos.lng} />
                        <LocationMarker position={selectedPos} setPosition={setSelectedPos} />
                    </MapContainer>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm">Cancel</button>
                    <button 
                        onClick={() => { onConfirm(selectedPos); onClose(); }} 
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md shadow-emerald-200"
                    >
                        Search Here
                    </button>
                </div>
            </div>
        </div>
    );
};

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
                await new Promise(r => setTimeout(r, Math.random() * 500));
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
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
            <span className="truncate font-medium">{loading ? "Loading address..." : address}</span>
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

const FoundReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(9);
    const [sortBy, setSortBy] = useState("dateFound_desc");
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterPanelRef = useRef(null);
    const [filters, setFilters] = useState({
        search: "", 
        species: "", 
        condition: "", 
        dateAfter: "", 
        dateBefore: "", 
        chipNumber: "",
        radius: 25
    });

    const [userLocation, setUserLocation] = useState(null);
    const [searchCenter, setSearchCenter] = useState(null);
    const [isCustomLocation, setIsCustomLocation] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [locationStatus, setLocationStatus] = useState("idle");

    const [selectedFoundId, setSelectedFoundId] = useState(null);
    const [sightingReportId, setSightingReportId] = useState(null);
    const [mapLocation, setMapLocation] = useState(null);
    const [detailReport, setDetailReport] = useState(null);

    const formatDateForBackend = (dateString) => dateString ? `${dateString} 00:00:00` : null;

    useEffect(() => {
        if ("geolocation" in navigator) {
            setLocationStatus("loading");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    if (!isCustomLocation) {
                        setSearchCenter(loc);
                    }
                    setLocationStatus("success");
                },
                (error) => {
                    console.error("Location access error:", error);
                    setLocationStatus("error");
                    toast.error("Could not get your location.");
                }
            );
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
                setShowFilterPanel(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const payload = {
                    search: filters.search || null,
                    species: filters.species ? [filters.species] : null,
                    conditions: filters.condition ? [filters.condition] : null,
                    chipNumber: filters.chipNumber ? parseInt(filters.chipNumber) : null,
                    dateFoundAfter: formatDateForBackend(filters.dateAfter),
                    dateFoundBefore: formatDateForBackend(filters.dateBefore),
                    latitude: searchCenter?.lat || null,
                    longitude: searchCenter?.lng || null,
                    radius: searchCenter ? filters.radius : null
                };
                
                const [field, dir] = sortBy.includes('_') ? sortBy.split('_') : [sortBy, 'desc'];

                const data = await fetchFoundReports(page, pageSize, payload, field, dir);
                
                let fetchedReports = data.content || [];

                fetchedReports.sort((a, b) => {
                    if (field === 'title') {
                        return (a.title || "").localeCompare(b.title || "");
                    }
                    if (field === 'distance') {
                        return (a.distance || 0) - (b.distance || 0);
                    }

                    const dateA = new Date(a.dateFound || a.foundDate || 0);
                    const dateB = new Date(b.dateFound || b.foundDate || 0);
                    
                    if (dir === 'asc') return dateA - dateB;
                    return dateB - dateA;
                });

                setReports(fetchedReports);

                if (data.page) {
                    setTotalPages(data.page.totalPages || 0);
                    setTotalElements(data.page.totalElements || 0);
                } else {
                    setTotalPages(data.totalPages || 0);
                    setTotalElements(data.totalElements || 0);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load found reports");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => { fetchReports(); }, 500);
        return () => clearTimeout(timer);
    }, [page, filters, pageSize, sortBy, searchCenter]);

    const handleCustomLocationSelect = (latlng) => {
        setSearchCenter(latlng);
        setIsCustomLocation(true);
        setPage(0);
        toast.success("Search area updated");
    };

    const resetToUserLocation = () => {
        if (userLocation) {
            setSearchCenter(userLocation);
            setIsCustomLocation(false);
            setPage(0);
            toast.info("Reset to your current location");
        } else {
            toast.error("Location not available");
        }
    };

    const getConditionColor = (val) => {
        if (!val) return 'bg-gray-100 text-gray-800 border-gray-200';
        const normalized = String(val).toUpperCase().trim();
        if (normalized === 'EXCELLENT') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (normalized === 'GOOD') return 'bg-amber-100 text-amber-800 border-amber-200';
        if (normalized === 'BAD') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-12">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Found a pet?</h2>
                    <p className="text-emerald-700 max-w-xl">Did you find a lost animal? Create a found report to help the owner find them quickly.</p>
                </div>
                <button onClick={() => navigate("/create-found-report")} className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-emerald-200 transition-transform hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Found Report
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Found Reports</h1>
                    <p className="text-gray-500 mt-1">{loading ? "Searching..." : `${totalElements} reports found.`}</p>
                </div>
                <div className="flex items-center gap-3">
                    <ToolbarDropdown 
                        label="Show" 
                        value={pageSize} 
                        options={[{label:"6",value:6},{label:"9",value:9},{label:"12",value:12},{label:"15",value:15}]} 
                        onChange={(val)=>{setPageSize(val);setPage(0);}} 
                    />
                    <ToolbarDropdown 
                        label="Sort" 
                        value={sortBy} 
                        options={[
                            {label:"Newest First", value:"dateFound_desc"},
                            {label:"Oldest First", value:"dateFound_asc"},
                            {label:"Distance", value:"distance_asc"},
                            {label:"Title", value:"title_asc"}
                        ]} 
                        onChange={(val)=>{setSortBy(val);setPage(0);}} 
                    />
                </div>
            </div>

            <div className="relative z-20 space-y-3">
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapIcon className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">Searching area:</span>
                        {searchCenter ? (
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-100">
                                {isCustomLocation ? "Custom Map Location" : "My Current Location"} (25km radius)
                            </span>
                        ) : (
                            <span className="text-gray-400 italic">Getting location...</span>
                        )}
                    </div>
                    
                    <div className="flex-1"></div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsPickerOpen(true)}
                            className="text-xs flex items-center gap-1 bg-white border border-gray-300 hover:border-emerald-500 hover:text-emerald-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                            <MapPin className="w-3.5 h-3.5" /> Pick on Map
                        </button>

                        {isCustomLocation && userLocation && (
                            <button 
                                onClick={resetToUserLocation}
                                className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors font-medium border border-emerald-100"
                            >
                                <Navigation className="w-3.5 h-3.5" /> Use My Location
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search title or description..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" value={filters.search} onChange={(e) => {setFilters({...filters, search: e.target.value}); setPage(0);}} />
                    </div>
                    <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 shadow-md ${showFilterPanel ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'}`}>
                        <Filter className="w-5 h-5 text-white" /> <span className="hidden sm:inline font-medium text-sm">Filters</span>
                    </button>
                </div>

                {showFilterPanel && (
                    <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-emerald-50 rounded-xl shadow-xl border border-emerald-100 p-6 z-50 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-200">
                            <h3 className="font-semibold text-emerald-900">Filter Options</h3>
                            <button onClick={() => setFilters({search:"", species:"", condition:"", dateAfter:"", dateBefore:"", chipNumber:"", radius: 25})} className="text-xs text-red-500 hover:underline">Clear all</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomDropdown label="Species" icon={Dog} value={filters.species} options={[{label:"All",value:""},{label:"Dog",value:"DOG"},{label:"Cat",value:"CAT"},{label:"Other",value:"OTHER"}]} onChange={(val) => {setFilters({...filters, species: val}); setPage(0);}} />
                            <CustomDropdown label="Condition" icon={CheckCircle} value={filters.condition} options={[{label:"Any",value:""},{label:"Excellent",value:"EXCELLENT"},{label:"Good",value:"GOOD"},{label:"Bad",value:"BAD"}]} onChange={(val) => {setFilters({...filters, condition: val}); setPage(0);}} />
                            <CustomDatePicker label="Found After" value={filters.dateAfter} onChange={(val) => {setFilters({...filters, dateAfter: val}); setPage(0);}} />
                            <CustomDatePicker label="Found Before" value={filters.dateBefore} onChange={(val) => {setFilters({...filters, dateBefore: val}); setPage(0);}} />
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Hash className="w-3 h-3" /> Chip Number</label>
                                <input type="number" placeholder="e.g. 123456789" className="w-full p-2.5 rounded-lg border border-emerald-100 text-sm focus:ring-2 focus:ring-emerald-500" value={filters.chipNumber} onChange={(e) => {setFilters({...filters, chipNumber: e.target.value}); setPage(0);}} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Dog className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No found reports match your criteria.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} onClick={() => setDetailReport(report)} className="bg-emerald-50 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1">
                                <div className="relative h-64 bg-emerald-100 overflow-hidden">
                                    {report.imageUrl ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-emerald-300"><Dog className="w-12 h-12 opacity-50" /></div>}
                                    <div className="absolute top-3 right-3"><span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${getConditionColor(report.condition)}`}>{report.species}</span></div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900 line-clamp-1">{report.title}</h3><span className="text-xs font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-md">{new Date(report.foundDate).toLocaleDateString()}</span></div>
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
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedFoundId(report.id); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"><CheckCircle className="w-4 h-4" /> This is my pet</button>
                                            <button onClick={(e) => { e.stopPropagation(); setSightingReportId(report.id); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-semibold text-xs hover:bg-emerald-50 shadow-sm"><Eye className="w-4 h-4" /> I saw this pet</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-16">
                    <nav className="flex items-center gap-1 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-emerald-900/5">
                        <button disabled={page === 0} onClick={() => setPage(0)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20"><ChevronsLeft className="w-5 h-5" /></button>
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setPage(i)} className={`min-w-[44px] h-11 rounded-xl text-sm font-bold transition-all duration-200 ${page === i ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(totalPages - 1)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20"><ChevronsRight className="w-5 h-5" /></button>
                    </nav>
                </div>
            )}

            <LocationPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onConfirm={handleCustomLocationSelect}
                initialPosition={searchCenter || userLocation} 
            />
            
            <ReportDetailsModal isOpen={!!detailReport} onClose={() => setDetailReport(null)} report={detailReport} onViewMap={(loc) => { setDetailReport(null); setMapLocation(loc); }} />
            <ClaimModal isOpen={!!selectedFoundId} onClose={() => setSelectedFoundId(null)} foundReportId={selectedFoundId} addLostReportToFoundReport={addLostReportToFoundReport} />
            <AddSightingModal isOpen={!!sightingReportId} onClose={() => setSightingReportId(null)} baseReportId={sightingReportId} type="FOUND" />
            <MapModal isOpen={!!mapLocation} onClose={() => setMapLocation(null)} location={mapLocation} />
        </div>
    );
};

export default FoundReports;