import React, { useState, useEffect } from "react";
import { X, Phone, Calendar, FileText, AlertCircle, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchFoundReportById, disconnectFoundReports } from "@/services/api";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const FoundMatchModal = ({ notification, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [myFoundReport, setMyFoundReport] = useState(null);
  const [theirFoundReport, setTheirFoundReport] = useState(null);

  useEffect(() => {
    if (!notification) return;

    const fetchData = async () => {
      if (!notification.foundReportId || !notification.connectedFoundReportId) {
        toast.error("Report details missing.");
        onClose();
        return;
      }

      try {
        const [myData, theirData] = await Promise.all([
          fetchFoundReportById(notification.foundReportId),
          fetchFoundReportById(notification.connectedFoundReportId)
        ]);

        if (!myData || !theirData) {
          toast.info("One of the reports is no longer available.");
          onClose();
          return;
        }

        const isConnected = myData.connectedFoundReports && 
                            myData.connectedFoundReports.some(r => r.id === theirData.id);

        if (!isConnected) {
          toast.info("These reports are no longer connected.");
          onClose();
          return;
        }

        setMyFoundReport(myData);
        setTheirFoundReport(theirData);
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Could not load report details.");
        onClose();
      }
    };
    fetchData();
  }, [notification, onClose]);

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure? This will disconnect the sighting match.")) {
      try {
        await disconnectFoundReports(notification.foundReportId, notification.connectedFoundReportId);
        toast.info("Match disconnected.");
        onClose();
      } catch (error) {
        console.error(error);
        toast.error("Failed to disconnect.");
      }
    }
  };

  if (!notification || loading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/20 backdrop-blur-md p-4 animate-in fade-in duration-200"
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
              <h2 className="font-black text-lg tracking-tight leading-none">Sighting Match</h2>
              <p className="text-xs text-emerald-100 font-medium mt-1 opacity-90">Possible duplicate or connected sighting</p>
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
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Connected By</p>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-emerald-900 truncate">
                  {notification.fromUserName || "Unknown User"}
                </span>
                <span className="text-base font-black text-emerald-600 bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">
                  {notification.fromUserPhone || "No phone"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Their Found Report</span>
            </div>

            <div className="bg-white border border-emerald-100/80 rounded-[24px] p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                  {theirFoundReport?.imageUrl ? (
                    <img src={theirFoundReport.imageUrl} className="w-full h-full object-cover" alt="Their Found" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-8 h-8" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 truncate text-lg leading-tight mb-2">{theirFoundReport?.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{theirFoundReport?.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                      <Calendar className="w-3 h-3" />
                      {theirFoundReport?.foundDate ? new Date(theirFoundReport.foundDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {theirFoundReport?.latitude && theirFoundReport?.longitude && (
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-emerald-100/50 relative z-0">
                  <MapContainer
                    center={[theirFoundReport.latitude, theirFoundReport.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[theirFoundReport.latitude, theirFoundReport.longitude]}>
                      <Popup>Their Sighting</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Your Found Report</span>
            </div>

            <div className="bg-white border border-blue-100/80 rounded-[24px] p-4 shadow-sm opacity-90 hover:opacity-100 transition-opacity">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                  {myFoundReport?.imageUrl ? (
                    <img src={myFoundReport.imageUrl} className="w-full h-full object-cover" alt="My Found" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-6 h-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{myFoundReport?.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-lg border border-blue-100">
                    <Calendar className="w-3 h-3" /> Found: {myFoundReport?.foundDate ? new Date(myFoundReport.foundDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {myFoundReport?.latitude && myFoundReport?.longitude && (
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-blue-100/50 relative z-0">
                  <MapContainer
                    center={[myFoundReport.latitude, myFoundReport.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[myFoundReport.latitude, myFoundReport.longitude]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-gray-100 bg-white shrink-0">
          <button 
            onClick={handleDisconnect} 
            className="w-full py-4 rounded-2xl bg-white border-2 border-red-50 text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
             <Link2Off className="w-4 h-4" /> Not the same pet
          </button>
        </div>

      </div>
    </div>
  );
};

export default FoundMatchModal;