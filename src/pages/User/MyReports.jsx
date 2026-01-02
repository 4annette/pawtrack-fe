import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Calendar, FileText, 
  User, LogOut, ChevronDown, Check, 
  Settings2, Loader2, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from "lucide-react";
import { 
  fetchMyLostReportsList, 
  fetchMyFoundReportsList, 
  deleteLostReport, 
  deleteFoundReport 
} from "../../services/api.js";
import PawTrackLogo from "@/components/PawTrackLogo";
import { toast } from "sonner";

const formatDate = (dateString) => {
  if (!dateString) return "Date not set";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString();
  } catch (e) {
    return "Date Error";
  }
};

const AddressDisplay = ({ lat, lng }) => {
  const [address, setAddress] = useState("Loading...");

  useEffect(() => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setAddress("Location not set");
      return;
    }

    let isMounted = true;
    
    const timer = setTimeout(() => {
        const fetchAddress = async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                    { headers: { 'Accept-Language': 'en' } } 
                );

                if (!response.ok) throw new Error("Blocked");

                const data = await response.json();
                if (isMounted && data.address) {
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
                    const country = data.address.country || "";
                    const locString = [city, country].filter(Boolean).join(", ");
                    setAddress(locString || "View on map");
                }
            } catch (error) {
                if (isMounted) setAddress("View on map");
            }
        };
        fetchAddress();
    }, 1200);

    return () => { 
        isMounted = false; 
        clearTimeout(timer);
    };
  }, [lat, lng]);

  return (
    <span className="flex items-center gap-1.5 truncate text-emerald-600 font-medium">
      <MapPin className="w-4 h-4" /> {address}
    </span>
  );
};

const AestheticDropdown = ({ label, value, options, onChange, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];
  const isLost = type === 'lost';

  return (
    <div className="relative min-w-[140px]" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all duration-200 bg-white shadow-sm text-xs font-bold ${
          isOpen 
            ? (isLost ? 'border-orange-500 ring-2 ring-orange-100' : 'border-emerald-500 ring-2 ring-emerald-100') 
            : 'border-gray-100 hover:border-gray-300'
        } text-gray-700`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isLost ? 'text-orange-500' : 'text-emerald-500'}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
          <div className="p-1.5 space-y-1">
            {options.map((option) => (
              <div 
                key={option.value} 
                onClick={() => { onChange(option.value); setIsOpen(false); }} 
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  option.value === value 
                    ? (isLost ? 'bg-orange-600 text-white' : 'bg-emerald-600 text-white') 
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <span className="font-bold">{option.label}</span>
                {option.value === value && <Check className="w-3.5 h-3.5" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MyReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("lost");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState("lostDate"); 
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const logoMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) setIsMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = activeTab === "lost" 
        ? await fetchMyLostReportsList(page, pageSize, sortBy) 
        : await fetchMyFoundReportsList(page, pageSize, sortBy);
      
      setReports(res?.content || []);
      
      if (res?.page) {
        setTotalElements(res.page.totalElements || 0);
        setTotalPages(res.page.totalPages || 0);
      } else {
        setTotalElements(res?.totalElements || 0);
        setTotalPages(res?.totalPages || 0);
      }
    } catch (error) {
      console.error("Failed to load list", error);
      setReports([]); 
      if (error?.response?.status === 403) {
          toast.error("Session expired. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeTab, page, pageSize, sortBy]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
    setSortBy(tab === "lost" ? "lostDate" : "foundDate");
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Delete this report permanently?")) {
      try {
        activeTab === 'lost' ? await deleteLostReport(id) : await deleteFoundReport(id);
        toast.success("Report deleted");
        loadReports();
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const sortOptions = [
    { label: "Newest First", value: activeTab === "lost" ? "lostDate" : "foundDate" },
    { label: "Alphabetical", value: "title" }
  ];

  const sizeOptions = [
    { label: "Show 5", value: 5 },
    { label: "Show 10", value: 10 },
    { label: "Show 20", value: 20 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4 md:gap-6" ref={logoMenuRef}>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative flex items-center gap-1">
              <button onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }} 
                className="flex items-center gap-1 focus:outline-none active:scale-95 transition-transform"
              >
                  <PawTrackLogo size="sm" />
                  <div className={`md:hidden transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
              </button>

              {isMobileMenuOpen && (
                <div className="md:hidden absolute top-12 left-0 w-56 bg-white border border-gray-100 shadow-xl z-[100] rounded-2xl mt-2 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="flex flex-col p-2 gap-1">
                    <button onClick={() => { handleTabChange("lost"); setIsMobileMenuOpen(false); }} 
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
                    >
                      My Lost Reports
                    </button>
                    <button onClick={() => { handleTabChange("found"); setIsMobileMenuOpen(false); }} 
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left ${activeTab === 'found' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600'}`}
                    >
                      My Found Reports
                    </button>
                  </div>
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => handleTabChange("lost")} 
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'lost' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Lost
              </button>
              <button 
                onClick={() => handleTabChange("found")} 
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Found
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4" ref={userMenuRef}>
              <div className="relative">
                <button onClick={() => { setIsMobileMenuOpen(false); setIsUserMenuOpen(!isUserMenuOpen); }} 
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all active:scale-95 bg-emerald-100 text-emerald-700 border-emerald-200 hover:ring-2 ring-emerald-50 outline-none"
                >
                  <User className="w-5 h-5" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors font-bold"><User className="w-4 h-4 text-emerald-500" /> Profile</button>
                    <button onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors font-bold"><FileText className="w-4 h-4 text-orange-500" /> My Reports</button>
                    <div className="h-px bg-gray-50 my-1"></div>
                    <button onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors font-bold"><LogOut className="w-4 h-4" /> Logout</button>
                  </div>
                )}
              </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className={`rounded-2xl border p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${activeTab === 'lost' ? 'from-orange-50 via-white to-orange-50 bg-gradient-to-br border-orange-100' : 'from-emerald-50 via-white to-emerald-50 bg-gradient-to-br border-emerald-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeTab === 'lost' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${activeTab === 'lost' ? 'text-orange-900' : 'text-emerald-900'}`}>My {activeTab === 'lost' ? 'Lost' : 'Found'} Reports</h1>
              <p className={`text-xs uppercase font-black tracking-widest ${activeTab === 'lost' ? 'text-orange-700' : 'text-emerald-700'}`}>{totalElements} Total Records</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AestheticDropdown value={sortBy} options={sortOptions} onChange={(val) => {setSortBy(val); setPage(0);}} type={activeTab} />
            <AestheticDropdown value={pageSize} options={sizeOptions} onChange={(val) => {setPageSize(val); setPage(0);}} type={activeTab} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-300">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Updating List</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {reports.length > 0 ? (
              <>
                {reports.map(report => (
                  <div 
                    key={report.id} 
                    onClick={() => navigate(activeTab === 'lost' ? `/lost-report-details/${report.id}` : `/found-report-details/${report.id}`)}
                    className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between group transition-all duration-300 cursor-pointer ${activeTab === 'lost' ? 'hover:border-orange-300' : 'hover:border-emerald-300'} hover:shadow-md`}
                  >
                    <div className="flex items-center gap-5 w-full">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-gray-900 text-lg transition-colors truncate ${activeTab === 'lost' ? 'group-hover:text-orange-700' : 'group-hover:text-emerald-700'}`}>{report.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm font-medium text-gray-400">
                          <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-4 h-4" /> {formatDate(report.foundDate || report.lostDate || report.dateLost || report.dateFound)}</span>
                          <span className="hidden md:block flex items-center gap-1.5 text-gray-300">|</span>
                          <AddressDisplay lat={report.latitude} lng={report.longitude} />
                        </div>

                        <div className="flex md:hidden items-center gap-3 mt-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(activeTab === 'lost' ? `/lost-report-details/${report.id}` : `/found-report-details/${report.id}`); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            <Settings2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, report.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(activeTab === 'lost' ? `/lost-report-details/${report.id}` : `/found-report-details/${report.id}`); }}
                        className={`p-2 rounded-xl transition-colors ${activeTab === 'lost' ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
                      >
                        <Settings2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, report.id)}
                        className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 mb-6">
                    <nav className={`flex items-center gap-1 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl transition-all duration-500 ${activeTab === 'lost' ? 'shadow-orange-900/5' : 'shadow-emerald-900/5'}`}>
                      <button 
                        disabled={page === 0} 
                        onClick={() => setPage(0)} 
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-20 ${activeTab === 'lost' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        <ChevronsLeft className="w-5 h-5" />
                      </button>

                      <button 
                        disabled={page === 0} 
                        onClick={() => setPage(p => p - 1)} 
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-20 ${activeTab === 'lost' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                              page === i 
                                ? (activeTab === 'lost' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200') 
                                : `text-gray-400 ${activeTab === 'lost' ? 'hover:bg-orange-50 hover:text-orange-600' : 'hover:bg-emerald-50 hover:text-emerald-600'}`
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        disabled={page + 1 >= totalPages} 
                        onClick={() => setPage(p => p + 1)} 
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-20 ${activeTab === 'lost' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      <button 
                        disabled={page + 1 >= totalPages} 
                        onClick={() => setPage(totalPages - 1)} 
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-20 ${activeTab === 'lost' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        <ChevronsRight className="w-5 h-5" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[40px] py-20 text-center border-2 border-dashed border-gray-100">
                <Settings2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800">No reports found</h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReports;