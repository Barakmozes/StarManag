"use client";

import React from "react";
import { 
  BsPeopleFill, 
  BsChatQuoteFill, 
  BsReceipt,
  BsExclamationCircleFill,
  BsClockHistory
} from "react-icons/bs";
import { TableInStore } from "@/lib/AreaStore";
// הנחה: הקומפוננטה הזו קיימת באותה תיקייה או בנתיב היחסי המתאים
import TableCard_v1 from "./ableCard_v1"; 

interface TableCardProps {
  table: TableInStore;
}

export default function TableCard({ table }: TableCardProps) {
  // --- חישוב לוגיקה ויזואלית ---
  const isReserved = table.reserved;
  const hasOrders = (table.unpaidOrdersCount || 0) > 0;
  const hasRequests = table.specialRequests && table.specialRequests.length > 0;

  // --- הגדרת צבעים דינמיים ---
  const cardClasses = isReserved
    ? "bg-rose-50/90 border-rose-200 hover:border-rose-400 hover:shadow-rose-100"
    : "bg-white border-slate-100 hover:border-blue-400 hover:shadow-blue-50";

  const statusDot = isReserved ? "bg-rose-500" : "bg-emerald-500";
  const statusText = isReserved ? "text-rose-600" : "text-emerald-600";
  const statusLabel = isReserved ? "תפוס" : "פנוי";

  return (
    <div
      className={`
        group relative flex flex-col justify-between
        h-full min-h-[150px] w-full
        p-5 rounded-[1.5rem] border-2 
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl cursor-pointer
        ${cardClasses}
      `}
    >
      {/* --- אינדיקציה לשינויים שלא נשמרו (Dirty State) --- */}
      {table.dirty && (
        <div className="absolute -top-2 -right-2 z-20 animate-bounce">
          <div className="bg-amber-500 text-white rounded-full p-1.5 shadow-md ring-4 ring-white">
            <BsExclamationCircleFill size={16} />
          </div>
        </div>
      )}

      {/* --- חלק עליון: סטטוס וסמלים --- */}
      <div className="flex justify-between items-start w-full mb-2">
        {/* תגית סטטוס */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wide bg-white/80 backdrop-blur-sm shadow-sm ${isReserved ? 'border-rose-100' : 'border-slate-100'}`}>
          <span className={`relative flex h-2.5 w-2.5`}>
            {isReserved && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDot}`}></span>
          </span>
          <span className={statusText}>{statusLabel}</span>
        </div>

        {/* אייקון הזמנות פתוחות (אם יש) */}
        {hasOrders && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 shadow-sm animate-pulse border border-amber-200">
            <BsReceipt size={14} />
          </div>
        )}
      </div>

      {/* --- חלק מרכזי: מספר שולחן --- */}
      <div className="flex-1 flex flex-col items-center justify-center py-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-[-6px]">
          שולחן
        </span>
        <span className={`text-6xl font-black tracking-tighter ${isReserved ? 'text-rose-900' : 'text-slate-800'}`}>
          {table.tableNumber}
        </span>
      </div>

      {/* --- חלק תחתון: סרגל מידע --- */}
      <div className="mt-auto pt-3 border-t border-black/5 w-full">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3">
          
          {/* כמות סועדים */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
            <BsPeopleFill className="text-slate-400" />
            <span>{table.diners}</span>
          </div>

          <div className="flex gap-2">
            {/* בקשות מיוחדות */}
            {hasRequests && (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                <BsChatQuoteFill />
                <span>{table.specialRequests.length}</span>
              </div>
            )}

            {/* הזמנות פתוחות (מספר) */}
            {hasOrders && (
              <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <span className="text-[10px]">₪</span>
                <span>{table.unpaidOrdersCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- התוספת המבוקשת (v1) --- */}
        <div className="w-full">
           <TableCard_v1 key={table.id} table={table as TableInStore} />
        </div>
      </div>
    </div>
  );
}