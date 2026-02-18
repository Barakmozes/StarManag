import { HiMap } from "react-icons/hi2";

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
      className="   relative flex-1 md:flex-none flex items-center justify-center gap-1.5 
              px-4 py-2 min-h-[40px]  text-sm font-semibold rounded-full border transition-all duration-200 whitespace-nowrap  bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-blue-300 hover:text-gray-900"
      aria-label={label}
    >                    <HiMap className="text-slate-700" size={16} />

      {label}
    </button>
  );
};

export default AddZoneModal;
