import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    Trash2,
    Loader2,
    Edit2,
    X,
    Calendar,
    Megaphone,
    Tag,
    Save,
    ChevronDown,
    Check,
    AlertTriangle,
    ShieldAlert,
    Bell,
    Info
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/pages/Header";
import {
    fetchAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    translateText
} from "@/services/api";

const typeConfigs = {
    LOCATION_ALERT: { color: "bg-red-50 text-red-600 border-red-100", activeColor: "bg-red-600 text-white", icon: AlertTriangle, labelKey: 'type_location_alert' },
    URGENT_APPEAL: { color: "bg-orange-50 text-orange-600 border-orange-100", activeColor: "bg-orange-600 text-white", icon: ShieldAlert, labelKey: 'type_urgent_appeal' },
    PREVENTIVE_UPDATE: { color: "bg-blue-50 text-blue-600 border-blue-100", activeColor: "bg-blue-600 text-white", icon: Bell, labelKey: 'type_preventive_update' },
    OTHER: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", activeColor: "bg-indigo-600 text-white", icon: Info, labelKey: 'type_other' }
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
                className="w-full h-12 px-4 bg-gray-50 border-none rounded-2xl flex items-center justify-between transition-all"
            >
                <div className="flex items-center gap-3">
                    <SelectedIcon className={`w-4 h-4 ${typeConfigs[selectedOption.value]?.color.split(' ')[1]}`} />
                    <span className="text-sm font-bold text-gray-900">{selectedOption.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition-all ${isSelected ? config.activeColor : 'text-gray-700 hover:bg-gray-50 font-bold'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : config.color.split(' ')[1]}`} />
                                        <span>{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const OrgAnnouncementDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [announcement, setAnnouncement] = useState(null);
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoMenuRef = useRef(null);

    const [formData, setFormData] = useState({ title: "", content: "", type: "OTHER" });

    const typeOptions = Object.keys(typeConfigs).map(key => ({
        label: t(typeConfigs[key].labelKey),
        value: key
    }));

    useEffect(() => {
        if (!id) return;
        loadAnnouncement();
    }, [id, i18n.language]);

    const loadAnnouncement = async () => {
        setLoading(true);
        try {
            const data = await fetchAnnouncementById(id);
            if (!data) throw new Error("No data");
            
            setAnnouncement(data);
            const isGreek = i18n.language?.startsWith('el');
            setFormData({
                title: isGreek ? (data.titleEl || "") : (data.titleEn || ""),
                content: isGreek ? (data.contentEl || "") : (data.contentEn || ""),
                type: data.type || "OTHER"
            });
        } catch (error) {
            toast.error(t('error_loading_announcement'));
            navigate("/organization/announcements");
        } finally {
            setLoading(false);
        }
    };

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

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const title = formData.title.trim();
            const content = formData.content.trim();
            const isGreekInput = containsGreek(title) || containsGreek(content);

            const titleEl = isGreekInput ? title : await translateOrFallback(title, 'en', 'el');
            const titleEn = isGreekInput ? await translateOrFallback(title, 'el', 'en') : title;
            const contentEl = isGreekInput ? content : await translateOrFallback(content, 'en', 'el');
            const contentEn = isGreekInput ? await translateOrFallback(content, 'el', 'en') : content;

            const payload = { titleEn, contentEn, titleEl, contentEl, type: formData.type };
            await updateAnnouncement(id, payload);
            toast.success(t('announcement_updated_success'));
            setIsEditing(false);
            loadAnnouncement();
        } catch (error) {
            toast.error(t('error_saving_announcement'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete_announcement'))) return;
        try {
            await deleteAnnouncement(id);
            toast.success(t('announcement_deleted_success'));
            navigate("/organization/announcements");
        } catch (error) {
            toast.error(t('error_deleting_announcement'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
            </div>
        );
    }

    if (!announcement) return null;

    const config = typeConfigs[formData.type] || typeConfigs.OTHER;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 w-full overflow-x-hidden">
            <Header
                activeTab=""
                setActiveTab={() => {}}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isOrganization={true}
                logoMenuRef={logoMenuRef}
            />

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> {t('back')}
                    </button>
                    
                    {!isEditing && (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(true)} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-50 hover:bg-indigo-50 transition-all">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={handleDelete} className="p-3 bg-white text-red-500 rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 transition-all">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[40px] shadow-xl border border-indigo-50 relative overflow-visible">
                    <div className={`absolute top-0 left-0 right-0 h-2 ${config.color.split(' ')[1].replace('text', 'bg')} rounded-t-[40px]`} />
                    
                    <div className="p-8 md:p-12 pt-10 md:pt-14">
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('announcement_label_title')}</label>
                                    <input required className="w-full h-12 p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('announcement_label_content')}</label>
                                    <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm font-bold min-h-[150px] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                                </div>
                                <CustomDropdown 
                                    label={t('announcement_label_type')} 
                                    value={formData.type} 
                                    options={typeOptions} 
                                    onChange={val => setFormData({ ...formData, type: val })} 
                                />
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('btn_update_announcement')}
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center uppercase text-xs tracking-widest">
                                        {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex flex-wrap items-center gap-4 border-b border-gray-50 pb-6">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm flex items-center gap-2 ${config.color}`}>
                                        <config.icon className="w-4 h-4" /> {t(config.labelKey)}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {announcement?.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : '--'}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight break-words">{formData.title}</h1>
                                    <p className="text-gray-600 text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap break-words">{formData.content}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrgAnnouncementDetails;