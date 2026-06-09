"use client";

import CustomersPage from "@/components/customers/CustomersPage";
import RoleGuard from "@/components/shared/RoleGuard";

export default function KamCustomersRoute() {
  return (
    <RoleGuard allowedRole="KAM">
      {(session) => <CustomersPage session={session} />}
    </RoleGuard>
  );
}
