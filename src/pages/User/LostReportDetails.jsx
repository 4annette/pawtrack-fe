import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Trash2, Save, Camera, Upload, 
  Loader2, Image as ImageIcon, Calendar, MapPin,
  CheckCircle, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchLostReportById, updateLostReport, deleteLostReport, 
  uploadLostReportImage, deleteLostReportImage 
} from "@/services/api";
import PawTrackLogo from "@/components/PawTrackLogo";

const LostReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const getReport = async () => {
      try {
        const data = await fetchLostReportById(id);
        setReport(data);
      } catch (err) {
        toast.error("Report not found");
        navigate("/my-reports");
      } finally {
        setLoading(false);
      }
    };
    getReport();
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLostReport(id, report);

      if (newImage) {
        await uploadLostReportImage(id, newImage);
      }
      
      toast.success("Report updated successfully!");
      navigate("/my-reports");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm("Remove this photo?")) {
      try {
        await deleteLostReportImage(id);
        setReport({ ...report, imagePath: null });
        setNewImage(null);
        toast.success("Photo removed");
      } catch (err) {
        toast.error("Could not remove photo");
      }
    }
  };

  const handleDeleteReport = async () => {
    if (window.confirm("Delete this entire report permanently?")) {
      try {
        await deleteLostReport(id);
        toast.success("Report deleted");
        navigate("/my-reports");
      } catch (err) {
        toast.error("Failed to delete report");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Details</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/my-reports")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <PawTrackLogo size="sm" />
          </div>
          <button 
            onClick={handleDeleteReport}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            Delete Report
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-[40px] shadow-xl border border-orange-100 p-6 md:p-10">
          
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lost Report Details</h1>
            <p className="text-sm font-medium text-orange-600">Review and update your pet's information</p>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            <div className="space-y-6 text-center">
              <label className="text-xs font-black text-orange-800 uppercase tracking-widest block text-left">Report Photo</label>
              <div className="relative group mx-auto w-full aspect-square max-w-[280px] rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                {newImage || report.imagePath ? (
                  <img 
                    src={newImage ? URL.createObjectURL(newImage) : report.imagePath} 
                    className="w-full h-full object-cover" 
                    alt="Pet Preview" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-[10px] font-black uppercase">No Photo Provided</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="w-full bg-white border border-orange-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-orange-600 cursor-pointer hover:bg-orange-50 transition-all shadow-sm">
                  <Camera className="w-4 h-4" />
                  {report.imagePath ? "CHANGE PHOTO" : "ADD PHOTO"}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} />
                </label>
                
                {(report.imagePath || newImage) && (
                  <button 
                    type="button" 
                    onClick={handleRemoveImage}
                    className="w-full py-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                  >
                    Delete Photo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-orange-800 uppercase tracking-widest">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 rounded-2xl border border-orange-100 text-sm font-semibold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  value={report.title}
                  onChange={(e) => setReport({...report, title: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-orange-800 uppercase tracking-widest">Description</label>
                <textarea 
                  required
                  className="w-full p-4 rounded-2xl border border-orange-100 text-sm font-semibold h-32 resize-none focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  value={report.description}
                  onChange={(e) => setReport({...report, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Status</p>
                    <p className="text-xs font-bold text-orange-600 uppercase">{report.status || 'ACTIVE'}</p>
                 </div>
                 <div className="p-4 bg-white rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Species</p>
                    <p className="text-xs font-bold text-gray-700 uppercase">{report.species || 'DOG'}</p>
                 </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95 flex items-center justify-center gap-3 tracking-widest text-xs"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "SAVING..." : "SAVE ALL CHANGES"}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default LostReportDetails;