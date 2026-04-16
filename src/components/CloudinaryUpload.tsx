import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { uploadToCloudinary, isCloudinaryUrl } from "@/lib/cloudinary";

interface CloudinaryUploadProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function CloudinaryUpload({
  currentImageUrl,
  onUpload,
  folder = "apple-store",
  label = "ছবি আপলোড",
  className = "",
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি ফাইল আপলোড করা যাবে");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ছবির সাইজ ১০MB এর বেশি হতে পারবে না");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, folder);
      onUpload(result.secure_url);
      toast.success("ছবি সফলভাবে আপলোড হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "ছবি আপলোড ব্যর্থ");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  const handleRemove = () => {
    setPreviewUrl(null);
    onUpload("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-foreground">{label}</label>

      {/* Preview */}
      {displayUrl && (
        <div className="relative w-24 h-24 rounded-xl border-2 border-accent/30 overflow-hidden bg-muted group">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-accent/30 hover:bg-accent/10"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          {uploading ? "আপলোড হচ্ছে..." : "ফাইল বাছুন"}
        </Button>

        {/* Camera capture */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="border-accent/30 hover:bg-accent/10"
        >
          <Camera className="w-4 h-4 mr-1" />
          ক্যামেরা
        </Button>
      </div>

      {currentImageUrl && isCloudinaryUrl(currentImageUrl) && (
        <p className="text-xs text-green-600">✅ Cloudinary-তে সংরক্ষিত</p>
      )}
    </div>
  );
}
