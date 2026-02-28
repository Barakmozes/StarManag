
import {  AiOutlineDashboard, AiOutlineMessage } from "react-icons/ai";

import {
  HiOutlineUserGroup,
  HiOutlineHome,
  HiOutlineTruck,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineClock,
} from "react-icons/hi2";

import { CiReceipt } from "react-icons/ci";
import {  VscLayoutMenubar } from "react-icons/vsc";

export const AdminRoutes = [
    { title: "Home", icon: HiOutlineHome, url: "/" },
    { title: "Dashboard", icon: AiOutlineDashboard, url: "/dashboard" },
    { title: "Users", icon: HiOutlineUserGroup, url: "/dashboard/users" },
    { title: "Orders", icon: CiReceipt, url: "/dashboard/orders" },
    { title: "Menu", icon: VscLayoutMenubar, url: "/dashboard/menu" },
    { title: "Notifications", icon: AiOutlineMessage, url: "/dashboard/notifications" },
    { title: "Scheduling", icon: HiOutlineCalendarDays, url: "/dashboard/scheduling" },
    { title: "Attendance", icon: HiOutlineClock, url: "/dashboard/attendance" },
    { title: "Deliveries", icon: HiOutlineTruck, url: "/dashboard/deliveries" },
    { title: "Settings", icon: HiOutlineCog6Tooth, url: "/dashboard/settings" },
  ];