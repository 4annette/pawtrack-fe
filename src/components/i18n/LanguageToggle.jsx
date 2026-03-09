import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('el') ? 'en' : 'el';
        i18n.changeLanguage(newLang);
        document.documentElement.lang = newLang;
    };

    return (
        <button
            onClick={toggleLanguage}
            className="fixed bottom-6 right-6 z-[9999] bg-white border-2 border-emerald-500 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-black text-xs text-emerald-700 uppercase tracking-tighter"
        >
            <Globe className="w-5 h-5 text-emerald-500" />
            {i18n.language.split('-')[0].toUpperCase()}
        </button>
    );
};

export default LanguageToggle;