import { FiClock } from "react-icons/fi";
import { buildAuditTrail, formatAuditEventDate } from "@/lib/auditTrail";

export default function AuditTrail({ record = {}, auditEvents = [] }) {
  const timeline = buildAuditTrail({ ...record, auditEvents: record.auditEvents || auditEvents });

  return (
    <section className="audit-card">
      <h2><FiClock /> Process Audit Trail</h2>
      {timeline.map((event, index) => (
        <div className={`audit-item ${event.current || index === 0 ? "active" : ""}`} key={event.id || `${event.title}-${event.at || index}`}>
          <i />
          <strong>{event.revision ? `${event.revision} - ${event.title}` : event.title}</strong>
          {[event.description, event.actor].filter(Boolean).length > 0 && (
            <p>{[event.description, event.actor].filter(Boolean).join(" | ")}</p>
          )}
          {formatAuditEventDate(event.at) && <p>{formatAuditEventDate(event.at)}</p>}
        </div>
      ))}
    </section>
  );
}
