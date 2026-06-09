"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import LineManagerDashboard from "@/components/line-manager/LineManagerDashboard";

export default function LineManagerDashboardPage() {
  return (
    <RoleGuard allowedRole="Line Manager">
      {(session) => <LineManagerDashboard session={session} />}
    </RoleGuard>
  );
}
