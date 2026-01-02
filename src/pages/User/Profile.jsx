import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, User, LogOut, FileText, Edit3, X } from "lucide-react";
import { updateUserProfile, deleteUserAccount, fetchCurrentUser } from "../../services/api.js";
import PawTrackLogo from "@/components/PawTrackLogo";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const [formData, setFormData] = useState({
    editedUserId: 0, 
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: ""
  });

  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        const data = await fetchCurrentUser();
        setFormData({
          editedUserId: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || "",
          username: data.username
        });
      } catch (error) {
        toast.error("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure? This will permanently delete your account.")) {
      try {
        await deleteUserAccount(formData.editedUserId);
        localStorage.removeItem("token");
        navigate("/auth");
        toast.success("Account deleted.");
      } catch (error) {
        toast.error("Error deleting account.");
      }
    }
  };

  const InfoRow = ({ label, value }) => (
    <div className="py-3 border-b border-gray-50 flex justify-between items-center">
      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{label}</span>
      <span className="font-bold text-gray-700">{value || "Not provided"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors outline-none">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <PawTrackLogo size="sm" />
            </div>

            <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs active:scale-90 transition-transform outline-none"
                >
                  <User className="w-5 h-5" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 font-bold">
                    <button onClick={() => { setIsEditing(false); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 text-left transition-colors">
                      <User className="w-4 h-4 text-emerald-500" /> Profile
                    </button>
                    <button onClick={() => { navigate('/my-reports'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 text-left transition-colors">
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

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-emerald-900">
              {isEditing ? "Edit Profile" : "Your Profile"}
            </h1>
            {!isEditing && (
               <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
               >
                 <Edit3 className="w-4 h-4" /> Edit
               </button>
            )}
          </div>
          
          {loading ? (
             <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
             </div>
          ) : !isEditing ? (

            /* VIEW MODE */
            <div className="space-y-2">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl font-black mb-2">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </div>
                <h2 className="text-xl font-bold">@{formData.username}</h2>
              </div>
              
              <InfoRow label="First Name" value={formData.firstName} />
              <InfoRow label="Last Name" value={formData.lastName} />
              <InfoRow label="Email" value={formData.email} />
              <InfoRow label="Phone" value={formData.phone} />

              <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          ) : (
            
            /* EDIT MODE */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">First Name</label>
                  <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">Last Name</label>
                  <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">Email Address</label>
                <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">Phone Number</label>
                <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;