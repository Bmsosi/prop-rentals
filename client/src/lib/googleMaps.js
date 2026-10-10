/**
 * load Google Maps API script dynamically (only once)
 */
export const loadGoogleMapsScript = (apiKey, onLoad, onError) => {
  if (!apiKey) {
    onError?.("Google Maps API key not found");
    console.warn("Google Maps API key not found");
    return;
  }

  if (window.google?.maps?.places) {
    onLoad?.();
    return;
  }

  // prevent loading multiple times
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => onLoad?.();
  script.onerror = () => onError?.("Failed to load Google Maps");
  document.head.appendChild(script);
};

/**
 * geocode address or ZIP and return coordinates + formatted address
 */
export const geocodeLocation = async (query) => {
  if (!window.google?.maps?.Geocoder) {
    throw new Error("Google Maps not loaded");
  }

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        resolve({
          location,
          formattedAddress: results[0].formatted_address,
        });
      } else {
        reject(`Geocoding failed: ${status}`);
      }
    });
  });
};

/**
 * create or update map instance
 */
export const updateOrCreateMap = (mapRef, mapInstanceRef, location, zoom) => {
  if (!mapRef.current) return;

  if (mapInstanceRef.current) {
    mapInstanceRef.current.setCenter(location);
    mapInstanceRef.current.setZoom(zoom);
  } else {
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }
};

/**
 * create or update map marker
 */
export const updateOrCreateMarker = (mapInstanceRef, markerRef, location, title) => {
  if (!mapInstanceRef.current) return;

  if (markerRef.current) {
    markerRef.current.setPosition(location);
    markerRef.current.setTitle(title);
  } else {
    markerRef.current = new window.google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title,
      animation: window.google.maps.Animation.DROP,
    });
  }
};
