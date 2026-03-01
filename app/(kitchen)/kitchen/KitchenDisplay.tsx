"use client";

import { User } from "@prisma/client";
import StationDisplay from "@/app/components/KDS/StationDisplay";

interface KitchenDisplayProps {
  user: User;
}

export default function KitchenDisplay({ user }: KitchenDisplayProps) {
  return (
    <StationDisplay
      station="KITCHEN"
      user={user}
      accentColor="#f97316"
      title="Kitchen Display"
    />
  );
}
