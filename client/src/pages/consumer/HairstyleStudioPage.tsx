import { useState, useCallback, useRef, useMemo } from "react";
import { Sparkles, Download, Heart, ArrowLeftRight, RotateCcw, Check, X, Image as ImageIcon, Camera, ChevronRight, Star, Shield, Zap, Globe, CreditCard, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { logger } from "../../utils/logger";
import { useHairstyles, useGenerateHairstyle, useResults, useSaveFavorite, useDeleteResult } from "../../hooks/useHairstyles";
import type { HairstyleResult, Hairstyle } from "../../api/hairstyles";
import type { FaceGeometry } from "../../utils/hairstyleMediaPipe";
import { detectFaceOnImage } from "../../utils/hairstyleMediaPipe";
import { generateHairMask } from "../../utils/hairMask";
import { cn } from "../../utils/cn";
import { compositeHairstyle, generateHairstylePreview } from "../../utils/hairstyleOverlay";
import { FALLBACK_HAIRSTYLES } from "../../data/fallbackHairstyles";
import BeforeAfterSlider from "../../components/hairstyle-studio/BeforeAfterSlider";
import FaceAnalysisCard from "../../components/hairstyle-studio/FaceAnalysisCard";
import LanguageSwitcher from "../../components/seo/LanguageSwitcher";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

const CATEGORIES = [
  { id: "all", labelKey: "categories.all" },
  { id: "men", labelKey: "categories.men" },
  { id: "women", labelKey: "categories.women" },
  { id: "unisex", labelKey: "categories.unisex" },
];

const FEATURES_DATA = [
  { icon: ArrowLeftRight, titleKey: "features.compare", descKey: "features.compareDesc" },
  { icon: Sparkles, titleKey: "features.realistic", descKey: "features.realisticDesc" },
  { icon: Info, titleKey: "features.faceShape", descKey: "features.faceShapeDesc" },
  { icon: Shield, titleKey: "features.free", descKey: "features.freeDesc" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function HairstyleStudioPage() {
  const { t, i18n } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<HairstyleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [category, setCategory] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<{ x: number; y: number }[] | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const [faceDetecting, setFaceDetecting] = useState(false);
  const [credits, setCredits] = useState<number>(() => {
    const stored = localStorage.getItem("hairstyle_credits");
    const val = stored ? Number(stored) : 0;
    if (val <= 0) {
      localStorage.setItem("hairstyle_credits", "5");
      return 5;
    }
    return val;
  });
  const [creditPackages, setCreditPackages] = useState<Array<{ _id: string; name: string; credits: number; price: number; popular: boolean }> | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<{ faceShape: string; confidence: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generationIdRef = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: apiHairstyles, error: hairstylesError } = useHairstyles();
  const hairstyles = apiHairstyles && apiHairstyles.length > 0 ? apiHairstyles : FALLBACK_HAIRSTYLES;
  const { data: results = [], isLoading: resultsLoading } = useResults();
  const generateMutation = useGenerateHairstyle();
  const saveFavoriteMutation = useSaveFavorite();
  const deleteMutation = useDeleteResult();

  const hasPhoto = !!uploadedFile && !!photoUrl;
  const isGenerating = !!selectedHairstyle && !generatedImage;
  const hasResult = !!generatedImage;

  const filteredHairstyles = category === "all"
    ? hairstyles
    : hairstyles.filter((h) => h.category === category);

  const thumbnails = useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of hairstyles) {
      map[h.slug] = generateHairstylePreview(h.slug, 200, h.previewImage);
    }
    return map;
  }, [hairstyles]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setUploadedFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setGeneratedImage(null);
    setSelectedHairstyle(null);
    setCurrentResult(null);
    setError(null);
    setFaceGeometry(null);
    setFaceAnalysis(null);

    setFaceDetecting(true);
    setFaceLandmarks(null);
    setImageDimensions(null);
    const img = new Image();
    img.onload = async () => {
      setImageDimensions({ w: img.width, h: img.height });
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs"
        );
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });
        const result = landmarker.detect(img, {
          imageWidth: img.width,
          imageHeight: img.height,
        });
        const landmarks = result.faceLandmarks?.[0];
        if (landmarks) {
          const lmData = landmarks.map((l: any) => ({ x: l.x, y: l.y, z: l.z }));
          setFaceLandmarks(lmData);
          setFaceAnalysis({ faceShape: "oval", confidence: 0.5 });
        }
        const geo = await detectFaceOnImage(img);
        setFaceGeometry(geo);
        setFaceDetecting(false);
      } catch {
        setFaceDetecting(false);
      }
    };
    img.onerror = () => setFaceDetecting(false);
    img.src = URL.createObjectURL(file);
  }, [photoUrl]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSelectHairstyle = useCallback((id: string) => {
    const hairstyle = hairstyles.find((h) => (h._id || h.id) === id) || null;
    if (!hairstyle || !uploadedFile) return;

    const currentCredits = credits ?? 0;
    if (currentCredits <= 0) {
      setShowCredits(true);
      return;
    }

    setError(null);
    setSelectedHairstyle(hairstyle);
    setGeneratedImage(null);
    setCurrentResult(null);
    setShowBefore(false);

    setCredits((prev) => {
      const next = (prev ?? 5) - 1;
      localStorage.setItem("hairstyle_credits", String(next));
      return next;
    });

    const genId = ++generationIdRef.current;

    const dims = imageDimensions;
    const maskDataUrl = dims ? generateHairMask(dims.w, dims.h, faceLandmarks) : undefined;

    if (photoUrl) {
      compositeHairstyle(photoUrl, hairstyle.slug, faceGeometry)
        .then((dataUrl) => {
          if (genId === generationIdRef.current) setGeneratedImage(dataUrl);
        })
        .catch((err) => {
          logger.error("Compositing failed:", err);
          if (genId === generationIdRef.current) setGeneratedImage(photoUrl);
        });
    }

    generateMutation.mutate(
      { hairstyleId: id, image: uploadedFile, hairMask: maskDataUrl },
      {
        onSuccess: (data) => {
          if (genId === generationIdRef.current) setCurrentResult(data.result);
        },
        onError: () => {
          if (genId === generationIdRef.current && !generatedImage) {
            setError("Generation failed. The preview is shown without AI enhancement.");
          }
        },
      }
    );
  }, [hairstyles, uploadedFile, generateMutation, photoUrl, faceGeometry, faceLandmarks, imageDimensions, credits]);

  const handleToggleFavorite = useCallback((resultId: string) => {
    saveFavoriteMutation.mutate(resultId);
  }, [saveFavoriteMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleReset = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setUploadedFile(null);
    setSelectedHairstyle(null);
    setGeneratedImage(null);
    setCurrentResult(null);
    setError(null);
    setFaceGeometry(null);
    setFaceDetecting(false);
  }, [photoUrl]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.download = `hairstyle-${selectedHairstyle?.slug || "preview"}.png`;
    link.href = generatedImage;
    link.click();
  }, [generatedImage, selectedHairstyle]);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark-secondary" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 dark:bg-surface-dark/95 dark:border-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{t("app.name")}</h1>
                <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{t("app.tagline")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Credits badge */}
              {credits !== null && (
                <button
                  onClick={() => setShowCredits(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
                >
                  <Zap size={11} />
                  {credits}
                </button>
              )}

              <LanguageSwitcher />

              {results.length > 0 && (
                <button
                  onClick={() => setShowSavedModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 transition-all"
                >
                  <Heart size={12} />
                  <span className="hidden sm:inline">{t("studio.saved")} ({results.length})</span>
                </button>
              )}
              {hasPhoto && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 transition-all"
                >
                  <RotateCcw size={12} />
                  <span className="hidden sm:inline">{t("studio.newPhoto")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {!hasPhoto ? (
          /* ── Upload State ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8 pt-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-900/15"
              >
                <Sparkles size={32} className="text-white" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-3">
                {t("hero.title")}
              </h2>
              <p className="text-sm sm:text-base text-text-muted dark:text-text-dark-muted max-w-lg mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>

              {/* Credit indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  <Zap size={11} />
                  {credits !== null ? `${credits} ${t("credits.free")} ${t("credits.freeHint")}` : "5 free credits"}
                </span>
              </div>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                dragOver
                  ? "border-black bg-gray-50 dark:bg-surface-dark-tertiary"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-surface-dark-tertiary/50 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
              )}
            >
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-sm border border-gray-100 dark:border-gray-700/40 flex items-center justify-center mb-5">
                    <ImageIcon size={32} className="text-text-muted dark:text-text-dark-muted" />
                  </div>
                  <p className="text-base font-semibold text-text-primary dark:text-text-dark-primary mb-1">
                    {t("upload.drop")}
                  </p>
                  <p className="text-sm text-text-muted dark:text-text-dark-muted mb-4">
                    {t("upload.browse")}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted mb-4">
                    <Camera size={12} />
                    <span>{t("upload.maxSize")}</span>
                  </div>
                <Button size="lg" className="shadow-lg shadow-black/10">
                  <Camera size={14} /> {t("upload.cta")}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium text-text-muted dark:text-text-dark-muted text-center mb-3 uppercase tracking-wider">{t("upload.sample")}</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border border-gray-100 dark:border-gray-700/40 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all overflow-hidden"
                    onClick={() => {
                      const images = [
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
                        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
                      ];
                      fetch(images[i - 1])
                        .then((r) => r.blob())
                        .then((blob) => handleFile(new File([blob], `sample-${i}.jpg`, { type: "image/jpeg" })))
                        .catch(() => {});
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-text-muted dark:text-text-dark-muted">
                      <ImageIcon size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 pb-4">
              {["Free", "Private", "150+ styles", "AI-powered"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 text-[11px] font-medium text-text-muted dark:text-text-dark-muted">
                  {tag}
                </span>
              ))}
            </div>

            {/* ═══ How It Works Section ═══ */}
            <div className="mt-8 pb-8 border-t border-gray-100 dark:border-gray-700/40 pt-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{t("howItWorks.title")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { step: "1", titleKey: "howItWorks.step1", descKey: "howItWorks.step1desc" },
                  { step: "2", titleKey: "howItWorks.step2", descKey: "howItWorks.step2desc" },
                  { step: "3", titleKey: "howItWorks.step3", descKey: "howItWorks.step3desc" },
                ].map((item) => (
                  <div key={item.step} className="text-center p-4 rounded-2xl bg-gray-50/50 dark:bg-surface-dark-tertiary/50">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center mx-auto mb-3 text-sm font-bold dark:bg-white dark:text-gray-900">{item.step}</div>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1">{t(item.titleKey)}</h4>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted">{t(item.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Features Section ═══ */}
            <div className="mt-6 pb-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{t("features.title")}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {FEATURES_DATA.map((feat) => (
                  <div key={feat.titleKey} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary text-center">
                    <feat.icon size={18} className="text-text-primary dark:text-text-dark-primary mx-auto mb-2" />
                    <h4 className="text-xs font-semibold text-text-primary dark:text-text-dark-primary mb-1">{t(feat.titleKey)}</h4>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted leading-relaxed">{t(feat.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Reviews / Social Proof ═══ */}
            <div className="pb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 px-6 rounded-2xl bg-gray-50/70 dark:bg-surface-dark-tertiary/70 border border-gray-100 dark:border-gray-700/40">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-sm font-bold text-text-primary dark:text-text-dark-primary">4.9</span>
                  <span className="text-xs text-text-muted dark:text-text-dark-muted">(1M+ reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted dark:text-text-dark-muted">
                  <Globe size={12} />
                  <span>10 languages</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted dark:text-text-dark-muted">
                  <Shield size={12} />
                  <span>Private & secure</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Tool View ── */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: Photo / Result */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[65%]">
              <div className="relative bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm overflow-hidden">
                {error && (
                  <div className="absolute top-3 left-3 right-3 z-20 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {error}
                  </div>
                )}

                {isGenerating ? (
                  <div className="aspect-[4/5] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-black dark:border-t-white animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">{t("studio.generating")}</p>
                      {selectedHairstyle && (
                        <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1">{selectedHairstyle.name}</p>
                      )}
                    </div>
                  </div>
                ) : hasResult && showBefore && photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Original"
                    className="w-full aspect-[4/5] object-cover"
                  />
                ) : hasResult ? (
                  generatedImage ? (
                    generatedImage.startsWith("data:") || generatedImage.startsWith("http") || generatedImage.startsWith("/") ? (
                      <img
                        src={generatedImage}
                        alt={selectedHairstyle?.name || "Hairstyle preview"}
                        className="w-full aspect-[4/5] object-cover"
                      />
                    ) : null
                  ) : null
                ) : (
                  <img
                    src={photoUrl!}
                    alt="Your photo"
                    className="w-full aspect-[4/5] object-cover"
                  />
                )}

                {hasPhoto && !isGenerating && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                      {hasResult && showBefore ? t("studio.original") : selectedHairstyle?.name || t("studio.yourPhoto")}
                    </span>
                    {faceDetecting && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white bg-blue-600/60 backdrop-blur-sm px-2 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {t("face.detecting")}
                      </span>
                    )}
                    {faceGeometry && faceGeometry.confidence > 0 && !faceDetecting && (
                      <span className="inline-flex items-center text-[11px] text-white bg-green-600/40 backdrop-blur-sm px-2 py-1.5 rounded-lg">
                        {t("face.detected")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {hasResult && !isGenerating && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setShowBefore(!showBefore)}
                    className={cn(
                      "flex items-center gap-1.5 h-9 px-4 rounded-xl border text-xs font-semibold transition-all",
                      showBefore
                        ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                        : "border-gray-200 dark:border-gray-600 text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary hover:border-gray-300"
                    )}
                  >
                    <ArrowLeftRight size={13} />
                    {showBefore ? t("studio.showResult") : t("studio.compare")}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary hover:border-gray-300 transition-all"
                  >
                    <Download size={13} />
                    {t("studio.download")}
                  </button>

                  {currentResult && (
                    <button
                      onClick={() => handleToggleFavorite(currentResult._id)}
                      className={cn(
                        "flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all",
                        currentResult.favorite
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                          : "border border-gray-200 dark:border-gray-600 text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
                      )}
                    >
                      <Heart size={13} className={currentResult.favorite ? "fill-red-500" : ""} />
                      {currentResult.favorite ? t("studio.saved") : t("studio.save")}
                    </button>
                  )}
                </div>
              )}

              {/* Before/After Slider */}
              {hasResult && !isGenerating && photoUrl && generatedImage && !generatedImage.startsWith("data:") && (
                <div className="mt-4">
                  <BeforeAfterSlider before={photoUrl} after={generatedImage} />
                </div>
              )}

              {/* Face Analysis */}
              {faceAnalysis && !isGenerating && (
                <div className="mt-4">
                  <FaceAnalysisCard analysis={faceAnalysis} loading={false} />
                </div>
              )}
            </div>

            {/* Right: Hairstyle Selector */}
            <div className="w-full lg:w-[320px] shrink-0">
              <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm">
                {/* Header */}
                <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-700/40">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{t("studio.hairstyles")}</h2>
                    <button
                      onClick={() => setShowGalleryModal(true)}
                      className="text-xs font-semibold text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary transition-colors"
                    >
                      {t("studio.viewAll")}
                    </button>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                            category === cat.id
                              ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                              : "bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {t(cat.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hairstyle Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                    {filteredHairstyles.map((hairstyle) => {
                      const id = hairstyle._id || hairstyle.id;
                      const isSelected = selectedHairstyle?._id === id || selectedHairstyle?.id === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleSelectHairstyle(id)}
                          disabled={isGenerating}
                          className={cn(
                            "relative rounded-2xl overflow-hidden transition-all duration-200 border",
                            isSelected
                              ? "border-gray-900 ring-1 ring-gray-900 shadow-md"
                              : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm",
                            isGenerating && !isSelected && "opacity-40 cursor-not-allowed"
                          )}>
                          <div className="aspect-[3/4] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 relative">
                            <img
                              src={thumbnails[hairstyle.slug] || ""}
                              alt={hairstyle.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center shadow dark:bg-gray-200">
                                <Check size={8} className="text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-4">
                              <p className="text-[10px] font-semibold text-white">{hairstyle.name}</p>
                              <p className="text-[8px] text-white/50 capitalize">{hairstyle.category}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {hairstylesError && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">
                      Failed to load hairstyles
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Gallery Modal ── */}
      <AnimatePresence>
        {showGalleryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowGalleryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/40">
                <h2 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{t("studio.hairstyles")}</h2>
                <button
                  onClick={() => setShowGalleryModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                      category === cat.id
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                    >
                      {t(cat.labelKey)} ({cat.id === "all" ? hairstyles.length : hairstyles.filter((h) => h.category === cat.id).length})
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {filteredHairstyles.map((hairstyle) => {
                    const id = hairstyle._id || hairstyle.id;
                    const isSelected = selectedHairstyle?._id === id || selectedHairstyle?.id === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { handleSelectHairstyle(id); setShowGalleryModal(false); }}
                          className={cn(
                            "relative rounded-2xl overflow-hidden transition-all border",
                            isSelected ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-100 dark:border-gray-700/40 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <div className="aspect-square bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                          <img
                            src={thumbnails[hairstyle.slug] || ""}
                            alt={hairstyle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-gray-900 flex items-center justify-center dark:bg-gray-200">
                            <Check size={7} className="text-white" />
                          </div>
                        )}
                        <div className="p-1.5">
                          <p className="text-[9px] font-semibold text-text-primary dark:text-text-dark-primary truncate">{hairstyle.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Saved Looks Modal ── */}
      <AnimatePresence>
        {showSavedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSavedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/40">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-text-muted dark:text-text-dark-muted" />
                  <h2 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{t("studio.savedLooks")}</h2>
                  <span className="text-xs text-text-muted dark:text-text-dark-muted">{results.length}</span>
                </div>
                <button
                  onClick={() => setShowSavedModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                  {resultsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-2xl" />
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart size={24} className="text-text-muted dark:text-text-dark-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted dark:text-text-dark-muted">{t("studio.noSaved")}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{t("studio.noSavedHint")}</p>
                  </div>
                ) : (
                  <div className="space-y-2" ref={resultsRef}>
                    {results.map((result) => {
                      const hairstyle = typeof result.hairstyleId === "object" ? result.hairstyleId : null;
                      return (
                        <div
                          key={result._id}
                          onClick={() => { setGeneratedImage(result.generatedImage || null); setShowSavedModal(false); if (hairstyle) setSelectedHairstyle(hairstyle as unknown as Hairstyle); }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            {result.generatedImage ? (
                              <img src={result.generatedImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={14} className="text-text-muted dark:text-text-dark-muted" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{hairstyle?.name || "Hairstyle"}</p>
                            <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-0.5">{formatDate(result.createdAt)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(result._id); }}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                              result.favorite ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-text-muted dark:text-text-dark-muted hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <Heart size={12} className={result.favorite ? "fill-red-400" : ""} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(result._id); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Credits Modal ── */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{t("credits.title")}</h2>
                  </div>
                  <button
                    onClick={() => setShowCredits(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Balance */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 mb-4">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">{t("credits.balance")}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-amber-900 dark:text-amber-300">{credits ?? 0}</span>
                    <span className="text-sm text-amber-600 dark:text-amber-400">{t("credits.free")}</span>
                  </div>
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">{t("credits.freeHint")}</p>
                </div>

                {/* Packages */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-2">{t("credits.purchase")}</p>
                  {[
                    { name: "Starter Pack", credits: 10, price: 2.99, popular: false },
                    { name: "Popular Pack", credits: 50, price: 9.99, popular: true },
                    { name: "Pro Pack", credits: 150, price: 19.99, popular: false },
                    { name: "Unlimited Pack", credits: 500, price: 49.99, popular: false },
                  ].map((pkg) => (
                    <button
                      key={pkg.name}
                      disabled
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left",
                        pkg.popular
                          ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20"
                          : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-surface-dark-secondary"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{pkg.name}</span>
                          {pkg.popular && (
                            <Badge variant="warning" size="sm">POPULAR</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{pkg.credits} credits</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-text-primary dark:text-text-dark-primary">${pkg.price}</span>
                        <CreditCard size={12} className="text-text-muted dark:text-text-dark-muted" />
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-text-muted dark:text-text-dark-muted text-center mt-4">Payments via Paystack · Secure checkout</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
    </div>
  );
}
