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
import { useNavigate } from "react-router-dom";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";
import { getAreas } from "@/api/areas";
import type { Area } from "@/api/areas";
import { fixLeafletIcons, tileUrl, TILE_ATTRIBUTION } from "@/utils/leaflet";
import "leaflet/dist/leaflet.css";

fixLeafletIcons();

const STORAGE_KEY = "glowup_user_location";
const DEFAULT_CENTER: [number, number] = [20, 0];

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

function getInitialLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { lat, lng, areaName } = JSON.parse(saved);
      if (typeof lat === "number" && typeof lng === "number") {
        return {
          userLocation: [lat, lng] as [number, number],
          selectedArea: areaName || "",
        };
      }
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

function MapController({
  center,
  onMapReady,
}: {
  center: [number, number] | null;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();
  const lastCenterRef = useRef(center);

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (
      center &&
      (!lastCenterRef.current ||
        lastCenterRef.current[0] !== center[0] ||
        lastCenterRef.current[1] !== center[1])
    ) {
      lastCenterRef.current = center;
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);

  return null;
}

function AreaSelector({
  value,
  onChange,
  areas,
  loading,
  onRetry,
}: {
  value: string;
  onChange: (name: string) => void;
  areas: Area[];
  loading: boolean;
  onRetry: () => void;
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
        aria-label={value ? `Selected area: ${value}` : "Choose area"}
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all min-w-[160px] dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-primary dark:hover:border-gray-500"
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
            className="absolute top-full mt-2 left-0 z-[1000] w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden dark:bg-surface-dark dark:border-gray-600"
          >
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search areas…"
                  className="w-full pl-3 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none focus:border-blue-300 focus:bg-white transition-all dark:bg-surface-dark-tertiary dark:border-gray-600 dark:text-text-dark-primary dark:placeholder:text-text-dark-muted"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
              {loading ? (
                <div className="px-4 py-6 text-center">
                  <Loader2 size={20} className="mx-auto mb-2 text-gray-300 animate-spin" />
                  <p className="text-xs text-gray-400">Loading areas...</p>
                </div>
              ) : areas.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <AlertCircle size={20} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400 mb-2">Could not load areas</p>
                  <button
                    onClick={onRetry}
                    className="text-xs text-blue-600 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <MapPin size={20} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400">No areas found</p>
                </div>
              ) : (
                filtered.map((area) => {
                  const isActive = value === area.name;
                  return (
                    <button
                      key={area._id || area.name}
                      onClick={() => {
                        onChange(area.name);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                        isActive ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? "bg-blue-100 dark:bg-blue-900/40" : "bg-gray-100 dark:bg-surface-dark-tertiary"
                          }`}
                        >
                          <MapPin
                            size={14}
                            className={
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-text-dark-muted"
                            }
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-text-dark-primary"
                            }`}
                          >
                            {area.name}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-text-dark-muted">
                            {area.tag}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <Check size={14} className="text-blue-600 dark:text-blue-400" />
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
    <div className="w-56 font-sans dark:text-text-dark-primary">
      <div className="relative h-20 -mx-3 -mt-3 mb-2 rounded-t-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950">
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

      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5 dark:text-text-dark-primary">
          {stylist.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-text-dark-muted">
          {stylist.rating && (
            <span className="flex items-center gap-0.5">
              <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
              <span className="font-medium text-gray-700 dark:text-text-dark-secondary">
                {stylist.rating}
              </span>
            </span>
          )}
          {stylist.location && (
            <span>{getLocationString(stylist.location)}</span>
          )}
          {dist !== null && (
            <span className="text-blue-600 font-medium dark:text-blue-400">
              {dist < 1
                ? `${(dist * 1000).toFixed(0)}m`
                : `${dist.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>

      {stylist.services && stylist.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {stylist.services.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 dark:bg-surface-dark-tertiary dark:text-text-dark-muted"
            >
              {typeof s === "string" ? s : s.name}
            </span>
          ))}
          {stylist.services.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-400 dark:bg-surface-dark-tertiary dark:text-text-dark-muted">
              +{stylist.services.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate(`/app/stylist/${stylist.id}`)}
          aria-label={`View profile of ${stylist.name}`}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-secondary"
        >
          View Profile
        </button>
        <button
          onClick={onSelect}
          aria-label={`Book with ${stylist.name}`}
          className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <Navigation size={12} />
          Book
        </button>
      </div>
    </div>
  );
}

function StatsBar({
  stylistCount,
  userLocation,
  selectedArea,
}: {
  stylistCount: number;
  userLocation: [number, number] | null;
  selectedArea?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 dark:bg-surface-dark dark:border-gray-700/50 dark:text-text-dark-muted">
      <span className="flex items-center gap-1.5">
        <Users size={13} className="text-gray-400 dark:text-text-dark-muted" />
        <span className="font-semibold text-gray-700 dark:text-text-dark-primary">{stylistCount}</span>
        {selectedArea ? `stylist${stylistCount !== 1 ? "s" : ""} in ${selectedArea}` : `stylist${stylistCount !== 1 ? "s" : ""} nearby`}
      </span>
      {userLocation && (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Location active
        </span>
      )}
    </div>
  );
}

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
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [useDarkTiles, setUseDarkTiles] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setUseDarkTiles(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const fetchAreas = useCallback(async () => {
    setAreasLoading(true);
    try {
      const data = await getAreas();
      setAreas(data);
    } catch {
      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAreas();
  }, [fetchAreas]);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const saveLocation = (lat: number, lng: number, areaName?: string) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lat, lng, areaName: areaName || "" }),
      );
    } catch {
      /* localStorage may be full or disabled */
    }
  };

  const getUserLocation = useCallback(() => {
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
  }, []);

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

  const handleRetryAreas = useCallback(() => {
    fetchAreas();
  }, [fetchAreas]);

  const stylistsWithCoords = stylists.filter(
    (s) => s.location?.lat && s.location?.lng,
  );

  const areaFilteredStylists = selectedArea
    ? stylistsWithCoords.filter(
        (s) => s.location.area.toLowerCase() === selectedArea.toLowerCase(),
      )
    : stylistsWithCoords;

  const showEmptyState = stylistsWithCoords.length > 0 && areaFilteredStylists.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden relative z-0 dark:bg-surface-dark-secondary dark:border-0">
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700/50">
        <AreaSelector
          value={selectedArea}
          onChange={handleAreaSelect}
          areas={areas}
          loading={areasLoading}
          onRetry={handleRetryAreas}
        />

        <button
          onClick={getUserLocation}
          disabled={locating}
          aria-label={locating ? "Locating…" : "My location"}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            locating
              ? "bg-blue-50 text-blue-500 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
              : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-primary dark:hover:border-gray-500"
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
          disabled={!userLocation}
          aria-label={showUserRadius ? "Hide radius indicator" : "Show radius indicator"}
          className={`p-2 rounded-lg border transition-all ${
            showUserRadius && userLocation
              ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
              : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-muted dark:hover:text-text-dark-secondary"
          } ${!userLocation ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <Layers size={16} />
        </button>
      </div>

      <StatsBar
        stylistCount={areaFilteredStylists.length}
        userLocation={userLocation}
        selectedArea={selectedArea}
      />

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
                aria-label="Dismiss error"
                className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={12} />
              </button>
              {locationError.includes("timed out") && (
                <button
                  onClick={getUserLocation}
                  className="text-xs font-medium text-red-600 underline whitespace-nowrap"
                >
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" style={{ height: "420px" }}>
        <MapContainer
          center={userLocation || DEFAULT_CENTER}
          zoom={userLocation ? 13 : 2}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom="center"
          zoomControl={false}
        >
          <TileLayer
            key={useDarkTiles ? "dark" : "light"}
            url={tileUrl(useDarkTiles)}
            attribution={TILE_ATTRIBUTION}
            eventHandlers={{
              tileerror: () => setTileError(true),
            }}
          />
          <MapController center={flyTarget} onMapReady={handleMapReady} />

          {userLocation && (
            <>
              <Marker position={userLocation} icon={userIcon}>
                <Popup className="custom-popup">
                  <div className="text-center px-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-text-dark-primary">You</p>
                    <p className="text-[11px] text-gray-400 dark:text-text-dark-muted">Current location</p>
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

          {areaFilteredStylists.map((stylist) => (
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

        {tileError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-surface-dark/80">
            <div className="text-center p-6">
              <AlertCircle size={24} className="mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-text-dark-primary">Map tiles failed to load</p>
              <p className="text-xs text-gray-400 mt-1">Check your internet connection</p>
            </div>
          </div>
        )}

        {showEmptyState && !tileError && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="bg-white/90 dark:bg-surface-dark/90 rounded-xl px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-600 text-center pointer-events-auto">
              <MapPin size={18} className="mx-auto mb-1 text-gray-400" />
              <p className="text-xs font-medium text-gray-600 dark:text-text-dark-muted">
                No stylists in this area
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Try a different area filter</p>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-secondary"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-secondary"
          >
            <ZoomOut size={14} />
          </button>
          <div className="h-px bg-gray-200 mx-1 dark:bg-gray-600" />
          <button
            onClick={getUserLocation}
            aria-label="Center on my location"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all dark:bg-surface-dark dark:border-gray-600 dark:text-text-dark-secondary"
          >
            <Locate size={14} />
          </button>
        </div>

        {!tileError && (
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm px-3 py-2 dark:bg-surface-dark/90 dark:border-gray-600">
            <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-text-dark-muted">
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
        )}
      </div>

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
        .dark .leaflet-popup-content-wrapper {
          background: #18181b !important;
          border-color: #3f3f46 !important;
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
        .dark .leaflet-popup-tip {
          background: #18181b !important;
          border-color: #3f3f46 !important;
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
        .leaflet-tile-pane {
          filter: saturate(0);
        }
      `}</style>
    </div>
  );
}
