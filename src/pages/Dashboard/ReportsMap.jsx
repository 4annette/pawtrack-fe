import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchAllMapReports } from '@/services/api';
import { Loader2, Calendar, MapPin, Navigation, Search, Camera, PawPrint } from 'lucide-react';

const lostIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32]
});

const foundIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32]
});

const MapController = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 2 });
        }
    }, [coords, map]);
    return null;
};

const ReportsMap = () => {
    const [reports, setReports] = useState({ lost: [], found: [] });
    const [loading, setLoading] = useState(true);
    const [flyToCoords, setFlyToCoords] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchAllMapReports();
                setReports(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(loc);
                    setFlyToCoords(loc);
                }
            );
        }
        loadData();
    }, []);

    const handleRecenter = () => {
        if (userLocation) {
            setFlyToCoords({ ...userLocation, _t: Date.now() });
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                setFlyToCoords({
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    _t: Date.now()
                });
            }
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] w-full flex items-center justify-center bg-emerald-50 rounded-2xl">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const isValidCoord = (lat, lng) =>
        typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

    return (
        <div className="relative w-full h-[70vh] bg-emerald-200/40 rounded-[3rem] p-4 shadow-lg border border-emerald-100 max-sm:p-2 max-sm:rounded-[2rem] overflow-hidden">
            <style>
                {`
          .leaflet-popup-content-wrapper {
            padding: 0;
            overflow: hidden !important;
            border-radius: 1.5rem;
            box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1);
            border: 4px solid white;
          }
          .leaflet-popup-content { margin: 0 !important; width: 240px !important; overflow: hidden !important; }
          .leaflet-container { background: #f8fafc !important; border-radius: 2rem; }
          
          /* FIXED CLOSE BUTTON STYLING */
          .leaflet-container a.leaflet-popup-close-button {
            top: 12px !important;
            right: 12px !important;
            padding: 4px !important;
            width: 24px !important;
            height: 24px !important;
            background: white !important;
            border-radius: 50% !important;
            color: #64748b !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
            z-index: 100 !important;
            font: 16px/24px Tahoma, Verdana, sans-serif !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            text-decoration: none !important;
          }

          .leaflet-container a.leaflet-popup-close-button:hover {
            color: #ef4444 !important;
            transform: scale(1.1);
          }

          .leaflet-control-zoom { 
            border: none !important; 
            margin-top: 100px !important; 
            margin-left: 24px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .leaflet-control-zoom-in, .leaflet-control-zoom-out { 
            background-color: white !important; 
            color: #04aa73 !important; 
            border: 1px solid #f1f5f9 !important;
            border-radius: 16px !important;
            font-weight: 900 !important;
            width: 52px !important;
            height: 52px !important;
            line-height: 52px !important;
            font-size: 22px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
            transform: scale(1.1);
            background-color: #17bd6d !important;
          }
          .leaflet-popup-tip-container { display: none; }

          @media (max-width: 640px) {
            .leaflet-control-zoom { 
                margin-top: 80px !important; 
                margin-left: 10px !important; 
                transform: scale(0.8); 
            }
          }
        `}
            </style>

            <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl border-[8px] border-white relative z-10 bg-white max-sm:border-[4px] max-sm:rounded-[1.8rem]">
                <MapContainer
                    center={[45.0, 20.0]}
                    zoom={4}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap'
                    />

                    <MapController coords={flyToCoords} />

                    {reports.lost.filter(r => isValidCoord(r.latitude, r.longitude)).map((report) => (
                        <Marker key={`lost-${report.id}`} position={[report.latitude, report.longitude]} icon={lostIcon}>
                            <Popup>
                                <div className="flex flex-col font-sans overflow-hidden rounded-[1.3rem]">
                                    <div className="h-28 bg-orange-50 relative overflow-hidden">
                                        {report.imageUrl ? (
                                            <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-orange-200">
                                                <Camera className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-5 left-5 px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter shadow-md z-20">Lost</div>
                                    </div>
                                    <div className="p-4 bg-white text-center">
                                        <h3 className="font-black text-gray-800 text-sm leading-tight mb-3 italic whitespace-normal break-words">
                                            {report.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <Calendar className="w-3 h-3" />
                                                {report.lostDate?.substring(0, 10)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <MapPin className="w-3 h-3" />
                                                {report.species}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {reports.found.filter(r => isValidCoord(r.latitude, r.longitude)).map((report) => (
                        <Marker key={`found-${report.id}`} position={[report.latitude, report.longitude]} icon={foundIcon}>
                            <Popup>
                                <div className="flex flex-col font-sans overflow-hidden rounded-[1.3rem]">
                                    <div className="h-28 bg-emerald-50 relative overflow-hidden">
                                        {report.imageUrl ? (
                                            <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-emerald-200">
                                                <Camera className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-5 left-5 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter shadow-md z-20">Found</div>
                                    </div>
                                    <div className="p-4 bg-white text-center">
                                        <h3 className="font-black text-gray-800 text-sm leading-tight mb-3 italic whitespace-normal break-words">
                                            {report.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <Calendar className="w-3 h-3" />
                                                {report.dateFound?.substring(0, 10)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <MapPin className="w-3 h-3" />
                                                {report.species}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-sm px-2 max-sm:top-5 max-sm:max-w-[85%]">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Search location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-7 py-4 bg-white/90 backdrop-blur-md border-2 border-white rounded-full shadow-lg focus:outline-none font-bold text-gray-600 placeholder:text-gray-300 text-sm max-sm:py-3 max-sm:px-5 max-sm:text-xs"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-md max-sm:p-2"
                    >
                        <Search className="w-4 h-4 max-sm:w-3 max-sm:h-3" />
                    </button>
                </form>
            </div>

            <div className="absolute top-10 right-10 z-[1001] max-sm:top-auto max-sm:bottom-28 max-sm:right-5">
                <button
                    onClick={handleRecenter}
                    className="p-3.75 bg-white text-emerald-500 rounded-2xl shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all max-sm:p-3 max-sm:rounded-xl"
                >
                    <Navigation className="w-5 h-5 max-sm:w-4 max-sm:h-4" />
                </button>
            </div>

            <div className="absolute bottom-10 left-10 z-[1001] flex items-center gap-6 bg-white/90 backdrop-blur-md px-7 py-3 rounded-full shadow-lg border-2 border-white max-sm:bottom-6 max-sm:left-5 max-sm:gap-4 max-sm:px-5 max-sm:py-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg max-sm:p-1">
                        <PawPrint className="w-5 h-5 text-orange-600 max-sm:w-4 max-sm:h-4" />
                    </div>
                    <span className="text-[12px] font-black text-gray-600 uppercase tracking-widest italic max-sm:text-[10px]">Lost</span>
                </div>
                <div className="w-px h-6 bg-gray-200 max-sm:h-4" />
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg max-sm:p-1">
                        <PawPrint className="w-5 h-5 text-emerald-600 max-sm:w-4 max-sm:h-4" />
                    </div>
                    <span className="text-[12px] font-black text-gray-600 uppercase tracking-widest italic max-sm:text-[10px]">Found</span>
                </div>
            </div>
        </div>
    );
};

export default ReportsMap;