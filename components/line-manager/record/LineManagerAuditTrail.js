import AuditTrail from "@/components/sales/record/AuditTrail";

export default function LineManagerAuditTrail({ record = {}, decision, auditEvents = [] }) {
  return <AuditTrail record={{ ...record, lineManagerApproval: record.lineManagerApproval || decision, auditEvents: record.auditEvents || auditEvents }} />;
}
