import { FiBarChart2, FiBriefcase, FiCheckSquare, FiGrid, FiStar, FiUsers } from "react-icons/fi";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: FiGrid, href: "/kam/dashboard" },
  { label: "Recommendations", icon: FiStar, href: "/kam/recommendations" },
  { label: "Task Queue & Record", icon: FiCheckSquare, href: "/kam/tasks" },
  { label: "Customers", icon: FiUsers, href: "/kam/customers" },
];

export const OVERVIEW_CARDS = [
  { label: "Active Accounts", value: "11", icon: FiBarChart2, tone: "blue" },
  { label: "Pipeline Accounts", value: "4", icon: FiBriefcase, tone: "blue" },
  { label: "Your Queue", value: "0", icon: FiStar, tone: "green" },
];
