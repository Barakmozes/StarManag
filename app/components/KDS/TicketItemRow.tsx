"use client";

import { TicketItemStatus } from "@/graphql/generated";

interface TicketItemRowProps {
  item: {
    id: string;
    menuTitle: string;
    quantity: number;
    instructions: string;
    prepare: string;
    status: TicketItemStatus;
  };
  onToggle: (itemId: string, newStatus: TicketItemStatus) => void;
}

const nextStatus: Record<string, TicketItemStatus> = {
  PENDING: TicketItemStatus.InProgress,
  IN_PROGRESS: TicketItemStatus.Done,
  DONE: TicketItemStatus.Pending,
};

export default function TicketItemRow({ item, onToggle }: TicketItemRowProps) {
  const isDone = item.status === TicketItemStatus.Done;
  const isCancelled = item.status === TicketItemStatus.Cancelled;
  const isInProgress = item.status === TicketItemStatus.InProgress;

  const handleClick = () => {
    if (isCancelled) return;
    const next = nextStatus[item.status] ?? TicketItemStatus.Pending;
    onToggle(item.id, next);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCancelled}
      className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors
        ${isDone ? "bg-green-900/30 line-through opacity-60" : ""}
        ${isCancelled ? "bg-red-900/20 line-through opacity-40 cursor-not-allowed" : ""}
        ${isInProgress ? "bg-yellow-900/20" : ""}
        ${!isDone && !isCancelled && !isInProgress ? "hover:bg-gray-700/50" : ""}
      `}
    >
      {/* Status indicator */}
      <span className="mt-0.5 flex-shrink-0 text-lg">
        {isDone && "✓"}
        {isCancelled && "✕"}
        {isInProgress && "▶"}
        {item.status === TicketItemStatus.Pending && "○"}
      </span>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-white text-sm">
            {item.quantity}x
          </span>
          <span className="text-white text-sm truncate">{item.menuTitle}</span>
        </div>

        {item.prepare && (
          <span className="inline-block mt-0.5 rounded bg-gray-600/60 px-1.5 py-0.5 text-xs text-gray-300">
            {item.prepare}
          </span>
        )}

        {item.instructions && (
          <p className="mt-0.5 text-xs italic text-yellow-300/80 truncate">
            {item.instructions}
          </p>
        )}
      </div>
    </button>
  );
}
