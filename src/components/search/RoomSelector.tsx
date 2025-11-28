"use client";

import * as React from "react";
import { MinusIcon, PlusIcon, UsersIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RoomOccupancy } from "@/lib/types";

interface RoomSelectorProps {
  rooms: RoomOccupancy[];
  onRoomsChange: (rooms: RoomOccupancy[]) => void;
  className?: string;
}

export function RoomSelector({
  rooms,
  onRoomsChange,
  className,
}: RoomSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const totalGuests = rooms.reduce(
    (acc, room) => acc + room.adults + room.children,
    0
  );

  const updateRoom = (
    index: number,
    field: "adults" | "children",
    delta: number
  ) => {
    const newRooms = [...rooms];
    const newValue = newRooms[index][field] + delta;

    if (field === "adults" && newValue >= 1 && newValue <= 6) {
      newRooms[index].adults = newValue;
      onRoomsChange(newRooms);
    } else if (field === "children" && newValue >= 0 && newValue <= 4) {
      newRooms[index].children = newValue;
      onRoomsChange(newRooms);
    }
  };

  const addRoom = () => {
    if (rooms.length < 5) {
      onRoomsChange([...rooms, { adults: 2, children: 0 }]);
    }
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      const newRooms = rooms.filter((_, i) => i !== index);
      onRoomsChange(newRooms);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-14 px-4",
            className
          )}
        >
          <UsersIcon className="mr-3 h-5 w-5 opacity-60" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Guests & Rooms
            </span>
            <span className="text-sm">
              {totalGuests} guest{totalGuests !== 1 ? "s" : ""}, {rooms.length}{" "}
              room{rooms.length !== 1 ? "s" : ""}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {rooms.map((room, index) => (
            <div
              key={index}
              className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Room {index + 1}</span>
                {rooms.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRoom(index)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Adults</p>
                  <p className="text-xs text-muted-foreground">Age 18+</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateRoom(index, "adults", -1)}
                    disabled={room.adults <= 1}
                    className="h-8 w-8"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {room.adults}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateRoom(index, "adults", 1)}
                    disabled={room.adults >= 6}
                    className="h-8 w-8"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Children</p>
                  <p className="text-xs text-muted-foreground">Age 0-17</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateRoom(index, "children", -1)}
                    disabled={room.children <= 0}
                    className="h-8 w-8"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {room.children}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateRoom(index, "children", 1)}
                    disabled={room.children >= 4}
                    className="h-8 w-8"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {rooms.length < 5 && (
            <Button
              variant="outline"
              onClick={addRoom}
              className="w-full"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add another room
            </Button>
          )}

          <Button onClick={() => setOpen(false)} className="w-full">
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}


