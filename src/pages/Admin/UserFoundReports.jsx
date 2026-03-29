import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
    Loader2, ChevronLeft, Search, Calendar, MapPin, 
    Dog, AlertCircle, ChevronRight, Trash2, X, Copy, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import ProfileButton from "@/components/topBar/ProfileButton";
import Notifications from "@/components/notifications/Notifications";
import PawTrackLogo from "@/components/PawTrackLogo";
import AdminMenu from "@/components/admin/AdminMenu";

const LocationName = ({ lat, lng }) => {
    const [address, setAddress] = useState("Loading...");

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                );
                const data = await res.json();
                if (data.address) {
                    const addr = data.address;
                    const shortAddr = [
                        addr.road || addr.suburb || addr.neighbourhood,
                        addr.city || addr.town || addr.village
                    ].filter(Boolean).join(", ");
                    setAddress(shortAddr || "Unknown Area");
                } else {
                    setAddress(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
                }
            } catch (err) {
                setAddress("Location Unavailable");
            }
        };
        if (lat && lng) fetchAddress();
    }, [lat, lng]);

    return (
        <p className="text-[10px] font-bold text-indigo-600 truncate border-b border-indigo-200 border-dashed inline-block max-w-full">
            {address}
        </p>
    );
};

const MapModal = ({ isOpen, onClose, lat, lng, title }) => {
    if (!isOpen) return null;
    
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=14&output=embed`;
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    return (
        <div 
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-6 border-b border-gray-100 flex items-center justify-between pr-16">
                    <div>
                        <h3 className="font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            {title || "Location"}
                        </h3>
                        <a 
                            href={googleMapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mt-1 hover:underline"
                        >
                            Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`${lat}, ${lng}`);
                            toast.success("Coordinates copied!");
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase hover:text-indigo-600 transition-colors"
                    >
                        <Copy className="w-3 h-3" /> {lat.toFixed(4)}, {lng.toFixed(4)}
                    </button>
                </div>

                <div className="h-[450px] w-full bg-gray-50">
                    <iframe
                        title="map-location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={mapUrl}
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

const UserFoundReports = () => {
    const { userId } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const getCurrentLanguage = () => {
        const preferred = i18n.language || i18n.resolvedLanguage || localStorage.getItem('i18nextLng') || '';
        return String(preferred).toLowerCase();
    };
    const isGreekLanguage = getCurrentLanguage().startsWith('el');
    const getLocalizedTitle = (item) => {
        if (!item) return '';
        return isGreekLanguage
            ? item.titleEl || item.title || item.titleEl || ''
            : item.title || item.titleEl || item.title || '';
    };
    const getLocalizedDescription = (item) => {
        if (!item) return '';
        return isGreekLanguage
            ? item.descriptionEl || item.description || item.descriptionEl || ''
            : item.description || item.descriptionEl || item.description || '';
    };
    
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedMap, setSelectedMap] = useState(null);

    useEffect(() => {
        loadReports();
    }, [userId, page]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/users/${userId}/found-reports`, {
                params: { page: page, size: 6, sortBy: 'id', sortDirection: 'DESC' }
            });
            
            if (response && response.data) {
                const data = response.data;
                const content = data.content || (Array.isArray(data) ? data : []);
                const pageMeta = data.page || data;

                setReports(content);
                setTotalPages(pageMeta.totalPages || 0);
                setTotalElements(pageMeta.totalElements || 0);
            }
        } catch (error) {
            toast.error(t('load_reports_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, reportId) => {
        e.stopPropagation();
        if (!window.confirm(t('confirm_delete_report'))) return;
        try {
            await api.delete(`/admin/reports/found/${reportId}`);
            toast.success(t('report_deleted_success'));
            loadReports();
        } catch (error) {
            toast.error(t('delete_report_failed'));
        }
    };

    const getConditionStyle = (condition) => {
        const styles = {
            EXCELLENT: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            GOOD: 'text-blue-600 bg-blue-50 border-blue-100',
            POOR: 'text-red-600 bg-red-50 border-red-100'
        };
        return styles[condition] || 'text-gray-600 bg-white border-gray-100';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <PawTrackLogo size="sm" />
                        <span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('admin_panel')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminMenu />
                        <Notifications />
                        <ProfileButton />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-4">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {t('back_to_users')}
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Search className="w-8 h-8 text-emerald-500" />
                        {t('found_reports')}
                    </h1>
                    <p className="text-gray-500 mt-2 font-black uppercase text-[10px] tracking-widest">
                        {t('user_id')}: {userId} • {totalElements} {t('reports_total')}
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-gray-100 p-20 text-center shadow-sm">
                        <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{t('no_reports')}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {reports.map((report) => (
                            <div 
                                key={report.id} 
                                onClick={() => navigate(`/admin/reports/found/${report.id}`)}
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group h-full cursor-pointer active:scale-[0.98]"
                            >
                                <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-[2.5rem]">
                                    {report.imageUrl ? (
                                        <img src={report.imageUrl} alt={getLocalizedTitle(report)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-gray-200" /></div>
                                    )}
                                    
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <div className={`min-w-[70px] h-8 flex items-center justify-center px-3 rounded-xl text-[9px] font-black uppercase border shadow-sm backdrop-blur-md bg-white/90 ${getConditionStyle(report.condition)}`}>
                                            {t(report.condition) || report.condition}
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(e, report.id)} 
                                            className="p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-1">
                                        <h3 className="text-lg font-black text-gray-900 truncate uppercase tracking-tight">{getLocalizedTitle(report) || "Untitled"}</h3>
                                        <span className="text-[9px] font-black uppercase text-gray-300 tracking-tight shrink-0 mt-1.5">ID: #{report.id}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-4">
                                        <Dog className="w-3 h-3" /> {t(report.species) || report.species}
                                    </div>

                                    <div className="mb-4 flex-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1.5">{t('description')}</p>
                                        <p className="text-xs text-gray-600 line-clamp-3 italic bg-gray-50/50 p-3 rounded-xl border border-gray-100 min-h-[3rem]">
                                            {getLocalizedDescription(report) || t('no_description')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-auto">
                                        <div className="flex items-start gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{t('date_found')}</p>
                                                <p className="text-[10px] font-bold text-gray-700">
                                                    {report.foundDate ? new Date(report.foundDate).toLocaleDateString() : t('not_set')}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedMap(report); }}
                                            className="flex items-start gap-2 group/loc text-left hover:opacity-80 transition-opacity"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 group-hover/loc:scale-110 transition-transform" />
                                            <div className="overflow-hidden">
                                                <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{t('location')}</p>
                                                <LocationName lat={report.latitude} lng={report.longitude} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mt-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t('page')} {page + 1} {t('of')} {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 0} 
                                onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }} 
                                className="p-2 border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                                disabled={page >= totalPages - 1} 
                                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }} 
                                className="p-2 border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <MapModal 
                isOpen={!!selectedMap} 
                onClose={() => setSelectedMap(null)} 
                lat={selectedMap?.latitude} 
                lng={selectedMap?.longitude} 
                title={getLocalizedTitle(selectedMap)} 
            />
        </div>
    );
};

export default UserFoundReports;