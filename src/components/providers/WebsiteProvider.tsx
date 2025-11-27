"use client";

import * as React from "react";
import { useWebsiteStore, isCacheValid } from "@/lib/store/website-store";
import { getWebsiteConfig } from "@/lib/actions/api";

interface WebsiteProviderProps {
  children: React.ReactNode;
}

export function WebsiteProvider({ children }: WebsiteProviderProps) {
  const {
    website,
    lastFetched,
    isLoading,
    setWebsite,
    setLoading,
    setError,
  } = useWebsiteStore();

  const hasFetched = React.useRef(false);

  React.useEffect(() => {
    // Prevent double-fetching in StrictMode
    if (hasFetched.current) return;

    async function initializeWebsite() {
      // Check if we have valid cached data
      if (website && isCacheValid(lastFetched)) {
        return;
      }

      hasFetched.current = true;
      setLoading(true);

      try {
        const response = await getWebsiteConfig();
        setWebsite(response.website);
      } catch (error) {
        console.error("Failed to load website config:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load website configuration"
        );
      } finally {
        setLoading(false);
      }
    }

    initializeWebsite();
  }, [website, lastFetched, setWebsite, setLoading, setError]);

  // Set favicon dynamically when website config is loaded
  React.useEffect(() => {
    if (website?.website?.faviconUrl) {
      // Update favicon link element
      const existingLink = document.querySelector("link[rel='icon']");
      if (existingLink) {
        existingLink.setAttribute("href", website.website.faviconUrl);
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = website.website.faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [website?.website?.faviconUrl]);

  // Update document title with SEO title if available
  React.useEffect(() => {
    if (website?.seo?.title) {
      // Only update if we're on the home page (no specific page title)
      const currentTitle = document.title;
      const defaultTitle = "Lunarety - Find Your Perfect Getaway";
      if (currentTitle === defaultTitle || !currentTitle) {
        document.title = website.seo.title;
      }
    }
  }, [website?.seo?.title]);

  // We could show a loading state, but for better UX we render children immediately
  // The metadata will update once loaded
  return <>{children}</>;
}

// Export a hook to easily access website config in components
export function useWebsite() {
  const store = useWebsiteStore();
  return {
    website: store.website,
    isLoading: store.isLoading,
    error: store.error,
    logo: store.getLogo(),
    favicon: store.getFavicon(),
    seo: store.getSeo(),
  };
}

