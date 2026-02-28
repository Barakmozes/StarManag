"use client";

import { ImSpinner2 } from "react-icons/im";

const DataLoading = () => {
  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <ImSpinner2
        className="h-10 w-10 animate-spin text-green-600 sm:h-16 sm:w-16"
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default DataLoading;
