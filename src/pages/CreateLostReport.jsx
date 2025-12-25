import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Dog, Hash, AlertTriangle, 
  Loader2, LogOut, CheckCircle, Upload, ImageIcon, X,
  User, FileText
} from "lucide-react";
import { toast } from "sonner";
import PawTrackLogo from "@/components/PawTrackLogo";
import { createLostReport, uploadLostReportImage } from "@/services/api";
import { 
  CustomDateTimePicker, 
  CustomDropdown 
} from "@/components/DashboardComponents";

// --- LOCAL COMPONENT: SIMPLE FILE UPLOAD (No Camera) ---
const SimpleFileInput = ({ label, onChange, selectedFile }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) onChange(file);
    };
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" /> {label}
        </label>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div onClick={() => fileInputRef.current.click()} className={`w-full p-6 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300 hover:bg-white bg-white/50 shadow-sm'}`}>
          {selectedFile ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-emerald-100 rounded-full ml-2"><X className="w-4 h-4 text-emerald-600"/></button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
                <div className="p-3 bg-emerald-100 rounded-full mb-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Click to upload photo</span>
                <span className="text-[10px] opacity-70 mt-1">JPG, PNG supported</span>
            </div>
          )}
        </div>
      </div>
    );
};

const CreateLostReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  
  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    species: "DOG",
    dateLost: "",
    chipNumber: "",
  });

  const speciesOptions = [{ label: "Dog", value: "DOG" }, { label: "Cat", value: "CAT" }, { label: "Other", value: "OTHER" }];

  const handleLogout = () => { 
    localStorage.removeItem("token"); 
    navigate("/auth"); 
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let formattedDate = formData.dateLost;
      if (!formattedDate) {
           const now = new Date();
           const year = now.getUTCFullYear();
           const month = String(now.getUTCMonth() + 1).padStart(2, '0');
           const day = String(now.getUTCDate()).padStart(2, '0');
           const hh = String(now.getUTCHours()).padStart(2, '0');
           const mm = String(now.getUTCMinutes()).padStart(2, '0');
           formattedDate = `${year}-${month}-${day} ${hh}:${mm}:00`;
      }

      const payload = {
        ...formData,
        status: "ACTIVE",
        dateLost: formattedDate
      };

      const newReport = await createLostReport(payload);
      
      if (imageFile && newReport.id) {
        try {
          await uploadLostReportImage(newReport.id, imageFile);
          toast.success("Report and image uploaded successfully!");
        } catch (imgError) {
          toast.warning("Report created, but image upload failed.");
        }
      } else {
          toast.success("Lost report created successfully!");
      }

      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to create report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
             </button>
             <PawTrackLogo size="sm" />
          </div>

          <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs active:scale-90 transition-transform"
              >
                U
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
                  <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors font-bold">
                      <User className="w-4 h-4 text-emerald-500" /> Edit Profile
                  </button>
                  <button onClick={() => navigate('/my-reports')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors font-bold">
                      <FileText className="w-4 h-4 text-orange-500" /> My Reports
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors font-bold">
                      <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-[32px] shadow-xl border border-emerald-100 p-6 md:p-8">
            <h1 className="text-2xl font-black text-emerald-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-emerald-600" />
                Report a Lost Pet
            </h1>
            <p className="text-emerald-700 mb-8 font-medium opacity-80">
                Please provide as much detail as possible to help the community find your pet.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Report Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Lost Golden Retriever near Downtown" 
                    className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Description</label>
                  <textarea 
                    required 
                    placeholder="Describe markings, collar, etc." 
                    className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold h-32 resize-none outline-none bg-white shadow-sm transition-all" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomDropdown 
                    label="Species" 
                    icon={Dog} 
                    value={formData.species} 
                    options={speciesOptions} 
                    onChange={val => setFormData({...formData, species: val})} 
                />
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Hash className="w-3 h-3"/> Chip Number
                    </label>
                    <input 
                        type="number" 
                        placeholder="Optional" 
                        className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm" 
                        value={formData.chipNumber} 
                        onChange={e => setFormData({...formData, chipNumber: e.target.value})} 
                    />
                </div>
              </div>

              <CustomDateTimePicker 
                  label="Date & Time Lost" 
                  value={formData.dateLost} 
                  onChange={val => setFormData({...formData, dateLost: val})} 
              />

              <SimpleFileInput 
                label="Add Pet Photo" 
                selectedFile={imageFile} 
                onChange={setImageFile} 
              />

              <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Save Lost Report"}
                  </button>
              </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLostReport;