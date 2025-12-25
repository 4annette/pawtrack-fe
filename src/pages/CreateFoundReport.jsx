import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Dog, Cat, CheckCircle, Calendar, Hash, 
  ChevronDown, Check, ChevronLeft, ChevronRight, Clock, 
  Upload, Camera, Image as ImageIcon, Loader2, LogOut, User, FileText
} from "lucide-react";
import { toast } from "sonner";
import PawTrackLogo from "@/components/PawTrackLogo";
import { createFoundReport, uploadFoundReportImage } from "@/services/api";

// --- REUSED COMPONENT: CUSTOM DATE TIME PICKER ---
const CustomDateTimePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
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
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
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

  const handleTimeChange = (type, val) => {
      if (type === 'hour') {
          setSelectedHour(val);
          updateValue(selectedDateStr, val, selectedMinute);
      } else {
          setSelectedMinute(val);
          updateValue(selectedDateStr, selectedHour, val);
      }
  };

  const renderCalendarDays = () => {
    const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    for (let d = 1; d <= totalDays; d++) {
        const currentYear = viewDate.getFullYear();
        const currentMonth = String(viewDate.getMonth() + 1).padStart(2, '0');
        const currentDay = String(d).padStart(2, '0');
        const thisDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
        const isSelected = selectedDateStr === thisDateStr;
        days.push(
            <button key={d} onClick={() => handleDateClick(d)} type="button" className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-700 hover:bg-emerald-100'}`}>{d}</button>
        );
    }
    return days;
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Calendar className="w-3 h-3" /> {label}</label>
        <div onClick={() => setIsOpen(!isOpen)} className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm`}>
            <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || 'Select date & time'}</span>
            <div className="flex gap-1"><Clock className="w-4 h-4 text-emerald-300" /><Calendar className="w-4 h-4 text-emerald-500" /></div>
        </div>
        {isOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-emerald-100 p-4 w-64 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronRight className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-7 mb-2 text-center">{['S','M','T','W','T','F','S'].map((d,i) => (<span key={i} className="text-xs font-bold text-emerald-400">{d}</span>))}</div>
                <div className="grid grid-cols-7 gap-1 place-items-center mb-4 border-b border-gray-100 pb-4">{renderCalendarDays()}</div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div className="flex-1 flex gap-1">
                        <select value={selectedHour} onChange={(e) => handleTimeChange('hour', e.target.value)} className="w-full p-1 text-sm border border-emerald-100 rounded text-gray-700 focus:outline-none focus:border-emerald-500 bg-emerald-50/50">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                        <span className="text-gray-400">:</span>
                        <select value={selectedMinute} onChange={(e) => handleTimeChange('minute', e.target.value)} className="w-full p-1 text-sm border border-emerald-100 rounded text-gray-700 focus:outline-none focus:border-emerald-500 bg-emerald-50/50">{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="bg-emerald-600 text-white text-xs px-2 py-1.5 rounded hover:bg-emerald-700">OK</button>
                </div>
            </div>
        )}
    </div>
  );
};

// --- REUSED COMPONENT: CUSTOM DROPDOWN ---
const CustomDropdown = ({ label, icon: Icon, value, options, onChange }) => {
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
      <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm text-sm text-gray-700`}>
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                  <span className="font-medium">{option.label}</span>
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

// --- UPGRADED COMPONENT: CUSTOM IMAGE INPUT (Upload OR Camera) ---
const CustomImageInput = ({ label, onChange, selectedFile }) => {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) onChange(file);
    };

    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {label}</label>
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

        <div className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-white'}`}>
          {selectedFile ? (
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 overflow-hidden">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                </div>
                <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline ml-2">Remove</button>
            </div>
          ) : (
            <div className="w-full flex gap-3 justify-center">
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-emerald-200 transition-all group">
                    <div className="p-2 bg-emerald-100 rounded-full mb-2 group-hover:bg-emerald-200 transition-colors">
                        <Upload className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-emerald-700">Upload Photo</span>
                </button>
                <div className="w-px bg-gray-200 my-2"></div>
                <button type="button" onClick={() => cameraInputRef.current.click()} className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-emerald-200 transition-all group">
                    <div className="p-2 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                        <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700">Take Photo</span>
                </button>
            </div>
          )}
        </div>
      </div>
    );
};

// --- PAGE: CREATE FOUND REPORT ---
const CreateFoundReport = () => {
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
    condition: "GOOD",
    dateFound: "", 
    chipNumber: "",
  });

  const speciesOptions = [{ label: "Dog", value: "DOG" }, { label: "Cat", value: "CAT" }, { label: "Other", value: "OTHER" }];
  const conditionOptions = [{ label: "Excellent", value: "EXCELLENT" }, { label: "Good", value: "GOOD" }, { label: "Injured", value: "INJURED" }];

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
        let formattedDate = formData.dateFound;
        if (!formattedDate) {
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const hh = String(now.getUTCHours()).padStart(2, '0');
            const mm = String(now.getUTCMinutes()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day} ${hh}:${mm}:00`;
        }

        const newReport = await createFoundReport({ ...formData, dateFound: formattedDate });

        if (imageFile && newReport?.id) {
            try {
                await uploadFoundReportImage(newReport.id, imageFile);
                toast.success("Report and image uploaded successfully!");
            } catch (err) {
                toast.warning("Report created, but image upload failed.");
            }
        } else {
            toast.success("Found report created successfully!");
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
      {/* STYLISH HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
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
            <h1 className="text-2xl font-black text-emerald-900 mb-2">Details about the pet</h1>
            <p className="text-emerald-700 mb-8 font-medium">Please provide as much detail as possible to help the owner identify their pet.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Report Title</label>
                    <input type="text" required placeholder="e.g. Golden Retriever found near Park" className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm focus:ring-4 focus:ring-emerald-500/5 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Description</label>
                    <textarea required placeholder="Describe the pet's appearance, behavior..." className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold h-32 resize-none outline-none bg-white shadow-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomDropdown label="Species" icon={Dog} value={formData.species} options={speciesOptions} onChange={val => setFormData({...formData, species: val})} />
                    <CustomDropdown label="Condition" icon={CheckCircle} value={formData.condition} options={conditionOptions} onChange={val => setFormData({...formData, condition: val})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomDateTimePicker label="Date & Time Found" value={formData.dateFound} onChange={val => setFormData({...formData, dateFound: val})} />
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5"><Hash className="w-3 h-3"/> Chip Number</label>
                        <input type="number" placeholder="Optional" className="w-full p-4 rounded-2xl border border-emerald-100 text-sm font-bold outline-none bg-white shadow-sm" value={formData.chipNumber} onChange={e => setFormData({...formData, chipNumber: e.target.value})} />
                    </div>
                </div>

                <CustomImageInput label="Add Photo" selectedFile={imageFile} onChange={setImageFile} />

                <div className="pt-4">
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em]">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Create Report"}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFoundReport;