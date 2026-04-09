import React, { useState, useEffect, useRef } from "react";
import {
    Megaphone,
    Loader2,
    X,
    AlertTriangle,
    ChevronDown,
    Check,
    Bell,
    Info,
    ShieldAlert,
    Tag,
    ArrowLeft,
    Save
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/pages/Header";
import {
    createAnnouncement,
    translateText
} from "@/services/api";

const typeConfigs = {
    LOCATION_ALERT: {
        color: "bg-red-50 text-red-600 border-red-100",
        activeColor: "bg-red-600 text-white",
        icon: AlertTriangle,
        labelKey: 'type_location_alert'
    },
    URGENT_APPEAL: {
        color: "bg-orange-50 text-orange-600 border-orange-100",
        activeColor: "bg-orange-600 text-white",
        icon: ShieldAlert,
        labelKey: 'type_urgent_appeal'
    },
    PREVENTIVE_UPDATE: {
        color: "bg-blue-50 text-blue-600 border-blue-100",
        activeColor: "bg-blue-600 text-white",
        icon: Bell,
        labelKey: 'type_preventive_update'
    },
    OTHER: {
        color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        activeColor: "bg-indigo-600 text-white",
        icon: Info,
        labelKey: 'type_other'
    }
};

const CustomDropdown = ({ label, value, options, onChange }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];
    const SelectedIcon = typeConfigs[selectedOption.value]?.icon || Info;

    return (
        <div className="relative space-y-1.5 w-full" ref={containerRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 ml-1">
                <Tag className="w-3 h-3" /> {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full min-h-[3.5rem] py-3 px-4 bg-gray-50 border-none rounded-2xl flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <SelectedIcon className={`w-5 h-5 flex-shrink-0 ${typeConfigs[selectedOption.value]?.color.split(' ')[1]}`} />
                    <span className="text-base font-bold text-gray-900 text-left leading-tight whitespace-normal">
                        {selectedOption.label}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-1.5 space-y-1">
                        {options.map((option) => {
                            const config = typeConfigs[option.value] || typeConfigs.OTHER;
                            const Icon = config.icon;
                            const isSelected = value === option.value;
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => { onChange(option.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between px-4 py-4 rounded-lg text-base cursor-pointer transition-all ${isSelected ? config.activeColor : 'text-gray-700 hover:bg-gray-50 font-bold'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : config.color.split(' ')[1]}`} />
                                        <span className="leading-tight whitespace-normal text-left">{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateAnnouncement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOrganization, setIsOrganization] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoMenuRef = useRef(null);

    const [formData, setFormData] = useState({ title: "", content: "", type: "LOCATION_ALERT" });

    const typeOptions = Object.keys(typeConfigs).map(key => ({
        label: t(typeConfigs[key].labelKey),
        value: key
    }));

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user.role === "ADMIN") setIsAdmin(true);
                if (user.role === "ORGANIZATIONS") setIsOrganization(true);
            } catch (e) { console.error(e); }
        }
    }, []);

    const containsGreek = (text) => /[\u0370-\u03FF]/.test(text || "");

    const translateOrFallback = async (text, fromLang, toLang) => {
        if (!text) return '';
        try {
            const translated = await translateText(text, fromLang, toLang);
            return translated || text;
        } catch (error) {
            return text;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const title = formData.title.trim();
            const content = formData.content.trim();
            const isGreekInput = containsGreek(title) || containsGreek(content);

            const titleEl = isGreekInput ? title : await translateOrFallback(title, 'en', 'el');
            const titleEn = isGreekInput ? await translateOrFallback(title, 'el', 'en') : title;
            const contentEl = isGreekInput ? content : await translateOrFallback(content, 'en', 'el');
            const contentEn = isGreekInput ? await translateOrFallback(content, 'el', 'en') : content;

            const payload = { titleEn, contentEn, titleEl, contentEl, type: formData.type };

            await createAnnouncement(payload);
            toast.success(t('announcement_created_success'));
            navigate("/organization/announcements");
        } catch (error) {
            toast.error(t('error_saving_announcement'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 w-full overflow-x-hidden">
            <Header
                activeTab=""
                setActiveTab={() => { }}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={isOrganization}
                logoMenuRef={logoMenuRef}
            />

            <main className="w-full max-w-3xl mx-auto px-4 py-6 md:py-8 box-border">
                <div className="mb-6 md:mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> {t('back')}
                    </button>
                </div>

                <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-xl border border-indigo-50 w-full box-border overflow-visible">
                    <div className="p-6 md:p-12">
                        <div className="mb-8 md:mb-10 w-full">
                            <h1 className="text-2xl md:text-3xl font-black text-indigo-900 uppercase tracking-tight flex items-start gap-3 whitespace-normal break-words">
                                <Megaphone className="w-7 h-7 md:w-8 h-8 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <span className="flex-1">{t('create_announcement_title')}</span>
                            </h1>
                            <p className="text-gray-400 mt-2 font-bold uppercase text-[9px] md:text-[10px] tracking-widest leading-relaxed">
                                {t('announcements_management_subtitle')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-visible w-full box-border">
                            <div className="space-y-4 w-full">
                                <div className="space-y-1 w-full">
                                    <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest ml-1">{t('announcement_label_title')}</label>
                                    <input
                                        required
                                        className="w-full h-14 px-4 bg-gray-50 border-none rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all box-border"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t('enter_title')}
                                    />
                                </div>
                                <div className="space-y-1 w-full">
                                    <label className="text-[10px] font-black text-indigo-800 uppercase tracking-widest ml-1">{t('announcement_label_content')}</label>
                                    <textarea
                                        required
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-base font-bold min-h-[150px] md:min-h-[200px] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all box-border resize-none"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder={t('enter_content')}
                                    />
                                </div>
                            </div>

                            <div className="relative z-50 w-full">
                                <CustomDropdown
                                    label={t('announcement_label_type')}
                                    value={formData.type}
                                    options={typeOptions}
                                    onChange={val => setFormData({ ...formData, type: val })}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 pt-6 w-full">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white font-black h-14 md:h-16 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-sm uppercase tracking-widest active:scale-[0.98] md:flex-[2]"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {t('btn_publish_announcement')}</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-full h-14 md:h-16 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center uppercase text-sm tracking-widest md:flex-1"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateAnnouncement;