"use client";

import { useParams } from "next/navigation";
import RoleGuard from "@/components/shared/RoleGuard";
import KamAgreementPage from "@/components/kam/tasks/KamAgreementPage";

export default function KamTaskDetailRoute() {
  const params = useParams();

  return (
    <RoleGuard allowedRole="KAM">
      {(session) => <KamAgreementPage session={session} recordId={params.id} />}
    </RoleGuard>
  );
}
