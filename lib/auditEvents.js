export function makeAuditEvent(title, description = "", actor = "", revision = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    actor,
    revision,
    at: new Date().toISOString(),
  };
}

export function appendAuditEvent(events = [], event = null) {
  if (!event?.title) return events || [];
  return [...(events || []), event];
}
