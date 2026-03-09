import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, FileText, LogOut, Settings } from "lucide-react";
import { logoutUser } from "@/services/api";

const ProfileButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/auth");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs active:scale-90 transition-transform"
      >
        <User className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
          <button
            onClick={() => { navigate('/profile'); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors"
          >
            <User className="w-4 h-4 text-emerald-500" /> {t('profile_menu_item')}
          </button>

          <button
            onClick={() => { navigate('/my-reports'); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors"
          >
            <FileText className="w-4 h-4 text-orange-500" /> {t('my_reports_menu_item')}
          </button>

          <button
            onClick={() => { navigate('/account-settings'); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 text-left transition-colors"
          >
            <Settings className="w-4 h-4 text-blue-500" /> {t('account_settings_menu_item')}
          </button>

          <div className="h-px bg-gray-100 my-1"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" /> {t('logout_menu_item')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;