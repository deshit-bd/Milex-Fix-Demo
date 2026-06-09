"use client";

import { useParams } from "next/navigation";
import RoleGuard from "@/components/shared/RoleGuard";
import SalesRecordPage from "@/components/sales/record/SalesRecordPage";

export default function RecordPage() {
  const params = useParams();

  return (
    <RoleGuard allowedRole="Sales Coordinator">
      {(session) => <SalesRecordPage session={session} recordId={params.id} />}
    </RoleGuard>
  );
}
