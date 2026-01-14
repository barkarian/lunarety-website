"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserBaseType } from "./auth-store";

// Website configuration type based on WebsiteService response
export interface WebsiteConfig {
  id: number;
  websiteOwner: number;
  type: "platformMarketplace" | "managerMarketplace" | "ownerMarketplace";
  /**
   * Defines which user types can use this website
   * - all: Anyone can browse and book without authentication
   * - all-or-guests: Optional auth, sign-up creates guests only
   * - agents: Required auth, agents only
   */
  userBaseType?: UserBaseType | null;
  platformProperties?: {
    docs?: Array<number>;
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  managerProperties?: {
    docs?: Array<number>;
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  ownerProperties?: {
    docs?: Array<number>;
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  websiteApiKey: string;
  website?: {
    websiteName?: string | null;
    logo?: number | null;
    logoUrl?: string | null;
    favicon?: number | null;
    faviconUrl?: string | null;
  };
  ai?: {
    supportsAi: boolean;
  };
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: Array<string> | null;
    media?: Array<number> | null;
    mediaUrls?: Array<string> | null;
  };
  channelManagerConfig?: {
    channelManagers?: Array<"beds24"> | null;
    beds24?: {
      channelUserId?: string | null;
      filterChannelPropertyIds?: Array<string> | null;
    };
  };
  updatedAt: string;
  createdAt: string;
}

interface WebsiteStore {
  // State
  website: WebsiteConfig | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setWebsite: (website: WebsiteConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWebsite: () => void;

  // Computed/getters
  getLogo: () => string | null;
  getFavicon: () => string | null;
  getSeo: () => WebsiteConfig["seo"] | null;
  getUserBaseType: () => UserBaseType | null;
  getWebsiteName: () => string;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

export const useWebsiteStore = create<WebsiteStore>()(
  persist(
    (set, get) => ({
      // Initial state
      website: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      // Actions
      setWebsite: (website) =>
        set({
          website,
          lastFetched: Date.now(),
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      clearWebsite: () =>
        set({
          website: null,
          lastFetched: null,
          error: null,
        }),

      // Getters
      getLogo: () => {
        const website = get().website;
        return website?.website?.logoUrl || null;
      },

      getFavicon: () => {
        const website = get().website;
        return website?.website?.faviconUrl || null;
      },

      getSeo: () => {
        const website = get().website;
        return website?.seo || null;
      },

      getUserBaseType: () => {
        const website = get().website;
        return website?.userBaseType || null;
      },

      getWebsiteName: () => {
        const website = get().website;
        return website?.website?.websiteName || website?.seo?.title || "the team";
      },
    }),
    {
      name: "website-config",
      partialize: (state) => ({
        website: state.website,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

// Helper to check if cache is valid
export function isCacheValid(lastFetched: number | null): boolean {
  if (!lastFetched) return false;
  return Date.now() - lastFetched < CACHE_DURATION;
}

