import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Loader2, Search, User } from "lucide-react";
import { toast } from "sonner";
import Header from "@/pages/Header";
import FoundReports from "./FoundReports";
import LostReports from "./LostReports";
import ReportsMap from "./ReportsMap";
import { fetchMyLostReports, addLostReportToFoundReport } from "@/services/api";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const getCurrentLanguage = () => {
    const preferred = i18n.language || i18n.resolvedLanguage || localStorage.getItem('i18nextLng') || '';
    return String(preferred).toLowerCase();
  };
  const isGreekLanguage = getCurrentLanguage().startsWith('el');
  const getLocalizedTitle = (item) => {
    if (!item) return '';
    return isGreekLanguage ? item.titleEl || item.title || '' : item.title || item.titleEl || '';
  };
  const [activeTab, setActiveTab] = useState("found");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [myLostReports, setMyLostReports] = useState([]);
  const [loadingLostReports, setLoadingLostReports] = useState(false);
  const [selectedFoundReportId, setSelectedFoundReportId] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const logoMenuRef = useRef(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === "ADMIN") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }

    const handleClickOutside = (event) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const openClaimModal = async (foundReportId) => {
    setSelectedFoundReportId(foundReportId);
    setIsClaimModalOpen(true);
    setLoadingLostReports(true);
    try {
      const data = await fetchMyLostReports(0, 50);
      setMyLostReports(data.content || []);
    } catch (error) {
      toast.error(t('load_lost_reports_failed'));
    } finally {
      setLoadingLostReports(false);
    }
  };

  const handleSelectLostPet = async (lostReportId) => {
    if (!selectedFoundReportId || !lostReportId) return;

    setSubmittingClaim(true);
    try {
      await addLostReportToFoundReport(selectedFoundReportId, lostReportId);
      toast.success(t('request_sent_success'));
      setIsClaimModalOpen(false);
    } catch (error) {
      toast.error(t('link_reports_failed'));
    } finally {
      setSubmittingClaim(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'found': return <FoundReports onClaimClick={openClaimModal} />;
      case 'lost': return <LostReports />;
      case 'map': return <ReportsMap />;
      default: return <FoundReports onClaimClick={openClaimModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
      <Header 
        showNav={true}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAdmin={isAdmin}
        logoMenuRef={logoMenuRef}
      />

      <main className="container mx-auto px-4 py-8 relative z-[1]">
        {renderContent()}
      </main>

      {isClaimModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-black text-emerald-900 text-lg">{t('claim_modal_title')}</h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingLostReports ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : myLostReports.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">{t('no_lost_reports')}</p>
                  <button
                    onClick={() => navigate('/my-reports')}
                    className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                  >
                    {t('create_report_first')}
                  </button>
                </div>
              ) : (
                myLostReports.map((report) => (
                  <button
                    key={report.id}
                    disabled={submittingClaim}
                    onClick={() => handleSelectLostPet(report.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                      {report.imageUrl ? (
                        <img src={report.imageUrl} alt={getLocalizedTitle(report)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-emerald-700">{getLocalizedTitle(report)}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{report.species} • {report.breed || "Unknown Breed"}</p>
                      <p className="text-[10px] font-bold text-orange-500 mt-1 uppercase tracking-wide">LOST: {report.lostDate ? report.lostDate.substring(0, 10) : 'Unknown'}</p>
                    </div>
                    {submittingClaim && (
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50 text-[10px] text-gray-500 text-center font-medium border-t border-gray-100">
              {t('claim_footer_info')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;