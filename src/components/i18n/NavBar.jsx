import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import PawTrackLogo from "@/components/PawTrackLogo";
import { Globe } from "lucide-react";
import ProfileButton from "@/components/topBar/ProfileButton";

const Navbar = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const token = localStorage.getItem("token");

    let isTokenValid = false;
    if (token && token !== "undefined" && token !== "null") {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            isTokenValid = payload.exp > Date.now() / 1000;
        } catch (e) {
            isTokenValid = false;
        }
    }

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('el') ? 'en' : 'el';
        i18n.changeLanguage(newLang);
        document.documentElement.lang = newLang;
    };

    return (
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
                <Link to="/">
                    <PawTrackLogo size="md" />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleLanguage}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-medium text-sm"
                >
                    <Globe className="w-4 h-4" />
                    {i18n.language.split('-')[0].toUpperCase()}
                </button>

                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/auth", { state: { mode: "login" } })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-6 shadow-sm transition-all"
                    >
                        {t('login')}
                    </Button>

                    <Button
                        type="button"
                        onClick={() => navigate("/auth", { state: { mode: "register" } })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-6 shadow-sm transition-all"
                    >
                        {t('signup')}
                    </Button>

                    {isTokenValid && <ProfileButton />}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;