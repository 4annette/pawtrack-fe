import React from "react";
import { ChevronDown, Map as MapIcon, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import PawTrackLogo from "@/components/PawTrackLogo";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";
import AdminMenu from "@/components/admin/AdminMenu";
import OrganizationMenu from "@/components/organization/OrganizationMenu";

const Header = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAdmin,
  isOrganization,
  logoMenuRef,
  showNav = false,
  showMyReportsToggle = false
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  const isAnnouncementsPage = location.pathname === "/announcements" || location.pathname.startsWith("/announcements/");

  return (
    <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center justify-between relative">
        <div className="flex items-center gap-6" ref={logoMenuRef}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <PawTrackLogo size="sm" />
              <div className={`md:hidden transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          </div>

          {showNav && (
            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab("lost")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'lost' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {t('lost_reports_tab')}
              </button>
              <button
                onClick={() => setActiveTab("found")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {t('found_reports_tab')}
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <MapIcon className="w-4 h-4" />
                {t('map_view_tab')}
              </button>
            </nav>
          )}

          {showMyReportsToggle && (
            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActiveTab("lost")}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'lost' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('lost_tab')}
              </button>
              <button
                onClick={() => setActiveTab("found")}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('found_tab')}
              </button>
            </nav>
          )}

          <Link
            to="/announcements"
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${isAnnouncementsPage
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Megaphone className={`w-4 h-4 ${isAnnouncementsPage ? 'text-indigo-600' : 'text-gray-400'}`} />
            {t('announcements_nav', 'Announcements')}
          </Link>

          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-12 left-0 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl z-[5000] animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col p-2 gap-1">
                {showNav && (
                  <>
                    <button
                      type="button"
                      onPointerDown={() => { setActiveTab("lost"); setIsMobileMenuOpen(false); }}
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t('lost_reports_tab')}
                    </button>
                    <button
                      type="button"
                      onPointerDown={() => { setActiveTab("found"); setIsMobileMenuOpen(false); }}
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'found' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t('found_reports_tab')}
                    </button>
                    <button
                      type="button"
                      onPointerDown={() => { setActiveTab("map"); setIsMobileMenuOpen(false); }}
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'map' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t('map_view_tab')}
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                  </>
                )}

                {showMyReportsToggle && (
                  <>
                    <button
                      type="button"
                      onPointerDown={() => { setActiveTab("lost"); setIsMobileMenuOpen(false); }}
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'lost' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t('my_lost_reports')}
                    </button>
                    <button
                      type="button"
                      onPointerDown={() => { setActiveTab("found"); setIsMobileMenuOpen(false); }}
                      className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors ${activeTab === 'found' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t('my_found_reports')}
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                  </>
                )}

                <Link
                  to="/announcements"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full px-4 py-3 text-sm font-bold rounded-xl text-left transition-colors flex items-center gap-2 ${isAnnouncementsPage ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Megaphone className={`w-4 h-4 ${isAnnouncementsPage ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {t('announcements_nav', 'Announcements')}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 relative z-[5000]">
          {isAdmin && <AdminMenu />}
          {isOrganization && <OrganizationMenu />}
          <Notifications />
          <ProfileButton />
        </div>
      </div>
    </header>
  );
};

export default Header;