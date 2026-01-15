"use client";

import * as React from "react";
import Image from "next/image";
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
  /** 
   * When true, shows a "peek" of adjacent images to indicate scrollability.
   * On mobile: no arrows, only peek effect with touch/drag scrolling
   * On desktop: arrows visible on hover with peek effect
   */
  peekMode?: boolean;
}

export function ImageCarousel({
  images,
  className,
  aspectRatio = "wide",
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  maxHeight,
  peekMode = false,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Touch/drag handling for peek mode
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartX, setDragStartX] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState(0);

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-[16/9]",
  };

  // When maxHeight is set, we limit the height while keeping aspect ratio
  const containerStyle: React.CSSProperties = maxHeight
    ? { maxHeight: `${maxHeight}px` }
    : {};

  // In peek mode, each slide takes ~85% width so adjacent images peek through
  const slideWidthPercent = peekMode ? 85 : 100;
  const gapPercent = peekMode ? 2 : 0;

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for peek mode
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!peekMode) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffset(0);
  }, [peekMode]);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging || !peekMode) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  }, [isDragging, dragStartX, peekMode]);

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging || !peekMode) return;
    setIsDragging(false);
    
    // Determine if we should navigate based on drag distance
    const threshold = 50;
    if (dragOffset > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (dragOffset < -threshold && currentIndex < images.length - 1) {
      goToNext();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, goToPrevious, goToNext, images.length, peekMode]);

  // Mouse drag handlers for peek mode on desktop
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!peekMode) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  }, [peekMode]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isDragging || !peekMode) return;
    const currentX = e.clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  }, [isDragging, dragStartX, peekMode]);

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging || !peekMode) return;
    setIsDragging(false);
    
    const threshold = 50;
    if (dragOffset > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (dragOffset < -threshold && currentIndex < images.length - 1) {
      goToNext();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, goToPrevious, goToNext, images.length, peekMode]);

  const handleMouseLeave = React.useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
    setIsHovered(false);
  }, [isDragging, handleMouseUp]);

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
          "relative w-full rounded-xl overflow-hidden bg-muted",
          aspectClasses[aspectRatio],
          className
        )}
        style={containerStyle}
      >
        <Image
          src={images[0].url}
          alt={images[0].alt || "Image"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Calculate transform for peek mode
  const calculateTransform = () => {
    if (peekMode) {
      // In peek mode, center the current slide with padding for peek effect
      // Each slide is 85% width + 2% gap = 87% per slide
      const slideStep = slideWidthPercent + gapPercent;
      // Start with offset to center first slide (leave space for peek on left side)
      const initialOffset = (100 - slideWidthPercent) / 2;
      const baseTransform = -currentIndex * slideStep + initialOffset;
      // Add drag offset as percentage of container width
      const containerWidth = containerRef.current?.offsetWidth || 1;
      const dragPercent = (dragOffset / containerWidth) * 100;
      return `translateX(calc(${baseTransform}% + ${dragPercent}%))`;
    }
    return `translateX(-${currentIndex * 100}%)`;
  };

  return (
    <div
      className={cn("relative w-full group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted",
          aspectClasses[aspectRatio],
          peekMode && "cursor-grab active:cursor-grabbing"
        )}
        style={containerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className={cn(
            "flex h-full",
            isDragging ? "transition-none" : "transition-transform duration-500 ease-out",
            peekMode && "gap-[2%]"
          )}
          style={{ 
            transform: calculateTransform(),
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "relative h-full flex-shrink-0",
                peekMode ? "rounded-lg overflow-hidden" : ""
              )}
              style={{ 
                minWidth: peekMode ? `${slideWidthPercent}%` : "100%",
                width: peekMode ? `${slideWidthPercent}%` : "100%",
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className={cn(
                  peekMode ? "object-cover" : "object-contain",
                  "select-none pointer-events-none"
                )}
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - hidden on mobile in peek mode */}
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg h-10 w-10 rounded-full",
            peekMode 
              ? "hidden md:flex opacity-0 group-hover:opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          )}
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg h-10 w-10 rounded-full",
            peekMode 
              ? "hidden md:flex opacity-0 group-hover:opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          )}
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
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
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
              <Image
                src={image.thumbnailUrl || image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

