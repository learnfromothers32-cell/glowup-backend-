import { useState, useRef, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Crosshair,
  MapPin,
  ChevronDown,
  X,
  Navigation,
  Loader2,
  AlertCircle,
  Check,
  Star,
  Users,
  Layers,
  ZoomIn,
  ZoomOut,
  Locate,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // ← moved here (top‑level)
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";
import "leaflet/dist/leaflet.css";

// ─── Fix Leaflet default marker icons ─────────────────────
const iconDefault = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: () => string;
};
delete iconDefault._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Constants ─────────────────────────────────────────────
const STORAGE_KEY = "glowup_user_location";
const ACCRA_CENTER: [number, number] = [5.6037, -0.187];

const areas = [
  { name: "Airport", lat: 5.6037, lng: -0.187, tag: "Residential" },
  { name: "Cantonments", lat: 5.5944, lng: -0.178, tag: "Upscale" },
  { name: "Osu", lat: 5.5589, lng: -0.185, tag: "Vibrant" },
  { name: "East Legon", lat: 5.6516, lng: -0.1866, tag: "Popular" },
  { name: "Labone", lat: 5.5612, lng: -0.1798, tag: "Trendy" },
  { name: "Dzorwulu", lat: 5.6, lng: -0.215, tag: "Central" },
  { name: "Tema", lat: 5.6699, lng: -0.0164, tag: "Metro" },
  { name: "Spintex", lat: 5.6099, lng: -0.1293, tag: "Growing" },
  { name: "Madina", lat: 5.6826, lng: -0.172, tag: "Bustling" },
  { name: "Adenta", lat: 5.7069, lng: -0.1562, tag: "Suburban" },
  { name: "Achimota", lat: 5.615, lng: -0.2297, tag: "Green" },
  { name: "Teshie", lat: 5.5833, lng: -0.1, tag: "Coastal" },
];

// ─── Custom marker icons (readable HTML templates) ─────────
const stylistIcon = L.divIcon({
  className: "custom-marker stylist-marker",
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
  html: `
    <div class="marker-wrapper">
      <div class="marker-body">
        <span>✂️</span>
      </div>
    </div>
  `,
});

const userIcon = L.divIcon({
  className: "custom-marker user-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div class="user-dot-outer">
      <div class="user-dot-inner"></div>
    </div>
  `,
});

// ─── Helpers ────────────────────────────────────────────────
function getInitialLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { lat, lng, areaName } = JSON.parse(saved);
      return {
        userLocation: [lat, lng] as [number, number],
        selectedArea: areaName || "",
      };
    }
  } catch {
    /* ignore */
  }
  return { userLocation: null as [number, number] | null, selectedArea: "" };
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Map controller (programmatic fly-to) ─────────────────
function MapController({
  center,
  onMapReady,
}: {
  center: [number, number] | null;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);

  return null;
}

// ─── Area Selector Dropdown ────────────────────────────────
function AreaSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = areas.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all min-w-[160px]"
      >
        <MapPin size={14} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-left truncate">
          {value || "Choose area"}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 z-[1000] w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search areas…"
                  className="w-full pl-3 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none focus:border-blue-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <MapPin size={20} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400">No areas found</p>
                </div>
              ) : (
                filtered.map((area) => {
                  const isActive = value === area.name;
                  return (
                    <button
                      key={area.name}
                      onClick={() => {
                        onChange(area.name);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <MapPin
                            size={14}
                            className={
                              isActive ? "text-blue-600" : "text-gray-400"
                            }
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isActive ? "text-blue-700" : "text-gray-900"
                            }`}
                          >
                            {area.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {area.tag}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stylist Popup Content ─────────────────────────────────
function StylistPopup({
  stylist,
  userLocation,
  onSelect,
}: {
  stylist: Stylist;
  userLocation: [number, number] | null;
  onSelect: () => void;
}) {
  const navigate = useNavigate();

  const dist =
    userLocation && stylist.location?.lat && stylist.location?.lng
      ? haversineDistance(
          userLocation[0],
          userLocation[1],
          stylist.location.lat,
          stylist.location.lng,
        )
      : null;

  return (
    <div className="w-56 font-sans">
      {/* Cover / image */}
      <div className="relative h-20 -mx-3 -mt-3 mb-2 rounded-t-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
        {stylist.image && (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="w-full h-full object-cover"
          />
        )}
        {stylist.isLive && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">
          {stylist.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {stylist.rating && (
            <span className="flex items-center gap-0.5">
              <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
              <span className="font-medium text-gray-700">
                {stylist.rating}
              </span>
            </span>
          )}
          {stylist.location && (
            <span>{getLocationString(stylist.location)}</span>
          )}
          {dist !== null && (
            <span className="text-blue-600 font-medium">
              {dist < 1
                ? `${(dist * 1000).toFixed(0)}m`
                : `${dist.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>

      {/* Services preview */}
      {stylist.services && stylist.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {stylist.services.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600"
            >
              {typeof s === "string" ? s : s.name}
            </span>
          ))}
          {stylist.services.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-400">
              +{stylist.services.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate(`/app/stylist/${stylist.id}`)}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={onSelect}
          className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <Navigation size={12} />
          Book
        </button>
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────
function StatsBar({
  stylistCount,
  userLocation,
}: {
  stylistCount: number;
  userLocation: [number, number] | null;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <Users size={13} className="text-gray-400" />
        <span className="font-semibold text-gray-700">{stylistCount}</span>
        stylist{stylistCount !== 1 ? "s" : ""} nearby
      </span>
      {userLocation && (
        <span className="flex items-center gap-1.5 text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Location active
        </span>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
interface ConsumerMapProps {
  stylists: Stylist[];
  onSelectStylist: (stylist: Stylist) => void;
}

export default function ConsumerMap({
  stylists,
  onSelectStylist,
}: ConsumerMapProps) {
  const initial = getInitialLocation();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    initial.userLocation,
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [selectedArea, setSelectedArea] = useState(initial.selectedArea);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showUserRadius, setShowUserRadius] = useState(true);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const saveLocation = (lat: number, lng: number, areaName?: string) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat, lng, areaName: areaName || "" }),
    );
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
        setSelectedArea("");
        setLocating(false);
        setLocationError(null);
        saveLocation(latitude, longitude);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === 1
            ? "Location access denied. Please enable it in settings."
            : err.code === 2
              ? "Unable to determine your location."
              : "Location request timed out. Try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleAreaSelect = (areaName: string) => {
    setSelectedArea(areaName);
    const area = areas.find((a) => a.name === areaName);
    if (area) {
      setUserLocation([area.lat, area.lng]);
      setFlyTarget([area.lat, area.lng]);
      setLocationError(null);
      saveLocation(area.lat, area.lng, areaName);
    }
  };

  const stylistsWithCoords = stylists.filter(
    (s) => s.location?.lat && s.location?.lng,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden relative z-0">
      {/* ── Top controls ──────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100">
        <AreaSelector value={selectedArea} onChange={handleAreaSelect} />

        <button
          onClick={getUserLocation}
          disabled={locating}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            locating
              ? "bg-blue-50 text-blue-500 border border-blue-200"
              : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Crosshair size={14} />
          )}
          <span className="hidden sm:inline">
            {locating ? "Locating…" : "My location"}
          </span>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowUserRadius((v) => !v)}
          className={`p-2 rounded-lg border transition-all ${
            showUserRadius && userLocation
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"
          }`}
          title="Toggle radius indicator"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* ── Stats bar ─────────────────────────────────── */}
      <StatsBar
        stylistCount={stylistsWithCoords.length}
        userLocation={userLocation}
      />

      {/* ── Error banner ──────────────────────────────── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="flex-1 text-xs text-red-700">{locationError}</p>
              <button
                onClick={() => setLocationError(null)}
                className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map ────────────────────────────────────────── */}
      <div className="relative" style={{ height: "420px" }}>
        <MapContainer
          center={userLocation || ACCRA_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB'
          />
          <MapController center={flyTarget} onMapReady={handleMapReady} />

          {userLocation && (
            <>
              <Marker position={userLocation} icon={userIcon}>
                <Popup className="custom-popup">
                  <div className="text-center px-1">
                    <p className="text-sm font-semibold text-gray-900">You</p>
                    <p className="text-[11px] text-gray-500">
                      Your current location
                    </p>
                  </div>
                </Popup>
              </Marker>
              {showUserRadius && (
                <Circle
                  center={userLocation}
                  radius={3000}
                  pathOptions={{
                    fillColor: "#3b82f6",
                    fillOpacity: 0.06,
                    color: "#3b82f6",
                    weight: 1,
                    opacity: 0.2,
                  }}
                />
              )}
            </>
          )}

          {/* ── Stylist markers – no eventHandlers, popup decides ── */}
          {stylistsWithCoords.map((stylist) => (
            <Marker
              key={stylist.id}
              position={[stylist.location.lat, stylist.location.lng]}
              icon={stylistIcon}
            >
              <Popup
                maxWidth={240}
                className="stylist-popup"
                closeButton={false}
              >
                <StylistPopup
                  stylist={stylist}
                  userLocation={userLocation}
                  onSelect={() => onSelectStylist(stylist)}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Custom zoom controls (lower z-index) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all"
          >
            <ZoomOut size={14} />
          </button>
          <div className="h-px bg-gray-200 mx-1" />
          <button
            onClick={getUserLocation}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all"
            title="Center on my location"
          >
            <Locate size={14} />
          </button>
        </div>

        {/* Legend (lower z-index) */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm px-3 py-2">
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              You
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
              Stylists
            </span>
            {showUserRadius && userLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-blue-300 bg-blue-50" />
                3km radius
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Styles (includes marker CSS & z-index fix for Leaflet) ── */}
      <style>{`
        .stylist-marker .marker-wrapper {
          width: 36px; height: 44px;
          display: flex; align-items: flex-end; justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .stylist-marker .marker-body {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2.5px solid white;
          display: flex; align-items: center; justify-content: center;
        }
        .stylist-marker .marker-body span {
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
        }
        .user-marker .user-dot-outer {
          width: 28px; height: 28px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .user-marker .user-dot-inner {
          width: 8px; height: 8px;
          background: white;
          border-radius: 50%;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 0 !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
          font-family: inherit !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          border-top: none !important;
          border-left: none !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        .leaflet-container {
          z-index: 0 !important;
        }
      `}</style>
    </div>
  );
}
