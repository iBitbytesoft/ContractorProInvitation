import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageDisplayProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const ImageDisplay = ({
  src,
  alt,
  width,
  height,
  className,
  ...props
}: ImageDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Reset error state when src changes
    if (src) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [src]);

  return (
    <div className="relative overflow-hidden rounded-md">
      {!imageError ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn("object-cover", className, !imageLoaded && "opacity-0")}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          {...props}
        />
      ) : (
        <div 
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground", 
            className
          )}
          style={{ width, height, minWidth: width, minHeight: height }}
        >
          Image not available
        </div>
      )}
    </div>
  );
};