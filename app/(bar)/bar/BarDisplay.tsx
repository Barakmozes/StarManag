"use client";

import { User } from "@prisma/client";
import StationDisplay from "@/app/components/KDS/StationDisplay";
import ClockInOutButton from "@/app/components/Restaurant_interface/ClockInOutButton";

interface BarDisplayProps {
  user: User;
}

export default function BarDisplay({ user }: BarDisplayProps) {
  return (
    <>
      <StationDisplay
        station="BAR"
        user={user}
        accentColor="#3b82f6"
        title="Bar Display"
      />
      <ClockInOutButton />
    </>
  );
}
