"use client"

import React, { useCallback, useState } from "react"
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMapMarkerAlt,
  faPhone,
  faClock,
  faDirections,
} from "@fortawesome/free-solid-svg-icons"
import i18n from "@/i18n/config"

const containerStyle = {
  width: "100%",
  height: "100%",
}

// Datos de las tiendas MyUrbanScoot
const stores = [
  {
    id: 1,
    name: "Valencia Peris i Valero",
    address: "Avinguda de Peris i Valero, 143, Bajo Derecha",
    city: "46011, València",
    coords: { lat: 39.45892, lng: -0.36647 },
    phone: "+34 963 123 456",
    hours: "L-S: 9:00-20:00",
    color: "#ef4444", // Rojo
  },
  {
    id: 2,
    name: "Valencia Av Del Cid",
    address: "C/ de St. Josep de Calassanç, 28, Extramurs",
    city: "46008, València",
    coords: { lat: 39.46725313340095, lng: -0.3894495288354332 },
    phone: "+34 963 789 012",
    hours: "L-S: 9:30-20:30",
    color: "#3b82f6", // Azul
  },
  {
    id: 3,
    name: "Barcelona",
    address: "Carrer de las Navas de Tolosa, 395, Sant Andreu.",
    city: "08041, Barcelona",
    coords: { lat: 41.41952152176716, lng: 2.181413459524578 },
    phone: "+34 963 345 678",
    hours: "L-S: 10:00-21:00",
    color: "#10b981", // Verde
  },
  {
    id: 4,
    name: "Murcia",
    address: "Rda. de Garay, 29.",
    city: "30008, Murcia",
    coords: { lat: 37.99102696939283, lng: -1.1335271584618638 },
    phone: "+34 963 901 234",
    hours: "L-S: 9:00-19:30",
    color: "#f59e0b", // Amarillo/Naranja
  },
]

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: "cooperative" as const,
  renderingType: "RASTER" as const, // Bright colors
}

interface StoreMapProps {
  store: (typeof stores)[0]
}

const StoreMap: React.FC<StoreMapProps> = ({ store }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coords.lat},${store.coords.lng}`
    window.open(url, "_blank")
  }

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      {/* Header de la tienda */}
      <div className="p-4 border-b border-gray-100 min-h-[140px] sm:min-h-[133px] md:min-h-[145px] lg:min-h-[133px] xl:min-h-[150px] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold font-archivoBlack uppercase text-gray-800 leading-tight">
            {store.name}
          </h3>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: store.color }}
          />
        </div>
        <div className="space-y-1 text-sm text-gray-600 flex-grow flex flex-col justify-center">
          <p className="flex items-start gap-2 leading-tight">
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              className="text-gray-400 w-4 mt-0.5 flex-shrink-0"
            />
            <span className="break-words">{store.address}</span>
          </p>
          <p className="ml-6 text-gray-500">{store.city}</p>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative h-48 bg-gray-200">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={store.coords}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          //@ts-ignore
          options={mapOptions}
        >
          <MarkerF
            position={store.coords}
            icon={{
              url: `data:image/svg+xml,${encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="${store.color}"/>
                  <circle cx="16" cy="16" r="8" fill="white"/>
                  <circle cx="16" cy="16" r="4" fill="${store.color}"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40),
            }}
          />
        </GoogleMap>

        {/* Overlay con botón de direcciones */}
        <button
          onClick={openDirections}
          className="absolute top-3 right-3 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110"
        >
          <FontAwesomeIcon
            icon={faDirections}
            className="text-gray-700 text-sm"
          />
        </button>
      </div>

      {/* Footer con info de contacto */}
      <div className="p-4 space-y-3 min-h-[100px] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FontAwesomeIcon icon={faPhone} className="text-gray-400 w-4 flex-shrink-0" />
            <span className="font-medium break-all">{store.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FontAwesomeIcon icon={faClock} className="text-gray-400 w-4 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{store.hours}</span>
          </div>
        </div>

        {/* Botón de llamada */}
        <button
          onClick={() => window.open(`tel:${store.phone}`, "_self")}
          className="w-full bg-black/80 text-white py-2.5 px-4 rounded-lg transition-all duration-200 uppercase font-bold font-archivoBlack hover:bg-gray-800 transform hover:scale-[1.02] active:scale-[0.98] mt-auto"
        >
          {i18n.t("stores_map.call_button")}
        </button>
      </div>
    </div>
  )
}

const StoresMapGrid: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "",
    id: "google-map-script",
  })

  if (loadError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">
          {i18n.t("stores_map.loading_error_title")}
        </div>
        <p className="text-gray-600">
          {i18n.t("stores_map.loading_error_message")}
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse">
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
            <div className="h-48 bg-gray-300 mx-4 rounded-lg mb-4"></div>
            <div className="p-4 space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-8 bg-gray-300 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold font-archivoBlack uppercase text-gray-800">
          {i18n.t("stores_map.main_title")}
        </h2>
        <p className="text-gray-600 font-archivo max-w-2xl mx-auto">
          {i18n.t("stores_map.main_subtitle")}
        </p>
      </div>

      {/* Grid de Mapas */}
      <div className="grid grid-cols-1 md:grid-cols-2 large:grid-cols-4 xl:grid-cols-2 gap-6">
        {stores.map((store) => (
          <StoreMap key={store.id} store={store} />
        ))}
      </div>

      {/* Info adicional */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold font-archivoBlack text-gray-800 mb-2">
          {i18n.t("stores_map.info_title")}
        </h3>
        <p className="text-gray-600 font-archivo mb-4">
          {i18n.t("stores_map.info_message")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {i18n.t("stores_map.stores_status_open")}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            {i18n.t("stores_map.stores_status_advice")}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            {i18n.t("stores_map.stores_status_test_drives")}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoresMapGrid
