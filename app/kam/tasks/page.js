"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import KamTasksPage from "@/components/kam/tasks/KamTasksPage";

export default function KamTasksRoute() {
  return (
    <RoleGuard allowedRole="KAM">
      {(session) => <KamTasksPage session={session} />}
    </RoleGuard>
  );
}
