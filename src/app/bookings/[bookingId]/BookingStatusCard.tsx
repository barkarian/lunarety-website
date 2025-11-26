"use client";

import {
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
}

const statusConfigs: Record<string, StatusConfig> = {
  pending: {
    icon: ClockIcon,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Pending Confirmation",
    description:
      "Your booking is being reviewed. You'll receive confirmation shortly.",
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
  completed: {
    icon: CheckCircle2Icon,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Completed",
    description: "Thank you for staying with us!",
  },
};

interface BookingStatusCardProps {
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

export function BookingStatusCard({ status }: BookingStatusCardProps) {
  const config = statusConfigs[status] || statusConfigs.pending;
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

