"use client";

import { useState } from "react";
import Modal from "@/app/components/Common/Modal";
import { FaChevronRight } from "react-icons/fa";

const LanguageSelectModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const Languages = [
    "English",
    "Francais",
    "German",
    "Dutch",
    "Espanol",
    "Italiano",
  ];

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 min-h-[44px] rounded-md px-3 py-2 hover:bg-slate-100 transition text-gray-500"
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLanguage}</span>
        <FaChevronRight className="shrink-0" />
      </button>

      <Modal
        title="Select your preferred language"
        isOpen={isOpen}
        closeModal={closeModal}
      >
        {/* Mobile-safe modal body wrapper */}
        <div className="w-[min(100vw-2rem,32rem)] max-w-full max-h-[90vh] overflow-y-auto overscroll-contain pb-4">
          <section className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {Languages?.map((language) => {
                const isSelected = language === selectedLanguage;

                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(language);
                      closeModal();
                    }}
                    className={[
                      "min-h-[44px] w-full rounded-md border px-3 py-2 text-left transition",
                      isSelected
                        ? "bg-slate-100 border-slate-300 text-slate-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {language}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 pb-[env(safe-area-inset-bottom)]" />
          </section>
        </div>
      </Modal>
    </>
  );
};

export default LanguageSelectModal;
