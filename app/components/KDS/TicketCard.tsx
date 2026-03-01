"use client";

import { TicketStatus, TicketItemStatus } from "@/graphql/generated";
import ElapsedTimer from "./ElapsedTimer";
import OrderTypeBadge from "./OrderTypeBadge";
import TicketItemRow from "./TicketItemRow";

export interface TicketData {
  id: string;
  orderId: string;
  station: string;
  status: TicketStatus;
  priority: number;
  createdAt: any;
  updatedAt: any;
  orderNumber: string;
  tableId?: string | null;
  tableNumber?: number | null;
  orderNote?: string | null;
  specialNotes?: string | null;
  orderDate: any;
  userName: string;
  orderType: string;
  siblingTicketStatus?: string | null;
  items: Array<{
    id: string;
    menuItemId?: string | null;
    menuTitle: string;
    quantity: number;
    instructions: string;
    prepare: string;
    category: string;
    status: TicketItemStatus;
  }>;
}

interface TicketCardProps {
  ticket: TicketData;
  currentTime: Date;
  accentColor: string;
  onBump: (ticketId: string, status: TicketStatus) => void;
  onItemToggle: (itemId: string, newStatus: TicketItemStatus) => void;
}

const SIBLING_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Done",
  RECALLED: "Recalled",
  CANCELLED: "Cancelled",
};

export default function TicketCard({
  ticket,
  currentTime,
  accentColor,
  onBump,
  onItemToggle,
}: TicketCardProps) {
  const isRush = ticket.priority > 0;
  const isCancelled = ticket.status === TicketStatus.Cancelled;
  const isCompleted = ticket.status === TicketStatus.Completed;
  const siblingStation = ticket.station === "KITCHEN" ? "Bar" : "Kitchen";

  // Determine the next bump status
  let bumpLabel = "";
  let bumpStatus: TicketStatus | null = null;
  if (ticket.status === TicketStatus.New) {
    bumpLabel = "Start";
    bumpStatus = TicketStatus.InProgress;
  } else if (ticket.status === TicketStatus.InProgress) {
    bumpLabel = "Done";
    bumpStatus = TicketStatus.Completed;
  }

  return (
    <div
      className={`relative flex flex-col rounded-lg border-2 transition-all
        ${isRush ? "border-red-500 shadow-red-500/30 shadow-lg" : "border-gray-600"}
        ${isCancelled ? "opacity-40 line-through" : ""}
        ${isCompleted ? "opacity-70 border-green-700" : ""}
        bg-gray-800
      `}
    >
      {/* Rush badge */}
      {isRush && (
        <div className="absolute -top-2 -right-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white animate-pulse">
          RUSH
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-black"
            style={{ color: accentColor }}
          >
            #{ticket.orderNumber.slice(-4)}
          </span>
          <OrderTypeBadge
            orderType={ticket.orderType}
            tableNumber={ticket.tableNumber}
          />
        </div>
        <ElapsedTimer orderDate={ticket.orderDate} currentTime={currentTime} />
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700/50">
        <span>{ticket.userName}</span>
        {ticket.siblingTicketStatus && (
          <span className="inline-flex items-center gap-1 rounded bg-gray-700/60 px-1.5 py-0.5 text-xs">
            <span className="text-gray-400">{siblingStation}:</span>
            <span className="text-gray-200">
              {SIBLING_LABELS[ticket.siblingTicketStatus] ??
                ticket.siblingTicketStatus}
            </span>
          </span>
        )}
      </div>

      {/* Notes */}
      {(ticket.orderNote || ticket.specialNotes) && (
        <div className="border-b border-gray-700/50 px-3 py-1.5">
          {ticket.orderNote && (
            <p className="text-xs text-yellow-300">
              Note: {ticket.orderNote}
            </p>
          )}
          {ticket.specialNotes && (
            <p className="text-xs text-orange-300">
              Special: {ticket.specialNotes}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 space-y-0.5 px-2 py-2 overflow-y-auto max-h-[300px]">
        {ticket.items.map((item) => (
          <TicketItemRow
            key={item.id}
            item={item}
            onToggle={onItemToggle}
          />
        ))}
      </div>

      {/* Bump button */}
      {bumpStatus && !isCancelled && (
        <div className="border-t border-gray-700 p-2">
          <button
            onClick={() => onBump(ticket.id, bumpStatus!)}
            className="w-full rounded py-2.5 text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            {bumpLabel}
          </button>
        </div>
      )}
    </div>
  );
}
