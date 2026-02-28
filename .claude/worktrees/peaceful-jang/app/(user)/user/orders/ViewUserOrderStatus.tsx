import Image from "next/image";
import { HiPhone } from "react-icons/hi2";

export const UserOrderPreparing = () => {
  return (
    <li className="mb-10 ml-6">
      <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
        <span className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></span>
      </div>

      <h5 className="text-sm sm:text-base font-medium text-slate-800">
        Order is Being Prepared
      </h5>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-100 p-3 rounded-md">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/img/objects/chef.png"
            className="rounded-full"
            alt="chef"
            width={36}
            height={36}
          />
          <div className="min-w-0">
            <h6 className="text-sm font-semibold text-slate-800">
              Chef: Manuel
            </h6>
            <a href="tel:05275623589" className="text-sm text-slate-600">
             44 756 235-89
            </a>
          </div>
        </div>

        <a
          href="tel:0524475623589"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
          aria-label="Call chef"
        >
          <HiPhone size={22} aria-hidden="true" />
        </a>
      </div>
    </li>
  );
};

export const UserOrderCollected = () => {
  return (
    <li className="mb-10 ml-6">
      <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
        <span className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></span>
      </div>

      <h5 className="text-sm sm:text-base font-medium text-slate-800">
        Order Collected
      </h5>
      <p className="text-sm text-slate-600">Received by</p>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-100 p-3 rounded-md">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/img/humans/h9.jpg"
            className="rounded-full"
            alt="driver"
            width={36}
            height={36}
          />
          <div className="min-w-0">
            <h6 className="text-sm font-semibold text-slate-800 break-words">
              Josie Macmillan
            </h6>
            <a href="tel:052475623589" className="text-sm text-slate-600">
              756 235-89
            </a>
          </div>
        </div>

        <a
          href="tel:05275623589"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
          aria-label="Call driver"
        >
          <HiPhone size={22} aria-hidden="true" />
        </a>
      </div>
    </li>
  );
};
