"use client";

import { useCartStore, useLoginModal, useSideBarDrawer } from "@/lib/store";
import { useRestaurantStore } from "@/lib/AreaStore";
import Link from "next/link";
import {
  HiBars3,
  HiOutlinePencilSquare,
  HiOutlineShoppingCart,
} from "react-icons/hi2";
import LocationBtn from "./LocationBtn";
import { User } from "@prisma/client";
import AccountDropDown from "./AccountDropDown";
import {
  GetAreasNameDescriptionDocument,
  GetAreasNameDescriptionQuery,
  GetAreasNameDescriptionQueryVariables,
  Role,
} from "@/graphql/generated";
import { gql, useMutation, useQuery } from "@urql/next";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import toast from "react-hot-toast";
import { GoChevronDown } from "react-icons/go";
import { signOut } from "next-auth/react";


/* -------------------------------- GraphQL -------------------------------- */

const EDIT_USER_ROLE = gql`
  mutation EditUserRole($id: String!, $role: Role!) {
    editUserRole(id: $id, role: $role) {
      id
      role
    }
  }
`;

type HeaderProps = {
  user: User;
};

const Header = ({ user }: HeaderProps) => {
  const { onOpen } = useLoginModal();
  const { menus } = useCartStore();
  const { onSideBarOpen } = useSideBarDrawer();
  const router = useRouter();

  const { setSelectedArea, setAreas, selectedArea } = useRestaurantStore();

  const [{ data: UserData, fetching }] = useQuery<
    GetAreasNameDescriptionQuery,
    GetAreasNameDescriptionQueryVariables
  >({
    query: GetAreasNameDescriptionDocument,
    variables: {
      orderBy: { createdAt: "asc" as any },
    },
  });

  const FetcheAreas = UserData?.getAreasNameDescription;

  useEffect(() => {
    if (FetcheAreas) {
      const adapted = FetcheAreas.map((zone) => ({
        name: zone.name,
        id: zone.id,
        floorPlanImage: zone.floorPlanImage,
        createdAt: zone.createdAt,
      }));
      setAreas(adapted);
    }
  }, [FetcheAreas, setAreas]);

  const handleZoneClickk = (zoneName: string) => {
    setSelectedArea(zoneName);
    router.replace("/#top_header");
  };

  /* --------------------------- App info modal ---------------------------- */

  const [isAboutOpen, setIsAboutOpen] = useState(false);

  /* --------------------------- Role switch modal -------------------------- */

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const ALL_ROLES: Role[] = useMemo(
    () => [Role.User, Role.Admin, Role.Manager, Role.Chef, Role.Waiter, Role.Delivery],
    []
  );

  // draft role (for modal select)
  const [roleDraft, setRoleDraft] = useState<Role>(
    (user?.role as unknown as Role) ?? Role.User
  );

  useEffect(() => {
    if (user?.role) setRoleDraft(user.role as unknown as Role);
  }, [user?.role]);

  const [{ fetching: switchingRole }, editUserRole] = useMutation(EDIT_USER_ROLE);
const identifier = user?.id ?? user?.email;
const saveRole = async () => {
if (!identifier) {
  toast.error("Missing user identifier (id/email)");
  return;
}

  // אם לא באמת השתנה תפקיד - לא צריך לעשות כלום
  const currentRole = user.role as unknown as Role;
  if (roleDraft === currentRole) {
    toast("Role unchanged");
    setIsRoleModalOpen(false);
    return;
  }

  try {
    const res = await editUserRole({ id: identifier, role: roleDraft });
    if (res.error) throw res.error;

    toast.success(`Role updated: התחבר שוב בתור: ${roleDraft}`);
    setIsRoleModalOpen(false);

    // ✅ הכי חשוב: לכפות התחברות מחדש כדי שה-session יתעדכן מההתחלה
    // שים callbackUrl כדי שיחזור לדף הראשי (או דף התחברות)
    setTimeout(() => {
      signOut({ callbackUrl: "/?roleChanged=1" });
    }, 300);
  } catch (err: any) {
    toast.error(err?.message || "Failed to change role");
  }
};


  return (
    <>
      <header className="grid grid-cols-2 py-5 px-6 md:px-14 lg:px-18 items-center sticky top-0 z-10 bg-white md:flex justify-between shadow">
        {/* Left Area */}
        <div className="flex items-center gap-x-3 md:gap-x-8">
          <button
            className="p-2 rounded-full bg-slate-200 text-gray-500 hover:bg-green-200 hover:text-green-600"
            onClick={onSideBarOpen}
            aria-label="Open sidebar"
          >
            <HiBars3 size={28} className="cursor-pointer shrink-0" />
          </button>

          {/* Title button (opens the bilingual app explanation + PayPlus test card) */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="font-semibold text-gray-700 hover:text-green-700 transition whitespace-nowrap"
            aria-label="About StarManag (English/Hebrew)"
          >
            StarManag
          </button>

          {!["WAITER", "MANAGER"].includes(user?.role) && <LocationBtn />}
        </div>

   {/* Admin Dashboard link (desktop only, header-native style) */}
{/* Admin Dashboard link + cute tooltip (desktop only) */}
{user?.role === "ADMIN" && (
  <div className="hidden md:flex ml-auto items-center mr-4">
    <div className="relative group">
      <Link
        href="/dashboard"
        className="
          inline-flex items-center justify-center
          rounded-full bg-slate-200 px-4 py-2
          text-sm font-semibold text-slate-700
          shadow-sm transition
          hover:bg-green-200 hover:text-green-700
          focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
        "
        aria-label="Go to Dashboard"
      >
        Dashboard
      </Link>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none absolute right-0 top-full z-50 mt-2 w-64
          rounded-xl bg-white/90 p-3 text-xs text-slate-700
          shadow-lg ring-1 ring-slate-200 backdrop-blur
          opacity-0 translate-y-1 transition duration-200
          group-hover:opacity-100 group-hover:translate-y-0
          group-focus-within:opacity-100 group-focus-within:translate-y-0
        "
      >
        {/* little arrow */}
        <div className="absolute -top-1 right-5 h-2 w-2 rotate-45 bg-white/90 ring-1 ring-slate-200" />

        <div className="space-y-1">
<p className="font-semibold text-slate-800">
  ✨ -Let&apos;s try the dashboard- <br />
  בוא ננסה את הדשבורד
</p>
          <p className="text-slate-600">
            ניהול תפריטים, הזמנות ותפקידים—בלחיצה אחת. מומלץ להיכנס ולהתנסות 
          </p>
        </div>
      </div>
    </div>
  </div>
)}


        {/* Center Area - Display Zones for Desktop */}
        {["WAITER", "MANAGER"].includes(user?.role) &&
          (fetching ? (
            <header id="top_header" className="py-5 px-4 md:px-12 bg-white shadow">
              <p className="text-center text-gray-500">Loading zones...</p>
            </header>
          ) : (
            <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5 flex-1">
              {FetcheAreas?.map((zone) => (
                <button
                  key={zone.name}
                  onClick={() => handleZoneClickk(zone.name)}
                  className={`px-2 py-1 whitespace-nowrap rounded-lg text-xs md:text-base shadow-sm hover:shadow-md text-gray-700 bg-gray-100 hover:bg-green-100 transition ${
                    selectedArea?.name === zone.name
                      ? "bg-green-200 text-green-800 font-semibold"
                      : ""
                  }`}
                  aria-label={`Select zone: ${zone.name}`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          ))}

        {/* Center Area - Zone Selector for Small Screens */}
        
        {["WAITER", "MANAGER"].includes(user?.role) && (
          <div className="flex md:hidden items-center justify-center w-full">
            <select
              className="p-2 border rounded-lg text-gray-700 bg-white focus:ring focus:ring-green-300 w-full"
              value={selectedArea?.name || undefined}
              onChange={(e) => handleZoneClickk(e.target.value)}
              aria-label="Select a zone"
              style={{
                backgroundColor: selectedArea ? "rgba(144, 238, 144, 0.2)" : "white",
              }}
            >
              <option value="" disabled>
                Select a Zone
              </option>
              {FetcheAreas?.map((zone) => (
                <option key={zone.name} value={zone.name}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Area */}
        <div className="hidden md:flex items-center justify-end space-x-4">
          
       {/* Role switch button + tooltip on hover */}
{user ? (
  <div className="flex items-center gap-3">
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-2 bg-slate-200 text-gray-500 px-4 py-1 rounded-full hover:bg-green-200 hover:text-green-600"
        onClick={() => setIsRoleModalOpen(true)}
        aria-label="Switch your role"
      >
        <HiOutlinePencilSquare className="h-5 w-5" />
        <span className="hidden lg:inline">Switch Role</span>
      </button>

      {/* Tooltip (shows only on hover/focus) */}
      <div
        className="
          pointer-events-none hidden xl:block
          absolute left-1/2 top-full z-50 mt-2 w-[300px] -translate-x-1/2
          rounded-xl bg-white/90 p-3 text-xs text-slate-700
          shadow-lg ring-1 ring-slate-200 backdrop-blur
          opacity-0 translate-y-1 transition duration-200
          group-hover:opacity-100 group-hover:translate-y-0
          group-focus-within:opacity-100 group-focus-within:translate-y-0
        "
      >
        <p className="leading-snug text-slate-600">
          Use this to enter a different role (Admin/Manager/Waiter…) and see
          different screens & flows.
        </p>

        <div className="mt-2 border-t border-slate-200/70 pt-2" dir="rtl">
          <p className="leading-snug text-slate-600 text-right">
            השתמש בכפתור זה כדי להחליף לתפקיד אחר (מנהל/מנהל/מלצר...) ולראות מסכים וזרימות שונות.
          </p>
        </div>
      </div>
    </div>
  </div>
) : null}


          {/* Shopping Cart */}
          <Link
            href="/cart"
            className="relative p-2 bg-slate-200 rounded-full text-gray-500 hover:bg-green-200 hover:text-green-600"
            aria-label="View cart"
          >
            <HiOutlineShoppingCart className="pr-1" size={28} />
            <span
              className="absolute top-0 right-1 font-bold text-green-600"
              aria-label={`Cart items: ${menus ? menus.length : 0}`}
            >
              {menus ? menus.length : 0}
            </span>
          </Link>

          {/* User Account Dropdown */}
          {user ? (
            <AccountDropDown user={user} />
          ) : (
            <button
              className="bg-slate-200 text-gray-500 px-4 py-1 rounded-full hover:bg-green-200 hover:text-green-600"
              onClick={onOpen}
              aria-label="Login or signup"
            >
              Login/Signup
            </button>
          )}
        </div>
        
      </header>

      {/* ----------------------------- About modal ----------------------------- */}
      <Modal
        isOpen={isAboutOpen}
        closeModal={() => setIsAboutOpen(false)}
        title="StarManag | App Guide (EN / HE)"
      >
        <div className="space-y-6 text-sm text-slate-700">
          {/* English */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">English</h3>
            <p className="text-slate-600">
              StarManag is an end-to-end restaurant experience: a customer ordering
              flow + a staff/admin management system, all in one app.
            </p>

            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <b>Customer flow:</b> browse categories & menus, add to cart, checkout,
                pay, and see success/failure pages.
              </li>
              <li>
                <b>User area:</b> favorites, order history/status, and a help section.
              </li>
              <li>
                <b>Waiter/Manager flow:</b> zone & table interface for the restaurant
                floor (tables, reservations, special requests, and starting orders).
              </li>
              <li>
                <b>Admin dashboard:</b> manage menus, categories, orders, deliveries,
                notifications, restaurant settings, and user roles.
              </li>
            </ul>

            <p className="text-slate-600">
              Tip: use the <b>Switch Role</b> button in the header to jump between roles
              and explore different screens quickly.
            </p>
          </div>

          {/* Hebrew */}
          <div dir="rtl" className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-right">עברית</h3>
            <p className="text-slate-600 text-right">
              StarManag היא מערכת מקצה לקצה למסעדה: גם חוויית לקוח להזמנה ותשלום,
              וגם חוויית צוות/ניהול לניהול התפריט, ההזמנות והשולחנות — הכל באותה אפליקציה.
            </p>

            <ul className="list-disc pr-5 space-y-1 text-slate-600 text-right">
              <li>
                <b>חוויית לקוח:</b> צפייה בקטגוריות ותפריט, הוספה לעגלה, מעבר לתשלום,
                וקבלת מסכי הצלחה/כשל.
              </li>
              <li>
                <b>אזור משתמש:</b> מועדפים, היסטוריית הזמנות/סטטוס, וטופס עזרה (Help).
              </li>
              <li>
                <b>מלצר/מנהל:</b> ממשק אזורים ושולחנות לניהול רצפת המסעדה (שולחנות,
                הזמנות מוקדמות/רזרבציות, בקשות מיוחדות והתחלת הזמנה לשולחן).
              </li>
              <li>
                <b>דשבורד ניהול (Admin):</b> ניהול תפריט וקטגוריות, הזמנות, שליחויות,
                התראות, הגדרות מסעדה ותפקידי משתמשים.
              </li>
            </ul>

            <p className="text-slate-600 text-right">
              טיפ: השתמש/י בכפתור <b>Switch Role</b> כדי להחליף Role ולהיכנס לתפקיד אחר
              ולראות מסכים שונים.
            </p>
          </div>

          {/* PayPlus test card */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">PayPlus test card (Sandbox)
              השתמש בכרטיס זה כדי לבדוק תשלום להזמנה
            </h3>
            <p className="text-slate-600">
              Use the following card details only for testing purchases via PayPlus (test/sandbox):
            </p>

            <div className="rounded-md bg-slate-100 p-3 text-xs font-mono text-slate-700 space-y-1">
              <div>Card number: 5326140280779844</div>
              <div>Validity: 05 / 2026</div>
              <div>CVV (3 digits): 000</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* --------------------------- Switch role modal -------------------------- */}
      <Modal
        isOpen={isRoleModalOpen}
        closeModal={() => setIsRoleModalOpen(false)}
        title="Switch Role"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <p className="text-slate-600">
            Change your current user role to quickly preview different app experiences
            (Admin dashboard, Waiter/Manager zones, etc.).
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Select role
            </label>

            <div className="relative inline-block w-full">
              <select
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value as Role)}
                className="block w-full rounded-md appearance-none bg-white border border-green-400 px-4 py-2 pr-8 leading-tight focus:outline-none"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <GoChevronDown className="dark:text-gray-300" />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Note: if you don’t see changes immediately, refresh the page (or sign out/sign in,
              depending on how the session is cached).
            </p>
            <h3>sign out/sign in to see</h3>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="bg-slate-200 text-gray-500 px-4 py-1 rounded-full hover:bg-slate-300"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="bg-green-600 text-white px-4 py-1 rounded-full hover:bg-green-500 disabled:opacity-60"
              onClick={saveRole}
              disabled={switchingRole}
            >
              {switchingRole ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header;