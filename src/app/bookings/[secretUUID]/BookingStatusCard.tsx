"use client";

import {
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Booking } from "@/lib/types";

type BookingStatus = Booking["status"];

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
}

const statusConfigs: Record<BookingStatus, StatusConfig> = {
  inquiry: {
    icon: ClockIcon,
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    label: "Inquiry Received",
    description:
      "We haven't held this booking yet. We'll contact you shortly to confirm the details.",
  },
  "on-hold": {
    icon: ClockIcon,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    label: "On Hold",
    description:
      "We've held this booking for you. Watch for our confirmation or any follow-up requests.",
  },
  confirmed: {
    icon: CheckCircle2Icon,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Confirmed",
    description: "Your booking is confirmed. We look forward to hosting you!",
  },
  cancelled: {
    icon: XCircleIcon,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Cancelled",
    description: "This booking has been cancelled.",
  },
  "no-show": {
    icon: XCircleIcon,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "No Show",
    description: "This booking was marked as a no-show.",
  },
};

interface BookingStatusCardProps {
  status: BookingStatus;
}

export function BookingStatusCard({ status }: BookingStatusCardProps) {
  const config = statusConfigs[status] || statusConfigs.inquiry;
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.color} border-2`}>
      <CardContent className="py-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <StatusIcon className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{config.label}</h2>
            <p className="text-sm opacity-80">{config.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

