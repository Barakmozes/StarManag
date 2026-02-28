"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { HiOutlineXMark } from "react-icons/hi2";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  closeModal: () => void;
  children: React.ReactNode;
};

const Modal = ({  isOpen = false, title, closeModal, children }: ModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={closeModal}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-300/75" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Close button row (keeps close reachable even when content scrolls) */}
                <div className="flex items-start justify-end p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-gray-500 hover:bg-green-200 hover:text-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>

                {title ? (
                  <Dialog.Title
                    as="h3"
                    className="px-4 pb-2 text-lg font-medium leading-6 text-gray-900 sm:px-6"
                  >
                    {title}
                  </Dialog.Title>
                ) : null}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2 sm:px-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
