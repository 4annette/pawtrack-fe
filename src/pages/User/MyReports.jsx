import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin, Calendar, FileText,
  ChevronDown, Check,
  Settings2, Loader2, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from "lucide-react";
import {
  fetchMyLostReportsList,
  fetchMyFoundReportsList,
  deleteLostReport,
  deleteFoundReport
} from "../../services/api.js";
import { toast } from "sonner";
import Header from "@/pages/Header";

const formatDate = (dateString, t) => {
  if (!dateString) return t('date_not_set');
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('invalid_date');
    return date.toLocaleDateString();
  } catch (e) {
    return t('date_error');
  }
};

const AddressDisplay = ({ lat, lng, activeTab }) => {
  const { t } = useTranslation();
  const [address, setAddress] = useState(t('loading_dots'));

  useEffect(() => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setAddress(t('location_not_set'));
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
            setAddress(locString || t('view_on_map'));
          }
        } catch (error) {
          if (isMounted) setAddress(t('view_on_map'));
        }
      };
      fetchAddress();
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [lat, lng, t]);

  return (
    <span className={`flex items-center gap-1.5 truncate font-medium ${activeTab === 'lost' ? 'text-orange-600' : 'text-emerald-600'}`}>
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
        className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all duration-200 bg-white shadow-sm text-xs font-bold ${isOpen
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${option.value === value
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isGreekLanguage = i18n.language?.startsWith('el');

  const getLocalizedTitle = (item) => {
    if (!item) return '';
    return (isGreekLanguage ? item.titleEl : item.title) || item.title || item.titleEl || '';
  };

  const getLocalizedDescription = (item) => {
    if (!item) return '';
    return (isGreekLanguage ? item.descriptionEl : item.description) || item.description || item.descriptionEl || '';
  };
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "lost");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState("date_desc");
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const logoMenuRef = useRef(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === "ADMIN") setIsAdmin(true);
        if (user.role === "ORGANIZATIONS") setIsOrganization(true);
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }

    const handleClickOutside = (event) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) setIsMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      let field = activeTab === 'lost' ? 'dateLost' : 'dateFound';
      let dir = 'desc';

      if (sortBy === 'title_asc') {
        field = 'title';
        dir = 'asc';
      } else if (sortBy === 'date_asc') {
        dir = 'asc';
      }

      const res = activeTab === "lost"
        ? await fetchMyLostReportsList(page, pageSize, field, dir)
        : await fetchMyFoundReportsList(page, pageSize, field, dir);

      let fetchedReports = res?.content || [];

      fetchedReports.sort((a, b) => {
        const dateA = new Date(a.dateFound || a.foundDate || a.dateLost || a.lostDate || 0);
        const dateB = new Date(b.dateFound || b.foundDate || b.dateLost || b.lostDate || 0);

        if (sortBy === 'title_asc') {
          return getLocalizedTitle(a).localeCompare(getLocalizedTitle(b));
        }
        if (sortBy === 'date_asc') {
          return dateA - dateB;
        }
        return dateB - dateA;
      });

      setReports(fetchedReports);

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
        toast.error(t('session_expired_toast'));
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
    setSortBy("date_desc");
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm(t('confirm_delete_report'))) {
      try {
        activeTab === 'lost' ? await deleteLostReport(id) : await deleteFoundReport(id);
        toast.success(t('report_deleted_toast'));
        loadReports();
      } catch (err) {
        toast.error(t('failed_delete_report_toast'));
      }
    }
  };

  const sortOptions = [
    { label: t('sort_newest'), value: "date_desc" },
    { label: t('sort_oldest'), value: "date_asc" },
    { label: t('sort_alphabetical'), value: "title_asc" }
  ];

  const sizeOptions = [
    { label: t('show_count', { count: 5 }), value: 5 },
    { label: t('show_count', { count: 10 }), value: 10 },
    { label: t('show_count', { count: 20 }), value: 20 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 flex flex-col">
      <Header
        showNav={false}
        showMyReportsToggle={true}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAdmin={isAdmin}
        isOrganization={isOrganization}
        logoMenuRef={logoMenuRef}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className={`rounded-2xl border p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${activeTab === 'lost' ? 'from-orange-50 via-white to-orange-50 bg-gradient-to-br border-orange-100' : 'from-emerald-50 via-white to-emerald-50 bg-gradient-to-br border-emerald-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeTab === 'lost' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${activeTab === 'lost' ? 'text-orange-900' : 'text-emerald-900'}`}>
                {activeTab === 'lost' ? t('my_lost_reports_title') : t('my_found_reports_title')}
              </h1>
              <p className={`text-xs uppercase font-black tracking-widest ${activeTab === 'lost' ? 'text-orange-700' : 'text-emerald-700'}`}>
                {t('total_records', { count: totalElements }, { format: 'uppercase' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AestheticDropdown value={sortBy} options={sortOptions} onChange={(val) => { setSortBy(val); setPage(0); }} type={activeTab} />
            <AestheticDropdown value={pageSize} options={sizeOptions} onChange={(val) => { setPageSize(val); setPage(0); }} type={activeTab} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-300">
            <Loader2 className={`w-10 h-10 animate-spin ${activeTab === 'lost' ? 'text-orange-500' : 'text-emerald-500'}`} />
            <p className="text-xs font-black uppercase tracking-widest">{t('updating_list_status', { format: 'uppercase' })}</p>
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
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className={`font-bold text-gray-900 text-lg transition-colors truncate ${activeTab === 'lost' ? 'group-hover:text-orange-700' : 'group-hover:text-emerald-700'}`}>{getLocalizedTitle(report)}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm font-medium text-gray-400">
                          <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-4 h-4" /> {formatDate(report.dateFound || report.foundDate || report.dateLost || report.lostDate, t)}</span>
                          <span className="hidden md:block flex items-center gap-1.5 text-gray-300">|</span>
                          <AddressDisplay lat={report.latitude} lng={report.longitude} activeTab={activeTab} />
                        </div>

                        <div className="flex md:hidden items-center gap-2 mt-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(activeTab === 'lost' ? `/lost-report-details/${report.id}?edit=true` : `/found-report-details/${report.id}?edit=true`); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            <Settings2 className="w-3.5 h-3.5" /> {t('edit_btn_inline')}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, report.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {t('delete_btn_inline')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(activeTab === 'lost' ? `/lost-report-details/${report.id}?edit=true` : `/found-report-details/${report.id}?edit=true`); }}
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
                            className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all duration-200 ${page === i
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
                <h3 className="text-xl font-bold text-gray-800">{t('no_reports_found')}</h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReports;