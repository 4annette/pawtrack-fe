import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Dog, Hash, AlertTriangle, 
  Loader2, LogOut, CheckCircle, Upload, ImageIcon, X,
  User, FileText, Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, Check
} from "lucide-react";
import { toast } from "sonner";
import PawTrackLogo from "@/components/PawTrackLogo";
import { createLostReport, uploadLostReportImage } from "@/services/api";

// --- REUSED COMPONENT: CUSTOM DATE TIME PICKER (WITH STYLED TIME DROPDOWNS) ---
const CustomDateTimePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  
  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isMinOpen, setIsMinOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
        const parts = value.split(" ");
        if (parts.length >= 2) {
            setSelectedDateStr(parts[0]);
            const timeParts = parts[1].split(":");
            if (timeParts.length >= 2) {
                setSelectedHour(timeParts[0]);
                setSelectedMinute(timeParts[1]);
            }
            const dateObj = new Date(parts[0]);
            if (!isNaN(dateObj.getTime())) setViewDate(dateObj);
        }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
          setIsHourOpen(false);
          setIsMinOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeMonth = (inc) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + inc, 1));

  const updateValue = (dateStr, hh, mm) => {
      if (!dateStr) return;
      const finalValue = `${dateStr} ${hh}:${mm}:00`;
      onChange(finalValue);
  };

  const handleDateClick = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const newDateStr = `${year}-${month}-${dayStr}`;
    setSelectedDateStr(newDateStr);
    updateValue(newDateStr, selectedHour, selectedMinute);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {label}</label>
        <div onClick={() => setIsOpen(!isOpen)} className={`w-full p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm`}>
            <span className={`text-sm font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || 'Select date & time'}</span>
            <div className="flex gap-1"><Clock className="w-4 h-4 text-emerald-300" /><Calendar className="w-4 h-4 text-emerald-500" /></div>
        </div>

        {isOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 w-72 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronRight className="w-4 h-4"/></button>
                </div>

                <div className="grid grid-cols-7 mb-2 text-center">
                    {['S','M','T','W','T','F','S'].map((d,i) => (<span key={i} className="text-[10px] font-bold text-emerald-300">{d}</span>))}
                </div>

                <div className="grid grid-cols-7 gap-1 place-items-center mb-4 border-b border-gray-100 pb-4">
                    {(() => {
                        const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                        const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                        const days = [];
                        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
                        for (let d = 1; d <= totalDays; d++) {
                            const thisDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSelected = selectedDateStr === thisDateStr;
                            days.push(
                                <button key={d} onClick={() => handleDateClick(d)} type="button" className={`h-8 w-8 rounded-full text-xs font-black flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-700 hover:bg-emerald-100'}`}>{d}</button>
                            );
                        }
                        return days;
                    })()}
                </div>

                <div className="flex items-center gap-2 relative">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 flex gap-1 items-center">
                        <div className="relative flex-1">
                            <button type="button" onClick={() => {setIsHourOpen(!isHourOpen); setIsMinOpen(false);}} className="w-full p-2 text-sm font-black bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 flex justify-between items-center">
                                {selectedHour} <ChevronDown className="w-3 h-3 text-emerald-400"/>
                            </button>
                            {isHourOpen && (
                                <div className="absolute bottom-full mb-1 left-0 w-full max-h-40 overflow-y-auto bg-white border border-emerald-100 rounded-xl shadow-xl z-[60]">
                                    {hours.map(h => (
                                        <div key={h} onClick={() => {setSelectedHour(h); updateValue(selectedDateStr, h, selectedMinute); setIsHourOpen(false);}} className={`p-2 text-center text-xs font-bold cursor-pointer hover:bg-emerald-50 ${selectedHour === h ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>{h}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-emerald-300 font-bold">:</span>
                        <div className="relative flex-1">
                            <button type="button" onClick={() => {setIsMinOpen(!isMinOpen); setIsHourOpen(false);}} className="w-full p-2 text-sm font-black bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 flex justify-between items-center">
                                {selectedMinute} <ChevronDown className="w-3 h-3 text-emerald-400"/>
                            </button>
                            {isMinOpen && (
                                <div className="absolute bottom-full mb-1 left-0 w-full max-h-40 overflow-y-auto bg-white border border-emerald-100 rounded-xl shadow-xl z-[60]">
                                    {minutes.map(m => (
                                        <div key={m} onClick={() => {setSelectedMinute(m); updateValue(selectedDateStr, selectedHour, m); setIsMinOpen(false);}} className={`p-2 text-center text-xs font-bold cursor-pointer hover:bg-emerald-50 ${selectedMinute === m ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>{m}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="bg-emerald-600 text-white text-[10px] font-black px-3 py-2 rounded-lg hover:bg-emerald-700 uppercase tracking-tighter">OK</button>
                </div>
            </div>
        )}
    </div>
  );
};

// --- REUSED COMPONENT: CUSTOM DROPDOWN ---
const StyledDropdown = ({ label, icon: Icon, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm text-sm font-bold text-gray-700`}>
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-bold'}`}>
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- LOCAL COMPONENT: SIMPLE FILE UPLOAD ---
const SimpleFileInput = ({ label, onChange, selectedFile }) => {
    const fileInputRef = useRef(null);
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" /> {label}
        </label>
        <input type="file" ref={fileInputRef} onChange={(e) => {const f = e.target.files[0]; if(f) onChange(f);}} accept="image/*" className="hidden" />
        <div onClick={() => fileInputRef.current.click()} className={`w-full p-6 rounded-[24px] border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-emerald-100 hover:border-emerald-300 bg-white shadow-sm'}`}>
          {selectedFile ? (
            <div className="flex items-center gap-3 text-emerald-700 font-black text-sm">
                <CheckCircle className="w-5 h-5" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-2 hover:bg-red-50 rounded-full ml-2 transition-colors"><X className="w-4 h-4 text-red-500"/></button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
                <div className="p-3 bg-emerald-100 rounded-full mb-3">
                    <Upload className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Click to upload photo</span>
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "", description: "", species: "DOG", dateLost: "", chipNumber: "",
  });

  const speciesOptions = [{ label: "Dog", value: "DOG" }, { label: "Cat", value: "CAT" }, { label: "Other", value: "OTHER" }];

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/auth"); };

  useEffect(() => {
    const handleClickOutside = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false); };
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
           formattedDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:00`;
      }
      const newReport = await createLostReport({ ...formData, status: "LESS_THAN_3_HOURS", dateLost: formattedDate });
      if (imageFile && newReport.id) {
        try { await uploadLostReportImage(newReport.id, imageFile); toast.success("Success!"); } 
        catch { toast.warning("Image failed, but report created."); }
      } else { toast.success("Lost report created!"); }
      navigate("/dashboard");
    } catch { toast.error("Failed to create report."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
             <PawTrackLogo size="sm" />
          </div>
          <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs active:scale-90 transition-transform">U</button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
                  <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors"><User className="w-4 h-4 text-emerald-500" /> Edit Profile</button>
                  <button onClick={() => navigate('/my-reports')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors"><FileText className="w-4 h-4 text-orange-500" /> My Reports</button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors font-bold"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              )}
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-emerald-900/5 border border-emerald-100/50 p-6 md:p-10">
            <h1 className="text-3xl font-black text-emerald-900 mb-2 flex items-center gap-3 tracking-tight">
                <AlertTriangle className="w-8 h-8 text-emerald-600" /> Report Lost Pet
            </h1>
            <p className="text-emerald-700 mb-10 font-bold text-sm">Help the community identify your pet.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Report Title</label>
                  <input type="text" required placeholder="e.g. Lost Golden Retriever near Downtown" className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Description</label>
                  <textarea required placeholder="Describe markings, collar, etc." className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold h-32 resize-none outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StyledDropdown label="Species" icon={Dog} value={formData.species} options={speciesOptions} onChange={val => setFormData({...formData, species: val})} />
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5"><Hash className="w-3 h-3"/> Chip Number</label>
                    <input type="number" placeholder="Optional" className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all" value={formData.chipNumber} onChange={e => setFormData({...formData, chipNumber: e.target.value})} />
                </div>
              </div>

              <CustomDateTimePicker label="Date & Time Lost" value={formData.dateLost} onChange={val => setFormData({...formData, dateLost: val})} />

              <SimpleFileInput label="Pet Photo" selectedFile={imageFile} onChange={setImageFile} />

              <div className="pt-6">
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em]">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : "Save Lost Report"}
                  </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLostReport;