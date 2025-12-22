import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, User, Mail, Phone, LogOut, FileText } from "lucide-react";
import { updateUserProfile, deleteUserAccount } from "../../services/api.js";
import PawTrackLogo from "@/components/PawTrackLogo";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const [formData, setFormData] = useState({
    editedUserId: 0, 
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

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
      navigate("/dashboard");
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

            <div className="flex items-center gap-4" ref={userMenuRef}>
               <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs outline-none hover:ring-2 ring-emerald-50 transition-all"
                  >
                    {formData.firstName ? formData.firstName[0].toUpperCase() : "U"}
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                      <button onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left">
                        <User className="w-4 h-4 text-emerald-500" /> Edit Profile
                      </button>
                      <button onClick={() => { navigate('/my-reports'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left">
                        <FileText className="w-4 h-4 text-orange-500" /> My Reports
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
               </div>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-emerald-500/20" required />
              <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-emerald-500/20" required />
            </div>
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-emerald-500/20" required />
            <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-emerald-500/20" />
            
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-100">
              <Save className="w-5 h-5" />
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;