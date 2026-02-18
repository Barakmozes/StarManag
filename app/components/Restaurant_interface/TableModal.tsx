"use client";

import React, { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@urql/next";
import { useRouter } from "next/navigation"; 
import { useCartStore } from "@/lib/store"; 

// Icons
import { 
  BsPeople, 
  BsChatLeftText, 
  BsCreditCard,
  BsExclamationCircle,
  BsGeoAlt,
  BsPlusLg,
  BsX,
  BsGearFill,
  BsShieldLockFill,
  BsTrash3Fill,
  BsClock,
  BsBasket3,
  
  BsPlayCircleFill 
} from "react-icons/bs";
import { HiOutlineXMark } from "react-icons/hi2";

// GraphQL & Types
import { BasicArea, EditTableDocument, GetTableOrderDocument, GetTableOrderQuery, GetTableOrderQueryVariables } from "@/graphql/generated";
import { TableInStore } from "@/lib/AreaStore";

// Sub-components
import ToggleReservation from "./Table_Settings/ToggleReservation";
import TableReservations from "./Table_Settings/TableReservations";
import EditTableModal from "./CRUD_Zone-CRUD_Table/EditTableModal";
import DeleteTableModal from "./CRUD_Zone-CRUD_Table/DeleteTableModal";

interface TableModalProps {
  open: boolean;
  onClose: () => void;
  table: TableInStore | null;
  currentArea?: BasicArea | null;
  allAreas: BasicArea[];
  isEditMode: boolean; 
  canManage: boolean;
  onMoveToArea: (tableId: string, newAreaId: string) => void;
}

type ModalView = "DETAILS" | "EDIT" | "DELETE";

export default function TableModal({
  open,
  onClose,
  table,
  currentArea,
  allAreas,
  canManage,
}: TableModalProps) {
  
  const router = useRouter();
  
  // שליפה ספציפית מהחנות כדי למנוע רינדורים מיותרים
  const startOrderForTable = useCartStore((state) => state.startOrderForTable); 
  
  const [currentView, setCurrentView] = useState<ModalView>("DETAILS");
  const [reqInput, setReqInput] = useState("");
  const [{ fetching: isEditing }, editTable] = useMutation(EditTableDocument);

  // --- 1. שליפת הזמנות בזמן אמת (סנכרון מלא) ---
  const [{ data: ordersData, fetching: loadingOrders }] = useQuery<GetTableOrderQuery, GetTableOrderQueryVariables>({
    query: GetTableOrderDocument,
    variables: { tableId: table?.id || "" },
    pause: !open || !table?.id, 
    requestPolicy: 'cache-and-network', 
  });

  const activeOrders = ordersData?.getTableOrder || [];

  // --- 2. חישוב נתונים ---
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    let lastOrderTime: Date | null = null;
    let statusCounts: Record<string, number> = {};

    activeOrders.forEach(order => {
      if (Array.isArray(order.cart)) {
        order.cart.forEach((item: any) => {
           const qty = Number(item.quantity) || 1;
           const price = Number(item.price) || 0;
           totalItems += qty;
           totalAmount += price * qty;
        });
      }

      const orderDate = new Date(order.orderDate);
      if (!lastOrderTime || orderDate > lastOrderTime) {
        lastOrderTime = orderDate;
      }

      const status = order.status || "UNKNOWN";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return { totalItems, totalAmount, lastOrderTime, statusCounts };
  }, [activeOrders]);

  const getTimeDisplay = (date: Date | null) => {
    if (!date) return "-";
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "עכשיו";
    if (diffMins < 60) return `${diffMins} דק'`;
    return `${Math.floor(diffMins / 60)} ש'`;
  };

  useEffect(() => {
    if (open) setCurrentView("DETAILS");
  }, [open]);

  if (!table) return null;

  // --- Handlers ---

  const handleStartOrder = (e: React.MouseEvent) => {
    // מונע אירועים אחרים (כמו לחיצה על הרקע אם קיים)
    e.stopPropagation(); 
    e.preventDefault();

    // 1. עדכון החנות הגלובלית שהמשתמש כעת בשולחן הזה
    startOrderForTable(table.id, table.tableNumber);
    
    // 2. סגירת המודל הנוכחי באופן יזום
    onClose();
    
    // 3. ניווט לדף ההזמנות/תפריט
    router.replace("/#menuSection");
  };

  const handleOpenEdit = () => setCurrentView("EDIT");
  const handleOpenDelete = () => setCurrentView("DELETE");
  const handleBackToDetails = () => setCurrentView("DETAILS");
  
  const handleFullClose = () => {
    setCurrentView("DETAILS");
    onClose();
  };

  const addSpecialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqInput.trim()) return;
    const updatedRequests = [...(table.specialRequests || []), reqInput.trim()];
    const loadingToast = toast.loading("מעדכן...");
    try {
        await editTable({ editTableId: table.id, specialRequests: updatedRequests });
        toast.success("עודכן", { id: loadingToast });
        setReqInput("");
    } catch (err) {
        toast.error("שגיאה", { id: loadingToast });
    }
  };

  const removeSpecialRequest = async (index: number) => {
      const updatedRequests = table.specialRequests?.filter((_, idx) => idx !== index);
      try { await editTable({ editTableId: table.id, specialRequests: updatedRequests }); } 
      catch (err) { toast.error("שגיאה במחיקה"); }
  };

  const isMainModalVisible = open && currentView === "DETAILS";

  return (
    <>
      <Transition.Root show={isMainModalVisible} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={handleFullClose} dir="rtl">
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" 
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-[2rem] bg-white text-right shadow-2xl transition-all sm:my-8 w-full max-w-xl border border-slate-100">
                  
                  {/* --- Header Compact --- */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center text-2xl font-black shadow-md">
                        {table.tableNumber}
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-black text-slate-800">שולחן {table.tableNumber}</Dialog.Title>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                          <BsGeoAlt /> {currentArea?.name || "כללי"}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFullClose} className="p-2 bg-white text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 hover:bg-rose-50 transition-colors">
                      <HiOutlineXMark size={20} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
                    
                   {/* --- Top Row: Status & Actions --- */}
<div className="flex items-center justify-between mb-6">
  
  {/* צד ימין: סטטוסים */}
  <div className="flex items-center gap-2">
    
    {/* סטטוס ראשי (תפוס/פנוי) */}
    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
      table.reserved 
        ? "bg-rose-50 text-rose-700 border-rose-100" 
        : "bg-emerald-50 text-emerald-700 border-emerald-100"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ml-1.5 ${table.reserved ? 'bg-rose-500' : 'bg-emerald-500'}`} />
      {table.reserved ? "תפוס" : "פנוי"}
    </span>

    {/* אינדיקטור הזמנות פעילות */}
    {activeOrders.length > 0 && (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse shadow-sm">
        {activeOrders.length} מנות
      </span>
    )}
  </div>

  {/* צד שמאל: כפתור פעולה (מחליף את ToggleReservation הישן) */}
  {/* אם הלוגיקה בתוך ToggleReservation, העתק את ה-className לכפתור שם */}
  <button
    onClick={() => { /* כאן תבוא הפונקציה של השינוי סטטוס */ }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
  >
    {/* אייקון משתנה בהתאם למצב */}
    {table.reserved ? (
      <>
<ToggleReservation table={table}/>   </>
    ) : (
      <>
<ToggleReservation table={table}/>         </>
      
    )}
  </button>
  

</div>

                    {/* --- COMPACT LIVE STATS --- */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 divide-x divide-x-reverse divide-slate-100 flex items-center overflow-hidden">
                        
                        <div className="flex-1 p-3 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">לתשלום</span>
                            <div className="flex items-center gap-1 text-emerald-600">
                               $ 
                                <span className="text-lg font-black leading-none">{loadingOrders ? "-" : stats.totalAmount}</span>
                            </div>
                        </div>
                            {/* --- פריטים / עגלה (לחצן פעיל) --- */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // מניעת סגירת מודל לא רצויה אם יש לוגיקה כזו
                                    startOrderForTable(table.id, table.tableNumber); // 1. עדכון ה-State עם מספר השולחן
                                    onClose(); // 2. סגירת המודל הנוכחי
                                    router.push("/cart"); // 3. מעבר לדף העגלה
                                }}
                                className="flex-1 p-3 flex flex-col items-center justify-center transition-all duration-200 
                                hover:bg-green-50 hover:scale-[1.02] active:scale-95 cursor-pointer group relative overflow-hidden"
                                aria-label="פתח עגלה וצפה בפרטי הזמנה"
                      >
                          {/* כותרת משתנה בהובר */}
                          <span className="text-[10px] text-slate-400 group-hover:text-green-600 font-bold uppercase mb-1 transition-colors">
                              פתח הזמנה
                          </span>
                    
                    {/* אייקון ומספר */}
                    <div className="flex items-center gap-2 text-orange-500 group-hover:text-green-600 transition-colors">
                        <BsBasket3 size={18} />
                        <span className="text-xl font-black leading-none">
                            {loadingOrders ? "-" : stats.totalItems}
                        </span>
                    </div>

                    {/* אינדיקטור ויזואלי עדין ללחיצה */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-100 rounded-none transition-all" />
                </button>

                        <div className="flex-1 p-3 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">זמן</span>
                            <div className="flex items-center gap-1 text-cyan-600">
                                <BsClock />
                                <span className="text-lg font-black leading-none">
                                    {loadingOrders ? "-" : getTimeDisplay(stats.lastOrderTime)}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 p-3 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">סועדים</span>
                            <div className="flex items-center gap-1 text-purple-500">
                                <BsPeople />
                                <span className="text-lg font-black leading-none">{table.diners}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- START ORDER BUTTON --- */}
                    { (
                        <button 
                            onClick={handleStartOrder}
                            className="w-full mb-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 font-bold hover:from-orange-600 hover:to-orange-700 transition-all active:scale-95"
                        >
                            <BsPlayCircleFill size={18} /> התחל הזמנה חדשה לשולחן
                        </button>
                    )}

                    {/* --- Requests --- */}
                    <div className="mb-6 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2">
                                <BsChatLeftText /> הערות ודגשים
                            </h4>
                        </div>
                        <form onSubmit={addSpecialRequest} className="flex gap-2 mb-1">
                            <input 
                              type="text" value={reqInput} onChange={(e) => setReqInput(e.target.value)} disabled={isEditing}
                              className="flex-1 bg-white border border-amber-200 text-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-400" 
                              placeholder="הוסף הערה..." 
                            />
                            <button type="submit" disabled={!reqInput.trim() || isEditing} className="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600">
                               <BsPlusLg />
                            </button>
                        </form>
                        <div className="flex flex-wrap gap-1.5">
                          {table.specialRequests?.map((req, idx) => (
                            <span key={idx} className="flex items-center gap-1 text-[10px] font-bold bg-white text-slate-600 px-2 py-1 rounded border border-amber-200">
                              {req}
                              <button onClick={() => removeSpecialRequest(idx)} className="text-rose-400 hover:text-rose-600"><BsX /></button>
                            </span>
                          ))}
                        </div>
                    </div>

                    {/* --- Future Reservations --- */}
                    <div className="border-t border-slate-100  mb-1">
                        <h4 className="text-xs font-bold text-slate-800 mb-1">הזמנות עתידיות</h4>
                        <TableReservations table={table} />
                    </div>

                    {/* --- Admin Footer --- */}
                    {canManage && (
                       <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                           <button onClick={handleOpenEdit} className="flex-1 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2">
                               <BsGearFill /> ערוך
                           </button>
                           <button onClick={handleOpenDelete} className="flex-1 py-2.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 border border-rose-100 flex items-center justify-center gap-2">
                               <BsTrash3Fill /> מחק
                           </button>
                       </div>
                    )}
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {currentView === "EDIT" && (
        <EditTableModal 
          table={table as any} 
          open={true} 
          onClose={handleBackToDetails} 
        />
      )}

      {currentView === "DELETE" && (
        <DeleteTableModal 
          table={table as any} 
          open={true}
          onClose={handleBackToDetails} 
        />
      )}
    </>
  );
}