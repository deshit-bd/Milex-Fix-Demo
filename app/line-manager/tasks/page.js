"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import LineManagerTasksPage from "@/components/line-manager/tasks/LineManagerTasksPage";

export default function TasksPage() {
  return (
    <RoleGuard allowedRole="Line Manager">
      {(session) => <LineManagerTasksPage session={session} />}
    </RoleGuard>
  );
}
