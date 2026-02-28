"use client";

import React, { useMemo } from "react";
import { TableInStore } from "@/lib/AreaStore";
import Start_an_order from "./Table_Settings/Start_an_order_Table";

type TableCard_v1Props = {
  table: TableInStore;
};

const TableCard_v1: React.FC<TableCard_v1Props> = ({ table }) => {
  const { diners } = table;
  const isRound = diners <= 4;

  // --- חישוב מיקומי כיסאות רספונסיבי ---
  // אנו משתמשים באחוזים כדי שהכיסאות יישארו בפרופורציה בכל גודל מסך
  const chairs = useMemo(() => {
    return Array.from({ length: diners }).map((_, index) => {
      // זווית לכל כיסא
      const angle = (index / diners) * (2 * Math.PI) - Math.PI / 2; // מתחיל מלמעלה (12 שעון)
      
      // רדיוס באחוזים (50% זה המרכז, אנחנו רוצים שיהיו בקצה המעטפת)
      // לשולחן עגול נשתמש ברדיוס אחיד, למרובע נתאים את הפיזור
      const radius = isRound ? 42 : 45; 
      
      const left = 50 + radius * Math.cos(angle);
      const top = 50 + radius * Math.sin(angle);

      return { left: `${left}%`, top: `${top}%` };
    });
  }, [diners, isRound]);

  return (
    <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center p-4">
      
      {/* --- הכיסאות (שכבה תחתונה) --- */}
      {chairs.map((pos, index) => (
        <div
          key={index}
          className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-slate-800 rounded-full shadow-sm z-0 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          style={{ left: pos.left, top: pos.top }}
          aria-hidden="true" // דקורטיבי בלבד
        />
      ))}

      {/* --- גוף השולחן (שכבה עליונה) --- */}
      <div
        className={`
          relative z-10 flex flex-col items-center justify-center
          w-full h-full
          bg-gradient-to-br from-slate-50 to-slate-200
          border border-slate-300 shadow-xl
          transition-all duration-300
          ${isRound ? "rounded-full" : "rounded-2xl"}
        `}
      >
        {/* טקסטורה עדינה למשטח השולחן */}
        <div className={`absolute inset-3 border border-dashed border-slate-300/50 ${isRound ? "rounded-full" : "rounded-xl"} pointer-events-none`} />

        <div className="flex flex-col items-center justify-center gap-1 z-20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            הזמנה
          </span>
          
          {/* Wrapper לכפתור ההזמנה עם עצירת האירוע (Propagation).
             כך לחיצה עליו לא תפתח את המודל של השולחן.
          */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className=" relative z-[110] transform transition-transform hover:scale-105 active:scale-95"
          >
            <Start_an_order table={table} />
          </div>
        </div>
      </div>
    </div>
  );
};

// שימוש ב-React.memo למניעת רינדורים מיותרים ברשימות גדולות
export default React.memo(TableCard_v1);