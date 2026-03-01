"use client";

import React, { useState, useCallback } from "react";
import { User } from "@prisma/client";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";
import Modal from "@/app/components/Common/Modal";
import { useLoginModal } from "@/lib/store";
import { AddReservationDocument } from "@/graphql/generated";
import DateTimePartyPicker from "./Reservation/DateTimePartyPicker";
import AreaPicker from "./Reservation/AreaPicker";
import TablePicker from "./Reservation/TablePicker";
import ConfirmationStep from "./Reservation/ConfirmationStep";

type Props = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
};

type BookingState = {
  step: 1 | 2 | 3 | 4;
  date: string;
  time: string;
  partySize: number;
  areaId: string | null;
  areaName: string | null;
  tableId: string | null;
  tableNumber: number | null;
};

const INITIAL: BookingState = {
  step: 1,
  date: "",
  time: "",
  partySize: 2,
  areaId: null,
  areaName: null,
  tableId: null,
  tableNumber: null,
};

const STEP_TITLES: Record<number, string> = {
  1: "When are you coming?",
  2: "Choose an area",
  3: "Pick a table",
  4: "Confirm your reservation",
};

export default function ReservationBookingModal({ user, isOpen, onClose }: Props) {
  const [state, setState] = useState<BookingState>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { onOpen: openLogin } = useLoginModal();
  const [, addReservation] = useMutation(AddReservationDocument);

  const reset = useCallback(() => {
    setState(INITIAL);
    setIsSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!user || !state.tableId || !state.date || !state.time) return;
    setIsSubmitting(true);

    const reservationTime = new Date(
      `${state.date}T${state.time}:00`
    ).toISOString();

    const result = await addReservation({
      userEmail: user.email,
      tableId: state.tableId,
      reservationTime,
      numOfDiners: state.partySize,
      createdBy: "USER",
    });

    setIsSubmitting(false);

    if (result.error) {
      const msg = result.error.message;
      toast.error(msg);
      if (msg.includes("just booked")) {
        setState((s) => ({ ...s, step: 3, tableId: null, tableNumber: null }));
      }
    } else {
      toast.success("Reservation confirmed!");
      handleClose();
    }
  };

  if (!user && isOpen) {
    openLogin();
    onClose();
    return null;
  }

  return (
    <Modal isOpen={isOpen} closeModal={handleClose} title={STEP_TITLES[state.step]}>
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              s <= state.step ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-bold text-gray-400">{state.step}/4</span>
      </div>

      {state.step === 1 && (
        <DateTimePartyPicker
          date={state.date}
          time={state.time}
          partySize={state.partySize}
          onDateChange={(d) => setState((s) => ({ ...s, date: d }))}
          onTimeChange={(t) => setState((s) => ({ ...s, time: t }))}
          onPartySizeChange={(n) => setState((s) => ({ ...s, partySize: n }))}
          onNext={() => setState((s) => ({ ...s, step: 2 }))}
        />
      )}

      {state.step === 2 && (
        <AreaPicker
          date={state.date}
          time={state.time}
          numOfDiners={state.partySize}
          onSelectArea={(id, name) =>
            setState((s) => ({ ...s, areaId: id, areaName: name, step: 3, tableId: null, tableNumber: null }))
          }
          onBack={() => setState((s) => ({ ...s, step: 1 }))}
        />
      )}

      {state.step === 3 && state.areaId && state.areaName && user && (
        <TablePicker
          date={state.date}
          time={state.time}
          numOfDiners={state.partySize}
          areaId={state.areaId}
          areaName={state.areaName}
          userEmail={user.email ?? ""}
          selectedTableId={state.tableId}
          onSelectTable={(id, num) =>
            setState((s) => ({ ...s, tableId: id, tableNumber: num }))
          }
          onBack={() => setState((s) => ({ ...s, step: 2 }))}
          onNext={() => setState((s) => ({ ...s, step: 4 }))}
          onBackToAreaPicker={() =>
            setState((s) => ({ ...s, step: 2, areaId: null, areaName: null, tableId: null, tableNumber: null }))
          }
        />
      )}

      {state.step === 4 && state.areaName && state.tableNumber && (
        <ConfirmationStep
          date={state.date}
          time={state.time}
          partySize={state.partySize}
          areaName={state.areaName}
          tableNumber={state.tableNumber}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirm}
          onBack={() => setState((s) => ({ ...s, step: 3 }))}
        />
      )}
    </Modal>
  );
}
