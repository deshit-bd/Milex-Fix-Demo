"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import SalesTasksPage from "@/components/sales/tasks/SalesTasksPage";

export default function TasksPage() {
  return (
    <RoleGuard allowedRole="Sales Coordinator">
      {(session) => <SalesTasksPage session={session} />}
    </RoleGuard>
  );
}
