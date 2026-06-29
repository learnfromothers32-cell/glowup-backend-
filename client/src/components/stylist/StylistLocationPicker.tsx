import { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Crosshair, Loader2, Search, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchLocation } from "../../utils/locationSearch";
import type { SearchResult } from "../../utils/locationSearch";
import "leaflet/dist/leaflet.css";

const iconDefault = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
delete iconDefault._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface LocationValue {
  area: string;
  lat: number;
  lng: number;
}

interface Props {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

const SEARCH_DEBOUNCE = 350;

function MapPinPicker({
  lat,
  lng,
  onMove,
  onClose,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
        onMoveRef.current(newLat, newLng);
      },
    });
    return null;
  }

  const hasCoords = lat !== 0 && lng !== 0;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div style={{ height: 260, width: "100%" }}>
        <MapContainer
          center={[lat, lng]}
          zoom={hasCoords ? 16 : 2}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <MapEvents />
          <Marker
            ref={markerRef}
            position={[lat, lng]}
            draggable
            eventHandlers={{
              dragend() {
                const marker = markerRef.current;
                if (marker) {
                  const { lat: mlat, lng: mlng } = marker.getLatLng();
                  onMoveRef.current(mlat, mlng);
                }
              },
            }}
          />
        </MapContainer>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Navigation size={12} className="text-blue-500" />
          Drag the pin or tap the map
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function StylistLocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.area || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const data = await searchLocation(q);
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(val), SEARCH_DEBOUNCE);
  };

  const selectResult = (r: SearchResult) => {
    setQuery(r.displayName.split(",")[0] || r.area);
    setShowResults(false);
    onChange({ area: r.area || r.displayName, lat: r.lat, lng: r.lng });
    if (inputRef.current) inputRef.current.blur();
  };

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: { "User-Agent": "GlowUpOS/1.0", "Accept-Language": "en" },
          },
        )
          .then((r) => r.json())
          .then((data) => {
            const area =
              data.address?.suburb ||
              data.address?.neighbourhood ||
              data.address?.town ||
              data.address?.city ||
              "My location";
            setQuery(area);
            onChange({ area, lat: latitude, lng: longitude });
          })
          .catch(() => {
            setQuery("My location");
            onChange({ area: "My location", lat: latitude, lng: longitude });
          })
          .finally(() => setDetecting(false));
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onChange]);

  const pinLat = value.lat || 20;
  const pinLng = value.lng || 0;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search for your location..."
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                  onChange({ area: "", lat: 0, lng: 0 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shrink-0 flex items-center gap-2 text-sm font-medium"
          >
            {detecting ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            <span className="hidden sm:inline">Detect</span>
          </button>
        </div>

        {/* Autocomplete results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1 left-0 right-0 z-[2000] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            >
              {searching ? (
                <div className="px-4 py-6 text-center">
                  <Loader2 size={18} className="mx-auto mb-2 text-gray-300 animate-spin" />
                  <p className="text-xs text-gray-400">Searching...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <MapPin size={18} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400">No locations found</p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto py-1">
                  {results.map((r, i) => (
                    <button
                      key={`${r.lat}-${r.lng}-${i}`}
                      type="button"
                      onClick={() => selectResult(r)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.displayName.split(",")[0]}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {r.displayName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fine-tune map toggle */}
      {value.area && !showMap && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all bg-gray-50/50"
        >
          <MapPin size={14} />
          Fine-tune on map
        </button>
      )}

      {/* Map */}
      {showMap && (
        <MapPinPicker
          lat={pinLat}
          lng={pinLng}
          onMove={(lat, lng) => onChange({ area: value.area, lat, lng })}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
