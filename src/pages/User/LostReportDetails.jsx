import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Trash2, Loader2, Image as ImageIcon, Edit3, X,
  Camera, Calendar, Hash, Dog,
  CheckCircle, MapPin, Clock, ChevronDown, Info, Save
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  fetchLostReportById,
  updateLostReport,
  deleteLostReport,
  uploadLostReportImage,
  deleteLostReportImage,
  toggleLostReportFoundStatus
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
      <label className="text-xs font-semibold text-orange-700 flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {label}
      </label>
      <div className="w-full p-3 rounded-xl border border-orange-50 bg-orange-50/10 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed">
        <Clock className="w-3.5 h-3.5 text-orange-300" />
        {value ? value.replace('T', ' ').substring(0, 16) : t('not_set')}
      </div>
    </div>
  );
};

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, disabled }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const safeOptions = options || [];
  const selectedOption = safeOptions.find(opt => opt.value === value) || { label: t('not_set'), value: "" };

  useEffect(() => {
    const handleClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (disabled) return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-orange-700 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <div className="w-full p-3 rounded-xl border border-orange-50 bg-orange-50/10 text-sm font-bold text-gray-600 truncate">{selectedOption.label}</div>
    </div>
  );

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-orange-700 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-3 rounded-xl border border-orange-100 hover:border-orange-300 bg-white shadow-sm text-sm text-gray-700 font-bold flex items-center justify-between transition-all">
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden z-50 p-1 space-y-1">
          {safeOptions.map((option) => (
            <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`px-3 py-2 rounded-lg text-sm cursor-pointer font-bold ${option.value === value ? 'bg-orange-600 text-white' : 'hover:bg-orange-50'}`}>{option.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const LostReportDetails = () => {
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
  const [addressText, setAddressText] = useState(t('loading_location_text'));
  const [selectedFoundReport, setSelectedFoundReport] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logoMenuRef = useRef(null);

  const speciesOptions = [
    { label: t('species_dog'), value: "DOG" },
    { label: t('species_cat'), value: "CAT" },
    { label: t('species_other'), value: "OTHER" }
  ];

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === "ADMIN") setIsAdmin(true);
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

    const getReport = async () => {
      try {
        const data = await fetchLostReportById(id);
        setReport(data);
        setOriginalReport(data);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rawDate = report.lostDate || originalReport.lostDate || originalReport.createdAt;
      const formattedDate = rawDate ? rawDate.replace('T', ' ').substring(0, 19) : null;
      const updateData = { ...report, date: formattedDate };
      delete updateData.lostDate;

      await updateLostReport(id, updateData);

      if (report.found !== originalReport.found) {
        await toggleLostReportFoundStatus(id, report.found);
      }

      if (newImage) {
        await uploadLostReportImage(id, newImage);
      }
      toast.success(t('saved_successfully_toast'));
      setIsEditing(false);
      setNewImage(null);
      const updated = await fetchLostReportById(id);
      setReport(updated);
      setOriginalReport(updated);
    }
    catch (err) {
      toast.error(t('error_saving_toast'));
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setReport({ ...originalReport });
    setNewImage(null);
    setIsEditing(false);
  };

  const handleDeleteReport = async () => {
    if (window.confirm(t('confirm_delete_report'))) {
      try {
        await deleteLostReport(id);
        toast.success(t('report_deleted_toast'));
        navigate("/my-reports", { state: { activeTab: 'lost' } });
      } catch (err) { toast.error(t('failed_delete_report_toast')); }
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm(t('confirm_remove_photo'))) {
      try {
        await deleteLostReportImage(id);
        setReport({ ...report, imageUrl: null });
        toast.success(t('photo_removed_toast'));
      } catch (err) { toast.error(t('could_not_remove_photo_toast')); }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header
        activeTab=""
        setActiveTab={() => {}}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAdmin={isAdmin}
        logoMenuRef={logoMenuRef}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-[32px] sm:rounded-[40px] shadow-xl border border-orange-100 p-5 sm:p-10 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/my-reports", { state: { activeTab: 'lost' } })} className="p-2 hover:bg-white/50 rounded-full transition-colors active:scale-90 text-orange-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-orange-900 tracking-tight">
                {isEditing ? t('edit_lost_report_title') : t('lost_report_details_title')}
              </h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none justify-center bg-white border border-orange-200 text-orange-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm active:scale-95">
                    <Edit3 className="w-4 h-4" /> {t('edit_btn', { format: 'uppercase' })}
                  </button>
                  <button onClick={handleDeleteReport} className="flex-1 sm:flex-none justify-center bg-red-50 text-red-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-red-100 transition-colors shadow-sm active:scale-95">
                    <Trash2 className="w-4 h-4" /> {t('delete_btn', { format: 'uppercase' })}
                  </button>
                </>
              ) : (
                <button onClick={handleCancel} className="w-full sm:w-auto justify-center bg-white border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                  <X className="w-4 h-4" /> {t('cancel', { format: 'uppercase' })}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-orange-800 uppercase tracking-[0.2em] block">
                {t('label_pet_photo', { format: 'uppercase' })}
              </label>
              <div className="relative aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                {newImage ? <img src={URL.createObjectURL(newImage)} className="w-full h-full object-cover" alt="New Preview" /> : report.imageUrl ? <img src={report.imageUrl} className="w-full h-full object-cover" alt="Report" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><ImageIcon className="w-12 h-12" /><span className="text-[10px] font-black uppercase mt-2">{t('no_image', { format: 'uppercase' })}</span></div>}
              </div>

              {isEditing && (
                <div className="space-y-3">
                  <label className="w-full bg-white border border-orange-200 py-3.5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-orange-600 cursor-pointer hover:bg-orange-50 shadow-sm transition-all">
                    <Camera className="w-4 h-4" /> {report.imageUrl ? t('change_photo_btn', { format: 'uppercase' }) : t('add_photo_btn', { format: 'uppercase' })}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} />
                  </label>
                  {report.imageUrl && <button type="button" onClick={handleRemoveImage} className="w-full py-1 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">{t('delete_current_photo_btn', { format: 'uppercase' })}</button>}
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-orange-100 shadow-sm">
                <span className="text-xs font-black text-orange-800 uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('label_found_question', { format: 'uppercase' })}</span>
                <button type="button" disabled={!isEditing} onClick={() => setReport({ ...report, found: !report.found })} className={`w-12 h-6 rounded-full transition-colors relative ${report.found ? 'bg-orange-500' : 'bg-gray-300'} ${!isEditing && 'opacity-60 cursor-not-allowed'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${report.found ? 'right-1' : 'left-1'}`} /></button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800 uppercase tracking-widest block">{t('label_report_title', { format: 'uppercase' })}</label>
                {isEditing ? <input type="text" className="w-full p-3.5 rounded-2xl border border-orange-100 text-sm font-bold outline-none bg-white shadow-sm focus:ring-4 focus:ring-orange-500/5 transition-all" value={report.title || ""} onChange={e => setReport({ ...report, title: e.target.value })} /> : <div className="w-full p-3.5 rounded-2xl border border-orange-50 bg-orange-50/10 text-sm font-bold text-gray-700 truncate">{report.title || t('untitled')}</div>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800 uppercase tracking-widest block">{t('label_description', { format: 'uppercase' })}</label>
                {isEditing ? <textarea className="w-full p-3.5 rounded-2xl border border-orange-100 text-sm font-bold h-24 resize-none outline-none bg-white shadow-sm" value={report.description || ""} onChange={e => setReport({ ...report, description: e.target.value })} /> : <div className="w-full p-3.5 rounded-2xl border border-orange-50 bg-orange-50/10 text-sm font-bold text-gray-700 min-h-[60px] whitespace-pre-wrap">{report.description || t('no_description_provided')}</div>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800 uppercase tracking-widest block"><MapPin className="inline w-3 h-3 mr-1" /> {t('label_last_seen_location', { format: 'uppercase' })}</label>
                <div className="w-full p-3.5 rounded-2xl border border-orange-50 bg-orange-50/20 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed overflow-hidden"><Info className="w-3.5 h-3.5 text-orange-300 shrink-0" /><span className="truncate">{addressText}</span></div>
              </div>

              <CustomDropdown label={t('label_species')} icon={Dog} value={report.species || ""} options={speciesOptions} onChange={val => setReport({ ...report, species: val })} disabled={!isEditing} />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800 uppercase tracking-widest block">{t('label_chip_number', { format: 'uppercase' })}</label>
                {isEditing ? <input type="number" className="w-full p-3.5 rounded-2xl border border-orange-100 text-sm font-bold outline-none bg-white shadow-sm" value={report.chipNumber || ""} onChange={e => setReport({ ...report, chipNumber: e.target.value })} /> : <div className="w-full p-3.5 rounded-2xl border border-orange-50 bg-orange-50/10 text-sm font-bold text-gray-700">{report.chipNumber || t('not_provided')}</div>}
              </div>

              <CustomDateTimePicker label={t('label_date_lost')} value={report.lostDate || report.createdAt} />
              {isEditing && <div className="flex justify-end pt-6"><button type="submit" disabled={saving} className="w-full sm:w-auto bg-orange-600 text-white font-black px-10 py-3.5 rounded-2xl hover:bg-orange-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('save_btn', { format: 'uppercase' })}</button></div>}
            </div>
          </form>

          {report.latitude && report.longitude && (
            <div className="mt-10 border-t border-orange-100 pt-8">
              <h3 className="text-[10px] font-black text-orange-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> {t('last_seen_map_title', { format: 'uppercase' })}</h3>
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-orange-200 shadow-sm relative z-0">
                <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[report.latitude, report.longitude]}><Popup>{t('last_seen_here_popup')}</Popup></Marker>
                  <RecenterMap lat={report.latitude} lng={report.longitude} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto w-full bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm mb-12">
          <h3 className="text-xs font-black text-orange-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {t('linked_found_reports_title', { format: 'uppercase' })}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {report.foundReports && report.foundReports.length > 0 ? (
              report.foundReports.map((fr) => (
                <div
                  key={fr.id}
                  onClick={() => setSelectedFoundReport(fr)}
                  className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 cursor-pointer hover:bg-orange-100/50 transition-all group flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-orange-900 truncate">{fr.title}</p>
                    <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(fr.foundDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <Info className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 italic font-medium">{t('no_linked_reports_yet')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedFoundReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedFoundReport(null)}>
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative border border-orange-100 animate-in zoom-in-95 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFoundReport(null)} className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-[210]"><X className="w-5 h-5 text-gray-600" /></button>
            <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-100 rounded-xl"><Dog className="w-5 h-5 text-orange-600" /></div>
                <div><h2 className="text-lg font-black text-orange-900 leading-tight">{selectedFoundReport.title}</h2><span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{t('found_report_preview', { format: 'uppercase' })}</span></div>
              </div>
              <div className="aspect-video w-full rounded-2xl bg-gray-50 border-4 border-white shadow-md overflow-hidden mb-6">
                {selectedFoundReport.imageUrl ? <img src={selectedFoundReport.imageUrl} className="w-full h-full object-cover" alt="Pet" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><ImageIcon className="w-10 h-10" /><p className="text-[9px] font-black uppercase mt-1">{t('no_photo', { format: 'uppercase' })}</p></div>}
              </div>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-50"><p className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-0.5">{t('label_condition', { format: 'uppercase' })}</p><p className="font-bold text-xs text-gray-700 capitalize">{selectedFoundReport.condition || t('unknown')}</p></div>
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-50"><p className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-0.5">{t('label_found_on', { format: 'uppercase' })}</p><p className="font-bold text-xs text-gray-700">{new Date(selectedFoundReport.foundDate).toLocaleDateString()}</p></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('label_description', { format: 'uppercase' })}</p><p className="text-xs text-gray-600 font-medium leading-relaxed">{selectedFoundReport.description || t('no_description_provided')}</p></div>
              </div>
              {selectedFoundReport.latitude && selectedFoundReport.longitude && (
                <div className="space-y-3"><div className="flex items-center gap-2 text-[9px] font-black text-orange-800 uppercase tracking-widest"><MapPin className="w-3.5 h-3.5" /> {t('label_found_location', { format: 'uppercase' })}</div>
                  <div className="h-40 w-full rounded-2xl overflow-hidden border border-orange-100 shadow-inner relative z-0">
                    <MapContainer center={[selectedFoundReport.latitude, selectedFoundReport.longitude]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedFoundReport.latitude, selectedFoundReport.longitude]} />
                      <RecenterMap lat={selectedFoundReport.latitude} lng={selectedFoundReport.longitude} />
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

export default LostReportDetails;