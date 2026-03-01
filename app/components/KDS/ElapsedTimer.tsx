"use client";

interface ElapsedTimerProps {
  orderDate: Date;
  currentTime: Date;
}

export default function ElapsedTimer({ orderDate, currentTime }: ElapsedTimerProps) {
  const diff = Math.max(0, currentTime.getTime() - new Date(orderDate).getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let colorClass = "text-green-400";
  if (minutes >= 20) colorClass = "text-red-400 font-bold";
  else if (minutes >= 10) colorClass = "text-yellow-400";

  return (
    <span className={`font-mono text-sm ${colorClass}`}>
      {minutes}m {seconds.toString().padStart(2, "0")}s
    </span>
  );
}
