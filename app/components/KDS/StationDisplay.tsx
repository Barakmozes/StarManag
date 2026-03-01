"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "urql";
import { User } from "@prisma/client";
import {
  GetKitchenTicketsDocument,
  BumpTicketStatusDocument,
  UpdateTicketItemStatusDocument,
  DisplayStation,
  TicketStatus,
  TicketItemStatus,
} from "@/graphql/generated";
import { useKdsStore } from "@/lib/kdsStore";
import StationHeader from "./StationHeader";
import TicketCard, { TicketData } from "./TicketCard";

interface StationDisplayProps {
  station: "KITCHEN" | "BAR";
  user: User;
  accentColor: string;
  title: string;
}

const POLL_INTERVAL = 5000;
const MAX_BACKOFF = 30000;

function getBackoffInterval(errors: number): number {
  if (errors <= 1) return POLL_INTERVAL;
  const ms = Math.min(POLL_INTERVAL * Math.pow(2, errors - 1), MAX_BACKOFF);
  return ms;
}

export default function StationDisplay({
  station,
  user,
  accentColor,
  title,
}: StationDisplayProps) {
  const {
    soundEnabled,
    completedVisible,
    consecutiveErrors,
    toggleSound,
    toggleCompleted,
    incrementErrors,
    resetErrors,
  } = useKdsStore();

  // Hydrate Zustand store on mount
  useEffect(() => {
    useKdsStore.persist.rehydrate();
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [lastPollTs, setLastPollTs] = useState<string | null>(null);
  const prevTicketIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isFirstPollRef = useRef(true);

  // urql query
  const stationEnum =
    station === "KITCHEN" ? DisplayStation.Kitchen : DisplayStation.Bar;

  const [queryResult, reexecuteQuery] = useQuery({
    query: GetKitchenTicketsDocument,
    variables: {
      station: stationEnum,
      updatedAfter: lastPollTs,
    },
    pause: true,
  });

  // Mutations
  const [, bumpTicket] = useMutation(BumpTicketStatusDocument);
  const [, updateItem] = useMutation(UpdateTicketItemStatusDocument);

  // Tick clock every second
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Polling
  useEffect(() => {
    const poll = () => {
      reexecuteQuery({ requestPolicy: "network-only" });
    };

    // Initial fetch (no updatedAfter)
    poll();

    const backoff = getBackoffInterval(consecutiveErrors);
    const id = setInterval(poll, backoff);
    return () => clearInterval(id);
  }, [reexecuteQuery, consecutiveErrors]);

  // Process query results
  useEffect(() => {
    if (queryResult.fetching) return;

    if (queryResult.error) {
      incrementErrors();
      return;
    }

    if (queryResult.data?.getKitchenTickets) {
      resetErrors();

      const incoming = queryResult.data.getKitchenTickets as TicketData[];

      if (isFirstPollRef.current || !lastPollTs) {
        // First load or full refetch: replace all
        setTickets(incoming);
        const ids = new Set(incoming.map((t) => t.id));
        prevTicketIdsRef.current = ids;
        isFirstPollRef.current = false;
      } else {
        // Delta merge: update existing, add new
        setTickets((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          for (const t of incoming) {
            map.set(t.id, t);
          }
          return Array.from(map.values());
        });

        // Detect new tickets for sound notification
        if (soundEnabled) {
          const newIds = incoming
            .filter((t) => !prevTicketIdsRef.current.has(t.id))
            .map((t) => t.id);
          if (newIds.length > 0) {
            playNotificationSound();
          }
        }

        // Update tracked IDs
        for (const t of incoming) {
          prevTicketIdsRef.current.add(t.id);
        }
      }

      // Update poll timestamp for delta
      const maxUpdated = incoming.reduce((max, t) => {
        const ts = new Date(t.updatedAt).getTime();
        return ts > max ? ts : max;
      }, lastPollTs ? new Date(lastPollTs).getTime() : 0);

      if (maxUpdated > 0) {
        setLastPollTs(new Date(maxUpdated).toISOString());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryResult.data, queryResult.error, queryResult.fetching]);

  // Sound
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const handleEnableSound = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    audioCtxRef.current.resume().then(() => {
      if (!soundEnabled) toggleSound();
    });
  };

  // Handlers
  const handleBump = (ticketId: string, status: TicketStatus) => {
    bumpTicket({ ticketId, status }).then((res) => {
      if (!res.error) {
        // Optimistic: update local state
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  items:
                    status === TicketStatus.Completed
                      ? t.items.map((i) => ({
                          ...i,
                          status:
                            i.status === TicketItemStatus.Cancelled
                              ? i.status
                              : TicketItemStatus.Done,
                        }))
                      : t.items,
                }
              : t
          )
        );
      }
    });
  };

  const handleItemToggle = (itemId: string, newStatus: TicketItemStatus) => {
    updateItem({ itemId, status: newStatus }).then((res) => {
      if (!res.error) {
        setTickets((prev) =>
          prev.map((t) => ({
            ...t,
            items: t.items.map((i) =>
              i.id === itemId ? { ...i, status: newStatus } : i
            ),
          }))
        );
      }
    });
  };

  // Group tickets into lanes
  const newTickets = tickets.filter((t) => t.status === TicketStatus.New);
  const inProgressTickets = tickets.filter(
    (t) => t.status === TicketStatus.InProgress || t.status === TicketStatus.Recalled
  );
  const completedTickets = completedVisible
    ? tickets.filter((t) => t.status === TicketStatus.Completed)
    : [];
  const cancelledTickets = tickets.filter(
    (t) => t.status === TicketStatus.Cancelled
  );

  const connectionOk = consecutiveErrors < 3;

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <StationHeader
        title={title}
        accentColor={accentColor}
        soundEnabled={soundEnabled}
        completedVisible={completedVisible}
        connectionOk={connectionOk}
        newCount={newTickets.length}
        inProgressCount={inProgressTickets.length}
        onToggleSound={toggleSound}
        onToggleCompleted={toggleCompleted}
        onEnableSound={handleEnableSound}
      />

      {/* Connection lost banner */}
      {!connectionOk && (
        <div className="flex items-center justify-center bg-red-700 py-3 text-lg font-bold text-white animate-pulse">
          CONNECTION LOST — Retrying...
        </div>
      )}

      {/* Main grid */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-min overflow-y-auto">
          {/* NEW tickets */}
          {newTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              currentTime={currentTime}
              accentColor={accentColor}
              onBump={handleBump}
              onItemToggle={handleItemToggle}
            />
          ))}

          {/* IN_PROGRESS tickets */}
          {inProgressTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              currentTime={currentTime}
              accentColor={accentColor}
              onBump={handleBump}
              onItemToggle={handleItemToggle}
            />
          ))}

          {/* Recently CANCELLED (brief display) */}
          {cancelledTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              currentTime={currentTime}
              accentColor={accentColor}
              onBump={handleBump}
              onItemToggle={handleItemToggle}
            />
          ))}

          {/* COMPLETED tickets (if toggled on) */}
          {completedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              currentTime={currentTime}
              accentColor={accentColor}
              onBump={handleBump}
              onItemToggle={handleItemToggle}
            />
          ))}

          {/* Empty state */}
          {tickets.length === 0 && !queryResult.fetching && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
              <svg
                className="mb-4 h-16 w-16 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-lg">No active tickets</p>
              <p className="text-sm">New orders will appear here automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
