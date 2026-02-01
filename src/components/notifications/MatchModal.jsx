import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Phone, Calendar, FileText, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchFoundReportById, fetchLostReportById, removeFoundReportFromLostReport, confirmLostReportMatch } from "@/services/api";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MatchModal = ({ notification, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [foundReport, setFoundReport] = useState(null);
  const [lostReport, setLostReport] = useState(null);

  useEffect(() => {
    if (!notification) return;

    const fetchData = async () => {
      if (!notification.foundReportId || !notification.lostReportId) {
        toast.error("This report is no longer available.");
        onClose();
        return;
      }

      try {
        const [foundData, lostData] = await Promise.all([
          fetchFoundReportById(notification.foundReportId),
          fetchLostReportById(notification.lostReportId)
        ]);

        if (!foundData || !lostData || !foundData.lostReport) {
          toast.info("This match is no longer available or disconnected.");
          onClose();
          return;
        }

        setFoundReport(foundData);
        setLostReport(lostData);
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Could not load report details.");
        onClose();
      }
    };
    fetchData();
  }, [notification]);

  if (!notification || loading) return null;

  const handleConfirm = async () => {
    try {
      await confirmLostReportMatch(notification.lostReportId);
      toast.success("Great! We're glad you found your pet.");
      onClose();
    } catch (error) {
      console.error("Error confirming match:", error);
      toast.error("Something went wrong while confirming the match.");
    }
  };

  const handleReject = async () => {
    try {
      await removeFoundReportFromLostReport(notification.lostReportId, notification.foundReportId);
      toast.info("Report disconnected from your lost report.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect report.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-emerald-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl shadow-emerald-900/20 overflow-hidden max-h-[90vh] flex flex-col border border-white/50 ring-4 ring-emerald-50/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/30 rounded-xl backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight leading-none">Potential Match</h2>
              <p className="text-xs text-emerald-100 font-medium mt-1 opacity-90">Is this your missing pet?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-3xl p-5 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-200">
              <Phone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Contact Finder</p>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-emerald-900 truncate">
                  {notification.fromUserName}
                </span>
                <span className="text-base font-black text-emerald-600 bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">
                  {notification.fromUserPhone || foundReport?.creator?.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">The Found Pet</span>
            </div>

            <div className="bg-white border border-emerald-100/80 rounded-[24px] p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                  {foundReport?.imageUrl ? (
                    <img src={foundReport.imageUrl} className="w-full h-full object-cover" alt="Found" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-8 h-8" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 truncate text-lg leading-tight mb-2">{foundReport?.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{foundReport?.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                      <Calendar className="w-3 h-3" />
                      {foundReport?.foundDate ? new Date(foundReport.foundDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {foundReport?.latitude && foundReport?.longitude && (
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-emerald-100/50 relative z-0">
                  <MapContainer
                    center={[foundReport.latitude, foundReport.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[foundReport.latitude, foundReport.longitude]}>
                      <Popup>Found Here</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Lost Report</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm opacity-90 hover:opacity-100 transition-opacity">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                  {lostReport?.imageUrl ? (
                    <img src={lostReport.imageUrl} className="w-full h-full object-cover" alt="Lost" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-6 h-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{lostReport?.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 w-fit px-2.5 py-1 rounded-lg border border-orange-100">
                    <Calendar className="w-3 h-3" /> Lost: {lostReport?.lostDate ? new Date(lostReport.lostDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {lostReport?.latitude && lostReport?.longitude && (
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-gray-200/50 relative z-0 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                  <MapContainer
                    center={[lostReport.latitude, lostReport.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lostReport.latitude, lostReport.longitude]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-white flex gap-4 shrink-0">
          <button onClick={handleReject} className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95">
            No, not mine
          </button>
          <button onClick={handleConfirm} className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Yes, It's My Pet!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MatchModal;