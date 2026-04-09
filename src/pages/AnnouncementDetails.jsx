import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Mail,
    Phone,
    Loader2,
    AlertTriangle,
    ShieldAlert,
    Bell,
    Info,
    ArrowLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/pages/Header";
import { fetchAnnouncementById } from "@/services/api";

const typeConfigs = {
    LOCATION_ALERT: { color: "bg-red-50 text-red-600 border-red-100", icon: AlertTriangle, labelKey: 'type_location_alert' },
    URGENT_APPEAL: { color: "bg-orange-50 text-orange-600 border-orange-100", icon: ShieldAlert, labelKey: 'type_urgent_appeal' },
    PREVENTIVE_UPDATE: { color: "bg-blue-50 text-blue-600 border-blue-100", icon: Bell, labelKey: 'type_preventive_update' },
    OTHER: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Info, labelKey: 'type_other' }
};

const AnnouncementDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOrganization, setIsOrganization] = useState(false);
    const logoMenuRef = useRef(null);

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user.role === "ADMIN") setIsAdmin(true);
                if (user.role === "ORGANIZATIONS") setIsOrganization(true);
            } catch (e) { console.error(e); }
        }

        const loadDetails = async () => {
            try {
                const data = await fetchAnnouncementById(id);
                setAnnouncement(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 font-bold mb-4">{t('announcement_not_found')}</p>
                <button onClick={() => navigate('/announcements')} className="text-indigo-600 font-black uppercase text-xs flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> {t('back_to_list')}
                </button>
            </div>
        );
    }

    const config = typeConfigs[announcement.type] || typeConfigs.OTHER;
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Header
                showNav={false}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={isOrganization}
                logoMenuRef={logoMenuRef}
            />

            <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
                <button
                    onClick={() => navigate('/announcements')}
                    className="group mb-6 flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    {t('back_to_announcements')}
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm flex items-center gap-2 ${config.color}`}>
                                <Icon className="w-4 h-4" />
                                {t(config.labelKey)}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-6 break-words">
                            {i18n.language.startsWith('el') ? announcement.titleEl : announcement.titleEn}
                        </h1>

                        <div className="prose prose-indigo max-w-none">
                            <p className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                {i18n.language.startsWith('el') ? announcement.contentEl : announcement.contentEn}
                            </p>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-50">
                            <div className="bg-gray-50 rounded-3xl p-6 md:p-8 space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                    {t('organization_info')}
                                </h4>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                                        <ShieldAlert className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-gray-900 text-lg truncate">
                                            {announcement.organization?.organizationName}
                                        </p>
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{announcement.organization?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                                                <Phone className="w-4 h-4" />
                                                <span>{announcement.organization?.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnnouncementDetails;