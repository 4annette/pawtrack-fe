import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Trash2, Loader2, Image as ImageIcon, Edit3, X,
  Camera, Calendar, Hash, Dog,
  CheckCircle, MapPin, Link as LinkIcon, AlertCircle, Clock,
  ChevronDown, Save, Briefcase, Building2, Send, ShieldCheck, Timer
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  fetchFoundReportById,
  updateFoundReport,
  deleteFoundReport,
  uploadFoundReportImage,
  deleteFoundReportImage,
  markFoundReportAsFound,
  translateText,
  updateFoundReportStatus,
  fetchNearbyOrganizations,
  createClaimVerification,
  fetchClaimVerificationDetails,
  deleteClaimVerification
} from "../../services/api";
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

const CustomDateTimePicker = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {label}
      </label>
      <div className="w-full p-3 rounded-xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed">
        <Clock className="w-3.5 h-3.5 text-emerald-300" />
        {value ? value.replace('T', ' ').substring(0, 16) : t('not_set')}
      </div>
    </div>
  );
};

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, disabled, placeholder }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder || t('not_set'), value: "" };

  useEffect(() => {
    const handleClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (disabled) return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <div className="w-full p-3 rounded-xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-600 truncate">{selectedOption.label}</div>
    </div>
  );

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-3 rounded-xl border border-emerald-100 hover:border-emerald-300 bg-white shadow-sm text-sm text-gray-700 font-bold flex items-center justify-between transition-all">
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-50 p-1 space-y-1 max-h-60 overflow-y-auto">
          {options.length > 0 ? options.map((option) => (
            <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`px-3 py-2 rounded-lg text-sm cursor-pointer font-bold ${option.value === value ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'}`}>{option.label}</div>
          )) : <div className="px-3 py-2 text-xs text-gray-400 italic">{t('no_options_found')}</div>}
        </div>
      )}
    </div>
  );
};

const FoundReportDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [report, setReport] = useState(null);
  const [originalReport, setOriginalReport] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [addressText, setAddressText] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [tempSelectedLostId, setTempSelectedLostId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [nearbyOrgs, setNearbyOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [claimDetails, setClaimDetails] = useState(null);
  const logoMenuRef = useRef(null);

  const hasFetched = useRef(false);

  const speciesOptions = [
    { label: t('species_dog'), value: "DOG" },
    { label: t('species_cat'), value: "CAT" },
    { label: t('species_other'), value: "OTHER" }
  ];
  const conditionOptions = [
    { label: t('condition_excellent'), value: "EXCELLENT" },
    { label: t('condition_good'), value: "GOOD" },
    { label: t('condition_bad'), value: "BAD" }
  ];

  const isGreekLanguage = i18n.language?.startsWith('el');
  const titleField = isGreekLanguage ? 'titleEl' : 'title';
  const descriptionField = isGreekLanguage ? 'descriptionEl' : 'description';
  const displayedTitle = report ? (report[titleField] || report.title || report.titleEl || '') : '';
  const displayedDescription = report ? (report[descriptionField] || report.description || report.descriptionEl || '') : '';

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === "ADMIN") setIsAdmin(true);
        if (user.role === "ORGANIZATIONS") setIsOrganization(true);
        if (user.role === "USER" || user.role === "ADMIN") setIsUser(true);
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }

    const handleClickOutside = (event) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    if (hasFetched.current) return;
    const getReport = async () => {
      try {
        const data = await fetchFoundReportById(id);
        setReport(data);
        setOriginalReport(data);
        hasFetched.current = true;
        
        if (data.claimVerificationStatus === "PENDING" || data.claimVerificationStatus === "ACCEPTED") {
            try {
                const claimData = await fetchClaimVerificationDetails(id);
                setClaimDetails(claimData);
            } catch (err) { console.error(err); }
        } else {
            const loadOrgs = async (lat, lng) => {
                const orgsData = await fetchNearbyOrganizations(lat, lng);
                setNearbyOrgs(orgsData.content.map(org => ({ label: org.organizationName, value: org.id })));
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => loadOrgs(pos.coords.latitude, pos.coords.longitude),
                    () => data.latitude && data.longitude && loadOrgs(data.latitude, data.longitude)
                );
            } else if (data.latitude && data.longitude) {
                loadOrgs(data.latitude, data.longitude);
            }
        }
      } catch (err) {
        toast.error(t('report_not_found_toast'));
        navigate("/my-reports");
      } finally { setLoading(false); }
    };
    getReport();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [id, navigate, t]);

  useEffect(() => {
    if (!report || !report.latitude || !report.longitude) {
      if (report && (!report.latitude || !report.longitude)) {
        setAddressText(t('no_location_coords_text'));
      }
      return;
    }

    const timerId = setTimeout(() => {
      setAddressText(t('fetching_address_text'));
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}`, {
        headers: { 'Accept-Language': i18n.language }
      })
        .then(res => res.json())
        .then(json => {
          if (json.address) {
            const addr = json.address;
            const city = addr?.city || addr?.town || addr?.village || "";
            const country = addr?.country || "";
            const formatted = [city, country].filter(Boolean).join(", ");
            setAddressText(formatted || t('map_location_only_text'));
          } else {
            setAddressText(t('map_location_only_text'));
          }
        })
        .catch(() => setAddressText(t('map_location_only_text')));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [report?.latitude, report?.longitude, t, i18n.language]);

  const executeMarkAsFound = async (lostId) => {
    try {
      await markFoundReportAsFound(id, lostId);
      setReport({ ...report, found: !report.found });
      setShowFoundModal(false);
      toast.success(t('status_updated_toast'));
    } catch (err) {
      toast.error(t('status_update_failed_toast'));
    }
  };

  const translateOrFallback = async (text, fromLang, toLang) => {
    if (!text) return '';
    try {
      const translated = await translateText(text, fromLang, toLang);
      return translated || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const containsGreek = (text) => /[\u0370-\u03FF]/.test(text);

  const handleToggleFound = async () => {
    if (!isEditing) return;

    if (report.found) {
      await executeMarkAsFound(null);
      return;
    }

    const hasPossible = report.possibleLostReports && report.possibleLostReports.length > 0;
    const hasLost = !!report.lostReport;

    if (hasPossible || hasLost) {
      setTempSelectedLostId(report.lostReport ? report.lostReport.id : null);
      setShowFoundModal(true);
    } else {
      await executeMarkAsFound(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rawDate = report.foundDate || originalReport.foundDate;
      const formattedDate = rawDate ? rawDate.replace('T', ' ').substring(0, 19) : null;

      const titleInput = (isGreekLanguage ? report.titleEl : report.title) || report.title || report.titleEl || '';
      const descriptionInput = (isGreekLanguage ? report.descriptionEl : report.description) || report.description || report.descriptionEl || '';
      const title = titleInput.trim();
      const description = descriptionInput.trim();
      const titleIsGreek = containsGreek(title);
      const descriptionIsGreek = containsGreek(description);

      const titleEl = titleIsGreek
        ? title
        : await translateOrFallback(title, 'en', 'el');
      const titleEn = titleIsGreek
        ? await translateOrFallback(title, 'el', 'en')
        : title;

      const descriptionEl = descriptionIsGreek
        ? description
        : await translateOrFallback(description, 'en', 'el');
      const descriptionEn = descriptionIsGreek
        ? await translateOrFallback(description, 'el', 'en')
        : description;

      const payload = {
        ...report,
        title: titleEn,
        titleEl,
        description: descriptionEn,
        descriptionEl,
        dateFound: formattedDate,
        chipNumber: parseInt(report.chipNumber) || 0
      };
      const reportWithoutFoundDate = { ...payload };
      delete reportWithoutFoundDate.foundDate;

      await updateFoundReport(id, reportWithoutFoundDate);
      if (newImage) {
        const updatedData = await uploadFoundReportImage(id, newImage);
        setReport(prev => ({ ...prev, imageUrl: updatedData.imageUrl || updatedData }));
        setOriginalReport(prev => ({ ...prev, imageUrl: updatedData.imageUrl || updatedData }));
      }
      toast.success(t('saved_toast'));
      setIsEditing(false);
      setNewImage(null);
      const updated = await fetchFoundReportById(id);
      setReport(updated);
      setOriginalReport(updated);
    } catch (err) { toast.error(t('error_saving_toast')); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setReport({ ...originalReport });
    setNewImage(null);
    setIsEditing(false);
  };

  const handleRemovePhoto = async () => {
    if (window.confirm(t('confirm_delete_photo'))) {
      try {
        await deleteFoundReportImage(id);
        const updated = { ...report, imageUrl: null };
        setReport(updated);
        setOriginalReport(updated);
        setNewImage(null);
        toast.success(t('photo_removed_toast'));
      } catch (err) { toast.error(t('could_not_remove_photo_toast')); }
    }
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await updateFoundReportStatus(id, newStatus);
      const updated = await fetchFoundReportById(id);
      setReport(updated);
      setOriginalReport(updated);
      toast.success(t('status_updated_toast'));
    } catch (err) {
      toast.error(t('error_saving_toast'));
    } finally {
      setSaving(false);
    }
  };

  const handleClaimVerification = async () => {
    if (!selectedOrgId) {
      toast.error(t('please_select_organization_error'));
      return;
    }
    setSaving(true);
    try {
      await createClaimVerification(id, selectedOrgId);
      toast.success(t('claim_verification_sent_toast'));
      const updated = await fetchFoundReportById(id);
      setReport(updated);
      if (updated.claimVerificationStatus === "PENDING" || updated.claimVerificationStatus === "ACCEPTED") {
          const claimData = await fetchClaimVerificationDetails(id);
          setClaimDetails(claimData);
      }
      setSelectedOrgId("");
    } catch (err) {
      toast.error(t('claim_verification_failed_toast'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (window.confirm(t('confirm_delete_claim'))) {
        setSaving(true);
        try {
            await deleteClaimVerification(id);
            toast.success(t('claim_deleted_toast'));
            const updated = await fetchFoundReportById(id);
            setReport(updated);
            setClaimDetails(null);
            
            if (updated.latitude && updated.longitude) {
                const orgsData = await fetchNearbyOrganizations(updated.latitude, updated.longitude);
                setNearbyOrgs(orgsData.content.map(org => ({ label: org.organizationName, value: org.id })));
            }
        } catch (err) {
            toast.error(t('claim_delete_failed_toast'));
        } finally {
            setSaving(false);
        }
    }
  };

  const canBeReadyForAdoption = () => {
    const dateStr = report?.foundDate || report?.dateFound;
    if (!dateStr) return false;
    const foundDate = new Date(dateStr);
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
    return foundDate <= eightMonthsAgo;
  };

  const shouldShowOrgActions = () => {
    if ((!isOrganization && !isAdmin) || !report) return false;
    if (report.status === 'FOUND' && canBeReadyForAdoption()) return true;
    if (report.status === 'READY_FOR_ADOPTION') return true;
    if (report.status === 'ADOPTED') return true;
    return false;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header
        activeTab=""
        setActiveTab={() => {}}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAdmin={isAdmin}
        isOrganization={isOrganization}
        logoMenuRef={logoMenuRef}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-[32px] sm:rounded-[40px] shadow-xl border border-emerald-100 p-5 sm:p-10 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/my-reports", { state: { activeTab: 'found' } })} className="p-2 hover:bg-white/50 rounded-full transition-colors active:scale-90 text-emerald-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                {isEditing ? t('edit_report_title') : t('report_details_title')}
              </h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none justify-center bg-white border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm active:scale-95">
                    <Edit3 className="w-4 h-4" /> {t('edit_btn', { format: 'uppercase' })}
                  </button>
                  <button onClick={async () => { if (window.confirm(t('confirm_delete_report'))) { await deleteFoundReport(id); navigate("/my-reports", { state: { activeTab: 'found' } }); } }} className="flex-1 sm:flex-none justify-center bg-red-50 text-red-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm active:scale-95 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> {t('delete_btn', { format: 'uppercase' })}
                  </button>
                </>
              ) : (
                <button onClick={handleCancel} className="w-full sm:w-auto justify-center bg-white border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                  <X className="w-4 h-4" /> {t('cancel', { format: 'uppercase' })}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] block">
                {t('label_pet_photo', { format: 'uppercase' })}
              </label>
              <div className="relative aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                {newImage ? (
                  <img src={URL.createObjectURL(newImage)} className="w-full h-full object-cover" alt="New Preview" />
                ) : report.imageUrl ? (
                  <img src={report.imageUrl} className="w-full h-full object-cover" alt="Existing Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3">
                  <label className="w-full bg-white border border-emerald-200 py-3.5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-emerald-600 cursor-pointer hover:bg-emerald-50 shadow-sm transition-all">
                    <Camera className="w-4 h-4" /> {report.imageUrl ? t('change_photo_btn', { format: 'uppercase' }) : t('add_photo_btn', { format: 'uppercase' })}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} />
                  </label>
                  {report.imageUrl && (
                    <button type="button" onClick={handleRemovePhoto} className="w-full py-1 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
                      {t('delete_current_photo_btn', { format: 'uppercase' })}
                    </button>
                  )}
                </div>
              )}

              {report.status !== 'ADOPTED' && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {t('label_found_question', { format: 'uppercase' })}
                  </span>
                  <button type="button" disabled={!isEditing} onClick={handleToggleFound} className={`w-12 h-6 rounded-full transition-colors relative ${report.found ? 'bg-emerald-500' : 'bg-gray-300'} ${!isEditing && 'opacity-60 cursor-not-allowed'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${report.found ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              )}

              {shouldShowOrgActions() && (
                <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> {t('organization_actions', { format: 'uppercase' })}
                  </span>
                  <div className="flex flex-col gap-2">
                    {report.status === 'FOUND' && canBeReadyForAdoption() && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('READY_FOR_ADOPTION')}
                        disabled={saving}
                        className="w-full bg-emerald-600 text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                      >
                        {t('mark_ready_for_adoption')}
                      </button>
                    )}
                    {report.status === 'READY_FOR_ADOPTION' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange('ADOPTED')}
                          disabled={saving}
                          className="bg-emerald-600 text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          {t('mark_adopted')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange('FOUND')}
                          disabled={saving}
                          className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase py-3 rounded-xl hover:bg-gray-200 transition-all"
                        >
                          {t('back_to_found')}
                        </button>
                      </div>
                    )}
                    {report.status === 'ADOPTED' && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-center font-black text-[10px] uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5" /> {t('status_adopted')}
                        </div>
                    )}
                  </div>
                </div>
              )}

              {isUser && !isEditing && report.claimVerificationStatus !== "REJECTED" && (
                <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-4 animate-in slide-in-from-top-2 relative overflow-hidden">
                    <div className="flex justify-between items-center pr-2">
                      <span className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> {t('claim_verification_title', { format: 'uppercase' })}
                      </span>
                      {report.claimVerificationStatus === 'PENDING' && (
                        <button 
                            onClick={handleDeleteClaim}
                            disabled={saving}
                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all active:scale-90"
                            title={t('delete_request')}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  
                  {(!report.claimVerificationStatus && !claimDetails) ? (
                    <div className="space-y-4">
                        <CustomDropdown 
                            label={t('select_organization')} 
                            icon={Building2} 
                            value={selectedOrgId} 
                            options={nearbyOrgs} 
                            onChange={setSelectedOrgId} 
                            placeholder={t('choose_nearby_org')}
                        />
                        <button 
                            type="button" 
                            onClick={handleClaimVerification} 
                            disabled={saving || !selectedOrgId}
                            className="w-full bg-blue-600 text-white text-[10px] font-black uppercase py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {t('send_claim_btn', { format: 'uppercase' })}
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${report.claimVerificationStatus === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                            {report.claimVerificationStatus === 'ACCEPTED' ? <ShieldCheck className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-1">{t('claim_status_label')}</p>
                                <p className="text-sm font-bold">{t(`status_${report.claimVerificationStatus.toLowerCase()}`)}</p>
                            </div>
                        </div>
                        
                        {claimDetails && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                    <p className="text-xs font-bold">{claimDetails.organization?.firstName || claimDetails.organizationName || t('unknown_org')}</p>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-bold">{claimDetails.updatedAt ? new Date(claimDetails.updatedAt).toLocaleString() : new Date(claimDetails.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                  {t('label_report_title', { format: 'uppercase' })}
                </label>
                {isEditing ? (
                  <input type="text" className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm focus:ring-4 focus:ring-emerald-500/5 transition-all" value={displayedTitle} onChange={e => setReport({ ...report, [titleField]: e.target.value })} />
                ) : (
                  <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700">{displayedTitle || t('untitled')}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                  {t('label_description', { format: 'uppercase' })}
                </label>
                {isEditing ? (
                  <textarea className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold h-24 resize-none outline-none bg-white shadow-sm" value={displayedDescription} onChange={e => setReport({ ...report, [descriptionField]: e.target.value })} />
                ) : (
                  <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700 min-h-[60px] whitespace-pre-wrap">{displayedDescription || t('no_description_provided')}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {t('label_location_text', { format: 'uppercase' })}
                </label>
                <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/20 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed overflow-hidden">
                  <span className="truncate">{addressText}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomDropdown label={t('label_condition')} icon={CheckCircle} value={report.condition || ""} options={conditionOptions} onChange={val => setReport({ ...report, condition: val })} disabled={!isEditing} />
                <div className="sm:hidden h-1"></div>
                <CustomDropdown label={t('label_species')} icon={Dog} value={report.species || ""} options={speciesOptions} onChange={val => setReport({ ...report, species: val })} disabled={!isEditing} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> {t('label_chip_number', { format: 'uppercase' })}
                </label>
                {isEditing ? (
                  <input type="number" className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm" value={report.chipNumber || ""} onChange={e => setReport({ ...report, chipNumber: e.target.value })} />
                ) : (
                  <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700">{report.chipNumber || "0"}</div>
                )}
              </div>

              <CustomDateTimePicker label={t('label_date_found')} value={report.foundDate || ""} />

              {isEditing && (
                <div className="flex justify-end pt-6">
                  <button type="submit" disabled={saving} className="w-full sm:w-auto bg-emerald-600 text-white font-black px-10 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? t('saving_btn', { format: 'uppercase' }) : t('save_btn', { format: 'uppercase' })}
                  </button>
                </div>
              )}
            </div>
          </form>

          {report.latitude && report.longitude && (
            <div className="mt-10 border-t border-emerald-100 pt-8">
              <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {t('found_location_map_title', { format: 'uppercase' })}
              </h3>
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-sm relative z-0">
                <MapContainer
                  center={[report.latitude, report.longitude]}
                  zoom={15}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[report.latitude, report.longitude]}>
                    <Popup>{t('found_here_popup')}</Popup>
                  </Marker>
                  <RecenterMap lat={report.latitude} lng={report.longitude} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> {t('linked_lost_report_title', { format: 'uppercase' })}
            </h3>
            {report.lostReport ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer" onClick={() => setSelectedMatch(report.lostReport)}>
                <p className="font-bold text-sm text-emerald-900">{report.lostReport.title}</p>
                <p className="text-xs text-emerald-600 mt-1 font-bold">{new Date(report.lostReport.lostDate).toLocaleDateString()}</p>
              </div>
            ) : report.possibleLostReports?.length > 0 ? (
              <div className="space-y-3">
                {report.possibleLostReports.map(plr => (
                  <div key={plr.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setSelectedMatch(plr)}>
                    <p className="font-bold text-sm text-emerald-900">{plr.title}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-bold">{new Date(plr.lostDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic font-bold">{t('no_linked_report')}</p>
            )}
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <h3 className="text-xs font-black text-orange-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {t('possible_matches_title', { format: 'uppercase' })}
            </h3>
            <div className="space-y-3">
              {report.connectedFoundReports?.length > 0 ? (
                report.connectedFoundReports.map(plr => (
                  <div key={plr.id} className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setSelectedMatch(plr)}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-orange-900 truncate">{plr.title}</p>
                      <p className="text-[10px] text-orange-600 font-bold">{new Date(plr.foundDate).toLocaleDateString()}</p>
                    </div>
                    <LinkIcon className="w-4 h-4 text-orange-300 shrink-0 ml-2" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic font-bold">{t('no_possible_matches')}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {showFoundModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 sm:p-8 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-emerald-900 uppercase">{t('select_report_modal_title', { format: 'uppercase' })}</h2>
              <button onClick={() => setShowFoundModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {report.lostReport && (
                <div onClick={() => setTempSelectedLostId(report.lostReport.id)} className={`p-4 rounded-2xl border-2 cursor-pointer ${tempSelectedLostId === report.lostReport.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100'}`}>
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">{t('original_label', { format: 'uppercase' })}</p>
                  <p className="font-bold text-sm">{report.lostReport.title}</p>
                </div>
              )}
              {report.possibleLostReports?.map(plr => (
                <div key={plr.id} onClick={() => setTempSelectedLostId(plr.id)} className={`p-4 rounded-2xl border-2 cursor-pointer ${tempSelectedLostId === plr.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100'}`}>
                  <p className="font-bold text-sm">{plr.title}</p>
                  <p className="text-xs text-gray-500">{new Date(plr.lostDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => executeMarkAsFound(tempSelectedLostId)} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all uppercase text-xs">{t('confirm_link_btn', { format: 'uppercase' })}</button>
              <button onClick={() => executeMarkAsFound(report.lostReport ? report.lostReport.id : null)} className="w-full bg-white text-gray-400 font-bold py-2 text-[10px] uppercase hover:text-emerald-600 transition-colors">{t('continue_no_change_btn', { format: 'uppercase' })}</button>
            </div>
          </div>
        </div>
      )}

      {selectedMatch && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative border border-emerald-100 animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-[210]"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  {selectedMatch.lostDate ? <AlertCircle className="w-5 h-5 text-emerald-600" /> : <Dog className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-emerald-900 leading-tight">{selectedMatch.title}</h2>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                    {selectedMatch.lostDate ? t('lost_report_preview', { format: 'uppercase' }) : t('found_report_preview', { format: 'uppercase' })}
                  </span>
                </div>
              </div>

              <div className="aspect-video w-full rounded-2xl bg-gray-50 border-4 border-white shadow-md overflow-hidden mb-6">
                {selectedMatch.imageUrl ? (
                  <img src={selectedMatch.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10" />
                    <p className="text-[9px] font-black uppercase mt-1">{t('no_photo', { format: 'uppercase' })}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-50">
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">{t('label_species', { format: 'uppercase' })}</p>
                    <p className="font-bold text-xs text-gray-700">{selectedMatch.species || t('unknown')}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-50">
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">{t('date_label', { format: 'uppercase' })}</p>
                    <p className="font-bold text-xs text-gray-700">
                      {new Date(selectedMatch.lostDate || selectedMatch.foundDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('label_description', { format: 'uppercase' })}</p>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {selectedMatch.description || t('no_description_provided')}
                  </p>
                </div>
              </div>

              {selectedMatch.latitude && selectedMatch.longitude && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-emerald-800 uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5" /> {t('map_location_label', { format: 'uppercase' })}
                  </div>
                  <div className="h-40 w-full rounded-2xl overflow-hidden border border-emerald-100 shadow-inner relative z-0">
                    <MapContainer
                      center={[selectedMatch.latitude, selectedMatch.longitude]}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%", zIndex: 0 }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedMatch.latitude, selectedMatch.longitude]} />
                      <RecenterMap lat={selectedMatch.latitude} lng={selectedMatch.longitude} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoundReportDetails;