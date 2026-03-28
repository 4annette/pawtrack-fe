import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
    ArrowLeft, ShieldCheck, Building2, Mail, User, 
    Calendar, Trash2, Loader2, Phone, Hash,
    ChevronDown, Check, Clock, Info, UserX
} from "lucide-react";
import { toast } from "sonner";
import { fetchVerificationRequestById, changeVerificationStatus, deleteVerificationRequest } from "@/services/api";
import PawTrackLogo from "@/components/PawTrackLogo";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";
import AdminMenu from "@/components/admin/AdminMenu";

const AdminViewVerification = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [req, setReq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchVerificationRequestById(id);
                setReq(data);
            } catch (e) { 
                toast.error(t('report_not_found_toast') || "Request not found"); 
                navigate(-1); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, [id, t, navigate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setStatusDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusChange = async (newStatus) => {
        try {
            await changeVerificationStatus(id, newStatus);
            toast.success(t('status_updated_success') || "Status updated");
            setReq({ ...req, requestStatus: newStatus, updatedAt: new Date().toISOString() });
            setStatusDropdownOpen(false);
        } catch (e) { 
            toast.error(t('status_update_failed') || "Action failed"); 
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete_request') || "Delete this request?")) return;
        try {
            await deleteVerificationRequest(id);
            toast.success(t('request_deleted_success') || "Deleted successfully");
            navigate('/admin/verifications');
        } catch (error) { 
            toast.error(t('delete_failed') || "Delete failed"); 
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'REJECTED') return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    const getAccountStatusStyle = (status) => {
        if (status === 'ACTIVE') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
        if (status === 'BANNED') return 'text-red-500 bg-red-50 border-red-100';
        return 'text-gray-400 bg-gray-50 border-gray-100';
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12"/>
        </div>
    );

    if (!req) return null;

    const statusOptions = [
        { value: "PENDING", label: t('pending') },
        { value: "ACCEPTED", label: t('accepted') },
        { value: "REJECTED", label: t('rejected') }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900 pb-20">
            <header className="sticky top-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <PawTrackLogo size="sm" />
                        <span className="hidden md:block font-black text-gray-400 text-xs uppercase tracking-widest border-l pl-4 border-gray-200">{t('admin_panel')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminMenu />
                        <Notifications />
                        <ProfileButton />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors mb-2">
                            <ArrowLeft className="w-3.5 h-3.5" /> {t('back')}
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            {t('view_verification_request')}
                        </h1>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-11 mt-1">ID: #{req.id}</p>
                    </div>

                    {req.requestStatus !== 'ACCEPTED' && (
                        <button 
                            onClick={handleDelete}
                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                            title={t('delete')}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-2 h-full ${req.requestStatus === 'PENDING' ? 'bg-amber-400' : req.requestStatus === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12 border-b border-gray-50 pb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{req.organizationName}</h2>
                                    <p className="text-indigo-500 font-bold flex items-center gap-2 mt-1">
                                        <Mail className="w-4 h-4"/> {req.organizationEmail}
                                    </p>
                                </div>
                            </div>

                            <div className="relative w-full md:w-48" ref={dropdownRef}>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('status')}</label>
                                {req.requestStatus === 'PENDING' ? (
                                    <>
                                        <button 
                                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                            className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase border transition-all shadow-sm ${getStatusStyle(req.requestStatus)}`}
                                        >
                                            {t(req.requestStatus.toLowerCase())}
                                            <ChevronDown className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {statusDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                                                {statusOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleStatusChange(opt.value)}
                                                        className={`w-full text-left px-3 py-2.5 text-[10px] font-black uppercase rounded-xl transition-colors flex items-center justify-between ${req.requestStatus === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {opt.label}
                                                        {req.requestStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={`w-full px-4 py-3 rounded-2xl text-[11px] font-black uppercase border text-center ${getStatusStyle(req.requestStatus)}`}>
                                        {t(req.requestStatus.toLowerCase())}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Representative Section */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" /> {t('representative_details')}
                                        </h4>
                                        {req.userResponseShort && (
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">User ID: #{req.userResponseShort.id}</span>
                                        )}
                                    </div>
                                    
                                    {req.userResponseShort ? (
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase">{t('username')}</p>
                                                <p className="text-sm font-bold text-gray-900">@{req.userResponseShort.username}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase">{t('phone')}</p>
                                                <p className="text-sm font-bold text-gray-800">{req.userResponseShort.phone || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase">{t('account_status')}</p>
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${getAccountStatusStyle(req.userResponseShort.accountStatus)}`}>
                                                    {t(req.userResponseShort.accountStatus?.toLowerCase()) || req.userResponseShort.accountStatus}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-6 flex flex-col items-start gap-2 text-red-400 border-t border-red-50">
                                            <div className="flex items-center gap-3">
                                                <UserX className="w-5 h-5 opacity-50" />
                                                <span className="text-xs font-black uppercase tracking-widest">{t('user_deleted')}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-red-300 leading-relaxed max-w-xs">
                                                {t('user_deleted_desc')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Section */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> {t('timeline')}
                                    </h4>
                                    <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        <div className="flex items-start gap-4 relative">
                                            <div className="mt-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-400 z-10" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{t('created')}</p>
                                                <p className="text-sm font-bold text-gray-700">{new Date(req.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        
                                        {req.createdAt !== req.updatedAt && (
                                            <div className="flex items-start gap-4 relative">
                                                <div className="mt-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-400 z-10" />
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{t('decision_date')}</p>
                                                    <p className="text-sm font-bold text-gray-700">{new Date(req.updatedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {req.requestStatus === 'PENDING' && (
                                    <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4 animate-in fade-in duration-300">
                                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold text-blue-600/80 leading-relaxed italic">
                                            {t('verification_info_footer')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminViewVerification;