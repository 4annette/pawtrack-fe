import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft, Loader2, Image as ImageIcon, Calendar, Hash, Dog,
    CheckCircle, MapPin, ShieldCheck, User, Mail, Phone, Clock,
    Briefcase, Save, Check, ChevronDown, ArrowLeftCircle
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { fetchFoundReportById, updateFoundReportStatus, markFoundReportAsFound, updateClaimVerificationStatus } from "../../services/api";
import Header from "@/pages/Header";

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
        if (lat && lng) {
            setTimeout(() => {
                map.invalidateSize();
                map.setView([lat, lng], 15);
            }, 200);
        }
    }, [lat, lng, map]);
    return null;
};

const ReadOnlyField = ({ label, value, icon: Icon }) => {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-blue-900/40 flex items-center gap-1 ml-1 tracking-widest">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <div className={`w-full p-3.5 rounded-2xl border border-blue-100 bg-white text-sm font-bold text-slate-700 truncate shadow-sm`}>
                {value || "--"}
            </div>
        </div>
    );
};

const OrgViewFoundReport = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [report, setReport] = useState(null);
    const [addressText, setAddressText] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const logoMenuRef = useRef(null);
    const dropdownRef = useRef(null);

    const isGreekLanguage = i18n.language?.startsWith('el');
    const displayedTitle = report ? (isGreekLanguage ? report.titleEl : report.title) : '';
    const displayedDescription = report ? (isGreekLanguage ? report.descriptionEl : report.description) : '';

    const getReportData = async () => {
        try {
            const data = await fetchFoundReportById(id);
            setReport(data);
        } catch (err) {
            toast.error(t('report_not_found_toast'));
            navigate("/organization/claims");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user.role === "ADMIN") setIsAdmin(true);
            } catch (e) { }
        }
        getReportData();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        if (isStatusDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isStatusDropdownOpen]);

    useEffect(() => {
        if (!report?.latitude || !report?.longitude) return;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}`, {
            headers: { 'Accept-Language': i18n.language }
        })
            .then(res => res.json())
            .then(json => {
                if (json.address) {
                    const addr = json.address;
                    const city = addr?.city || addr?.town || addr?.village || "";
                    const country = addr?.country || "";
                    setAddressText([city, country].filter(Boolean).join(", ") || t('map_location_only_text'));
                }
            })
            .catch(() => setAddressText(t('map_location_only_text')));
    }, [report, i18n.language]);

    const handleClaimStatusUpdate = async (newStatus) => {
        setSaving(true);
        try {
            await updateClaimVerificationStatus(report.claimVerification, newStatus);
            toast.success(t(`claim_${newStatus.toLowerCase()}_success`));
            setIsStatusDropdownOpen(false);
            getReportData();
        } catch (err) {
            toast.error(t('error_updating_claim'));
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setSaving(true);
        try {
            await updateFoundReportStatus(id, newStatus);
            toast.success(t('status_updated_toast'));
            getReportData();
        } catch (err) {
            toast.error(t('error_saving_toast'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleFound = async () => {
        setSaving(true);
        try {
            await markFoundReportAsFound(id, null);
            toast.success(t('status_updated_toast'));
            getReportData();
        } catch (err) {
            toast.error(t('status_update_failed_toast'));
        } finally {
            setSaving(false);
        }
    };

    const canBeReadyForAdoption = () => {
        if (!report?.foundDate) return false;
        const foundDate = new Date(report.foundDate);
        const now = new Date();
        const diffInMonths = (now.getFullYear() - foundDate.getFullYear()) * 12 + (now.getMonth() - foundDate.getMonth());
        const adjustedMonths = now.getDate() < foundDate.getDate() ? diffInMonths - 1 : diffInMonths;
        return adjustedMonths >= 8;
    };

    const currentStatus = report?.status || "FOUND";

    const claimOptions = [
        { value: "ACCEPTED", label: t('status_accepted') },
        { value: "REJECTED", label: t('status_rejected') }
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
            <Header
                activeTab="claims"
                setActiveTab={() => { }}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isAdmin={isAdmin}
                isOrganization={true}
                logoMenuRef={logoMenuRef}
            />

            <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
                <div className="bg-blue-100/40 rounded-[32px] shadow-sm border border-blue-200 p-5 sm:p-10 mb-6 relative">

                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl transition-all active:scale-90 text-blue-400 shadow-sm border border-gray-200 shrink-0">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{t('report_details_title')}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${currentStatus === 'ADOPTED' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                                        {t(currentStatus)}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest border-l pl-2 border-blue-100">ID: #{report.id}</span>
                                </div>
                            </div>
                        </div>

                        {report.claimVerificationStatus === 'ACCEPTED' && (
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                {(currentStatus === 'FOUND' || !report.status) && canBeReadyForAdoption() && (
                                    <button
                                        onClick={() => handleStatusChange('READY_FOR_ADOPTION')}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white text-[11px] font-black uppercase px-5 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                                        {t('mark_ready_for_adoption')}
                                    </button>
                                )}

                                {currentStatus === 'READY_FOR_ADOPTION' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusChange('ADOPTED')}
                                            disabled={saving}
                                            className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 active:scale-95"
                                        >
                                            <CheckCircle className="w-4 h-4" /> {t('mark_adopted')}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('FOUND')}
                                            disabled={saving}
                                            className="flex-1 sm:flex-none justify-center bg-white text-slate-600 border border-slate-200 text-[11px] font-black uppercase px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            {t('back_to_found')}
                                        </button>
                                    </>
                                )}

                                {currentStatus === 'ADOPTED' && (
                                    <button
                                        onClick={() => handleStatusChange('READY_FOR_ADOPTION')}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none justify-center bg-white text-slate-600 border border-slate-200 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeftCircle className="w-4 h-4" /> {t('back_to_ready')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                        <div className="space-y-6 sm:space-y-10">
                            <div className="relative w-full max-w-sm mx-auto md:mx-0 aspect-square rounded-[32px] overflow-hidden border-8 border-white shadow-xl bg-gray-100">
                                {report.imageUrl ? (
                                    <img src={report.imageUrl} className="w-full h-full object-cover" alt="Pet" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <ImageIcon className="w-20 h-20 opacity-30" />
                                    </div>
                                )}
                            </div>

                            {report.claimVerificationStatus === 'ACCEPTED' && currentStatus !== 'ADOPTED' && (
                                <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-blue-50 shadow-sm max-w-sm mx-auto md:mx-0 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all ${report.found ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                                            {t('label_found_question')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={handleToggleFound}
                                        className={`w-14 h-7 rounded-full transition-all relative ${report.found ? 'bg-blue-600' : 'bg-gray-200'} ${saving && 'opacity-50'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${report.found ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 max-w-sm mx-auto md:mx-0">
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] flex items-center gap-3">
                                    <User className="w-4 h-4" /> {t('reporter_info')}
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-lg font-black text-white shadow-md uppercase shrink-0">
                                        {report.creator.firstName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-slate-900 truncate">{report.creator.firstName} {report.creator.lastName}</p>
                                        <p className="text-[11px] font-bold text-blue-400 tracking-tight truncate">@{report.creator.username}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-[12px] text-slate-600 font-bold break-all">
                                        <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                                        {report.creator.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-[12px] text-slate-600 font-bold">
                                        <Phone className="w-4 h-4 text-blue-300 shrink-0" />
                                        {report.creator.phone || "--"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <ReadOnlyField label={t('label_report_title')} value={displayedTitle} />

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-blue-900/30 ml-1 tracking-widest">{t('label_description')}</label>
                                <div className="w-full p-4 rounded-2xl border border-gray-100 bg-white text-[13px] font-bold text-slate-700 min-h-[120px] whitespace-pre-wrap leading-relaxed shadow-sm">
                                    {displayedDescription || t('no_description_provided')}
                                </div>
                            </div>

                            <ReadOnlyField label={t('label_location_text')} value={addressText} icon={MapPin} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ReadOnlyField label={t('label_condition')} value={t(report.condition)} icon={CheckCircle} />
                                <ReadOnlyField label={t('label_species')} value={t(report.species)} icon={Dog} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ReadOnlyField label={t('label_chip_number')} value={report.chipNumber} icon={Hash} />
                                <ReadOnlyField label={t('label_date_found')} value={new Date(report.foundDate).toLocaleDateString()} icon={Calendar} />
                            </div>

                            {report.claimVerificationStatus && (
                                <div className="relative" ref={dropdownRef}>
                                    <div
                                        onClick={() => report.claimVerificationStatus === 'PENDING' && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                        className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all shadow-sm ${report.claimVerificationStatus === 'PENDING' ? 'cursor-pointer hover:border-orange-300' : ''
                                            } ${report.claimVerificationStatus === 'ACCEPTED'
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : report.claimVerificationStatus === 'REJECTED'
                                                    ? 'bg-red-50 border-red-100 text-red-700'
                                                    : 'bg-orange-50 border-orange-100 text-orange-700'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-2xl ${report.claimVerificationStatus === 'ACCEPTED'
                                                ? 'bg-emerald-600 text-white'
                                                : report.claimVerificationStatus === 'REJECTED'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-orange-600 text-white'
                                            } shadow-md shrink-0`}>
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">{t('claim_status_label')}</p>
                                            <div className="text-[12px] font-black uppercase tracking-widest flex items-center justify-between">
                                                {t(`status_${report.claimVerificationStatus.toLowerCase()}`)}
                                                {report.claimVerificationStatus === 'PENDING' && <ChevronDown className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />}
                                            </div>
                                        </div>
                                    </div>

                                    {isStatusDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 shadow-xl rounded-2xl p-1.5 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                                            {claimOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => handleClaimStatusUpdate(opt.value)}
                                                    className="w-full text-left px-4 py-3 text-[11px] font-black uppercase rounded-xl transition-colors hover:bg-blue-50 text-slate-700 flex items-center justify-between"
                                                >
                                                    {opt.label}
                                                    {report.claimVerificationStatus === opt.value && <Check className="w-4 h-4 text-blue-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {report.latitude && report.longitude && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('found_location_map_title')}</h3>
                            </div>
                            <div className="h-80 w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-lg relative z-0">
                                <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[report.latitude, report.longitude]}>
                                        <Popup>{t('found_here_popup')}</Popup>
                                    </Marker>
                                    <RecenterMap lat={report.latitude} lng={report.longitude} />
                                </MapContainer>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrgViewFoundReport;