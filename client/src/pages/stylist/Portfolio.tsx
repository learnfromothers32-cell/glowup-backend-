import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Scissors,
  RefreshCcw,
  ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Camera,
  Plus,
  Flame,
  Heart,
  MessageCircle,
  Video,
  Film,
} from "lucide-react";
import {
  getMyStylistProfile,
  addBeforeAfter,
  removeBeforeAfter,
  getMyTrendingStats,
  savePortfolioMedia,
} from "../../api/stylists";
import api, { API_SERVER_URL } from "../../api/axios";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

interface PortfolioItem {
  url: string;
  type: "image" | "video";
}

type PortfolioItemInput =
  | string
  | {
      url?: unknown;
      type?: unknown;
    };

type TrendingStat = {
  transformationId: string;
  likes: number;
  views: number;
  commentCount: number;
  shares?: number;
};

const normalizeItem = (item: PortfolioItemInput): PortfolioItem =>
  typeof item === "string"
    ? { url: item, type: "image" }
    : {
        url: String(item.url || ""),
        type: item.type === "video" ? "video" : "image",
      };

const getTrendingTransformationKey = (
  stylistId: string,
  item: { _id?: string },
  index: number,
) => (item._id ? `${stylistId}_${item._id}` : `${stylistId}_${index}`);

interface PendingFile {
  id: string;
  file: File;
  preview: string | null;
  type: "image" | "video";
}

function VideoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <X size={16} className="sm:size-[18]" />
        </button>
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl object-contain bg-black sm:rounded-xl"
        />
      </div>
    </motion.div>
  );
}

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(4, 8, 20, 0.96)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all bg-white/10 text-white"
      >
        <X size={17} />
      </button>
      <div
        className="relative w-full max-w-5xl mx-auto px-4 sm:px-14"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          key={index}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          src={
            images[index]?.startsWith("http")
              ? images[index]
              : `${API_SERVER_URL}${images[index]}`
          }
          alt={`Portfolio image ${index + 1} of ${images.length}`}
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
              }
              className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all bg-white/10"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all bg-white/10"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-xs tabular-nums text-white/40">
          {index + 1} / {images.length}
        </span>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 20 : 5,
                background: i === index ? "#D4A047" : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Portfolio() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [editMode, setEditMode] = useState(false);
  const mountedRef = useRef(true);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  interface BeforeAfterItem {
    _id?: string;
    before: string;
    after: string;
    caption?: string;
    service?: string;
    mediaType?: "image" | "video";
    createdAt?: string;
  }
  const [beforeAfterItems, setBeforeAfterItems] = useState<BeforeAfterItem[]>([]);
  const [trendingStats, setTrendingStats] = useState<Record<string, TrendingStat>>({});
  const [stylistId, setStylistId] = useState("");
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const [transformActiveVideo, setTransformActiveVideo] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [showTransformForm, setShowTransformForm] = useState(false);
  const [transformUploading, setTransformUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const transformInputRef = useRef<HTMLInputElement>(null);
  const [transformPreview, setTransformPreview] = useState<string | null>(null);
  const [transformFileName, setTransformFileName] = useState<string>("");
  const [transformCaption, setTransformCaption] = useState("");
  const [transformService, setTransformService] = useState("");
  const [transformFileError, setTransformFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const transformUrlRef = useRef<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const candidate = error as {
        response?: { data?: { message?: unknown } };
        message?: unknown;
      };

      if (typeof candidate.response?.data?.message === "string") {
        return candidate.response.data.message;
      }

      if (typeof candidate.message === "string") {
        return candidate.message;
      }
    }

    return fallback;
  };

  const revokePreview = (url: string | null) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const handleTransformFile = () => {
    const file = transformInputRef.current?.files?.[0];
    if (!file) {
      setTransformPreview(null);
      setTransformFileName("");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setTransformFileError("File exceeds 100MB limit");
      setTransformPreview(null);
      setTransformFileName("");
      return;
    }
    setTransformFileError(null);
    setTransformFileName(file.name);
    revokePreview(transformUrlRef.current);
    const url = URL.createObjectURL(file);
    transformUrlRef.current = url;
    setTransformPreview(url);
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      revokePreview(transformUrlRef.current);
    };
  }, []);

  const fetchPortfolio = useCallback(async () => {
    const portfolioTimeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 15000);

    try {
      setLoading(true);
      setError(null);
      const [profileResult, statsResult] = await Promise.allSettled([
        withTimeout(getMyStylistProfile(), 12000, "Profile fetch"),
        withTimeout(
          getMyTrendingStats().catch(() => []),
          12000,
          "Trending stats fetch",
        ),
      ]);

      const profile =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const stats = statsResult.status === "fulfilled" ? statsResult.value : [];

      if (!profile) {
        if (profileResult.status === "rejected" && (profileResult.reason as any)?.response?.status === 404) {
          window.clearTimeout(portfolioTimeout);
          if (mountedRef.current) {
            setLoading(false);
            window.location.href = "/stylist/onboarding";
          }
          return;
        }
        throw new Error(
          profileResult.status === "rejected"
            ? (profileResult.reason as Error)?.message || "Failed to load portfolio"
            : "Stylist profile not available",
        );
      }

      if (!mountedRef.current) return;
      setStylistId(profile.id);
      setPortfolioItems((profile.portfolioImages || []).map(normalizeItem));
      setBeforeAfterItems(profile.beforeAfter || []);
      const statsMap: Record<string, TrendingStat> = {};
      for (const s of stats as TrendingStat[]) statsMap[s.transformationId] = s;
      setTrendingStats(statsMap);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setError(getErrorMessage(err, "Failed to load portfolio"));
    } finally {
      window.clearTimeout(portfolioTimeout);
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPortfolio();
  }, [fetchPortfolio]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const getMediaUrl = (item: PortfolioItem) => {
    const url = item.url;
    return url.startsWith("http") ? url : `${API_SERVER_URL}${url}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newPending: PendingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      type: "image" as const,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newPending: PendingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      type: "video" as const,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.preview) revokePreview(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const togglePendingType = (id: string) => {
    setPendingFiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              type:
                p.type === "image" ? ("video" as const) : ("image" as const),
            }
          : p,
      ),
    );
  };

  const handleSaveAll = async () => {
    if (pendingFiles.length === 0) return;
    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      pendingFiles.forEach((p) => formData.append("media", p.file));
      formData.append("types", JSON.stringify(pendingFiles.map((p) => p.type)));
      const result = await savePortfolioMedia(formData);
      if (!mountedRef.current) return;
      setPortfolioItems(result.portfolioImages);
      pendingFiles.forEach((p) => {
        if (p.preview) revokePreview(p.preview);
      });
      setPendingFiles([]);
      showSuccess(`Saved ${result.portfolioImages.length > 0 ? "media" : ""}`);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setError(getErrorMessage(err, "Save failed"));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const handleRemove = async (item: PortfolioItem) => {
    try {
      setDeletingId(item.url);
      setError(null);
      await api.delete("/stylists/portfolio", { data: { url: item.url } });
      if (!mountedRef.current) return;
      setPortfolioItems((prev) => prev.filter((p) => p.url !== item.url));
      showSuccess("Item removed");
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setError(getErrorMessage(err, "Failed to remove"));
    } finally {
      if (mountedRef.current) setDeletingId(null);
    }
  };

  const imgCount = portfolioItems.filter((i) => i.type === "image").length;
  const vidCount = portfolioItems.filter((i) => i.type === "video").length;
  const imageItems = portfolioItems.filter((i) => i.type === "image");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-40 skeleton-pulse" />
        <div className="h-4 w-64 skeleton-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square skeleton-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-text-primary dark:text-text-dark-primary">
            Portfolio
          </h1>
          <p className="text-xs mt-0.5 text-text-muted dark:text-text-dark-muted">
            Showcase your best work — images and videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPortfolio}
            variant="ghost-gray"
            size="sm"
            icon
            title="Refresh"
          >
            <RefreshCcw size={15} />
          </Button>
          {portfolioItems.length > 0 && (
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                editMode
                  ? "bg-error/10 text-error border border-error/20"
                  : "bg-gray-100 dark:bg-surface-dark-tertiary text-text-muted dark:text-text-dark-muted"
              }`}
            >
              {editMode ? "Done" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-error/10 border border-error/20">
          <AlertCircle size={14} className="text-error" />
          <p className="text-xs font-medium text-error">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-success/10 border border-success/20">
          <Check size={14} className="text-success" />
          <p className="text-xs font-medium text-success">{successMsg}</p>
        </div>
      )}

      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <Card elevated padding="none" className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-text-primary dark:text-text-dark-primary">
                    {pendingFiles.length}{" "}
                    {pendingFiles.length === 1 ? "item" : "items"} ready to save
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        pendingFiles.forEach((p) => {
                          if (p.preview) revokePreview(p.preview);
                        });
                        setPendingFiles([]);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Clear all
                    </Button>
                    <Button
                      onClick={handleSaveAll}
                      disabled={saving}
                      variant="primary"
                      size="sm"
                    >
                      {saving ? (
                        <><Loader2 size={13} className="animate-spin" /> Saving...</>
                      ) : (
                        <><Upload size={13} /> Save to Portfolio</>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {pendingFiles.map((p) => (
                    <div
                      key={p.id}
                      className="relative shrink-0 w-16 h-16 min-[480px]:w-20 min-[480px]:h-20 rounded-xl overflow-hidden group bg-gray-100 dark:bg-surface-dark-tertiary"
                    >
                      {p.type === "video" ? (
                        <video
                          src={p.preview}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : p.preview ? (
                        <img
                          src={p.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film
                            size={20}
                            className="text-text-muted dark:text-text-dark-muted"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                        <button
                          onClick={() => togglePendingType(p.id)}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold text-white ${
                            p.type === "video" ? "bg-amber-400 dark:bg-amber-500" : "bg-gray-900 dark:bg-gray-200"
                          }`}
                        >
                          {p.type === "video" ? "Video" : "Image"}
                        </button>
                        <button
                          onClick={() => removePendingFile(p.id)}
                          className="w-5 h-5 rounded-full flex items-center justify-center bg-white/90"
                        >
                          <X size={9} className="text-error" />
                        </button>
                      </div>
                      <div
                        className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded font-semibold text-white ${
                          p.type === "video" ? "bg-amber-400 dark:bg-amber-500" : "bg-gray-900 dark:bg-gray-200"
                        }`}
                      >
                        {p.type === "video" ? "V" : "I"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col min-[480px]:flex-row gap-3">
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-500 border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary">
          <ImageIcon
            size={18}
            className="text-text-muted dark:text-text-dark-muted"
          />
          <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">
            Add Images
          </span>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </label>
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-500 border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary">
          <Film
            size={18}
            className="text-text-muted dark:text-text-dark-muted"
          />
          <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">
            Add Videos
          </span>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            multiple
            className="hidden"
            onChange={handleVideoSelect}
          />
        </label>
      </div>

      {portfolioItems.length === 0 && pendingFiles.length === 0 ? (
        <Card elevated padding="none" className="overflow-hidden">
          <div className="text-center py-12 sm:py-20 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-surface-dark-secondary">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100 dark:bg-surface-dark-tertiary">
              <Camera
                size={28}
                className="text-text-muted dark:text-text-dark-muted"
              />
            </div>
            <p className="text-sm font-semibold mb-1 text-text-primary dark:text-text-dark-primary">
              No portfolio items yet
            </p>
            <p className="text-xs mb-5 text-text-muted dark:text-text-dark-muted">
              Upload images or videos to showcase your work
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
          {portfolioItems.map((item, i) => (
            <motion.div
              key={`${item.url}-${i}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group relative aspect-square overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary card-hover"
            >
              {item.type === "video" ? (
                <button
                  type="button"
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => setActiveVideo(item)}
                  aria-label="Play video"
                >
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(item.url, el);
                    }}
                    src={getMediaUrl(item)}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <polygon points="6,4 20,12 6,20" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-1.5 left-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                      Video
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => setLightbox({ open: true, index: i })}
                  aria-label="View image"
                >
                  <img
                    src={getMediaUrl(item)}
                    alt={`Portfolio ${i + 1}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              )}
              {editMode && (
                <button
                  onClick={() => handleRemove(item)}
                  disabled={deletingId === item.url}
                  className="absolute top-1 right-1 z-10 w-8 h-8 min-[480px]:w-6 min-[480px]:h-6 rounded-full flex items-center justify-center bg-black/60 shadow transition hover:bg-error"
                >
                  {deletingId === item.url ? (
                    <Loader2 size={10} className="animate-spin text-white" />
                  ) : (
                    <X size={10} className="text-white" />
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="pt-8 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold font-display text-text-primary dark:text-text-dark-primary">
              Transformations
            </h2>
            <p className="text-xs mt-0.5 text-text-muted dark:text-text-dark-muted">
              Showcase your work — appears in portfolio &amp; trending feed
            </p>
          </div>
          <Button
            onClick={() => setShowTransformForm(!showTransformForm)}
            variant="primary"
            size="md"
          >
            {showTransformForm ? <X size={14} /> : <Plus size={14} />}
            {showTransformForm ? "Cancel" : "Add Transformation"}
          </Button>
        </div>

      <AnimatePresence>
        {showTransformForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!transformUploading) {
                setShowTransformForm(false);
                setTransformPreview(null);
                setTransformFileName("");
                setTransformCaption("");
                setTransformService("");
                setTransformFileError(null);
                revokePreview(transformUrlRef.current);
                transformUrlRef.current = null;
                if (transformInputRef.current) transformInputRef.current.value = "";
              }
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary rounded-t-2xl sm:rounded-t-2xl">
                <h3 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">
                  Add Transformation
                </h3>
                <button
                  onClick={() => {
                    if (!transformUploading) {
                      setShowTransformForm(false);
                      setTransformPreview(null);
                      setTransformFileName("");
                      setTransformCaption("");
                      setTransformService("");
                      setTransformFileError(null);
                      revokePreview(transformUrlRef.current);
                      transformUrlRef.current = null;
                      if (transformInputRef.current) transformInputRef.current.value = "";
                    }
                  }}
                  disabled={transformUploading}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <p className="text-xs font-medium mb-1.5 text-text-secondary dark:text-text-dark-secondary">
                    Transformation Photo *
                  </p>
                  <label className="block cursor-pointer">
                    <div className="rounded-xl border-2 border-dashed flex items-center justify-center hover:border-indigo-300 dark:hover:border-indigo-500 transition-all border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary overflow-hidden min-h-[180px]">
                      <input
                        ref={transformInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleTransformFile}
                      />
                      {transformPreview ? (
                        <div className="relative w-full flex flex-col items-center justify-center p-3">
                          {transformFileName?.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? (
                            <video
                              src={transformPreview}
                              className="w-full object-contain rounded-lg max-h-48"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={transformPreview}
                              alt="Preview"
                              className="w-full object-contain rounded-lg max-h-48"
                            />
                          )}
                          <p className="text-xs font-medium truncate text-text-primary dark:text-text-dark-primary max-w-full mt-2 shrink-0">
                            {transformFileName}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-surface-dark-secondary">
                            <ImageIcon size={22} className="text-text-muted dark:text-text-dark-muted" />
                          </div>
                          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                            Upload transformation photo
                          </p>
                          <p className="text-[11px] text-text-muted dark:text-text-dark-muted">
                            Tap to select · PNG, JPG, MP4 up to 100MB
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <input
                    value={transformCaption}
                    onChange={(e) => setTransformCaption(e.target.value)}
                    placeholder="Caption (optional)"
                    className="rounded-xl px-3 py-2.5 text-xs outline-none bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 text-text-primary dark:text-text-dark-primary"
                  />
                  <input
                    value={transformService}
                    onChange={(e) => setTransformService(e.target.value)}
                    placeholder="Service name (optional)"
                    className="rounded-xl px-3 py-2.5 text-xs outline-none bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 text-text-primary dark:text-text-dark-primary"
                  />
                </div>

                {transformFileError && (
                  <div className="flex items-center gap-2 mb-3 rounded-xl px-3 py-2 bg-error/10">
                    <AlertCircle size={12} className="text-error" />
                    <p className="text-xs text-error">{transformFileError}</p>
                  </div>
                )}

                <Button
                  onClick={async () => {
                    const file = transformInputRef.current?.files?.[0];
                    if (!file) {
                      setTransformFileError("Please select a photo");
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      setTransformFileError("File must be under 100MB");
                      return;
                    }
                    setTransformUploading(true);
                    setTransformFileError(null);
                    try {
                      const formData = new FormData();
                      formData.append("image", file);
                      if (transformCaption.trim())
                        formData.append("caption", transformCaption.trim());
                      if (transformService.trim())
                        formData.append("service", transformService.trim());
                      const result = await addBeforeAfter(formData);
                      setBeforeAfterItems(result.beforeAfter);
                      setTransformCaption("");
                      setTransformService("");
                      setTransformPreview(null);
                      setTransformFileName("");
                      revokePreview(transformUrlRef.current);
                      transformUrlRef.current = null;
                      if (transformInputRef.current) transformInputRef.current.value = "";
                      setShowTransformForm(false);
                      showSuccess("Transformation added!");
                    } catch (err: unknown) {
                      setTransformFileError(getErrorMessage(err, "Upload failed"));
                    } finally {
                      setTransformUploading(false);
                    }
                  }}
                  disabled={transformUploading || !transformPreview}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  {transformUploading ? (
                    <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  ) : (
                    "Save Transformation"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {beforeAfterItems.length === 0 && !showTransformForm ? (
          <Card elevated padding="none" className="overflow-hidden">
            <div className="text-center py-8 sm:py-12">
              <Scissors size={28} className="mx-auto mb-2 text-text-muted dark:text-text-dark-muted" />
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                No transformations yet
              </p>
              <p className="text-xs mt-1 text-text-muted dark:text-text-dark-muted">
                Add your work to appear in the portfolio &amp; trending feed
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {beforeAfterItems.map((item: BeforeAfterItem, i: number) => {
              const itemKey = getTrendingTransformationKey(stylistId, item, i);
              const st = trendingStats[itemKey];
              const imgUrl = (path: string) =>
                path?.startsWith("http") ? path : `${API_SERVER_URL}${path}`;
              const fmt = (n: number) =>
                n >= 1000
                  ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`
                  : String(n);
              return (
                <motion.div
                  key={itemKey}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary card-hover"
                >
                  {item.mediaType === "video" ? (
                    <button
                      type="button"
                      onClick={() => setTransformActiveVideo(imgUrl(item.after))}
                      className="absolute inset-0 cursor-pointer"
                    >
                      <video
                        src={imgUrl(item.after)}
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                          Video
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="absolute inset-0">
                      <img
                        src={imgUrl(item.after)}
                        alt={item.caption || "Transformation"}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <button
                    onClick={async () => {
                      if (!window.confirm("Remove this transformation?")) return;
                      try {
                        const id = item._id ? item._id.toString() : String(i);
                        setDeletingId(id);
                        const result = await removeBeforeAfter(id);
                        if (!mountedRef.current) return;
                        setBeforeAfterItems(result.beforeAfter);
                        showSuccess("Transformation removed");
                      } catch (err: unknown) {
                        if (!mountedRef.current) return;
                        setError(getErrorMessage(err, "Failed to remove"));
                      } finally {
                        if (mountedRef.current) setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === (item._id ? item._id.toString() : String(i))}
                    className="absolute top-2 right-2 z-10 w-9 h-9 min-[480px]:w-7 min-[480px]:h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/50 hover:bg-red-500 shadow-md"
                  >
                    {deletingId === (item._id ? item._id.toString() : String(i)) ? (
                      <Loader2 size={10} className="animate-spin text-white" />
                    ) : (
                      <Trash2 size={11} className="text-white" />
                    )}
                  </button>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {item.caption && (
                          <p className="text-[11px] font-semibold truncate text-white drop-shadow-sm">
                            {item.caption}
                          </p>
                        )}
                        {item.service && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/20 backdrop-blur-sm text-white/90 inline-block mt-0.5">
                            {item.service}
                          </span>
                        )}
                      </div>
                      {st && (
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {st.likes > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/80">
                              <Heart size={8} className="text-red-400" fill="currentColor" />
                              {fmt(st.likes)}
                            </span>
                          )}
                          {st.likes + st.views > 100 && (
                            <Flame size={12} className="text-amber-400 fill-amber-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoViewer
            src={getMediaUrl(activeVideo)}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox.open && (
          <Lightbox
            key="lb"
            images={imageItems.map(getMediaUrl)}
            initialIndex={lightbox.index}
            onClose={() => setLightbox({ open: false, index: 0 })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transformActiveVideo && (
          <VideoViewer
            src={transformActiveVideo}
            onClose={() => setTransformActiveVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
