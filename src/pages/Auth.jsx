import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PawTrackLogo from "@/components/PawTrackLogo"; 
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, PawPrint } from "lucide-react"; 
import { toast } from "sonner";
import { loginUser, registerUser } from "@/services/api";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLogin, setIsLogin] = useState(
    location.state?.mode === "register" ? false : true
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser({
          username: formData.username,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        toast.success("Welcome back!");
        navigate('/dashboard'); 
      } else {
        await registerUser(formData);
        toast.success("Account created! Please sign in.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-sage-light blur-2xl opacity-60" />
        <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-sky-light blur-2xl opacity-60" />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          
          <div className="bg-white/40 backdrop-blur-md p-10 rounded-2xl shadow-lg mb-8 animate-float">
             <PawPrint className="w-24 h-24 text-emerald-600 fill-emerald-100" />
          </div>
          
          <h2 className="text-4xl font-display font-bold text-gray-800 mb-4">
            Reunite with your <br/> furry friends
          </h2>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            PawTrack helps lost pets find their way back home. Join our community of pet lovers today.
          </p>

          <div className="flex gap-8 mt-12">
              <div>
                <p className="text-2xl font-bold text-sage">2.5k+</p>
                <p className="text-sm text-gray-500">Pets Reunited</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky">15k+</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sunny">98%</p>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-up">
          <div className="flex justify-center mb-8 lg:justify-start">
            <PawTrackLogo size="lg" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {isLogin ? "Welcome back!" : "Create account"}
            </h1>
            <p className="text-gray-500">
              {isLogin ? "Sign in to continue tracking" : "Join PawTrack today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="email" name="email" type="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} className="pl-11" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="username" name="username" type="text" placeholder="coolcat123" value={formData.username} onChange={handleChange} className="pl-11" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 rounded-lg font-bold shadow-md transition-all hover:scale-[1.02]" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center mt-8 text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;