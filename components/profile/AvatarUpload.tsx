"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";

type AvatarUploadProps = {
  initialUrl?: string | null;
  onUploadComplete?: (url: string) => void;
};

export function AvatarUpload({ initialUrl, onUploadComplete }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(initialUrl ?? "");
  }, [initialUrl]);

  const handleContainerClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // File validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    
    // Max 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (!hasSupabaseConfig()) {
        // Mock mode: Convert to base64 Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            setAvatarUrl(result);
            onUploadComplete?.(result);
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Supabase mode
        const supabase = createClient();
        
        // 1. Get authenticated user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("You must be signed in to upload images.");
        }

        // 2. Prepare file path (sanitize & create unique name under user's directory)
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        // 3. Upload to avatars bucket
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        // 5. Update state and notify parent
        setAvatarUrl(publicUrl);
        onUploadComplete?.(publicUrl);
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      setError(err.message || "An error occurred during upload.");
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarUrl("");
    onUploadComplete?.("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="font-sans text-xs font-bold uppercase tracking-[0.1em]">
        profile photo
      </span>
      <div className="flex items-center gap-6">
        <div
          onClick={handleContainerClick}
          className="relative aspect-square w-32 border border-black bg-gray-50 cursor-pointer group overflow-hidden transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar preview"
              fill
              sizes="128px"
              className="object-cover grayscale transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1.5">
              <Camera className="h-6 w-6 stroke-[1.5] text-black" />
              <span className="font-mono text-[10px] text-black font-bold uppercase tracking-wider">
                Upload
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          {avatarUrl && !isUploading && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center gap-1.5 text-white">
              <Camera className="h-5 w-5" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                Change Photo
              </span>
            </div>
          )}

          {/* Uploading Spinner Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1.5 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider animate-pulse">
                Uploading...
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={handleContainerClick}
            disabled={isUploading}
            className="border border-black bg-white px-4 py-2 font-mono text-xs font-bold text-black uppercase hover:bg-black hover:text-white transition-colors duration-150 disabled:opacity-50"
          >
            {avatarUrl ? "Upload New" : "Choose Image"}
          </button>
          
          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="border border-transparent bg-transparent px-4 py-2 font-mono text-xs font-bold text-gray-500 hover:text-black uppercase text-left transition-colors duration-150 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="font-mono text-xs text-red-600 border border-black bg-red-50 px-3 py-2 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
