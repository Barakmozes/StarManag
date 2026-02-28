import Link from "next/link";
import Image from "next/image";
import { HiOutlineChevronLeft } from "react-icons/hi2";

const CartTopSection = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Logo / Home */}
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-slate-200 p-4 hover:bg-green-200 transition"
        aria-label="Go to home"
      >
        <Image
          src="/img/logo.png"
          alt="logo"
          width={70}
          height={70}
          className="mx-auto"
        />
      </Link>

      <h1 className="text-xl text-center my-5 leading-tight tracking-tight text-gray-500 md:text-2xl">
        Cart
      </h1>

      {/* Back to Menu */}
      <div className="mb-6 w-full flex justify-center">
        <Link
          href="/"
          className="inline-flex w-full max-w-sm min-h-[44px] items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-base sm:text-lg text-white border border-green-500 hover:text-green-700 hover:bg-green-200 transition"
        >
          <HiOutlineChevronLeft className="h-5 w-5" aria-hidden="true" />
          <span>Back to Menu</span>
        </Link>
      </div>
    </div>
  );
};

export default CartTopSection;
