import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, Search, Filter, Dog, Eye, MapPin, 
    Loader2, Clock, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight 
} from "lucide-react";
import { toast } from "sonner";
import { fetchLostReports } from "@/services/api";
import { 
    CustomDropdown, CustomDatePicker, ReportDetailsModal, 
    AddSightingModal, MapModal 
} from "@/components/DashboardComponents";

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
    const [filters, setFilters] = useState({
        search: "",
        species: "",
        dateAfter: "",
        dateBefore: ""
    });

    const [sightingReportId, setSightingReportId] = useState(null); 
    const [mapLocation, setMapLocation] = useState(null);
    const [detailReport, setDetailReport] = useState(null);

    const formatDateForBackend = (dateString) => dateString ? `${dateString} 00:00:00` : null;

    function getLostStatus(dateLost) {
        if (!dateLost) return "MORE_THAN_1_MONTH";
        const now = new Date();
        const diffInMilliseconds = now - new Date(dateLost);
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

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const payload = {
                    search: filters.search || null,
                    species: filters.species ? [filters.species] : null,
                    dateLostAfter: formatDateForBackend(filters.dateAfter),
                    dateLostBefore: formatDateForBackend(filters.dateBefore)
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
    }, [page, filters, pageSize, sortBy]);

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
                    <h1 className="text-3xl font-bold text-gray-900">Lost Reports</h1>
                    <p className="text-gray-500 mt-1">{loading ? "Searching..." : `${totalElements} reports found.`}</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="text-xs font-bold text-emerald-600 bg-transparent outline-none cursor-pointer appearance-none">
                            {[6, 9, 12, 15].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort</span>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }} className="text-xs font-bold text-emerald-600 bg-transparent outline-none cursor-pointer appearance-none">
                            <option value="dateLost">Newest</option>
                            <option value="title">Title</option>
                            <option value="species">Species</option>
                        </select>
                    </div>
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
                            <CustomDatePicker label="Lost After" value={filters.dateAfter} onChange={(val) => {setFilters({...filters, dateAfter: val}); setPage(0);}} />
                            <CustomDatePicker label="Lost Before" value={filters.dateBefore} onChange={(val) => {setFilters({...filters, dateBefore: val}); setPage(0);}} />
                        </div>
                    </div>
                )}
            </div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => {
                        const currentStatus = getLostStatus(report.dateLost);
                        return (
                            <div key={report.id} onClick={() => setDetailReport({...report, status: currentStatus, statusColor: getStatusColor(currentStatus), statusSentence: currentStatus.replace(/_/g, ' ')})} className="bg-emerald-50 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1">
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
                                        {report.dateLost && (
                                            <span className="text-xs font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-md">
                                                {new Date(report.dateLost).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{report.description || "No description provided."}</p>
                                    <div className="mt-auto pt-4 space-y-3 border-t border-emerald-200">
                                        <button onClick={(e) => { e.stopPropagation(); setMapLocation(report.location); }} className="w-full flex items-center text-xs text-gray-600 hover:text-emerald-700"><MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> View Location</button>
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
                        <button 
                            disabled={page === 0} 
                            onClick={() => setPage(0)} 
                            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>

                        <button 
                            disabled={page === 0} 
                            onClick={() => setPage(p => p - 1)} 
                            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`min-w-[46px] h-[46px] rounded-full text-sm font-black transition-all duration-300 relative overflow-hidden ${
                                        page === i 
                                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-110' 
                                            : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={page + 1 >= totalPages} 
                            onClick={() => setPage(p => p + 1)} 
                            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <button 
                            disabled={page + 1 >= totalPages} 
                            onClick={() => setPage(totalPages - 1)} 
                            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-20"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
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