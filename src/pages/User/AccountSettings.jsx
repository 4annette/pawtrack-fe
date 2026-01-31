import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User, Lock, Save, Loader2, Eye, EyeOff, BellRing, ShieldCheck, Search, PawPrint, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { 
  changeUsername, 
  changePassword, 
  loginUser, 
  logoutUser, 
  fetchUserDetails,
  toggleNotifyFoundReportLost,
  toggleNotifyFoundReportFound,
  toggleNotifyLostReport,
  toggleNotifyUserAccount
} from "@/services/api";
import PawTrackLogo from "@/components/PawTrackLogo";
import Notifications from "@/components/notifications/Notifications";
import ProfileButton from "@/components/topBar/ProfileButton";

const AccountSettings = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("menu");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({
    lostReportNotify: false,
    foundReportNotifyFound: false,
    lostReportNotifyLost: false,
    userAccountNotify: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await fetchUserDetails();
        setSettings({
          lostReportNotify: user.lostReportNotify,
          foundReportNotifyFound: user.foundReportNotifyFound,
          lostReportNotifyLost: user.lostReportNotifyLost,
          userAccountNotify: user.userAccountNotify
        });
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = async (key, apiFn) => {
    const newValue = !settings[key];
    try {
      await apiFn(newValue);
      setSettings(prev => ({ ...prev, [key]: newValue }));
      toast.success("Preference updated");
    } catch (error) {
      toast.error("Failed to update preference");
    }
  };

  const MenuOption = ({ icon: Icon, title, description, onClick, colorClass = "text-gray-600 bg-gray-50" }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group"
    >
      <div className="flex items-center gap-5">
        <div className={`p-3.5 rounded-2xl ${colorClass} transition-colors group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500 font-medium">{description}</p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );

  const ToggleOption = ({ icon: Icon, title, description, value, onToggle, colorClass }) => (
    <div className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className={`p-3.5 rounded-2xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <p className="text-sm text-gray-500 font-medium pr-4">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-emerald-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const CustomInput = ({ label, type = "text", value, onChange, placeholder, required = true }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-gray-700 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  const PasswordInput = ({ label, value, onChange, placeholder }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-700 ml-1">{label}</label>
        <div className="relative group">
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
            placeholder={placeholder}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  };

  const ChangeUsernameView = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!username.trim() || !password.trim()) {
        toast.error("Please fill in all fields");
        return;
      }
      setLoading(true);
      try {
        await changeUsername(username);
        await wait(1000);
        localStorage.removeItem("token");
        try {
          const loginResponse = await loginUser({ username, password });
          const newToken = loginResponse.token || loginResponse.access_token || loginResponse;
          if (newToken) {
            localStorage.setItem("token", JSON.stringify(newToken).replace(/^"|"$/g, '')); 
            toast.success("Username updated successfully!");
            setCurrentView("menu");
          } else {
            throw new Error("No token received");
          }
        } catch (loginError) {
          toast.error("Username changed. Please sign in manually.");
          await logoutUser();
          navigate("/auth");
        }
      } catch (error) {
        toast.error("Failed to update username. It might be taken.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setCurrentView("menu")}
            className="p-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 hover:shadow-md transition-all text-gray-600 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Back</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8">
          <div className="mb-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Change Username</h2>
            <p className="text-gray-500 font-medium mt-1">Enter your new username and confirm with your password.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CustomInput label="New Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. PetLover99" />
            <PasswordInput label="Current Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Required to confirm changes" />
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-bold text-lg rounded-2xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    );
  };

  const ChangePasswordView = () => {
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmationPassword: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (formData.newPassword !== formData.confirmationPassword) {
        toast.error("New passwords do not match");
        return;
      }
      setLoading(true);
      try {
        await changePassword(formData);
        toast.success("Password changed successfully");
        setCurrentView("menu");
      } catch (error) {
        toast.error("Failed to change password. Verify your old password.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setCurrentView("menu")}
            className="p-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 hover:shadow-md transition-all text-gray-600 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Back</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8">
          <div className="mb-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Change Password</h2>
            <p className="text-gray-500 font-medium mt-1">Ensure your account is secure with a strong password.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput label="Current Password" value={formData.oldPassword} onChange={(e) => setFormData({...formData, oldPassword: e.target.value})} />
            <PasswordInput label="New Password" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} />
            <PasswordInput label="Confirm New Password" value={formData.confirmationPassword} onChange={(e) => setFormData({...formData, confirmationPassword: e.target.value})} />
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-bold text-lg rounded-2xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <PawTrackLogo size="sm" />
          <div className="flex items-center gap-4">
            <Notifications />
            <ProfileButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-lg mx-auto">
          {currentView === "menu" && (
            <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Account Settings</h1>
              
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Profile Security</h2>
                <MenuOption icon={User} title="Change Username" description="Update your display name" colorClass="bg-blue-50 text-blue-600" onClick={() => setCurrentView("username")} />
                <MenuOption icon={Lock} title="Change Password" description="Update your login credentials" colorClass="bg-emerald-50 text-emerald-600" onClick={() => setCurrentView("password")} />
              </section>

              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Notification Preferences</h2>
                {loadingSettings ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                ) : (
                  <>
                    <ToggleOption 
                      icon={Search} 
                      title="Lost Pet Matches" 
                      description="Notify when a found report matches your lost report" 
                      value={settings.lostReportNotifyLost} 
                      onToggle={() => handleToggle('lostReportNotifyLost', toggleNotifyFoundReportLost)}
                      colorClass="bg-orange-50 text-orange-600"
                    />
                    <ToggleOption 
                      icon={PawPrint} 
                      title="Found Pet Matches" 
                      description="Notify when a lost report matches your found report" 
                      value={settings.foundReportNotifyFound} 
                      onToggle={() => handleToggle('foundReportNotifyFound', toggleNotifyFoundReportFound)}
                      colorClass="bg-purple-50 text-purple-600"
                    />
                    <ToggleOption 
                      icon={BellRing} 
                      title="Similar Found Pets" 
                      description="Notify when other similar pets are found" 
                      value={settings.lostReportNotify} 
                      onToggle={() => handleToggle('lostReportNotify', toggleNotifyLostReport)}
                      colorClass="bg-pink-50 text-pink-600"
                    />
                    <ToggleOption 
                      icon={ShieldCheck} 
                      title="Account Alerts" 
                      description="Notify on username or password changes" 
                      value={settings.userAccountNotify} 
                      onToggle={() => handleToggle('userAccountNotify', toggleNotifyUserAccount)}
                      colorClass="bg-indigo-50 text-indigo-600"
                    />
                  </>
                )}
              </section>
            </div>
          )}

          {currentView === "username" && <ChangeUsernameView />}
          {currentView === "password" && <ChangePasswordView />}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;