import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2, AlertCircle, Scissors, RefreshCcw, ImageIcon } from "lucide-react";
import { getMyStylistProfile } from "../../api/stylists";
import api, { API_SERVER_URL } from "../../api/axios";
import type { Stylist } from "@/domain/stylist/stylist.types";

export default function Portfolio() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getMyStylistProfile();
      setImages(profile.portfolioImages || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post("/stylists/portfolio", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setImages(data.data.portfolioImages);
      showSuccess("Image uploaded");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async (imageUrl: string) => {
    try {
      setError(null);
      await api.delete("/stylists/portfolio", { data: { imageUrl } });
      setImages(prev => prev.filter(img => img !== imageUrl));
      showSuccess("Image removed");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to remove image");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-xs text-gray-500 mt-0.5">Showcase your best work to attract clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPortfolio}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all"
            title="Refresh"
          >
            <RefreshCcw size={15} className="text-gray-400" />
          </button>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer">
            {uploading ? (
              <><Loader2 size={14} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={14} /> Upload Image</>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <Upload size={14} className="text-emerald-500 flex-shrink-0" />
          <p className="text-xs font-medium text-emerald-700">{successMsg}</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length === 0 && !error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Scissors size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No portfolio images yet</p>
          <p className="text-xs text-gray-400 mb-4">Upload your best work to showcase your skills</p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
            <Upload size={14} />
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <motion.div
              key={`${img}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="relative rounded-xl overflow-hidden aspect-square bg-gray-50 border border-gray-100 group"
            >
              <div
                className="w-full h-full flex items-center justify-center bg-gray-50"
              >
                {img ? (
                  <img
                    src={img.startsWith("http") ? img : `${API_SERVER_URL}${img}`}
                    alt={`Portfolio ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const placeholder = parent.querySelector(".portfolio-fallback");
                        if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                      }
                    }}
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "block";
                      const parent = target.parentElement;
                      if (parent) {
                        const placeholder = parent.querySelector(".portfolio-fallback");
                        if (placeholder) (placeholder as HTMLElement).style.display = "none";
                      }
                    }}
                  />
                ) : null}
                <div className="portfolio-fallback flex flex-col items-center justify-center text-gray-300" style={{ display: img ? "none" : "flex" }}>
                  <ImageIcon size={28} />
                </div>
              </div>
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleRemove(img)}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all shadow-md"
                  title="Remove"
                >
                  <X size={14} className="text-gray-700" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
