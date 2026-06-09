export function getRevisionNumber(revision = "") {
  const match = String(revision || "").match(/^R-?(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

export function getNextRevision(revision = "") {
  return `R${getRevisionNumber(revision) + 1}`;
}

export function formatRevisionLabel(revision = "") {
  const revisionNumber = getRevisionNumber(revision);
  return revisionNumber ? `R${revisionNumber}` : "New";
}

export function formatRevisionIdentifier(identifier = "", revision = "") {
  const revisionNumber = getRevisionNumber(revision);
  return revisionNumber ? `R${revisionNumber}-${identifier}` : identifier;
}

export function formatRateReference(identifier = "", revision = "") {
  return `REF-${formatRevisionIdentifier(identifier, revision)}`;
}

export function getRecordRevision(record = {}) {
  if (getRevisionNumber(record.revision) > 0) return formatRevisionLabel(record.revision);

  const status = record.status || "";
  const isRevisionRecord =
    record.finalization?.stage === "client-rejected" ||
    record.lineManagerApproval?.status === "Revision Requested" ||
    status === "OFFER REJECTED (REVISION REQUIRED)" ||
    status === "REVISION REQUESTED BY LM";

  return isRevisionRecord ? "R1" : "New";
}

export function formatRecordRevisionIdentifier(record = {}) {
  return formatRevisionIdentifier(record.identifier, getRecordRevision(record));
}

export function formatRecordRateReference(record = {}) {
  return formatRateReference(record.identifier, getRecordRevision(record));
}
