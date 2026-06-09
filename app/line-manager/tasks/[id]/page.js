"use client";

import { useParams } from "next/navigation";
import RoleGuard from "@/components/shared/RoleGuard";
import LineManagerRecordPlaceholder from "@/components/line-manager/LineManagerRecordPlaceholder";

export default function LineManagerTaskPage() {
  const params = useParams();

  return (
    <RoleGuard allowedRole="Line Manager">
      {(session) => <LineManagerRecordPlaceholder session={session} recordId={params.id} />}
    </RoleGuard>
  );
}
