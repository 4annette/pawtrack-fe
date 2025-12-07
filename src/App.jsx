import React from 'react';
import { Search, MapPin, Heart } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/50 flex flex-col items-center justify-center p-4">
      
      
      <div className="mb-8 inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
        Helping reunite 2,500+ pets with their families
      </div>

      
      <h1 className="mb-6 max-w-4xl text-center text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Every lost pet
        <br />
        
        <span className="text-primary">deserves to come home</span>
      </h1>

      <p className="mb-10 max-w-2xl text-center text-lg text-gray-600">
        PawTrack connects pet owners, finders, and communities to help lost pets
        find their way back home.
      </p>

      
      
      <button className="mb-16 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
        Get Started Now
      </button>

      
      <div className="grid w-full max-w-5xl gap-6 sm:grid-cols-3">
        
        <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 rounded-full bg-blue-50 p-3">
            <Search className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">Search</h3>
          <p className="text-center text-gray-500">Find lost pets quickly</p>
        </div>

        
        <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 rounded-full bg-green-50 p-3">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">Alert</h3>
          <p className="text-center text-gray-500">Notify nearby neighbors</p>
        </div>

        
        <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 rounded-full bg-red-50 p-3">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">Reunite</h3>
          <p className="text-center text-gray-500">Bring them home safe</p>
        </div>
      </div>
    </div>
  );
}

export default App;