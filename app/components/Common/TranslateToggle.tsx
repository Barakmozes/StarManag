"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineLanguage } from "react-icons/hi2";

type Locale = "en" | "he";

interface TranslateToggleProps {
  currentLocale: string; // מגיע מה-Server או מה-Cookie הראשוני
  className?: string;
}

/**
 * פונקציות עזר מחוץ לקומפוננטה למניעת רינדור מחדש מיותר
 */
const setLocaleCookie = (nextLocale: Locale) => {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const baseCookie = `locale=${nextLocale}; Path=/; SameSite=Lax; Max-Age=31536000`;
  document.cookie = isSecure ? `${baseCookie}; Secure` : baseCookie;
};

const getGoogleCombo = () => document.querySelector<HTMLSelectElement>(".goog-te-combo");

export default function TranslateToggle({
  currentLocale,
  className = "",
}: TranslateToggleProps) {
  const [locale, setLocale] = useState<Locale>(currentLocale === "he" ? "he" : "en");
  const [isSwitching, setIsSwitching] = useState(false);
  const isMounted = useRef(true);

  // סנכרון מצב פנימי אם ה-Props משתנים
  useEffect(() => {
    setLocale(currentLocale === "he" ? "he" : "en");
  }, [currentLocale]);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleToggle = useCallback(async () => {
    if (isSwitching) return;

    const nextLocale: Locale = locale === "en" ? "he" : "en";
    setIsSwitching(true);

    try {
      // 1. עדכון העוגייה מיד (בשביל ה-Request הבא)
      setLocaleCookie(nextLocale);

      // 2. שיגור אירוע גלובלי לסנכרון ה-DOM (עבור LangClientSync)
      window.dispatchEvent(
        new CustomEvent("starmanag:locale-change", { detail: { locale: nextLocale } })
      );

      // 3. ניסיון הפעלת התרגום של גוגל
      const combo = getGoogleCombo();
      if (combo) {
        combo.value = nextLocale;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // אם גוגל עדיין לא נטען, אנחנו לא עוצרים - העוגייה כבר עודכנה
        console.warn("Google Translate widget not yet available");
      }

      if (isMounted.current) {
        setLocale(nextLocale);
      }
    } catch (error) {
      console.error("Translation toggle failed", error);
    } finally {
      if (isMounted.current) setIsSwitching(false);
    }
  }, [isSwitching, locale]);

  // טקסטים דינמיים לפי השפה הנוכחית
  const buttonLabel = locale === "en" ? "עברית" : "English";
  const ariaLabel = locale === "en" ? "Switch to Hebrew" : "עבור לאנגלית";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isSwitching}
      aria-label={ariaLabel}
      className={`
        group flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 
        text-sm font-medium text-slate-600 transition-all duration-200
        hover:bg-green-100 hover:text-green-600 active:scale-95
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      <HiOutlineLanguage 
        className={`h-4 w-4 transition-transform duration-300 ${isSwitching ? 'animate-spin' : 'group-hover:rotate-12'}`} 
      />
      <span className="min-w-[50px] text-center">
        {isSwitching ? "..." : buttonLabel}
      </span>
    </button>
  );
}