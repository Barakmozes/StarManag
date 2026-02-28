"use client";

import React, { useState, useCallback, Fragment, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@urql/next";
import { Table } from "@prisma/client";
import toast from "react-hot-toast";
import { Dialog, Transition } from "@headlessui/react";

// Icons
import { 
  BsCalendarCheck, BsPeople, BsTelephone, BsEnvelope, 
  BsClock, BsInbox, BsInfoCircle, BsXCircle,
  BsPlusLg, BsArrowRepeat, BsPersonBadge, BsCalendarDate,
  BsCheckCircleFill, BsPencilSquare, BsArrowCounterclockwise,
  BsPersonVcard, BsHourglassSplit
} from "react-icons/bs";
import { HiOutlineXMark } from "react-icons/hi2";

import {
  GetReservationsDocument,
  GetReservationsQuery,
  GetReservationsQueryVariables,
  CancelReservationDocument,
  AddReservationDocument,
  AddGuestReservationDocument, // ודא שזה קיים ב-generated
  EditReservationDocument,
  CompleteReservationDocument,
} from "@/graphql/generated";
import { getIsraelDateString } from "@/lib/localeUtils";

interface TableReservationsProps {
  table: Table;
}

const TableReservations: React.FC<TableReservationsProps> = ({ table }) => {
  const todayString = getIsraelDateString();
  
  // --- Refs ---
  const formRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "", // שדה חדש לשם לקוח (עבור אורחים ללא אימייל)
    userEmail: "",
    numOfDiners: 2,
    time: "19:00",
    date: todayString
  });

  // --- Queries ---
  const [resResult, reexecuteQuery] = useQuery<GetReservationsQuery, GetReservationsQueryVariables>({
    query: GetReservationsDocument,
    pause: !isOpen,
    requestPolicy: 'cache-and-network'
  });

  const { data, fetching } = resResult;

  // --- Mutations ---
  const [, addReservation] = useMutation(AddReservationDocument);
  const [, addGuestReservation] = useMutation(AddGuestReservationDocument); // מוטציה לאורחים
  const [, editReservation] = useMutation(EditReservationDocument);
  const [, cancelReservation] = useMutation(CancelReservationDocument);
  const [, completeReservation] = useMutation(CompleteReservationDocument);

  // --- Helpers ---
  const refreshData = useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  const resetForm = () => {
    setFormData({
      customerName: "",
      userEmail: "",
      numOfDiners: 2,
      time: "19:00",
      date: todayString
    });
    setEditingId(null);
    setShowForm(false);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // מילוי טופס לעריכה
  const handleEditClick = (res: any) => {
    const dateObj = new Date(res.reservationTime);
    
    // ניסיון לחלץ שם לתצוגה בטופס
    let name = res.user?.name || "";
    if (!name && res.userEmail.includes("guest_")) {
        // לוגיקה אופציונלית לחילוץ שם מאימייל פיקטיבי אם נדרש, או השארת ריק
        // name = ...
    }

    setFormData({
      customerName: name,
      userEmail: res.userEmail || "",
      numOfDiners: res.numOfDiners,
      date: getIsraelDateString(dateObj),
      time: dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    });
    setEditingId(res.id);
    setShowForm(true);
    scrollToForm(); 
  };

  // --- Computed Data ---
  const tableAllReservations = useMemo(() => {
    if (!data?.getReservations) return [];
    return data.getReservations
      .filter((res: any) => res.tableId === table.id)
      .sort((a: any, b: any) => new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime());
  }, [data, table.id]);

  const reservationsForSelectedDate = useMemo(() => {
    return tableAllReservations.filter((res: any) => res.reservationTime.startsWith(selectedDate));
  }, [tableAllReservations, selectedDate]);

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const loadingToast = toast.loading(isEdit ? "שומר שינויים..." : "יוצר הזמנה...");

    try {
      const fullDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      if (isEdit) {
        // --- עריכה ---
        const result = await editReservation({
          id: editingId,
          numOfDiners: Number(formData.numOfDiners),
          reservationTime: fullDateTime,
          // בעריכה בדרך כלל לא משנים את זהות המזמין (אימייל/שם) כדי לשמור עקביות
        });
        if (result.error) throw new Error(result.error.message);
        toast.success("עודכן בהצלחה", { id: loadingToast });
      } else {
        // --- הוספה חדשה ---
        let result;
        
        // בדיקה: האם יש אימייל?
        if (formData.userEmail && formData.userEmail.trim() !== "") {
            // הוספה רגילה עם אימייל
            result = await addReservation({
                tableId: table.id,
                userEmail: formData.userEmail,
                numOfDiners: Number(formData.numOfDiners),
                reservationTime: fullDateTime,
                createdBy: "MANAGER", 
            });
        } else {
            // הוספת אורח (על בסיס שם בלבד)
            if (!formData.customerName) throw new Error("חובה להזין שם או אימייל");
            
            result = await addGuestReservation({
                customerName: formData.customerName,
                tableId: table.id,
                reservationTime: fullDateTime,
                numOfDiners: Number(formData.numOfDiners),
                createdBy: "MANAGER"
            });
        }

        if (result.error) throw new Error(result.error.message);
        toast.success("הזמנה נוצרה בהצלחה", { id: loadingToast });
      }

      refreshData();
      resetForm();
    } catch (err: any) {
      toast.error("שגיאה: " + err.message, { id: loadingToast });
    }
  };

  const handleCancel = async (resId: string) => {
    if (!window.confirm("האם לבטל את ההזמנה?")) return;
    const loadingToast = toast.loading("מבטל...");
    try {
      const result = await cancelReservation({ id: resId });
      if (result.error) throw new Error(result.error.message);
      toast.success("ההזמנה בוטלה", { id: loadingToast });
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleComplete = async (resId: string) => {
    const loadingToast = toast.loading("מעדכן...");
    try {
      const result = await completeReservation({ id: resId });
      if (result.error) throw new Error(result.error.message);
      toast.success("לקוח הושב", { id: loadingToast });
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // --- Helper Component: Badge ---
  const DetailBadge = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50/80 overflow-hidden">
      <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
        <Icon size={14} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">{label}</span>
        <span className="text-xs font-bold text-gray-800 truncate" title={value}>{value || "-"}</span>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
      const styles = {
          CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
          CANCELLED: 'bg-red-50 text-red-400 border-red-100 line-through',
          COMPLETED: 'bg-gray-100 text-gray-500 border-gray-200',
      };
      const style = styles[status as keyof typeof styles] || styles.PENDING;
      const label = status === 'CONFIRMED' ? 'מאושר' : status === 'CANCELLED' ? 'בוטל' : status === 'COMPLETED' ? 'הושלם' : 'ממתין';
      
      return <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${style}`}>{label}</span>;
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
      >
        <BsCalendarCheck size={18} />
        <span>ניהול הזמנות</span>
      </button>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setIsOpen(false)} dir="rtl">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4">
                <Dialog.Panel className="relative transform overflow-hidden rounded-[2rem] bg-slate-50 text-right shadow-2xl transition-all sm:my-8 w-full max-w-6xl border border-white/60">
                  
                  {/* Header */}
                  <div className="bg-white px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm z-20 relative">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-gray-200">
                        {table.tableNumber}
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-black text-gray-900">יומן הזמנות</Dialog.Title>
                        <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                          מערכת מסונכרנת
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button onClick={refreshData} className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all border border-gray-200" title="רענן נתונים">
                        <BsArrowRepeat className={fetching ? "animate-spin" : ""} size={20} />
                      </button>
                      <button 
                        onClick={() => {
                            if(showForm && editingId) { resetForm(); setShowForm(true); } 
                            else { setShowForm(!showForm); if(!showForm) scrollToForm(); }
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${showForm && !editingId ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {showForm && !editingId ? <HiOutlineXMark size={20}/> : <BsPlusLg size={16}/>}
                        {showForm && !editingId ? 'סגור טופס' : 'הזמנה חדשה'}
                      </button>
                      <button onClick={() => setIsOpen(false)} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-200"><HiOutlineXMark size={24}/></button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row h-[75vh]">
                    
                    {/* Main Content */}
                    <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
                      
                      {/* Form Area */}
                      <div ref={formRef}>
                        <Transition show={showForm} as={Fragment} enter="duration-300 ease-out" enterFrom="opacity-0 -translate-y-4 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="duration-200 ease-in" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-4">
                          <form onSubmit={handleSubmit} className={`p-6 rounded-3xl border-2 shadow-xl mb-10 relative overflow-hidden ${editingId ? 'bg-amber-50/50 border-amber-200 shadow-amber-100' : 'bg-white border-blue-100 shadow-blue-100/50'}`}>
                            
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${editingId ? 'bg-amber-400' : 'bg-blue-500'}`} />
                            
                            <h3 className={`text-lg font-black mb-6 flex items-center gap-2 ${editingId ? 'text-amber-700' : 'text-gray-800'}`}>
                               {editingId ? <BsPencilSquare className="text-amber-500"/> : <BsPlusLg className="text-blue-500"/>}
                               {editingId ? 'עריכת הזמנה' : 'יצירת הזמנה חדשה'}
                            </h3>
                            
                            {/* Grid Layout for Form Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                              
                              {/* 1. Customer Name */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">שם הלקוח</label>
                                <div className="relative">
                                  <BsPersonVcard className="absolute right-3.5 top-3 text-gray-400"/>
                                  <input 
                                    type="text"
                                    required={!formData.userEmail} // חובה אם אין אימייל
                                    disabled={!!editingId}
                                    className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100" 
                                    placeholder="שם מלא (לאורח)" 
                                    value={formData.customerName} 
                                    onChange={e => setFormData({...formData, customerName: e.target.value})} 
                                  />
                                </div>
                              </div>

                              {/* 2. Email */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">אימייל (אופציונלי)</label>
                                <div className="relative">
                                  <BsEnvelope className="absolute right-3.5 top-3 text-gray-400"/>
                                  <input 
                                    type="email" 
                                    disabled={!!editingId}
                                    className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100" 
                                    placeholder="customer@mail.com" 
                                    value={formData.userEmail} 
                                    onChange={e => setFormData({...formData, userEmail: e.target.value})} 
                                  />
                                </div>
                              </div>

                              {/* 3. Diners */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">סועדים</label>
                                <div className="relative">
                                  <BsPeople className="absolute right-3.5 top-3 text-gray-400"/>
                                  <input required type="number" min="1" className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.numOfDiners} onChange={e => setFormData({...formData, numOfDiners: parseInt(e.target.value)})} />
                                </div>
                              </div>

                              {/* 4. Date & Time */}
                              <div className="space-y-1.5 lg:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">תאריך ושעה</label>
                                <div className="flex gap-2">
                                  <input required type="date" className="flex-[3] px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                  <input required type="time" className="flex-[2] px-1 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-8 flex gap-3">
                              <button type="submit" className={`flex-1 py-3.5 rounded-xl font-black text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                                {editingId ? 'שמור שינויים' : 'אשר ושריין מקום'}
                              </button>
                              {editingId && (
                                  <button type="button" onClick={resetForm} className="px-8 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 hover:text-gray-800 transition-all">
                                      ביטול
                                  </button>
                              )}
                            </div>
                          </form>
                        </Transition>
                      </div>

                      {/* Date Filter */}
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                             <BsCalendarDate size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">תאריך תצוגה</span>
                            <input 
                              type="date" 
                              className="bg-transparent font-black text-gray-800 outline-none text-base cursor-pointer" 
                              value={selectedDate} 
                              onChange={e => setSelectedDate(e.target.value)} 
                            />
                          </div>
                        </div>
                        <div className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                          {reservationsForSelectedDate.length} הזמנות
                        </div>
                      </div>

                      {/* List */}
                      {reservationsForSelectedDate.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 border-2 border-dashed border-gray-300 rounded-3xl">
                          <BsInbox size={64} className="text-gray-400 mb-4" />
                          <p className="text-gray-500 font-bold text-lg">היומן פנוי לתאריך זה</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-10">
                          {reservationsForSelectedDate.map((res: any) => {
                            // זיהוי שם לקוח (רגיל או אורח)
                            let displayName = res.user?.name;
                            if (!displayName) {
                                if (res.userEmail.includes("guest_")) {
                                    const parts = res.userEmail.split('_');
                                    displayName = parts.length >= 2 ? parts[1].replace(/_/g, ' ') : "אורח";
                                } else {
                                    displayName = res.userEmail.split('@')[0];
                                }
                            }

                            return (
                              <div key={res.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:border-blue-100 group relative overflow-hidden ${res.status === 'CANCELLED' ? 'opacity-60 grayscale' : ''}`}>
                                  
                                  <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-lg font-black shadow-md flex items-center gap-2">
                                          <BsClock size={16} className="text-slate-400"/>
                                          {new Date(res.reservationTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <StatusBadge status={res.status} />
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 bg-white shadow-sm border border-gray-100 rounded-lg p-1">
                                        {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                                          <>
                                              <button onClick={() => handleEditClick(res)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="ערוך"><BsPencilSquare size={18}/></button>
                                              <button onClick={() => handleComplete(res.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title="הושב לקוח"><BsCheckCircleFill size={18}/></button>
                                              <button onClick={() => handleCancel(res.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-md transition-colors" title="בטל"><BsXCircle size={18}/></button>
                                          </>
                                        )}
                                        {res.status === 'CANCELLED' && (
                                            <button onClick={() => handleEditClick(res)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="שחזר"><BsArrowCounterclockwise size={18}/></button>
                                        )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <DetailBadge icon={BsPersonBadge} label="לקוח" value={displayName} color="bg-blue-500" />
                                    <DetailBadge icon={BsPeople} label="סועדים" value={res.numOfDiners} color="bg-purple-500" />
                                    <DetailBadge icon={BsTelephone} label="טלפון" value={res.user?.profile?.phone || "-"} color="bg-emerald-500" />
                                    <DetailBadge icon={BsEnvelope} label="אימייל" value={res.userEmail.includes("guest_") ? "-" : res.userEmail} color="bg-amber-500" />
                                  </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sidebar History */}
                    <div className="hidden lg:block w-96 bg-white border-r border-gray-100 p-8 overflow-y-auto">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-8">
                        <BsInfoCircle className="text-blue-500" /> היסטוריה מלאה
                      </h3>
                      <div className="relative border-r-2 border-gray-100 pr-5 mr-2 space-y-8">
                        {tableAllReservations.map((res: any) => {
                           let displayName = res.user?.name;
                           if (!displayName) {
                               if (res.userEmail.includes("guest_")) {
                                   const parts = res.userEmail.split('_');
                                   displayName = parts.length >= 2 ? parts[1].replace(/_/g, ' ') : "אורח";
                               } else {
                                   displayName = res.userEmail.split('@')[0];
                               }
                           }

                           return (
                            <div key={res.id} className="relative group">
                              <div className={`absolute -right-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 
                                  ${res.status === 'CANCELLED' ? 'bg-red-400' : res.status === 'COMPLETED' ? 'bg-gray-400' : 'bg-blue-500'}`} 
                              />
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{new Date(res.reservationTime).toLocaleDateString('he-IL')}</span>
                                <span className={`text-[9px] font-bold px-1.5 rounded ${res.status === 'CANCELLED' ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>{res.status}</span>
                              </div>
                              <div className="text-sm font-bold text-gray-800 leading-tight">
                                  {displayName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                <span>{res.numOfDiners} סועדים</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"/>
                                <span>{new Date(res.reservationTime).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                           );
                        })}
                      </div>
                    </div>

                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default TableReservations;