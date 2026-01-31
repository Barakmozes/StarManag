"use client";

import React, { useMemo, useState } from "react";
import Modal from "@/app/components/Common/Modal";
import { useMutation, useQuery } from "@urql/next";
import {
  ASSIGN_DRIVER_TO_ORDER,
  GET_DELIVERY_DRIVERS,
} from "./deliveries.gql";
import { useDeliveriesToast } from "./DeliveriesToast";
import { getGqlErrorMessage } from "./utils";
import { Role } from "@/graphql/generated";
import { HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";

type Props = {
  orderNumber: string;
  onDone: () => void;
};

type Driver = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  profile?: { phone?: string | null } | null;
};

export default function AssignDriver({ orderNumber, onDone }: Props) {
  const toast = useDeliveriesToast();

  const [isOpen, setIsOpen] = useState(false);

  // selection + search
  const [q, setQ] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // manual fallback (if missing phone/name)
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const [{ fetching: fetchingDrivers, data: driversData, error: driversErr }] =
    useQuery<{ getUsers: Driver[] }>({
      query: GET_DELIVERY_DRIVERS,
      pause: !isOpen, // fetch only when modal opened
      requestPolicy: "cache-and-network",
    });

  const [{ fetching: assigning }, assign] = useMutation(ASSIGN_DRIVER_TO_ORDER);

  const allDrivers = useMemo(() => {
    const users = driversData?.getUsers ?? [];
    return users.filter((u) => u.role === Role.Delivery);
  }, [driversData]);

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return allDrivers.find((d) => d.id === selectedDriverId) ?? null;
  }, [allDrivers, selectedDriverId]);

  const filteredDrivers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allDrivers;

    return allDrivers.filter((d) => {
      const name = (d.name ?? "").toLowerCase();
      const email = (d.email ?? "").toLowerCase();
      const phone = (d.profile?.phone ?? "").toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [allDrivers, q]);

  // when selecting a driver, auto-fill inputs (still editable)
  function pickDriver(driver: Driver) {
    setSelectedDriverId(driver.id);
    setDriverName(driver.name ?? "");
    setDriverEmail(driver.email ?? "");
    setDriverPhone(driver.profile?.phone ?? "");
  }

  const canSubmit = useMemo(() => {
    const nameOk = driverName.trim().length >= 2;
    const emailOk = driverEmail.trim().includes("@");
    const phoneOk = driverPhone.trim().length >= 7;
    return nameOk && emailOk && phoneOk;
  }, [driverName, driverEmail, driverPhone]);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setQ("");
    setSelectedDriverId("");
    // keep values? you can decide; I reset to avoid mistakes
    setDriverName("");
    setDriverEmail("");
    setDriverPhone("");
  }

  async function onAssign() {
    if (!canSubmit) {
      toast.error("Please select a driver with valid name/email/phone");
      return;
    }

    const res = await assign({
      orderNumber,
      driverName: driverName.trim(),
      driverEmail: driverEmail.trim(),
      driverPhone: driverPhone.trim(),
    });

    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }

    toast.success("Driver assigned successfully");
    closeModal();
    onDone();
  }

  return (
    <>
      <button
        className="px-3 py-1 rounded-full text-sm bg-orange-500 hover:bg-orange-600 text-white transition"
        onClick={openModal}
      >
        Assign Driver
      </button>

      <Modal
        isOpen={isOpen}
        closeModal={closeModal}
        title={`Assign Delivery Driver (#${orderNumber})`}
      >
        <div className="p-2 space-y-4">
          {/* Search + count */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">
                Delivery Drivers
              </span>
              <span className="px-2 py-0.5 rounded-full border bg-white">
                {allDrivers.length}
              </span>
            </div>

            <div className="relative w-full sm:w-[320px]">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border rounded-full pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="Search by name / email / phone"
              />
            </div>
          </div>

          {/* Drivers list */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="max-h-64 overflow-auto">
              {driversErr && (
                <div className="p-3 text-sm text-red-600">
                  {getGqlErrorMessage(driversErr as any)}
                </div>
              )}

              {fetchingDrivers && (
                <div className="p-3 text-sm text-slate-500">
                  Loading drivers...
                </div>
              )}

              {!fetchingDrivers && filteredDrivers.length === 0 && (
                <div className="p-3 text-sm text-slate-500">
                  No delivery drivers found.
                </div>
              )}

              {!fetchingDrivers &&
                filteredDrivers.map((d) => {
                  const active = d.id === selectedDriverId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => pickDriver(d)}
                      className={[
                        "w-full text-left p-3 border-b last:border-b-0 transition flex items-center justify-between gap-3",
                        active ? "bg-orange-50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={[
                            "h-9 w-9 rounded-lg border flex items-center justify-center",
                            active ? "bg-white" : "bg-white",
                          ].join(" ")}
                        >
                          <HiOutlineUser className="text-slate-600" />
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {d.name || "Unnamed driver"}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {d.email || "No email"} •{" "}
                            {d.profile?.phone || "No phone"}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={[
                            "text-xs px-2 py-1 rounded-full border",
                            active
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white text-slate-600 border-slate-200",
                          ].join(" ")}
                        >
                          {active ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Selected driver quick preview */}
          {selectedDriver && (
            <div className="rounded-xl border bg-orange-50 p-3 text-sm">
              <div className="font-semibold text-slate-800">Selected:</div>
              <div className="text-slate-700">
                {selectedDriver.name} • {selectedDriver.email} •{" "}
                {selectedDriver.profile?.phone}
              </div>
            </div>
          )}

          {/* Manual/edit fields (auto-filled when selecting) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Driver Name</span>
              <input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="e.g. David Cohen"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Driver Phone</span>
              <input
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="e.g. 050-1234567"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="text-slate-600">Driver Email</span>
              <input
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="e.g. driver@email.com"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition"
              onClick={closeModal}
              disabled={assigning}
            >
              Cancel
            </button>

            <button
              className={[
                "px-3 py-2 rounded-md text-white transition",
                canSubmit
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-orange-200 cursor-not-allowed",
              ].join(" ")}
              onClick={onAssign}
              disabled={!canSubmit || assigning}
              title={!canSubmit ? "Select a driver with valid details" : ""}
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
