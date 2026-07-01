import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Check, Loader2, AlertTriangle } from "lucide-react";
import { useHairTryOn } from "../hooks/useHairTryOn";
import { HAIRSTYLES } from "../data/hairstyles";
import Button from "@/components/ui/Button";

interface CameraCaptureProps {
  onComplete: (hairstyleId: string) => void;
  onBack: () => void;
}

export default function CameraCapture({ onComplete, onBack }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const {
    activeHairstyle,
    faceDetected,
    modelLoaded,
    modelLoading,
    modelError,
    loadingTimedOut,
    loadModel,
    retryLoad,
    startTryOn,
    stopTryOn,
    nextHairstyle,
    prevHairstyle,
    selectHairstyle,
  } = useHairTryOn();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setCameraError(null);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please enable camera permissions.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not start camera: " + (err?.message || "Unknown error"));
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const flipCamera = useCallback(() => {
    stopCamera();
    stopTryOn();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, [stopCamera, stopTryOn]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      stopTryOn();
    };
  }, []);

  useEffect(() => {
    if (facingMode && !streamRef.current) {
      startCamera();
    }
  }, [facingMode]);

  const handleVideoReady = useCallback(() => {
    if (!modelLoaded && !modelLoading) {
      loadModel();
    }
  }, [modelLoaded, modelLoading, loadModel]);

  useEffect(() => {
    if (modelLoaded && cameraReady && videoRef.current && overlayCanvasRef.current) {
      startTryOn(videoRef.current, overlayCanvasRef.current, facingMode === "user");
    }
  }, [modelLoaded, cameraReady, facingMode]);

  const handleCapture = useCallback(() => {
    onComplete(activeHairstyle.id);
  }, [activeHairstyle, onComplete]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-black rounded-xl overflow-hidden">
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 z-20">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
          <p className="text-center text-lg font-medium mb-2">Camera Unavailable</p>
          <p className="text-center text-sm text-gray-300 mb-6">{cameraError}</p>
          <Button onClick={startCamera} className="bg-amber-500 hover:bg-amber-600 text-black">
            Try Again
          </Button>
        </div>
      )}

      {!cameraError && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
            onLoadedData={handleVideoReady}
          />

          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
          />

          {!faceDetected && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-2 border-dashed border-white/30 rounded-2xl w-48 h-64 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/40" />
              </div>
            </div>
          )}

          {modelLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full z-20 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading face detection...
            </div>
          )}

          {loadingTimedOut && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              <div className="bg-red-900/80 text-white text-xs px-3 py-1.5 rounded-full">
                Model timed out
              </div>
              <button
                onClick={retryLoad}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {modelError && !loadingTimedOut && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-white text-xs px-3 py-1.5 rounded-full z-20">
              {modelError}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-6 z-20">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevHairstyle}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Previous hairstyle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <p className="text-white font-semibold text-sm">{activeHairstyle.name}</p>
                <p className="text-white/60 text-xs capitalize">{activeHairstyle.category}</p>
              </div>

              <button
                onClick={nextHairstyle}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Next hairstyle"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
              {HAIRSTYLES.map((hair) => (
                <button
                  key={hair.id}
                  onClick={() => selectHairstyle(hair.id)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all ${
                    activeHairstyle.id === hair.id
                      ? "border-amber-400 scale-110"
                      : "border-white/30 hover:border-white/60"
                  }`}
                  style={{ backgroundColor: hair.preview }}
                  title={hair.name}
                />
              ))}
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handleCapture}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                Pick This Style
              </Button>
            </div>

            <button
              onClick={flipCamera}
              className="mt-2 mx-auto flex items-center gap-1.5 text-white/50 text-xs hover:text-white/80 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Flip camera
            </button>
          </div>
        </>
      )}
    </div>
  );
}
