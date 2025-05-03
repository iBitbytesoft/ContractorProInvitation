import { useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  onChange: (file: File | null) => void;
  defaultValue?: string;
  label?: string;
  className?: string;
  isLoading?: boolean;
  previewUrl?: string;
}

export function FileUpload({
  accept = "image/*",
  onChange,
  defaultValue,
  label = "Upload File",
  className,
  isLoading = false,
  previewUrl
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || defaultValue || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col items-center gap-4">
        {/* Preview Area */}
        {preview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span>Uploading...</span>
              </div>
            ) : (
              "Choose File"
            )}
          </Button>
          {!isLoading && preview && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                onChange(null);
                const input = document.getElementById('file-upload') as HTMLInputElement;
                if (input) input.value = '';
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}