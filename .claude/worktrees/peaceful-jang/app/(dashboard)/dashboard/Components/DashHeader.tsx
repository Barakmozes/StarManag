import AccountDropDown from "@/app/components/Common/AccountDropDown";
import Container from "@/app/components/Common/Container";
import Image from "next/image";
import NotifyDropDown from "./NotifyDropDown";
import { User } from "@prisma/client";
import { HiBars3 } from "react-icons/hi2";

type Props = {
  user: User;
  onMenuClick?: () => void;
};

const DashHeader = ({ user, onMenuClick }: Props) => {
  return (
    <Container>
      <header className="sticky top-0 z-20 rounded-md border border-slate-100 bg-white/95 shadow-md supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-12">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile: open drawer */}
            {onMenuClick ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 md:hidden"
                aria-label="Open dashboard navigation"
              >
                <HiBars3 className="h-6 w-6" aria-hidden="true" />
              </button>
            ) : null}

            <Image
              src="/img/logo.png"
              alt="logo"
              width={40}
              height={40}
              className="shrink-0"
              priority
            />
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <NotifyDropDown userEmail={user?.email ?? ""} />
            <AccountDropDown user={user} />
          </div>
        </div>
      </header>
    </Container>
  );
};

export default DashHeader;
