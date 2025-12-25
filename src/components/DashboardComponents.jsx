import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, ChevronDown, Check, 
  ImageIcon, Upload, CheckCircle, X, Dog, AlertCircle, Hash, MapPin, 
  Loader2, Link as LinkIcon, Camera, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { 
    fetchMyLostReports, 
    fetchMyFoundReports, 
    linkFoundToLostReport, 
    createFoundReport, 
    connectFoundReports, 
    uploadFoundReportImage 
} from "@/services/api";

// --- HELPER: CUSTOM DATE TIME PICKER (WITH STYLED TIME DROPDOWNS) ---
export const CustomDateTimePicker = ({ label, value, onChange }) => {
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
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 flex gap-1 relative">
                        <div className="relative flex-1">
                            <button type="button" onClick={() => {setIsHourOpen(!isHourOpen); setIsMinOpen(false);}} className="w-full p-2 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 flex justify-between items-center">
                                {selectedHour} <ChevronDown className="w-3 h-3 text-emerald-400"/>
                            </button>
                            {isHourOpen && (
                                <div className="absolute bottom-full mb-1 left-0 w-full max-h-32 overflow-y-auto bg-white border border-emerald-100 rounded-lg shadow-xl z-50">
                                    {hours.map(h => (
                                        <div key={h} onClick={() => {setSelectedHour(h); updateValue(selectedDateStr, h, selectedMinute); setIsHourOpen(false);}} className={`p-2 text-center text-xs font-bold cursor-pointer hover:bg-emerald-50 ${selectedHour === h ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>{h}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-gray-400 font-bold">:</span>
                        <div className="relative flex-1">
                            <button type="button" onClick={() => {setIsMinOpen(!isMinOpen); setIsHourOpen(false);}} className="w-full p-2 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 flex justify-between items-center">
                                {selectedMinute} <ChevronDown className="w-3 h-3 text-emerald-400"/>
                            </button>
                            {isMinOpen && (
                                <div className="absolute bottom-full mb-1 left-0 w-full max-h-32 overflow-y-auto bg-white border border-emerald-100 rounded-lg shadow-xl z-50">
                                    {minutes.map(m => (
                                        <div key={m} onClick={() => {setSelectedMinute(m); updateValue(selectedDateStr, selectedHour, m); setIsMinOpen(false);}} className={`p-2 text-center text-xs font-bold cursor-pointer hover:bg-emerald-50 ${selectedMinute === m ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>{m}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="bg-emerald-600 text-white text-[10px] font-black px-3 py-2 rounded-lg hover:bg-emerald-700 uppercase">OK</button>
                </div>
            </div>
        )}
    </div>
  );
};

// --- HELPER: CUSTOM DATE PICKER (For Filters) ---
export const CustomDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) setViewDate(date);
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

  const handleDateClick = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
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
        const isSelected = value === `${currentYear}-${currentMonth}-${currentDay}`;
        days.push(
            <button key={d} onClick={() => handleDateClick(d)} type="button" className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-700 hover:bg-emerald-100'}`}>{d}</button>
        );
    }
    return days;
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Calendar className="w-3 h-3" /> {label}</label>
        <div onClick={() => setIsOpen(!isOpen)} className={`w-full p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-100 hover:border-emerald-300'} bg-white shadow-sm`}>
            <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value ? value : 'Select date'}</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
        </div>
        {isOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-emerald-100 p-4 w-64 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="text-sm font-bold text-gray-800">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600"><ChevronRight className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-7 mb-2 text-center">{['S','M','T','W','T','F','S'].map((d,i) => (<span key={i} className="text-xs font-bold text-emerald-400">{d}</span>))}</div>
                <div className="grid grid-cols-7 gap-1 place-items-center">{renderCalendarDays()}</div>
            </div>
        )}
    </div>
  );
};

// --- HELPER: CUSTOM DROPDOWN ---
export const CustomDropdown = ({ label, icon: Icon, value, options, onChange }) => {
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

// --- HELPER: IMAGE INPUT (With Camera) ---
export const CustomImageInput = ({ label, onChange, selectedFile }) => {
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
                    <div className="p-2 bg-emerald-100 rounded-full mb-2 group-hover:bg-emerald-200 transition-colors"><Upload className="w-5 h-5 text-emerald-600" /></div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-emerald-700">Upload Photo</span>
                </button>
                <div className="w-px bg-gray-200 my-2"></div>
                <button type="button" onClick={() => cameraInputRef.current.click()} className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-emerald-200 transition-all group">
                    <div className="p-2 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors"><Camera className="w-5 h-5 text-blue-600" /></div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700">Take Photo</span>
                </button>
            </div>
          )}
        </div>
      </div>
    );
};

// --- HELPER: FILE INPUT (Simple) ---
export const CustomFileInput = ({ label, onChange, selectedFile }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) onChange(file);
    };
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {label}</label>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div onClick={() => fileInputRef.current.click()} className={`w-full p-4 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300 hover:bg-gray-50'}`}>
          {selectedFile ? (
            <div className="flex items-center gap-2 text-emerald-700"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span></div>
          ) : (
            <div className="flex flex-col items-center text-gray-400"><Upload className="w-6 h-6 mb-2" /><span className="text-sm font-medium">Click to upload a photo</span><span className="text-xs opacity-70">JPG, PNG supported</span></div>
          )}
        </div>
      </div>
    );
};

// --- MODAL: REPORT DETAILS ---
export const ReportDetailsModal = ({ isOpen, onClose, report, onViewMap }) => {
  if (!isOpen || !report) return null;
  const isLostReport = !!report.lostDate;
  const dateLabel = isLostReport ? "Date Lost" : "Date Found";
  const dateValue = isLostReport ? report.lostDate : report.foundDate;
  const statusValue = isLostReport ? report.status : report.condition;
  const getConditionColor = (c) => {
    if (!c) return 'bg-gray-100 text-gray-800 border-gray-200';
    const n = String(c).toUpperCase().trim();
    if (n === 'EXCELLENT') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (n === 'GOOD') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (n === 'BAD' || n === 'INJURED') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-64 sm:h-80 bg-gray-100 shrink-0">
            {report.imageUrl ? <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50"><Dog className="w-16 h-16 opacity-30 mb-2" /><span className="text-sm font-medium">No Image</span></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black hover:bg-gray-800 rounded-full text-white shadow-lg"><X className="w-5 h-5" /></button>
            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <div className="flex items-center gap-2 mb-2">
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getConditionColor(statusValue)} bg-white/90`}>{report.species}</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight">{report.title}</h2>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{report.description || "No description."}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 block mb-1">{dateLabel}</span>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm"><Calendar className="w-4 h-4 text-emerald-500" /> {new Date(dateValue).toLocaleDateString()}</div>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 block mb-1">Chip Number</span>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm"><Hash className="w-4 h-4 text-emerald-500" /> {report.chipNumber || "Not Scanned"}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- MODAL: CLAIM ---
export const ClaimModal = ({ isOpen, onClose, foundReportId }) => {
  const [myLostReports, setMyLostReports] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const load = async () => { try { const d = await fetchMyLostReports(); setMyLostReports(d.content || []); } catch { toast.error("Error loading reports"); } };
      load();
    }
  }, [isOpen]);
  const handleClaim = async (lid) => {
    setLoading(true); try { await linkFoundToLostReport(foundReportId, lid); toast.success("Finder notified!"); onClose(); } catch { toast.error("Error linking."); } finally { setLoading(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Claim Pet</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button></div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {myLostReports.map(r => (
            <div key={r.id} className="border border-gray-100 p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 cursor-pointer">
              <span className="font-bold text-sm">{r.title}</span>
              <button onClick={() => handleClaim(r.id)} disabled={loading} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md">Select</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MODAL: ADD SIGHTING ---
export const AddSightingModal = ({ isOpen, onClose, baseReportId, type = "FOUND" }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("NEW"); 
  const [myReports, setMyReports] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", species: "DOG", condition: "GOOD", dateFound: "", chipNumber: "" });

  useEffect(() => {
    if (isOpen && mode === "EXISTING") {
      const load = async () => { try { const d = await fetchMyFoundReports(); setMyReports(d.content || []); } catch { toast.error("Error loading."); } };
      load();
    }
  }, [isOpen, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
        let targetId = null;
        if (mode === "NEW") {
            const now = new Date();
            const fDate = formData.dateFound || `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:00`;
            const nr = await createFoundReport({ ...formData, dateFound: fDate });
            targetId = nr.id;
            if (imageFile) await uploadFoundReportImage(nr.id, imageFile);
        } else { targetId = selectedExistingId; }
        if (targetId) {
            if (type === "LOST_REPORT_VIEW") await linkFoundToLostReport(targetId, baseReportId);
            else await connectFoundReports(baseReportId, targetId);
            toast.success("Linked!"); onClose();
        }
    } catch { toast.error("Error."); } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 font-bold text-xl"><h3>Sighting</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button type="button" onClick={() => setMode("NEW")} className={`flex-1 py-2 text-sm font-medium rounded-md ${mode === "NEW" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}>New Report</button>
            <button type="button" onClick={() => setMode("EXISTING")} className={`flex-1 py-2 text-sm font-medium rounded-md ${mode === "EXISTING" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}>Link Existing</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "NEW" && (
                <>
                    <input type="text" required placeholder="Title" className="w-full p-2 border rounded-lg text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <textarea required placeholder="Description" className="w-full p-2 border rounded-lg text-sm h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <CustomDropdown label="Species" value={formData.species} options={[{label:"Dog",value:"DOG"},{label:"Cat",value:"CAT"}]} onChange={v => setFormData({...formData, species: v})} />
                        <CustomDropdown label="Condition" value={formData.condition} options={[{label:"Good",value:"GOOD"},{label:"Injured",value:"INJURED"}]} onChange={v => setFormData({...formData, condition: v})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CustomDateTimePicker label="Date & Time Found" value={formData.dateFound} onChange={v => setFormData({...formData, dateFound: v})} />
                        <input type="number" placeholder="Chip Number" className="w-full p-2.5 border rounded-lg text-sm" value={formData.chipNumber} onChange={e => setFormData({...formData, chipNumber: e.target.value})} />
                    </div>
                    <CustomImageInput label="Photo" selectedFile={imageFile} onChange={setImageFile} />
                </>
            )}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4">{loading ? "Processing..." : "Connect"}</button>
        </form>
      </div>
    </div>
  );
};

// --- MODAL: MAP ---
export const MapModal = ({ isOpen, onClose, location }) => {
  if (!isOpen || !location) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-3xl h-[500px] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between bg-gray-50"><h3 className="font-bold">Map</h3><button onClick={onClose}><X className="w-6 h-6"/></button></div>
        <div className="flex-1 flex flex-col items-center justify-center">
            <MapPin className="w-12 h-12 text-red-500 mb-2 animate-bounce" />
            <p className="text-gray-500 text-xs">Coordinates: {location.y}, {location.x}</p>
        </div>
      </div>
    </div>
  );
};