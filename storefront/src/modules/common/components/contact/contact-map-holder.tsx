"use client";

import React, { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%", 
};

// Coordenadas de la dirección: Avinguda de Peris i Valero, 143, Bajo Derecha, 46011, Valencia
const center = {
  lat: 39.458920, // Latitud 
  lng: -0.366470, // Longitud 
};

const mapOptions = {
  disableDefaultUI: false, 
  zoomControl: true, // Habilita el control de zoom
  streetViewControl: false, // Deshabilita el control de Street View
  mapTypeControl: false, // Deshabilita el control de tipo de mapa (mapa, satélite)
  fullscreenControl: false, // Deshabilita el control de pantalla completa
};

const InteractiveMap: React.FC = () => {
  // Carga el script de la API de Google Maps.
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "", 
    id: "google-map-script", // ID único para el script del mapa
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="relative w-full h-80 bg-red-100 rounded-2xl shadow-md flex items-center justify-center text-red-700 text-lg font-medium">
        Error al cargar el mapa. Por favor, verifica tu clave de API y conexión.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-80 bg-gray-200 rounded-2xl shadow-md flex items-center justify-center text-gray-500 text-lg font-medium">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 rounded-2xl shadow-md overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle} 
        center={center}
        zoom={16} 
        onLoad={onLoad} 
        onUnmount={onUnmount} 
        options={mapOptions} 
      >
        {/* Marcador en la ubicación central */}
        <MarkerF position={center} />
      </GoogleMap>
    </div>
  );
};

export default InteractiveMap;
