"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import SalesDashboard from "@/components/sales/SalesDashboard";

export default function SalesDashboardPage() {
  return (
    <RoleGuard allowedRole="Sales Coordinator">
      {(session) => <SalesDashboard session={session} />}
    </RoleGuard>
  );
}
