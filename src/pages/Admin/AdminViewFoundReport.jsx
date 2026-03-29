import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft, Trash2, Loader2, Image as ImageIcon,
    Calendar, Dog, CheckCircle, MapPin, 
    Hash, Info, Activity, Heart, Search
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {
    fetchFoundReportById,
    deleteFoundReport,
    deleteFoundReportImage
} from "../../services/api";

import PawTrackLogo from "@/components/PawTrackLogo";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";
import AdminMenu from "@/components/admin/AdminMenu";

// Fix Leaflet Icons
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng && map) {
            map.setView([lat, lng], 15);
            map.invalidateSize();
        }
    }, [lat, lng, map]);
    return null;
};

const AdminViewFoundReport = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const getCurrentLanguage = () => {
        const preferred = i18n.language || i18n.resolvedLanguage || localStorage.getItem('i18nextLng') || '';
        return String(preferred).toLowerCase();
    };
    const isGreekLanguage = getCurrentLanguage().startsWith('el');
    const getLocalizedTitle = (item) => {
        if (!item) return '';
        return isGreekLanguage ? item.titleEl || item.title || item.titleEl || '' : item.title || item.titleEl || item.title || '';
    };
    const getLocalizedDescription = (item) => {
        if (!item) return '';
        return isGreekLanguage ? item.descriptionEl || item.description || item.descriptionEl || '' : item.description || item.descriptionEl || item.description || '';
    };
    
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [addressText, setAddressText] = useState("");

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchFoundReportById(id);
            if (!data) throw new Error("No data");
            setReport(data);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error(t('report_not_found_toast') || "Report not found");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!report?.latitude || !report?.longitude) return;
        const fetchAddr = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${report.latitude}&lon=${report.longitude}`);
                const data = await res.json();
                setAddressText(data.display_name || `${report.latitude}, ${report.longitude}`);
            } catch (e) {
                setAddressText(`${report.latitude}, ${report.longitude}`);
            }
        };
        fetchAddr();
    }, [report?.latitude, report?.longitude]);

    const handleDeletePhoto = async () => {
        if (!window.confirm(t('confirm_remove_photo') || "Delete photo?")) return;
        setImageLoading(true);
        try {
            await deleteFoundReportImage(id);
            setReport(prev => ({ ...prev, imageUrl: null }));
            toast.success(t('photo_removed_toast') || "Photo removed");
        } catch (err) {
            toast.error(t('could_not_remove_photo_toast') || "Error removing photo");
        } finally {
            setImageLoading(false);
        }
    };

    const handleDeleteReport = async () => {
        if (!window.confirm(t('confirm_delete_report') || "Delete entire report?")) return;
        try {
            await deleteFoundReport(id);
            toast.success(t('report_deleted_toast') || "Report deleted");
            navigate('/dashboard');
        } catch (err) {
            toast.error(t('failed_delete_report_toast') || "Error deleting report");
        }
    };

    const getConditionStyle = (condition) => {
        const styles = {
            EXCELLENT: 'bg-emerald-500 text-white border-emerald-400',
            GOOD: 'bg-blue-500 text-white border-blue-400',
            POOR: 'bg-red-500 text-white border-red-400'
        };
        return styles[condition] || 'bg-gray-500 text-white border-gray-400';
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
        </div>
    );

    if (!report) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 pb-20">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <PawTrackLogo size="sm" />
                        <span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('admin_panel') || "ADMIN"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminMenu />
                        <Notifications />
                        <ProfileButton />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Mobile Optimized Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-emerald-600 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> {t('back') || "BACK"}
                        </button>
                        
                        <button 
                            onClick={handleDeleteReport} 
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm font-black text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('delete_report') || "DELETE"}</span>
                        </button>
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 leading-tight">
                        <Search className="w-8 h-8 text-emerald-500 shrink-0" />
                        {t('view_found_report') || "Found Report"}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-xl relative">
                            <div className={`absolute top-6 left-6 z-10 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm border ${report.found ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-orange-500 text-white border-orange-400'}`}>
                                {report.found ? (t('status_found') || "FOUND") : (t('status_active') || "ACTIVE")}
                            </div>

                            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-50">
                                {imageLoading ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                    </div>
                                ) : report.imageUrl ? (
                                    <img src={report.imageUrl} className="w-full h-full object-cover" alt="Pet" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <ImageIcon className="w-12 h-12" />
                                        <span className="text-[10px] font-black uppercase mt-2">{t('no_image') || "NO IMAGE"}</span>
                                    </div>
                                )}
                                
                                {report.imageUrl && !imageLoading && (
                                    <button 
                                        type="button"
                                        onClick={handleDeletePhoto} 
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-full hover:bg-red-500 hover:text-white shadow-md transition-all active:scale-90"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500"><Hash className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase leading-none">{t('chip_number') || "CHIP"}</p>
                                    <p className="text-xs font-bold text-gray-700">{report.chipNumber || "0"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Calendar className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase leading-none">{t('date_found') || "DATE"}</p>
                                    <p className="text-xs font-bold text-gray-700">{report.foundDate ? report.foundDate.replace('T', ' ').substring(0, 16) : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Activity className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase leading-none">{t('condition') || "CONDITION"}</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase ${getConditionStyle(report.condition)}`}>
                                        {report.condition || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('title') || "TITLE"}</label>
                                    <div className="text-lg font-black text-gray-800">{getLocalizedTitle(report) || "Untitled"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('species') || "SPECIES"}</label>
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit capitalize">
                                        <Dog className="w-3 h-3" /> {report.species || "N/A"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description') || "DESCRIPTION"}</label>
                                <div className="text-sm font-medium text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed italic">
                                    "{getLocalizedDescription(report) || "No description provided."}"
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-500" /> {t('found_location') || "LOCATION"}
                                </label>
                            </div>
                            <div className="mb-4 text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 text-emerald-300 mt-0.5" />
                                <span>{addressText || t('loading_address') || "Loading..."}</span>
                            </div>
                            <div className="h-64 w-full rounded-[2rem] overflow-hidden border border-gray-100 relative z-0">
                                {report.latitude && report.longitude && (
                                    <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[report.latitude, report.longitude]}>
                                            <Popup>{getLocalizedTitle(report) || "Found Pet"}</Popup>
                                        </Marker>
                                        <RecenterMap lat={report.latitude} lng={report.longitude} />
                                    </MapContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 px-4">
                        <Heart className="w-6 h-6 text-red-500" />
                        {t('linked_lost_report') || "Linked Lost Report"}
                        <span className="text-xs font-black text-gray-300 bg-gray-100 px-2 py-1 rounded-lg">
                            {report.lostReport ? 1 : 0}
                        </span>
                    </h2>

                    {report.lostReport ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg overflow-hidden flex cursor-default pointer-events-none">
                                <div className="w-1/3 aspect-square bg-gray-100 overflow-hidden relative">
                                    {report.lostReport.imageUrl ? (
                                        <img src={report.lostReport.imageUrl} className="w-full h-full object-cover" alt="Lost" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200"><Dog className="w-8 h-8" /></div>
                                    )}
                                </div>
                                <div className="w-2/3 p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-xs font-black text-gray-800 uppercase truncate pr-4">{getLocalizedTitle(report.lostReport)}</h3>
                                            <span className="text-[8px] font-black text-gray-300">ID: #{report.lostReport.id}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 line-clamp-2 italic mb-3">"{getLocalizedDescription(report.lostReport)}"</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-orange-600 border-t border-gray-50 pt-3">
                                        <Calendar className="w-3 h-3" />
                                        {report.lostReport.lostDate ? new Date(report.lostReport.lostDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center">
                            <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('no_linked_report') || "No linked reports"}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminViewFoundReport;