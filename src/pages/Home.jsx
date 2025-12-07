import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; 
import PawTrackLogo from "@/components/PawTrackLogo"; 
import { Search, MapPin, Heart } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50">

      <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-sage-light blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-sky-light blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/20 blur-3xl opacity-30 pointer-events-none" />

      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <PawTrackLogo size="md" /> 
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate("/auth", { state: { mode: "login" } })}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-6 shadow-sm transition-all"
          >
            Login
          </Button>

          <Button 
            onClick={() => navigate("/auth", { state: { mode: "register" } })}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-6 shadow-sm transition-all"
          >
            Sign Up
          </Button>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center text-center mt-20 px-4">
        
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-8">
          Helping reunite 2,500+ pets with their families
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6 max-w-4xl">
          <span className="text-green-600">deserves to come home</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          PawTrack connects pet owners, finders, and communities to help 
          lost pets find their way back home.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl w-full">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
                <Search className="w-10 h-10 text-blue-500 mb-4" />
                <p className="text-xl font-bold text-gray-900">Search</p>
                <p className="text-gray-500 text-sm">Find lost pets quickly</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
                <MapPin className="w-10 h-10 text-green-600 mb-4" />
                <p className="text-xl font-bold text-gray-900">Alert</p>
                <p className="text-gray-500 text-sm">Notify nearby neighbors</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
                <Heart className="w-10 h-10 text-rose-500 mb-4" />
                <p className="text-xl font-bold text-gray-900">Reunite</p>
                <p className="text-gray-500 text-sm">Bring them home safe</p>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Home;