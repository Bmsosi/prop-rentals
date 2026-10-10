// src/components/property-details/AddressCard.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import {
  loadGoogleMapsScript,
  geocodeLocation,
  updateOrCreateMap,
  updateOrCreateMarker,
} from "@/lib/googleMaps";

const AddressCard = ({ fullAddress, zipCode, onAddressGenerated }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(fullAddress || "");
  const [error, setError] = useState(null);

  // load Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    loadGoogleMapsScript(apiKey, () => setIsMapLoaded(true), setError);
  }, []);

  // update when fullAddress changes
  useEffect(() => {
    if (fullAddress) setDisplayAddress(fullAddress);
  }, [fullAddress]);

  const renderMap = useCallback(async () => {
    if (!isMapLoaded || !window.google) return;

    const query = zipCode || fullAddress;
    if (!query) return;

    try {
      const { location, formattedAddress } = await geocodeLocation(query);
      const zoomLevel = zipCode && !fullAddress ? 13 : 15;

      if (!fullAddress && zipCode && formattedAddress !== displayAddress) {
        setDisplayAddress(formattedAddress);
        onAddressGenerated?.(formattedAddress);
      }

      updateOrCreateMap(mapRef, mapInstanceRef, location, zoomLevel);
      updateOrCreateMarker(mapInstanceRef, markerRef, location, fullAddress || formattedAddress);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(String(err));
    }
  }, [isMapLoaded, fullAddress, zipCode, displayAddress, onAddressGenerated]);

  useEffect(() => {
    renderMap();
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [renderMap]);

  return (
    <div className="bg-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-row items-center mb-6">
        <div className="mr-3 flex items-center">
          <MapPin className="w-10 h-10 text-gray-700" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-primary">Address</h2>
          <p className="text-xs sm:text-sm text-gray-700 break-words">
            {displayAddress || (zipCode ? `ZIP Code: ${zipCode}` : "No address provided")}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-[250px] bg-gray-200 rounded-lg overflow-hidden relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500 text-sm px-4 text-center">{error}</p>
          </div>
        ) : !isMapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default AddressCard;
