import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { WebsiteProvider } from "@/components/providers/WebsiteProvider";
import { getWebsiteConfig } from "@/lib/actions/api";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Generate metadata from website config at build/request time
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { website } = await getWebsiteConfig();
    
    return {
      title: website.seo?.title || "Lunarety - Find Your Perfect Getaway",
      description:
        website.seo?.description ||
        "Discover handpicked properties for your next adventure. Book with confidence and create unforgettable memories.",
      keywords: website.seo?.keywords?.join(", ") || undefined,
      icons: website.website?.faviconUrl
        ? { icon: website.website.faviconUrl }
        : undefined,
      openGraph: {
        title: website.seo?.title || "Lunarety - Find Your Perfect Getaway",
        description:
          website.seo?.description ||
          "Discover handpicked properties for your next adventure.",
        images: website.seo?.mediaUrls?.[0]
          ? [{ url: website.seo.mediaUrls[0] }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: website.seo?.title || "Lunarety - Find Your Perfect Getaway",
        description:
          website.seo?.description ||
          "Discover handpicked properties for your next adventure.",
        images: website.seo?.mediaUrls?.[0] || undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    // Fallback metadata
    return {
      title: "Lunarety - Find Your Perfect Getaway",
      description:
        "Discover handpicked properties for your next adventure. Book with confidence and create unforgettable memories.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <WebsiteProvider>{children}</WebsiteProvider>
      </body>
    </html>
  );
}
