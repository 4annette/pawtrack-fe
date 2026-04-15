import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PawTrackLogo from "@/components/PawTrackLogo";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, PawPrint, X, Globe, Building2, Phone, MapPin, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { loginUser, registerUser, registerOrganization, syncFcmToken, fetchStatistics, fetchCurrentUser } from "@/services/api";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const LocationMarker = ({ position, setPosition, setAddressLabel }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data && data.display_name) {
          const shortAddress = data.display_name.split(',').slice(0, 3).join(',');
          setAddressLabel(shortAddress);
        }
      } catch (error) {
        console.error("Reverse geocoding failed", error);
      }
    },
  });
  return position ? <Marker position={position} icon={icon} /> : null;
};

const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, 13);
  return null;
};

const Auth = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(
    location.state?.mode === "register" ? false : true
  );
  
  const [isOrgRegistration, setIsOrgRegistration] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([38.2466, 21.7346]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressLabel, setAddressLabel] = useState("");
  const [orgSuccess, setOrgSuccess] = useState(false);

  const [stats, setStats] = useState({
    foundedLostReports: 2500,
    activeUsers: 15000,
    successRate: 98
  });

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    phone: ""
  });

  useEffect(() => {
    const getStats = async () => {
      try {
        const data = await fetchStatistics();
        if (data) {
          setStats({
            foundedLostReports: data.foundedLostReports || 0,
            activeUsers: data.activeUsers || 0,
            successRate: data.successRate || 0
          });
        }
      } catch (error) {
        console.error("Failed to load statistics", error);
      }
    };
    getStats();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        const shortAddress = display_name.split(',').slice(0, 3).join(',');
        setMapCenter([newPos.lat, newPos.lng]);
        setSelectedLocation(newPos);
        setAddressLabel(shortAddress);
      } else {
        toast.error(t('location_not_found'));
      }
    } catch (error) {
      toast.error(t('search_error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const authData = await loginUser({
          username: formData.username,
          password: formData.password
        });
        
        localStorage.setItem('token', authData.token);
        const userDetails = await fetchCurrentUser();
        localStorage.setItem('user', JSON.stringify(userDetails));

        try {
          await syncFcmToken();
        } catch (fcmError) {
          console.error("FCM Token sync failed, but login continued:", fcmError);
        }

        toast.success(t('auth_welcome_back'));
        navigate('/dashboard');
        
      } else {
        if (isOrgRegistration) {
          if (!selectedLocation) {
            toast.error(t('please_select_location'));
            setLoading(false);
            return;
          }
          await registerOrganization({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            organizationName: formData.organizationName,
            phone: formData.phone,
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng
          });
          setOrgSuccess(true);
          setIsLogin(true);
          setFormData({ ...formData, password: "" }); 
        } else {
          await registerUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName
          });
          toast.success(t('auth_account_created'));
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t('auth_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full relative">
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => i18n.changeLanguage(i18n.language.startsWith('el') ? 'en' : 'el')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <Globe className="w-4 h-4 text-emerald-600" />
          {i18n.language.split('-')[0].toUpperCase()}
        </button>
        <Link 
          to="/" 
          className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all shadow-sm"
        >
          <X className="w-6 h-6" />
        </Link>
      </div>

      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-sage-light blur-2xl opacity-60" />
        <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-sky-light blur-2xl opacity-60" />

        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-white/40 backdrop-blur-md p-10 rounded-2xl shadow-lg mb-8 animate-float">
            <PawPrint className="w-24 h-24 text-emerald-600 fill-emerald-100" />
          </div>

          <h2 className="text-4xl font-display font-bold text-gray-800 mb-4 whitespace-pre-line">
            {t('auth_hero_title')}
          </h2>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            {t('auth_hero_subtitle')}
          </p>

          <div className="flex gap-8 mt-12">
            <div>
              <p className="text-2xl font-bold text-sage">{stats.foundedLostReports >= 1000 ? (stats.foundedLostReports / 1000).toFixed(1) + 'k' : stats.foundedLostReports}</p>
              <p className="text-sm text-gray-500">{t('stats_reunited')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky">{stats.activeUsers >= 1000 ? (stats.activeUsers / 1000).toFixed(1) + 'k' : stats.activeUsers}</p>
              <p className="text-sm text-gray-500">{t('stats_active_users')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sunny">{stats.successRate}%</p>
              <p className="text-sm text-gray-500">{t('stats_success_rate')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-up">
          <div className="flex justify-center mb-8 lg:justify-start">
            <PawTrackLogo size="lg" />
          </div>

          {isLogin && orgSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 animate-in fade-in zoom-in-95 duration-500">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">{t('auth_org_success_title') || "Request Sent!"}</h4>
                <p className="text-emerald-700 text-xs leading-relaxed mt-1">
                  {t('auth_org_success_message') || "Your registration is pending approval. You will receive an email once your account is activated."}
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2 transition-all duration-300">
              {isLogin ? t('auth_welcome_title') : (isOrgRegistration ? t('auth_org_register_title') : t('auth_register_title'))}
            </h1>
            <p className="text-gray-500">
              {isLogin ? t('auth_welcome_desc') : (isOrgRegistration ? t('auth_org_register_desc') : t('auth_register_desc'))}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                {!isOrgRegistration ? (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('auth_first_name')}</Label>
                      <Input id="firstName" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('auth_last_name')}</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Label htmlFor="organizationName">{t('auth_org_name')}</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="organizationName" name="organizationName" placeholder="Clinic Name" value={formData.organizationName} onChange={handleChange} className="pl-11" required />
                      </div>
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Label htmlFor="phone">{t('auth_phone')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="phone" name="phone" placeholder="69XXXXXXXX" value={formData.phone} onChange={handleChange} className="pl-11" required />
                      </div>
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Label>{t('auth_location')}</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex justify-start gap-3 text-gray-500 h-auto py-2 px-3 text-left whitespace-normal break-words leading-tight"
                        onClick={() => setShowMap(true)}
                      >
                        <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm">
                          {addressLabel ? addressLabel : t('auth_select_on_map')}
                        </span>
                      </Button>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth_email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="email" name="email" type="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} className="pl-11" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{t('auth_username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="username" name="username" type="text" placeholder="username" value={formData.username} onChange={handleChange} className="pl-11" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 rounded-lg font-bold shadow-md transition-all hover:scale-[1.01]" disabled={loading}>
              {loading ? t('auth_processing') : (isLogin ? t('login') : t('signup'))}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-2">
            {!isLogin && (
              <p className="text-gray-500 text-sm">
                {isOrgRegistration ? t('auth_is_user') || "Registering as organization?" : t('auth_is_org') || "Are you a professional?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsOrgRegistration(!isOrgRegistration)}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {isOrgRegistration ? t('auth_switch_to_user') : t('auth_switch_to_org')}
                </button>
              </p>
            )}

            <p className="text-gray-500 text-sm">
              {isLogin ? t('auth_no_account') : t('auth_has_account')}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setIsOrgRegistration(false);
                  setOrgSuccess(false);
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {isLogin ? t('signup') : t('login')}
              </button>
            </p>
          </div>
        </div>
      </div>

      {showMap && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{t('auth_select_address')}</h3>
              <button onClick={() => setShowMap(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder={t('auth_search_address')} 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearchLocation} className="bg-emerald-500 hover:bg-emerald-600">
                  {t('search')}
                </Button>
              </div>

              <div className="h-[400px] w-full rounded-xl overflow-hidden border">
                <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker 
                    position={selectedLocation} 
                    setPosition={setSelectedLocation} 
                    setAddressLabel={setAddressLabel}
                  />
                  <ChangeView center={mapCenter} />
                </MapContainer>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowMap(false)}>{t('cancel')}</Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                  disabled={!selectedLocation}
                  onClick={() => setShowMap(false)}
                >
                  {t('auth_confirm_address')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;