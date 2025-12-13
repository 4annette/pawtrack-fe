import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, LogOut, MapPin, Search, Filter, 
  Dog, Cat, CheckCircle, X, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import PawTrackLogo from "@/components/PawTrackLogo";
import { fetchFoundReports, fetchMyLostReports, linkFoundToLostReport } from "@/services/api";

// --- COMPONENT: CLAIM MODAL (Links Found Pet to Your Lost Pet) ---
const ClaimModal = ({ isOpen, onClose, foundReportId }) => {
  const [myLostReports, setMyLostReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadMyReports = async () => {
        try {
          // Fetch user's own lost reports
          const data = await fetchMyLostReports();
          // Backend returns paginated response, so we access .content
          setMyLostReports(data.content || []);
        } catch (error) {
          console.error("Failed to load reports", error);
          toast.error("Could not load your lost reports.");
        }
      };
      loadMyReports();
    }
  }, [isOpen]);

  const handleClaim = async (lostReportId) => {
    setLoading(true);
    try {
      await linkFoundToLostReport(foundReportId, lostReportId);
      toast.success("Success! The finder has been notified.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to link reports. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Claim this Pet</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
          Select which of your missing pets matches this found report.
        </p>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {myLostReports.length > 0 ? (
            myLostReports.map(report => (
              <div key={report.id} className="border border-gray-100 p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                         {/* Fallback image if none exists */}
                        <img src={report.imageUrl || "https://placehold.co/100x100?text=Pet"} alt="Pet" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{report.title}</p>
                        <p className="text-xs text-gray-500">{report.species}</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleClaim(report.id)} 
                    disabled={loading}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Linking..." : "Select"}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">You haven't reported any lost pets yet.</p>
                <p className="text-xs text-blue-600 mt-1 cursor-pointer">Report a lost pet first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: MAP MODAL ---
const MapModal = ({ isOpen, onClose, location }) => {
  if (!isOpen || !location) return null;
  
  // Parse Backend coordinate structure: location.coordinate.x (Lng) / y (Lat)
  const lat = location.coordinate?.y || location.y || 0;
  const lng = location.coordinate?.x || location.x || 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-3xl h-[500px] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold">Location Details</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center relative">
            <MapPin className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
            <p className="font-semibold text-gray-700">Location Coordinates</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
            
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                target="_blank" 
                rel="noreferrer"
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
            >
                Open in Google Maps
            </a>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState("found");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    species: [],
    conditions: [], 
  });

  // Modal State
  const [selectedFoundId, setSelectedFoundId] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);

  // Load Reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        if (activeTab === "found") {
            const payload = {
                search: filters.search || null,
                species: filters.species.length > 0 ? filters.species : null,
                conditions: filters.conditions.length > 0 ? filters.conditions : null,
            };
            
            const data = await fetchFoundReports(page, 9, payload); // size 9 for 3x3 grid
            setReports(data.content || []);
            setTotalPages(data.totalPages || 0);
        } else {
            // Placeholder for 'lost' tab if you implement general lost feed later
            setReports([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => { fetchReports(); }, 300);
    return () => clearTimeout(timer);
  }, [page, filters, activeTab]);

  const toggleSpecies = (spec) => {
    setFilters(prev => ({
        ...prev,
        species: prev.species.includes(spec) 
            ? prev.species.filter(s => s !== spec) 
            : [...prev.species, spec]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <PawTrackLogo size="sm" />
            
            {/* Desktop Tabs */}
            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-lg">
                <button 
                    onClick={() => setActiveTab("lost")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'lost' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Lost Reports
                </button>
                <button 
                    onClick={() => setActiveTab("found")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Found Reports
                </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
             </button>
             <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                U
             </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* ADD LOST REPORT SHORTCUT */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Lost your pet?</h2>
                <p className="text-emerald-700 max-w-xl">
                    Create a lost pet report to help reunite with your furry friend. 
                    Our community will help you search.
                </p>
            </div>
            <button 
                onClick={() => toast.info("Create Report Page coming soon!")} // Link this to your create page later
                className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-emerald-200 transition-transform hover:scale-105 flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Report Lost Pet
            </button>
        </div>

        {/* PAGE TITLE */}
        <div>
            <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'found' ? 'Found Reports' : 'Lost Reports'}
            </h1>
            <p className="text-muted-foreground mt-1 text-gray-500">
                {activeTab === 'found' 
                    ? `${totalPages > 0 ? 'Browsing reports nearby.' : 'No reports found.'}` 
                    : 'Browsing lost pets nearby.'}
            </p>
        </div>

        {/* FILTERS BAR */}
        {activeTab === "found" && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by location, breed, or description..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <button 
                        onClick={() => toggleSpecies("DOG")}
                        className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${filters.species.includes("DOG") ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        <Dog className="w-4 h-4" /> Dog
                    </button>
                    <button 
                        onClick={() => toggleSpecies("CAT")}
                        className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${filters.species.includes("CAT") ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        <Cat className="w-4 h-4" /> Cat
                    </button>
                    
                    <select 
                        className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setFilters(prev => ({...prev, conditions: e.target.value ? [e.target.value] : []}))}
                    >
                        <option value="">Condition: All</option>
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="INJURED">Injured</option>
                    </select>
                </div>
            </div>
        )}

        {/* REPORTS GRID */}
        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                            {/* Image */}
                            <div className="relative h-64 bg-gray-100 overflow-hidden">
                                {report.imageUrl ? (
                                    <img 
                                        src={report.imageUrl} 
                                        alt={report.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Dog className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm text-gray-800 border border-gray-100">
                                        {report.species}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{report.title}</h3>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md whitespace-nowrap">
                                        {new Date(report.foundDate).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                    {report.description || "No description provided."}
                                </p>

                                <div className="mt-auto pt-4 space-y-3 border-t border-gray-50">
                                    <button 
                                        onClick={() => setMapLocation(report.location)}
                                        className="w-full flex items-center text-xs text-gray-500 hover:text-emerald-600 transition-colors"
                                    >
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                        View Location
                                    </button>

                                    <button 
                                        onClick={() => setSelectedFoundId(report.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-600 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        I Found This Pet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {!loading && reports.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400">No reports found matching your criteria.</p>
                        <button 
                            onClick={() => setFilters({search: "", species: [], conditions: []})}
                            className="text-emerald-600 text-sm font-medium mt-2 hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button 
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </>
        )}
      </main>

      {/* Modals */}
      <ClaimModal 
        isOpen={!!selectedFoundId} 
        onClose={() => setSelectedFoundId(null)} 
        foundReportId={selectedFoundId}
      />

      <MapModal 
        isOpen={!!mapLocation} 
        onClose={() => setMapLocation(null)} 
        location={mapLocation}
      />
      
    </div>
  );
};

export default Dashboard;