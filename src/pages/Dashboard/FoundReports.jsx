import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Dog, CheckCircle, Eye, MapPin, Loader2, Hash } from "lucide-react";
import { toast } from "sonner";
import { fetchFoundReports } from "@/services/api";
import { 
    CustomDropdown, CustomDatePicker, ReportDetailsModal, 
    ClaimModal, AddSightingModal, MapModal 
} from "@/components/DashboardComponents";

const FoundReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    // Filters
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterPanelRef = useRef(null);
    const [filters, setFilters] = useState({
        search: "",
        species: "",
        condition: "",
        dateAfter: "",
        dateBefore: "",
        chipNumber: ""
    });

    // Modals
    const [selectedFoundId, setSelectedFoundId] = useState(null); // For Claiming
    const [sightingReportId, setSightingReportId] = useState(null); // For Sightings
    const [mapLocation, setMapLocation] = useState(null);
    const [detailReport, setDetailReport] = useState(null);

    const formatDateForBackend = (dateString) => dateString ? `${dateString} 00:00:00` : null;

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
                    dateFoundBefore: formatDateForBackend(filters.dateBefore)
                };
                const data = await fetchFoundReports(page, 9, payload);
                const content = data.content || [];
                setReports(content);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements ?? data.numberOfElements ?? content.length);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load found reports");
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(() => { fetchReports(); }, 500);
        return () => clearTimeout(timer);
    }, [page, filters]);

    const getConditionColor = (val) => {
        if (!val) return 'bg-gray-100 text-gray-800 border-gray-200';
        const normalized = String(val).toUpperCase().trim();
        if (normalized === 'EXCELLENT') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (normalized === 'GOOD') return 'bg-amber-100 text-amber-800 border-amber-200';
        if (normalized === 'BAD' || normalized === 'INJURED') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* HERO SHORTCUT */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Found a pet?</h2>
                    <p className="text-emerald-700 max-w-xl">Did you find a lost animal? Create a found report to help the owner find them quickly.</p>
                </div>
                <button onClick={() => navigate("/create-found-report")} className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-emerald-200 transition-transform hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Found Report
                </button>
            </div>

            {/* TITLE & FILTERS */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Found Reports</h1>
                <p className="text-gray-500 mt-1">{loading ? "Searching..." : totalElements === 0 ? "No reports found." : `${totalElements} reports found.`}</p>
            </div>

            <div className="relative z-20">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                    </div>
                    <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 shadow-md ${showFilterPanel ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'}`}>
                        <Filter className="w-5 h-5 text-white" /> <span className="hidden sm:inline font-medium text-sm">Filters</span>
                    </button>
                </div>
                {showFilterPanel && (
                    <div ref={filterPanelRef} className="absolute top-full right-0 mt-3 w-full md:w-[600px] bg-emerald-50 rounded-xl shadow-xl border border-emerald-100 p-6 z-50">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-200">
                            <h3 className="font-semibold text-emerald-900">Filter Options</h3>
                            <button onClick={() => setFilters({search:"", species:"", condition:"", dateAfter:"", dateBefore:"", chipNumber:""})} className="text-xs text-red-500 hover:underline">Clear all</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomDropdown label="Species" icon={Dog} value={filters.species} options={[{label:"All",value:""},{label:"Dog",value:"DOG"},{label:"Cat",value:"CAT"},{label:"Other",value:"OTHER"}]} onChange={(val) => setFilters({...filters, species: val})} />
                            <CustomDropdown label="Condition" icon={CheckCircle} value={filters.condition} options={[{label:"Any",value:""},{label:"Excellent",value:"EXCELLENT"},{label:"Good",value:"GOOD"},{label:"Injured",value:"INJURED"}]} onChange={(val) => setFilters({...filters, condition: val})} />
                            <CustomDatePicker label="Found After" value={filters.dateAfter} onChange={(val) => setFilters({...filters, dateAfter: val})} />
                            <CustomDatePicker label="Found Before" value={filters.dateBefore} onChange={(val) => setFilters({...filters, dateBefore: val})} />
                            <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Hash className="w-3 h-3" /> Chip Number</label><input type="number" placeholder="e.g. 123456789" className="w-full p-2.5 rounded-lg border border-emerald-100 text-sm focus:ring-2 focus:ring-emerald-500" value={filters.chipNumber} onChange={(e) => setFilters({...filters, chipNumber: e.target.value})} /></div>
                        </div>
                    </div>
                )}
            </div>

            {/* GRID */}
            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div key={report.id} onClick={() => setDetailReport(report)} className="bg-emerald-50 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1">
                            <div className="relative h-64 bg-emerald-100 overflow-hidden">
                                {report.imageUrl ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-emerald-300"><Dog className="w-12 h-12 opacity-50" /></div>}
                                <div className="absolute top-3 right-3"><span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${getConditionColor(report.condition)}`}>{report.species}</span></div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900 line-clamp-1">{report.title}</h3><span className="text-xs font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-md">{new Date(report.foundDate).toLocaleDateString()}</span></div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{report.description || "No description provided."}</p>
                                <div className="mt-auto pt-4 space-y-3 border-t border-emerald-200">
                                    <button onClick={(e) => { e.stopPropagation(); setMapLocation(report.location); }} className="w-full flex items-center text-xs text-gray-600 hover:text-emerald-700"><MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> View Location</button>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedFoundId(report.id); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"><CheckCircle className="w-4 h-4" /> This is my pet</button>
                                        <button onClick={(e) => { e.stopPropagation(); setSightingReportId(report.id); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-semibold text-xs hover:bg-emerald-50 shadow-sm"><Eye className="w-4 h-4" /> I saw this pet</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <span className="text-sm text-gray-600 font-medium">Page {page + 1} of {totalPages}</span>
                    <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
            )}

            {/* MODALS */}
            <ReportDetailsModal isOpen={!!detailReport} onClose={() => setDetailReport(null)} report={detailReport} onViewMap={(loc) => { setDetailReport(null); setMapLocation(loc); }} />
            <ClaimModal isOpen={!!selectedFoundId} onClose={() => setSelectedFoundId(null)} foundReportId={selectedFoundId} />
            <AddSightingModal isOpen={!!sightingReportId} onClose={() => setSightingReportId(null)} baseReportId={sightingReportId} type="FOUND" />
            <MapModal isOpen={!!mapLocation} onClose={() => setMapLocation(null)} location={mapLocation} />
        </div>
    );
};

export default FoundReports;