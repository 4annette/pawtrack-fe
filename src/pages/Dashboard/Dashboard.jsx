import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, FileText, ChevronDown } from "lucide-react"; 
import PawTrackLogo from "@/components/PawTrackLogo";
import FoundReports from "./FoundReports";
import LostReports from "./LostReports";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("found");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // These refs track the containers to detect "outside" clicks
  const logoMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking outside the logo/mobile menu area, close it
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      // If clicking outside the user profile area, close it
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    // Listen for both mouse and touch events
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogout = () => { 
    localStorage.removeItem("token"); 
    navigate("/auth"); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* LEFT SIDE: LOGO & TABS */}
          <div className="flex items-center gap-6" ref={logoMenuRef}>
            {/* LOGO BUTTON - Toggles Mobile Menu */}
            <button 
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="flex items-center gap-2 focus:outline-none md:cursor-default"
            >
              <PawTrackLogo size="sm" />
              <div className={`md:hidden transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            {/* DESKTOP NAVIGATION (Hidden on Mobile) */}
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
            </nav>

            {/* MOBILE OVERLAY MENU - Now inside the ref div */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl z-[100]">
                <div className="flex flex-col p-4 gap-2">
                  <button 
                    type="button"
                    onPointerDown={() => { // Using PointerDown for faster response on mobile
                      setActiveTab("lost");
                      setIsMobileMenuOpen(false);
                    }} 
                    className={`w-full px-4 py-3 text-sm font-medium rounded-md text-left ${
                      activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'
                    }`}
                  >
                    Lost Reports
                  </button>
                  <button 
                    type="button"
                    onPointerDown={() => {
                      setActiveTab("found");
                      setIsMobileMenuOpen(false);
                    }} 
                    className={`w-full px-4 py-3 text-sm font-medium rounded-md text-left ${
                      activeTab === 'found' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600'
                    }`}
                  >
                    Found Reports
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* RIGHT SIDE: USER MENU */}
          <div className="flex items-center gap-4" ref={userMenuRef}>
             <div className="relative">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs outline-none hover:ring-2 ring-emerald-50 transition-all"
                >
                  U
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[100] overflow-hidden">
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-emerald-500" /> Edit Profile
                    </button>
                    <button 
                      onClick={() => navigate('/my-reports')} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-orange-500" /> My Reports
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'found' ? <FoundReports /> : <LostReports />}
      </main>

    </div>
  );
};

export default Dashboard;