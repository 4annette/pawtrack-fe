import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Trash2, Loader2, Image as ImageIcon, Edit3, X,
  Camera, User, FileText, LogOut, Calendar, Hash, Dog, 
  CheckCircle, MapPin, Link as LinkIcon, AlertCircle, Clock, 
  ChevronLeft, ChevronRight, Check, ChevronDown, Info
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchFoundReportById, 
  updateFoundReport, 
  deleteFoundReport, 
  uploadFoundReportImage, 
  deleteFoundReportImage 
} from "@/services/api";
import PawTrackLogo from "@/components/PawTrackLogo";

const CustomDateTimePicker = ({ label, value }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
      <Calendar className="w-3 h-3" /> {label}
    </label>
    <div className="w-full p-3 rounded-xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed">
      <Clock className="w-3.5 h-3.5 text-emerald-300" />
      {value ? value.replace('T', ' ').substring(0, 16) : "Not set"}
    </div>
  </div>
);

const CustomDropdown = ({ label, icon: Icon, value, options, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value) || { label: "Not set", value: "" };

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
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-50 p-1 space-y-1">
          {options.map((option) => (
            <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`px-3 py-2 rounded-lg text-sm cursor-pointer font-bold ${option.value === value ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'}`}>{option.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const FoundReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [report, setReport] = useState(null);
  const [originalReport, setOriginalReport] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const hasFetched = useRef(false);

  const speciesOptions = [{ label: "Dog", value: "DOG" }, { label: "Cat", value: "CAT" }, { label: "Other", value: "OTHER" }];
  const conditionOptions = [{ label: "Excellent", value: "EXCELLENT" }, { label: "Good", value: "GOOD" }, { label: "Bad", value: "BAD" }];

  useEffect(() => {
    if (hasFetched.current) return;
    const getReport = async () => {
      try {
        const data = await fetchFoundReportById(id);
        setReport(data);
        setOriginalReport(data);
        hasFetched.current = true;
      } catch (err) {
        toast.error("Report not found");
        navigate("/my-reports");
      } finally { setLoading(false); }
    };
    getReport();
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFoundReport(id, { ...report, chipNumber: parseInt(report.chipNumber) || 0 });
      if (newImage) {
        const updatedData = await uploadFoundReportImage(id, newImage);
        setReport(prev => ({ ...prev, imageUrl: updatedData.imageUrl || updatedData }));
        setOriginalReport(prev => ({ ...prev, imageUrl: updatedData.imageUrl || updatedData }));
      }
      toast.success("Saved");
      setIsEditing(false);
      setNewImage(null);
    } catch (err) { toast.error("Error saving"); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setReport({ ...originalReport });
    setNewImage(null);
    setIsEditing(false);
  };

  const handleRemovePhoto = async () => {
    if(window.confirm("Permanently delete this photo?")) {
      try {
        await deleteFoundReportImage(id);
        const updated = { ...report, imageUrl: null };
        setReport(updated);
        setOriginalReport(updated);
        setNewImage(null);
        toast.success("Photo removed");
      } catch (err) { toast.error("Could not remove photo"); }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/my-reports")} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <PawTrackLogo size="sm" />
          </div>
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs active:scale-90 transition-transform">U</button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
                <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors"><User className="w-4 h-4 text-emerald-500" /> Profile</button>
                <button onClick={() => navigate('/my-reports')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors"><FileText className="w-4 h-4 text-orange-500" /> My Reports</button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors font-bold"><LogOut className="w-4 h-4" /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-[40px] shadow-xl border border-emerald-100 p-6 md:p-10 mb-8">
          <div className="flex justify-between items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tight">{isEditing ? "Edit Report" : "Report Details"}</h1>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="bg-white border border-emerald-200 text-emerald-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm active:scale-95"><Edit3 className="w-4 h-4" /> Edit</button>
                  <button onClick={async () => { if(window.confirm("Delete permanently?")) { await deleteFoundReport(id); navigate("/my-reports"); }}} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm active:scale-95 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              ) : (
                <button onClick={handleCancel} className="bg-white border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"><X className="w-4 h-4" /> Cancel</button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] block">Report Photo</label>
              <div className="relative aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                {newImage ? (
                   <img src={URL.createObjectURL(newImage)} className="w-full h-full object-cover" alt="New Preview" />
                ) : report.imageUrl ? (
                   <img src={report.imageUrl} className="w-full h-full object-cover" alt="Existing Preview" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="space-y-3">
                  <label className="w-full bg-white border border-emerald-200 py-3.5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-emerald-600 cursor-pointer hover:bg-emerald-50 shadow-sm transition-all">
                    <Camera className="w-4 h-4" /> {report.imageUrl ? 'CHANGE PHOTO' : 'ADD PHOTO'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} />
                  </label>
                  {report.imageUrl && (
                    <button type="button" onClick={handleRemovePhoto} className="w-full py-1 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Delete current photo</button>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Found?</span>
                <button type="button" disabled={!isEditing} onClick={() => setReport({...report, found: !report.found})} className={`w-12 h-6 rounded-full transition-colors relative ${report.found ? 'bg-emerald-500' : 'bg-gray-300'} ${!isEditing && 'opacity-60 cursor-not-allowed'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${report.found ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">Title</label>
                {isEditing ? (
                  <input type="text" className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm focus:ring-4 focus:ring-emerald-500/5 transition-all" value={report.title || ""} onChange={e => setReport({...report, title: e.target.value})} />
                ) : (
                  <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700">{report.title || "Untitled"}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">Description</label>
                {isEditing ? (
                  <textarea className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold h-24 resize-none outline-none bg-white shadow-sm" value={report.description || ""} onChange={e => setReport({...report, description: e.target.value})} />
                ) : (
                  <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700 min-h-[60px] whitespace-pre-wrap">{report.description || "No description provided."}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Location</label>
                <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/20 text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed">
                   <Info className="w-3.5 h-3.5 text-emerald-300" /> {report.location?.envelope || "No location data"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomDropdown label="Condition" icon={CheckCircle} value={report.condition || ""} options={conditionOptions} onChange={val => setReport({...report, condition: val})} disabled={!isEditing} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <CustomDropdown label="Species" icon={Dog} value={report.species || ""} options={speciesOptions} onChange={val => setReport({...report, species: val})} disabled={!isEditing} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5"><Hash className="w-3 h-3"/> Chip Number</label>
                  {isEditing ? (
                    <input type="number" className="w-full p-3.5 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm" value={report.chipNumber || ""} onChange={e => setReport({...report, chipNumber: e.target.value})} />
                  ) : (
                    <div className="w-full p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/10 text-sm font-bold text-gray-700">{report.chipNumber || "0"}</div>
                  )}
                </div>
              </div>

              <CustomDateTimePicker label="Date Found" value={report.foundDate || ""} />

              {isEditing && (
                <div className="flex justify-end pt-6">
                  <button type="submit" disabled={saving} className="bg-emerald-600 text-white font-black px-10 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-[0.2em]">
                    {saving ? "SAVING..." : "SAVE"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Linked Lost Report</h3>
                {report.lostReport ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer" onClick={() => navigate(`/lost-report-details/${report.lostReport.id}`)}>
                        <p className="font-bold text-sm text-emerald-900">{report.lostReport.title}</p>
                        <p className="text-xs text-emerald-600 mt-1 font-bold">{new Date(report.lostReport.lostDate).toLocaleDateString()}</p>
                    </div>
                ) : <p className="text-xs text-gray-400 italic font-bold">No linked lost report</p>}
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xs font-black text-orange-800 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Possible Matches</h3>
                <div className="space-y-3">
                    {report.possibleLostReports?.length > 0 ? report.possibleLostReports.map(plr => (
                        <div key={plr.id} className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/lost-report-details/${plr.id}`)}>
                            <div>
                                <p className="font-bold text-sm text-orange-900">{plr.title}</p>
                                <p className="text-[10px] text-orange-600 font-bold">{new Date(plr.lostDate).toLocaleDateString()}</p>
                            </div>
                            <LinkIcon className="w-4 h-4 text-orange-300"/>
                        </div>
                    )) : <p className="text-xs text-gray-400 italic font-bold">No possible matches found</p>}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default FoundReportDetails;