import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/i18n/Navbar";
import { Search, MapPin, Heart } from "lucide-react";
import { fetchStatistics } from "@/services/api";

const Home = () => {
  const { t } = useTranslation();
  const [reunitedCount, setReunitedCount] = useState(2500);

  useEffect(() => {
    const getStats = async () => {
      try {
        const stats = await fetchStatistics();
        if (stats && stats.foundedLostReports) {
          setReunitedCount(stats.foundedLostReports);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    getStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50">
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-sage-light blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-sky-light blur-2xl opacity-60 pointer-events-none" />

      <Navbar />

      <main className="flex flex-col items-center justify-center text-center mt-20 px-4">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-8">
          {t('helping_reunite')}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6 max-w-4xl">
          <span className="text-green-600">{t('hero_title')}</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          {t('hero_description')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl w-full">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <Search className="w-10 h-10 text-blue-500 mb-4" />
            <p className="text-xl font-bold text-gray-900">{t('feature_search')}</p>
            <p className="text-gray-500 text-sm">{t('feature_search_desc')}</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <MapPin className="w-10 h-10 text-green-600 mb-4" />
            <p className="text-xl font-bold text-gray-900">{t('feature_alert')}</p>
            <p className="text-gray-500 text-sm">{t('feature_alert_desc')}</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <Heart className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-xl font-bold text-gray-900">{t('feature_reunite')}</p>
            <p className="text-gray-500 text-sm">{t('feature_reunite_desc')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;