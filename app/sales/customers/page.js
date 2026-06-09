"use client";

import CustomersPage from "@/components/customers/CustomersPage";
import RoleGuard from "@/components/shared/RoleGuard";

export default function SalesCustomersRoute() {
  return (
    <RoleGuard allowedRole="Sales Coordinator">
      {(session) => <CustomersPage session={session} />}
    </RoleGuard>
  );
}
