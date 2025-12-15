import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import PawTrackLogo from "@/components/PawTrackLogo";
import FoundReports from "./FoundReports";
import LostReports from "./LostReports";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("found");

  const handleLogout = () => { 
    localStorage.removeItem("token"); 
    navigate("/auth"); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <PawTrackLogo size="sm" />
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
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
             </button>
             <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">U</div>
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