import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Selected Location</Popup>
        </Marker>
    );
};

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const defaultCenter = [37.9838, 23.7275]; 
    
    const [position, setPosition] = useState(initialLat && initialLng ? [initialLat, initialLng] : null);
    const [mapCenter, setMapCenter] = useState(initialLat && initialLng ? [initialLat, initialLng] : defaultCenter);
    
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    
    useEffect(() => {
        if (!initialLat && !initialLng && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    setPosition([latitude, longitude]); 
                    onLocationSelect(latitude, longitude); 
                },
                (err) => {
                    console.warn("Location access denied or error:", err);
                }
            );
        }
    }, []); 

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                
                setMapCenter([lat, lon]);
                setPosition([lat, lon]);
                onLocationSelect(lat, lon);
                
                toast.success(`Found: ${result.display_name.split(',')[0]}`);
            } else {
                toast.error("Location not found. Try a broader search.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error searching for location");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm z-0">
            <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 flex shadow-lg">
                    <input 
                        type="text" 
                        placeholder="Search city, street, or area..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 p-3 rounded-l-xl border-none outline-none text-sm font-semibold bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button 
                        type="submit" 
                        disabled={searching}
                        className="bg-emerald-600 text-white px-4 rounded-r-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
                    >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                </form>
            </div>

            <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <ChangeView center={mapCenter} />
                <LocationMarker 
                    position={position} 
                    setPosition={setPosition} 
                    onLocationSelect={onLocationSelect} 
                />
            </MapContainer>

            <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-emerald-800 z-[1000] shadow-sm pointer-events-none flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-600"/>
                {position ? "Location Selected" : "Tap map or search to pin location"}
            </div>
        </div>
    );
};

export default LocationPicker;