type Props = {
  openModal: () => void;
  /** Optional override for styling the trigger button */
  className?: string;
  /** Optional label override */
  label?: string;
};

const AddZoneModal = ({ openModal, className, label = "Add Zone" }: Props) => {
  return (
    <button
      type="button"
      onClick={openModal}
      className={
        className ??
        "w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700 transition"
      }
      aria-label={label}
    >
      {label}
    </button>
  );
};

export default AddZoneModal;
