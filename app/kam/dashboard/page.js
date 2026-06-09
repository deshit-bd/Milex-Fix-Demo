"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import KamDashboard from "@/components/kam/KamDashboard";

export default function KamDashboardPage() {
  return (
    <RoleGuard allowedRole="KAM">
      {(session) => <KamDashboard session={session} />}
    </RoleGuard>
  );
}
