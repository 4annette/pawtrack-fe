import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Save, Trash2, Edit3, X } from "lucide-react";
import { updateUserProfile, deleteUserAccount, fetchCurrentUser } from "../../services/api.js";
import { toast } from "sonner";
import Header from "@/pages/Header";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logoMenuRef = useRef(null);

  const [formData, setFormData] = useState({
    editedUserId: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: ""
  });

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === "ADMIN") {
          setIsAdmin(true);
        }
        if (user.role === "ORGANIZATIONS") {
          setIsOrganization(true);
        }
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }

    const handleClickOutside = (event) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

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
        toast.error(t('profile_load_error'));
      } finally {
        setLoading(false);
      }
    };

    getUserData();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(formData);
      toast.success(t('profile_update_success'));
      setIsEditing(false);
    } catch (error) {
      toast.error(t('profile_update_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('confirm_delete_account'))) {
      try {
        await deleteUserAccount(formData.editedUserId);
        localStorage.removeItem("token");
        navigate("/auth");
        toast.success(t('account_deleted_toast'));
      } catch (error) {
        toast.error(t('account_delete_error'));
      }
    }
  };

  const InfoRow = ({ label, value }) => (
    <div className="py-3 border-b border-gray-50 flex justify-between items-center">
      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{label}</span>
      <span className="font-bold text-gray-700">{value || t('not_provided_text')}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header
        activeTab=""
        setActiveTab={() => {}}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAdmin={isAdmin}
        isOrganization={isOrganization}
        logoMenuRef={logoMenuRef}
      />

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-emerald-900">
              {isEditing ? t('edit_profile_title') : t('your_profile_title')}
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
              >
                <Edit3 className="w-4 h-4" /> {t('edit_btn', { format: 'uppercase' })}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : !isEditing ? (
            <div className="space-y-2">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl font-black mb-2">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </div>
                <h2 className="text-xl font-bold">@{formData.username}</h2>
              </div>

              <InfoRow label={t('auth_first_name', { format: 'uppercase' })} value={formData.firstName} />
              <InfoRow label={t('auth_last_name', { format: 'uppercase' })} value={formData.lastName} />
              <InfoRow label={t('auth_email', { format: 'uppercase' })} value={formData.email} />
              <InfoRow label={t('phone_label', { format: 'uppercase' })} value={formData.phone} />

              <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                <Trash2 className="w-4 h-4" />
                {t('delete_account_btn', { format: 'uppercase' })}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">{t('auth_first_name', { format: 'uppercase' })}</label>
                  <input name="firstName" placeholder={t('auth_first_name')} value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">{t('auth_last_name', { format: 'uppercase' })}</label>
                  <input name="lastName" placeholder={t('auth_last_name')} value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">{t('auth_email', { format: 'uppercase' })}</label>
                <input name="email" type="email" placeholder={t('auth_email')} value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block ml-1">{t('phone_label', { format: 'uppercase' })}</label>
                <input name="phone" placeholder={t('phone_placeholder')} value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 ring-emerald-500/5 transition-all font-bold" />
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                  <X className="w-4 h-4" /> {t('cancel', { format: 'uppercase' })}
                </button>
                <button type="submit" disabled={loading} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t('save_changes', { format: 'uppercase' })}</>}
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