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

// --- HELPER: CUSTOM DATE TIME PICKER ---
export const CustomDateTimePicker = ({ label, value, onChange }) => {
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
        
        {/* Hidden Inputs */}
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

  const getConditionColor = (condition) => {
    if (!condition) return 'bg-gray-100 text-gray-800 border-gray-200';
    const normalized = String(condition).toUpperCase().trim();
    if (normalized === 'EXCELLENT') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (normalized === 'GOOD') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (normalized === 'BAD' || normalized === 'INJURED') return 'bg-red-100 text-red-800 border-red-200';
    if (normalized.includes('LESS_THAN')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-64 sm:h-80 bg-gray-100 shrink-0">
            {report.imageUrl ? (
                <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50"><Dog className="w-16 h-16 opacity-30 mb-2" /><span className="text-sm font-medium">No Image Available</span></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black hover:bg-gray-800 rounded-full text-white transition-colors shadow-lg"><X className="w-5 h-5" /></button>
            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getConditionColor(statusValue)} bg-white/90`}>{report.species}</span>
                             <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-white/20 border border-white/30 backdrop-blur-sm">{statusValue || "Unknown"}</span>
                        </div>
                        <h2 className="text-2xl font-bold leading-tight">{report.title}</h2>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{report.description || "No additional details provided."}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 block mb-1">{dateLabel}</span>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        {new Date(dateValue).toLocaleDateString()} <span className="text-gray-400 text-xs font-normal">at {new Date(dateValue).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 block mb-1">Chip Number</span>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                        <Hash className="w-4 h-4 text-emerald-500" />
                        {report.chipNumber && report.chipNumber !== 0 ? report.chipNumber : "Not Scanned"}
                    </div>
                </div>
            </div>
            <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> Location Details</h4>
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between">
                     <div>
                         <p className="text-xs text-gray-500 font-mono">LAT: {report.location?.y ? report.location.y.toFixed(6) : "N/A"}</p>
                         <p className="text-xs text-gray-500 font-mono">LNG: {report.location?.x ? report.location.x.toFixed(6) : "N/A"}</p>
                     </div>
                     <button onClick={() => onViewMap(report.location)} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">View on Map</button>
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
      const loadMyReports = async () => {
        try {
          const data = await fetchMyLostReports();
          setMyLostReports(data.content || []);
        } catch (error) { console.error(error); toast.error("Could not load reports."); }
      };
      loadMyReports();
    }
  }, [isOpen]);

  const handleClaim = async (lostReportId) => {
    setLoading(true);
    try {
      await linkFoundToLostReport(foundReportId, lostReportId);
      toast.success("Success! Finder notified.");
      onClose();
    } catch (error) { console.error(error); toast.error("Failed to link reports."); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Claim this Pet</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button></div>
        <p className="text-gray-600 mb-4 text-sm">Select which of your missing pets matches this found report.</p>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {myLostReports.length > 0 ? (
            myLostReports.map(report => (
              <div key={report.id} className="border border-gray-100 p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"><img src={report.imageUrl || "https://placehold.co/100x100?text=Pet"} alt="Pet" className="w-full h-full object-cover" /></div>
                    <div><p className="font-bold text-gray-800 text-sm">{report.title}</p><p className="text-xs text-gray-500">{report.species}</p></div>
                </div>
                <button onClick={() => handleClaim(report.id)} disabled={loading} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50">{loading ? "Linking..." : "Select"}</button>
              </div>
            ))
          ) : (<div className="text-center py-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">You haven't reported any lost pets yet.</p></div>)}
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    species: "DOG",
    condition: "GOOD",
    dateFound: "", 
    chipNumber: "",
  });

  useEffect(() => {
    if (isOpen && mode === "EXISTING") {
      const loadMyReports = async () => {
        try {
          const data = await fetchMyFoundReports(); 
          setMyReports(data.content || []);
        } catch (error) {
          console.error("Failed to load my reports", error);
          toast.error("Could not load your existing reports.");
        }
      };
      loadMyReports();
    }
  }, [isOpen, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        let targetReportId = null;
        if (mode === "NEW") {
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
            const payload = { ...formData, dateFound: formattedDate };
            const newReport = await createFoundReport(payload);
            targetReportId = newReport.id;
            if (imageFile) await uploadFoundReportImage(newReport.id, imageFile);
        } else {
            if (!selectedExistingId) { toast.error("Please select a report."); setLoading(false); return; }
            targetReportId = selectedExistingId;
        }

        if (targetReportId) {
            if (type === "LOST_REPORT_VIEW") await linkFoundToLostReport(targetReportId, baseReportId);
            else await connectFoundReports(baseReportId, targetReportId);
            toast.success("Reports linked successfully!");
            onClose();
        }
    } catch (error) { console.error(error); toast.error("Failed to process request."); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">{type === "LOST_REPORT_VIEW" ? "I Found This Pet" : "I Saw This Pet Too"}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button></div>
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button type="button" onClick={() => setMode("NEW")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "NEW" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Create New Report</button>
            <button type="button" onClick={() => setMode("EXISTING")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "EXISTING" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Link Existing Report</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "NEW" && (
                <>
                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mb-2">Creating a new report to link to this post.</div>
                    <div><label className="text-xs font-bold text-gray-700 block mb-1">Title</label><input type="text" required placeholder="e.g. Found near Central Park" className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:outline-emerald-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-700 block mb-1">Description</label><textarea required placeholder="Describe the pet and the situation..." className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:outline-emerald-500 h-20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <CustomDropdown label="Species" icon={Dog} value={formData.species} options={[{label:"Dog",value:"DOG"},{label:"Cat",value:"CAT"},{label:"Other",value:"OTHER"}]} onChange={val => setFormData({...formData, species: val})} />
                        <CustomDropdown label="Condition" icon={CheckCircle} value={formData.condition} options={[{label:"Excellent",value:"EXCELLENT"},{label:"Good",value:"GOOD"},{label:"Injured",value:"INJURED"}]} onChange={val => setFormData({...formData, condition: val})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CustomDateTimePicker label="Date & Time Found" value={formData.dateFound} onChange={val => setFormData({...formData, dateFound: val})} />
                        <div><label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> Chip Number</label><input type="number" placeholder="Optional" className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:outline-emerald-500" value={formData.chipNumber} onChange={e => setFormData({...formData, chipNumber: e.target.value})} /></div>
                    </div>
                    {/* Reusing CustomImageInput here too */}
                    <CustomImageInput label="Upload Photo" selectedFile={imageFile} onChange={setImageFile} />
                </>
            )}
            {mode === "EXISTING" && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {myReports.length > 0 ? (
                        myReports.map(report => (
                            <div key={report.id} onClick={() => setSelectedExistingId(report.id)} className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedExistingId === report.id ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 hover:bg-gray-50"}`}>
                                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"><img src={report.imageUrl || "https://placehold.co/100x100?text=Pet"} alt="Pet" className="w-full h-full object-cover" /></div><div><p className="font-bold text-gray-800 text-sm">{report.title}</p><p className="text-xs text-gray-500">{new Date(report.foundDate).toLocaleDateString()}</p></div></div>
                                {selectedExistingId === report.id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            </div>
                        ))
                    ) : (<div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed"><p className="text-gray-500 text-sm">No found reports.</p></div>)}
                </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <LinkIcon className="w-5 h-5"/>} {loading ? "Linking..." : "Connect Reports"}</button>
        </form>
      </div>
    </div>
  );
};

// --- MODAL: MAP ---
export const MapModal = ({ isOpen, onClose, location }) => {
  if (!isOpen || !location) return null;
  const lat = location.coordinate?.y || location.y || 0;
  const lng = location.coordinate?.x || location.x || 0;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-3xl h-[500px] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="text-lg font-bold">Location Details</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center relative">
            <MapPin className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
            <p className="font-semibold text-gray-700">Location Coordinates</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg">Open in Google Maps</a>
        </div>
      </div>
    </div>
  );
};