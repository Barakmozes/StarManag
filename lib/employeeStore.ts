import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ViewMode = "WEEK" | "DAY" | "MONTH";

type EmployeeStore = {
  // Schedule view state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  currentWeekStart: Date;
  setCurrentWeekStart: (date: Date) => void;
  navigateWeek: (delta: number) => void;

  // Filters
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;

  selectedRoleFilter: string | null;
  setSelectedRoleFilter: (role: string | null) => void;

  selectedEmployeeEmail: string | null;
  setSelectedEmployeeEmail: (email: string | null) => void;

  // Editing state
  editingShiftId: string | null;
  setEditingShiftId: (id: string | null) => void;
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    devtools((set, get) => ({
      viewMode: "WEEK",
      setViewMode: (mode) => set({ viewMode: mode }),

      currentWeekStart: getMonday(new Date()),
      setCurrentWeekStart: (date) => set({ currentWeekStart: date }),
      navigateWeek: (delta) => {
        const { currentWeekStart } = get();
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + delta * 7);
        set({ currentWeekStart: next });
      },

      selectedAreaId: null,
      setSelectedAreaId: (id) => set({ selectedAreaId: id }),

      selectedRoleFilter: null,
      setSelectedRoleFilter: (role) => set({ selectedRoleFilter: role }),

      selectedEmployeeEmail: null,
      setSelectedEmployeeEmail: (email) => set({ selectedEmployeeEmail: email }),

      editingShiftId: null,
      setEditingShiftId: (id) => set({ editingShiftId: id }),
    })),
    {
      name: "employee-schedule",
      skipHydration: true,
    }
  )
);
