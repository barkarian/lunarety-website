"use client";

import Link from "next/link";
import Image from "next/image";
import { useWebsite } from "@/components/providers/WebsiteProvider";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header() {
  const { logo } = useWebsite();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logo ? (
              <Image
                src={logo}
                alt="Logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-primary">Lunarety</span>
            )}
          </Link>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
