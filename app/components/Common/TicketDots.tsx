"use client";

import {
  DisplayStation,
  TicketStatus,
} from "@/graphql/generated";

export function ticketStatusColor(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.New: return "bg-blue-500";
    case TicketStatus.InProgress: return "bg-yellow-500";
    case TicketStatus.Completed: return "bg-green-500";
    case TicketStatus.Recalled: return "bg-orange-500";
    case TicketStatus.Cancelled: return "bg-gray-400";
    default: return "bg-gray-300";
  }
}

export function ticketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.New: return "New";
    case TicketStatus.InProgress: return "In Progress";
    case TicketStatus.Completed: return "Done";
    case TicketStatus.Recalled: return "Recalled";
    case TicketStatus.Cancelled: return "Cancelled";
    default: return status;
  }
}

type TicketDotsProps = {
  tickets?: Array<{ station: DisplayStation; status: TicketStatus }>;
};

export default function TicketDots({ tickets }: TicketDotsProps) {
  if (!tickets || tickets.length === 0) return null;
  const kitchen = tickets.find((t) => t.station === DisplayStation.Kitchen);
  const bar = tickets.find((t) => t.station === DisplayStation.Bar);
  return (
    <span className="inline-flex items-center gap-1.5">
      {kitchen && (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${ticketStatusColor(kitchen.status)}`}
          title={`Kitchen: ${ticketStatusLabel(kitchen.status)}`}
        />
      )}
      {bar && (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white ${ticketStatusColor(bar.status)}`}
          title={`Bar: ${ticketStatusLabel(bar.status)}`}
        />
      )}
    </span>
  );
}
