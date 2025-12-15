import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Dog, Hash, AlertTriangle, 
  Loader2, LogOut, CheckCircle, Upload, ImageIcon, X 
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
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {label}</label>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div onClick={() => fileInputRef.current.click()} className={`w-full p-4 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300 hover:bg-white bg-white/50'}`}>
          {selectedFile ? (
            <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-emerald-100 rounded-full ml-2"><X className="w-4 h-4 text-emerald-600"/></button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
                <div className="p-2 bg-emerald-100 rounded-full mb-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Click to upload photo</span>
                <span className="text-xs opacity-70">JPG, PNG supported</span>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Date Logic
      let formattedDate = formData.dateLost;
      if (!formattedDate) {
           const now = new Date();
           const year = now.getUTCFullYear();
           const month = String(now.getUTCMonth() + 1).padStart(2, '0');
           const day = String(now.getUTCDate()).padStart(2, '0');
           const hh = String(now.getUTCHours()).padStart(2, '0');
           const mm = String(now.getUTCMinutes()).padStart(2, '0');
           formattedDate = `${year}-${month}-${day} ${hh}:${mm}:00`;
      } else if (formattedDate.length === 10) { 
          formattedDate += " 00:00:00"; 
      }

      const payload = {
        ...formData,
        status: "ACTIVE", // Default to ACTIVE since user doesn't choose
        dateLost: formattedDate
      };

      // 2. Create Report
      const newReport = await createLostReport(payload);
      
      // 3. Upload Image
      if (imageFile && newReport.id) {
        try {
          await uploadLostReportImage(newReport.id, imageFile);
          toast.success("Report and image uploaded successfully!");
        } catch (imgError) {
          console.error("Image upload failed", imgError);
          toast.warning("Report created, but image upload failed.");
        }
      } else {
         toast.success("Lost report created successfully!");
      }

      navigate("/dashboard");

    } catch (error) {
      console.error("Creation failed", error);
      toast.error("Failed to create report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
             </button>
             <PawTrackLogo size="sm" />
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
             </button>
             <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">U</div>
          </div>
        </div>
      </header>

      {/* CONTENT - GREEN CARD FOR LOST REPORT */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-2xl shadow-xl border border-emerald-100 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-emerald-600" />
                Report a Lost Pet
            </h1>
            <p className="text-emerald-700 mb-8 opacity-80">
                Please provide as much detail as possible to help the community find your pet.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title & Description */}
              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-800 block">Report Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Lost Golden Retriever near Downtown" 
                    className="w-full p-3 rounded-xl border border-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white shadow-sm" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-800 block">Description</label>
                  <textarea 
                    required 
                    placeholder="Describe your pet's appearance, distinct markings, collar, etc." 
                    className="w-full p-3 rounded-xl border border-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none transition-all bg-white shadow-sm" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
              </div>

              {/* Grid 1: Species & Chip Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomDropdown 
                    label="Species" 
                    icon={Dog} 
                    value={formData.species} 
                    options={speciesOptions} 
                    onChange={val => setFormData({...formData, species: val})} 
                />
                
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Hash className="w-3 h-3"/> Chip Number
                    </label>
                    <input 
                        type="number" 
                        placeholder="Optional" 
                        className="w-full p-3 rounded-xl border border-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm" 
                        value={formData.chipNumber} 
                        onChange={e => setFormData({...formData, chipNumber: e.target.value})} 
                    />
                </div>
              </div>

              {/* Grid 2: Date & Time (Full width or part of grid) */}
              <div>
                <CustomDateTimePicker 
                    label="Date & Time Lost" 
                    value={formData.dateLost} 
                    onChange={val => setFormData({...formData, dateLost: val})} 
                />
              </div>

              {/* Simple File Input (No Camera) */}
              <SimpleFileInput 
                label="Add Pet Photo" 
                selectedFile={imageFile} 
                onChange={setImageFile} 
              />

              {/* Submit Button */}
              <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-transform active:scale-[0.99] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin"/>}
                    {loading ? "Creating..." : "Save Lost Report"}
                  </button>
              </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLostReport;