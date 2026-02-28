"use client";

import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

type Props = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const DialogComponent = ({ isVisible = false, onClose, children }: Props) => {
  return (
    <Transition appear show={isVisible} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-300/75" />
        </Transition.Child>

        {/* Drawer */}
        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel
              className={
                "relative flex h-full w-[85vw] max-w-xs flex-col bg-white shadow-xl " +
                "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] " +
                "sm:max-w-sm md:w-72"
              }
            >
              {/* Close button (sticky so it's always reachable) */}
              <div className="sticky top-0 z-10 flex items-center justify-end bg-white px-4 pt-4 pb-2">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-green-200 hover:text-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  onClick={onClose}
                  aria-label="Close sidebar"
                >
                  <HiOutlineXMark className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </Dialog.Panel>
          </Transition.Child>

          {/* Spacer keeps drawer aligned left */}
          <div className="flex-1" />
        </div>
      </Dialog>
    </Transition>
  );
};

export default DialogComponent;
