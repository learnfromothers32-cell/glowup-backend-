import { useState, useRef, useCallback } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  imageUrl?: string | null;
  disabled?: boolean;
  className?: string;
  maxUploadSizeMB?: number;
}

export default function ImageUploader({ onUpload, imageUrl, disabled, className, maxUploadSizeMB = 100 }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = imageUrl || preview;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > maxUploadSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxUploadSizeMB}MB limit`);
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    onUpload(file);
  }, [onUpload, preview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }, [preview]);

  return (
    <div className={cn("relative", className)}>
      {error && (
        <div className="absolute top-2 left-2 right-2 z-10 p-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}
      {displayUrl ? (
        <div className="relative rounded-2xl overflow-hidden group bg-gray-100">
          <img
            src={displayUrl}
            alt="Upload preview"
            className="w-full aspect-[4/5] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-sm"
              aria-label="Remove photo"
            >
              <X size={15} />
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-3 left-3 text-[11px] font-medium text-white/80 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-black/60 transition-all"
            >
              Change photo
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={disabled}
          className={cn(
            "w-full aspect-[4/5] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4",
            dragOver
              ? "border-black bg-gray-50"
              : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Upload your photo</p>
            <p className="text-xs text-gray-400 mt-0.5">{`JPEG, PNG, WebP · Max ${maxUploadSizeMB}MB`}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Camera size={10} />
            <span>or drag and drop</span>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
