import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from "lucide-react";
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
            if (onLocationSelect) onLocationSelect(lat, lng);
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
    
    useEffect(() => {
        if (!initialLat && !initialLng && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    setPosition([latitude, longitude]); 
                    if (onLocationSelect) onLocationSelect(latitude, longitude); 
                },
                (err) => {
                    console.warn("Location access error:", err);
                }
            );
        }
    }, []); 

    return (
        <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm z-0">
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
                {position ? "Location Selected" : "Tap on map to pin location"}
            </div>
        </div>
    );
};

export default LocationPicker;