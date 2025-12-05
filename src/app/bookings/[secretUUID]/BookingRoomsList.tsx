"use client";

import { BedIcon } from "lucide-react";
import { formatCurrency, type BookingRoom } from "@/lib/types";

interface BookingRoomsListProps {
  rooms: BookingRoom[];
  currency?: string;
}

export function BookingRoomsList({ rooms, currency }: BookingRoomsListProps) {
  if (!rooms || rooms.length === 0) return null;

  return (
    <div>
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <BedIcon className="h-4 w-4" />
        Booked Rooms
      </h4>
      <div className="space-y-2">
        {rooms.map((room, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div>
              <p className="font-medium">{room.roomName}</p>
              <p className="text-sm text-muted-foreground">
                {room.adults} adult{room.adults !== 1 ? "s" : ""}
                {room.children > 0 &&
                  `, ${room.children} child${room.children !== 1 ? "ren" : ""}`}
              </p>
            </div>
            <span className="font-semibold">
              {formatCurrency(room.price, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

