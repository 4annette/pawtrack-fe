import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X, Loader2, Search, User, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import PawTrackLogo from "@/components/PawTrackLogo";
import FoundReports from "./FoundReports";
import LostReports from "./LostReports";
import ReportsMap from "./ReportsMap";
import { fetchMyLostReports, addLostReportToFoundReport } from "@/services/api";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("found");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [myLostReports, setMyLostReports] = useState([]);
  const [loadingLostReports, setLoadingLostReports] = useState(false);
  const [selectedFoundReportId, setSelectedFoundReportId] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const logoMenuRef = useRef(null);

  useEffect(() => {
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
      toast.error("Could not load your lost reports");
    } finally {
      setLoadingLostReports(false);
    }
  };

  const handleSelectLostPet = async (lostReportId) => {
    if (!selectedFoundReportId || !lostReportId) return;

    setSubmittingClaim(true);
    try {
      await addLostReportToFoundReport(selectedFoundReportId, lostReportId);
      toast.success("Request sent! The finder has been notified.");
      setIsClaimModalOpen(false);
    } catch (error) {
      toast.error("Failed to link reports. Try again.");
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

      <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between relative">

          <div className="flex items-center gap-6" ref={logoMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2 focus:outline-none md:cursor-default"
            >
              <PawTrackLogo size="sm" />
              <div className={`md:hidden transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab("lost")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'lost' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Lost Reports
              </button>
              <button
                onClick={() => setActiveTab("found")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Found Reports
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <MapIcon className="w-4 h-4" />
                Map View
              </button>
            </nav>

            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-12 left-0 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl z-[5000] animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col p-2 gap-1">
                  <button
                    type="button"
                    onPointerDown={() => { setActiveTab("lost"); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Lost Reports
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => { setActiveTab("found"); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'found' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Found Reports
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => { setActiveTab("map"); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'map' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Map View
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative z-[5000]">
            <Notifications />
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-[1]">
        {renderContent()}
      </main>

      {isClaimModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-black text-emerald-900 text-lg">Select Your Matching Pet</h3>
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
                  <p className="text-gray-500 font-bold">You don't have any active lost reports.</p>
                  <button
                    onClick={() => navigate('/my-reports')}
                    className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                  >
                    Create a report first
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
                        <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-emerald-700">{report.title}</h4>
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
              Selecting a pet will notify the finder immediately.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;