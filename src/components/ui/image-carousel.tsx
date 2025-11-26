"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: Array<{ url: string; thumbnailUrl?: string; alt?: string }>;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  /** Fixed maximum height in pixels. When set, overrides aspect ratio for a consistent height. */
  maxHeight?: number;
}

export function ImageCarousel({
  images,
  className,
  aspectRatio = "wide",
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  maxHeight,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-[16/9]",
  };

  // When maxHeight is set, we limit the height while keeping aspect ratio
  const containerStyle: React.CSSProperties = maxHeight
    ? { maxHeight: `${maxHeight}px` }
    : {};

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || isHovered || images.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, goToNext, images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          "relative w-full bg-muted rounded-xl overflow-hidden flex items-center justify-center",
          aspectClasses[aspectRatio],
          className
        )}
        style={containerStyle}
      >
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center",
          aspectClasses[aspectRatio],
          className
        )}
        style={containerStyle}
      >
        <img
          src={images[0].url}
          alt={images[0].alt || "Image"}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted",
          aspectClasses[aspectRatio]
        )}
        style={containerStyle}
      >
        <div
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="w-full h-full flex-shrink-0 flex items-center justify-center"
              style={{ minWidth: "100%" }}
            >
              <img
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="secondary"
          size="icon"
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg h-10 w-10 rounded-full"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg h-10 w-10 rounded-full"
          aria-label="Next image"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>

        {/* Slide Counter */}
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-medium shadow-lg">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all ring-2",
                index === currentIndex
                  ? "ring-primary opacity-100"
                  : "ring-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

