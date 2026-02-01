import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
        today.setHours(0, 0, 0, 0);

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
                <div className="absolute top-full left-0 mt-2 z-[2500] bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 w-64 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            disabled={isNextMonthDisabled()}
                            className={`p-1 rounded-full ${isNextMonthDisabled() ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-emerald-50 text-emerald-600'}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (<span key={i} className="text-xs font-bold text-emerald-400">{d}</span>))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {(() => {
                            const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                            const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                            const days = [];

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

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

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialPosition }) => {
    const [selectedPos, setSelectedPos] = useState(initialPosition || { lat: 37.9838, lng: 23.7275 });

    useEffect(() => {
        if (isOpen && initialPosition) {
            setSelectedPos(initialPosition);
        }
    }, [isOpen, initialPosition]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 animate-in fade-in">
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
                        <LocationPickerMarker position={selectedPos} setPosition={setSelectedPos} />
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
        </div>,
        document.body
    );
};

const LocationPickerMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position ? <Marker position={position} /> : null;
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
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (isMounted && data.address) {
                    const city = data.address.city || data.address.town || data.address.village || "";
                    const country = data.address.country || "";
                    setAddress([city, country].filter(Boolean).join(", ") || "Location details available");
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
            className="w-full flex items-center text-xs text-gray-600 hover:text-emerald-700 transition-colors text-left"
        >
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate font-medium">{loading ? "Loading address..." : address}</span>
        </button>
    );
};

const ToolbarDropdown = ({ label, value, options, onChange, align = "right" }) => {
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
        <div className="relative" ref={containerRef} style={{ zIndex: isOpen ? 2500 : 20 }}>
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
                <div className={`absolute top-full ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 z-50 animate-in fade-in zoom-in-95`}>
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
    const [filters, setFilters] = useState({ search: "", species: "", condition: "", dateAfter: "", dateBefore: "", chipNumber: "", radius: 25 });
    const [userLocation, setUserLocation] = useState(null);
    const [searchCenter, setSearchCenter] = useState(null);
    const [isCustomLocation, setIsCustomLocation] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedFoundId, setSelectedFoundId] = useState(null);
    const [sightingReportId, setSightingReportId] = useState(null);
    const [mapLocation, setMapLocation] = useState(null);
    const [detailReport, setDetailReport] = useState(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(loc);
                if (!isCustomLocation) setSearchCenter(loc);
            });
        }
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
                    dateFoundAfter: filters.dateAfter ? `${filters.dateAfter} 00:00:00` : null,
                    dateFoundBefore: filters.dateBefore ? `${filters.dateBefore} 00:00:00` : null,
                    latitude: searchCenter?.lat || null,
                    longitude: searchCenter?.lng || null,
                    radius: searchCenter ? filters.radius : null
                };
                const [field, dir] = sortBy.split('_');
                const data = await fetchFoundReports(page, pageSize, payload, field, dir);
                setReports(data.content || []);
                setTotalPages(data.page?.totalPages || 0);
                setTotalElements(data.page?.totalElements || 0);
            } catch (err) {
                toast.error("Failed to load reports");
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [page, filters, pageSize, sortBy, searchCenter]);

    return (
        <div className="space-y-8 animate-in fade-in pb-12">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Found a pet?</h2>
                    <p className="text-emerald-700 max-w-xl">Create a report to help owners find their pets.</p>
                </div>
                <button onClick={() => navigate("/create-found-report")} className="bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold">
                    <Plus className="w-5 h-5 inline mr-2" /> Add Found Report
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-30">
                <h1 className="text-3xl font-bold text-gray-900">Found Reports</h1>
                <div className="flex items-center gap-3">
                    <ToolbarDropdown label="Show" value={pageSize} options={[{ label: "6", value: 6 }, { label: "9", value: 9 }, { label: "12", value: 12 }]} onChange={(v) => setPageSize(v)} align="left" />
                    <ToolbarDropdown label="Sort" value={sortBy} options={[{ label: "Newest First", value: "dateFound_desc" }, { label: "Oldest First", value: "dateFound_asc" }]} onChange={(v) => setSortBy(v)} />
                </div>
            </div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div key={report.id} onClick={() => setDetailReport(report)} className="bg-emerald-50 rounded-2xl overflow-hidden cursor-pointer">
                            <div className="h-64 bg-emerald-100">
                                {report.imageUrl && <img src={report.imageUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold">{report.title}</h3>
                                <AddressDisplay lat={report.latitude} lng={report.longitude} onClick={() => setMapLocation({ lat: report.latitude, lng: report.longitude })} />
                                <div className="flex gap-2 mt-4">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedFoundId(report.id); }} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs">This is my pet</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LocationPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onConfirm={(pos) => setSearchCenter(pos)} initialPosition={searchCenter} />

            {createPortal(
                <div className="fixed inset-0 pointer-events-none z-[3000]">
                    <div className="pointer-events-auto">
                        <ReportDetailsModal
                            isOpen={!!detailReport}
                            onClose={() => setDetailReport(null)}
                            report={detailReport}
                            onViewMap={(loc) => { setDetailReport(null); setMapLocation(loc); }}
                            onClaim={(id) => { setDetailReport(null); setSelectedFoundId(id); }}
                            onAddSighting={(id) => { setDetailReport(null); setSightingReportId(id); }}
                        />
                        <ClaimModal isOpen={!!selectedFoundId} onClose={() => setSelectedFoundId(null)} foundReportId={selectedFoundId} addLostReportToFoundReport={addLostReportToFoundReport} />
                        <AddSightingModal isOpen={!!sightingReportId} onClose={() => setSightingReportId(null)} baseReportId={sightingReportId} type="FOUND" />
                        <MapModal isOpen={!!mapLocation} onClose={() => setMapLocation(null)} location={mapLocation} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default FoundReports;