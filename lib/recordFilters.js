export const QUEUE_STATUSES_BY_ROLE = {
  KAM: [
    "OFFER DELIVERED (PENDING AGREEMENT)",
    "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)",
    "PENDING_PROFILE",
    "FINAL PROFILE DATA",
    "CLIENT FINAL DATA UPDATE",
  ],
  "Line Manager": ["PENDING LM APPROVAL", "PENDING RATE APPROVAL"],
  "Sales Coordinator": [
    "PENDING RATE PREPARATION",
    "REVISION REQUESTED BY LM",
    "OFFER REJECTED (REVISION REQUIRED)",
    "APPROVED (PENDING OFFER LETTER)",
  ],
};

export function isActiveAccount(record) {
  return record.status === "ACTIVE & DISTRIBUTED";
}

export function isPipelineAccount(record) {
  return !isActiveAccount(record);
}

export function isQueueAccountForRole(record, role) {
  const queueStatuses = QUEUE_STATUSES_BY_ROLE[role] || QUEUE_STATUSES_BY_ROLE["Sales Coordinator"];
  return queueStatuses.includes(record.status);
}

export function getDashboardStatsForRole(records, role) {
  const activeAccounts = records.filter(isActiveAccount).length;
  const pipelineAccounts = records.filter(isPipelineAccount).length;
  const yourQueue = records.filter((record) => isQueueAccountForRole(record, role)).length;
  const conversionRate = records.length ? Math.round((activeAccounts / records.length) * 100) : 0;

  return {
    activeAccounts,
    pipelineAccounts,
    yourQueue,
    conversionRate,
  };
}
