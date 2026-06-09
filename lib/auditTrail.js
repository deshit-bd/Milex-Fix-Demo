export function formatAuditEventDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getCurrentAuditStep(record = {}) {
  const status = record.status || "PENDING RATE PREPARATION";
  const finalStage = record.finalization?.stage || "";

  if (finalStage === "activated" || status === "ACTIVE & DISTRIBUTED") {
    return { title: "PROFILE ACTIVATED", description: "Customer profile distributed" };
  }
  if (finalStage === "documents" || status === "CLIENT FINAL DATA UPDATE") {
    return { title: "CLIENT FINAL DATA UPDATE", description: "Waiting for legal documents" };
  }
  if (finalStage === "final-profile" || status === "PENDING_PROFILE" || status === "FINAL PROFILE DATA") {
    return { title: "PENDING_PROFILE", description: "Waiting for account profile setup" };
  }
  if (finalStage === "client-rejected" || status === "OFFER REJECTED (REVISION REQUIRED)") {
    return { title: "OFFER REJECTED", description: record.finalization?.rejectReason || record.offerRejectReason || record.revisionNote || "Revision required" };
  }
  if (status.includes("CLIENT ACCEPTED")) {
    return { title: "CLIENT ACCEPTED OFFER", description: "Waiting for agreement completion" };
  }
  if (status.includes("OFFER DELIVERED") || record.offerDocument) {
    return { title: "OFFER DELIVERED", description: "Waiting for client agreement" };
  }
  if (status === "APPROVED (PENDING OFFER LETTER)" || record.lineManagerApproval?.status === "Approved") {
    return { title: "APPROVED (PENDING OFFER LETTER)", description: "Rate approved. Sales Coordinator is preparing the offer letter" };
  }
  if (status === "REVISION REQUESTED BY LM" || record.lineManagerApproval?.status === "Revision Requested") {
    return { title: "REVISION REQUESTED BY LM", description: record.revisionNote || record.lineManagerApproval?.note || "Sales Coordinator must revise and forward rate again" };
  }
  if (status === "PENDING LM APPROVAL" || status === "PENDING RATE APPROVAL" || record.rateAction) {
    return { title: "PENDING RATE APPROVAL", description: "Waiting for Line Manager approval" };
  }

  return { title: "PENDING RATE PREPARATION", description: "Waiting for Pricing Team" };
}

function normalizeAuditEvent(event = {}) {
  const title = String(event.title || "").toUpperCase();

  // Recommendation note must never be shown inside Process Audit Trail.
  // It belongs only in the separate KAM Recommendation Note box.
  if (title.includes("RECOMMENDATION FORM")) {
    return {
      ...event,
      title: "RECOMMENDATION FORM",
      description: "CREATED BY KAM",
      actor: "",
    };
  }

  return event;
}

export function buildAuditTrail(record = {}) {
  const events = Array.isArray(record.auditEvents)
    ? record.auditEvents.filter((event) => event?.title).map(normalizeAuditEvent)
    : [];
  const current = getCurrentAuditStep(record);
  const latestEvent = events[events.length - 1];
  const currentAlreadyLogged = latestEvent?.title === current.title || latestEvent?.title?.includes(current.title);

  const timeline = currentAlreadyLogged ? [] : [{ ...current, current: true }];

  [...events].reverse().forEach((event, index) => {
    timeline.push({
      ...event,
      current: currentAlreadyLogged && index === 0,
    });
  });

  if (!events.some((event) => event.title?.includes("RECOMMENDATION FORM"))) {
    timeline.push({
      title: "RECOMMENDATION FORM",
      description: "CREATED BY KAM",
      actor: "",
      at: record.submittedAt || record.createdAt || record.recommendation?.submittedAt || "",
    });
  }

  return timeline;
}
