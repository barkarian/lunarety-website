"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
}

export function BackButton({ label = "Back", fallbackHref = "/" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback if no history (e.g., direct link access)
      router.push(fallbackHref);
    }
  };

  return (
    <Button variant="ghost" size="sm" className="gap-2" onClick={handleBack}>
      <ArrowLeftIcon className="h-4 w-4" />
      {label}
    </Button>
  );
}
