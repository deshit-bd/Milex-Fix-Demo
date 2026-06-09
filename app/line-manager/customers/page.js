"use client";

import CustomersPage from "@/components/customers/CustomersPage";
import RoleGuard from "@/components/shared/RoleGuard";

export default function LineManagerCustomersRoute() {
  return (
    <RoleGuard allowedRole="Line Manager">
      {(session) => <CustomersPage session={session} />}
    </RoleGuard>
  );
}
