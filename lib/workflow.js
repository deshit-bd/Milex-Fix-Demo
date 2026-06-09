import {
  CLIENT_FINALIZATION_KEY,
  LINE_MANAGER_APPROVAL_KEY,
  OFFER_DOCUMENT_KEY,
  RATE_ACTION_KEY,
  SAMPLE_RECORD_DETAIL,
} from "@/components/sales/record/recordData";
import { fetchDatabase, generateCustomerCode, generateCustomerCodeFromServer, readRecords, runDatabaseAction } from "./database";

export const SUBMITTED_RECOMMENDATION_KEY = "milex.kam.recommendation.submitted";
export const SALES_SELECTED_RECORD_KEY = "milex.sales.selected-record";
export const LINE_MANAGER_SELECTED_RECORD_KEY = "milex.line-manager.selected-record";
const SERVER_WORKFLOW_KEYS = [
  SUBMITTED_RECOMMENDATION_KEY,
  SALES_SELECTED_RECORD_KEY,
  LINE_MANAGER_SELECTED_RECORD_KEY,
  RATE_ACTION_KEY,
  LINE_MANAGER_APPROVAL_KEY,
  OFFER_DOCUMENT_KEY,
  CLIENT_FINALIZATION_KEY,
];

export function createCustomerCode() {
  return generateCustomerCode();
}

export async function createCustomerCodeFromServer() {
  return generateCustomerCodeFromServer();
}

export function readWorkflowItem(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function writeWorkflowItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function writeWorkflowItemOnServer(key, value) {
  writeWorkflowItem(key, value);
  return runDatabaseAction("writeWorkflowItem", { key, value });
}

export function getWorkflowSnapshot() {
  return {
    submitted: readWorkflowItem(SUBMITTED_RECOMMENDATION_KEY),
    rateAction: readWorkflowItem(RATE_ACTION_KEY),
    approval: readWorkflowItem(LINE_MANAGER_APPROVAL_KEY),
    offerDocument: readWorkflowItem(OFFER_DOCUMENT_KEY),
    finalization: readWorkflowItem(CLIENT_FINALIZATION_KEY),
  };
}

export async function getWorkflowSnapshotFromServer() {
  const db = await fetchDatabase();
  const workflow = db.workflow || {};
  if (db.apiError) return getWorkflowSnapshot();

  SERVER_WORKFLOW_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(workflow, key) && workflow[key]) {
      writeWorkflowItem(key, workflow[key]);
    } else {
      localStorage.removeItem(key);
    }
  });

  return {
    submitted: workflow[SUBMITTED_RECOMMENDATION_KEY] || null,
    rateAction: workflow[RATE_ACTION_KEY] || null,
    approval: workflow[LINE_MANAGER_APPROVAL_KEY] || null,
    offerDocument: workflow[OFFER_DOCUMENT_KEY] || null,
    finalization: workflow[CLIENT_FINALIZATION_KEY] || null,
  };
}

export function getSalesWorkflowStatus(snapshot = getWorkflowSnapshot()) {
  if (snapshot.finalization?.stage === "activated") return { status: "ACTIVE & DISTRIBUTED", tone: "success" };
  if (snapshot.finalization?.stage === "documents") return { status: "CLIENT FINAL DATA UPDATE", tone: "info" };
  if (snapshot.finalization?.stage === "final-profile") return { status: "FINAL PROFILE DATA", tone: "info" };
  if (snapshot.finalization?.stage === "client-rejected") return { status: "OFFER REJECTED (REVISION REQUIRED)", tone: "danger" };
  if (snapshot.offerDocument) return { status: "OFFER DELIVERED (PENDING AGREEMENT)", tone: "warning" };
  if (snapshot.approval?.status === "Approved") return { status: "APPROVED (PENDING OFFER LETTER)", tone: "warning" };
  if (snapshot.approval?.status === "Revision Requested") return { status: "REVISION REQUESTED BY LM", tone: "warning" };
  if (snapshot.rateAction) return { status: "PENDING LM APPROVAL", tone: "warning" };
  if (snapshot.submitted) return { status: "PENDING RATE PREPARATION", tone: "info" };
  return { status: "PENDING RATE PREPARATION", tone: "info" };
}

export function getLineManagerWorkflowStatus(snapshot = getWorkflowSnapshot()) {
  if (snapshot.approval?.status === "Approved") return { status: "APPROVED BY LM", tone: "success" };
  if (snapshot.approval?.status === "Revision Requested") return { status: "REVISION REQUESTED", tone: "warning" };
  if (snapshot.rateAction) return { status: "PENDING RATE APPROVAL", tone: "warning" };
  return { status: "WAITING FOR RATE", tone: "info" };
}

export function buildRecordFromWorkflow(selectedRecord = null) {
  const snapshot = getWorkflowSnapshot();
  const submitted = snapshot.submitted || {};
  const base = {
    ...SAMPLE_RECORD_DETAIL,
    ...(selectedRecord || {}),
  };

  return {
    ...base,
    identifier: selectedRecord?.identifier || snapshot.submitted?.identifier || snapshot.rateAction?.identifier || "",
    accountName: submitted.accountName || selectedRecord?.accountName || base.accountName,
    address: submitted.primaryAddress || base.address,
    businessType: submitted.businessType || base.businessType,
    mobile: submitted.mobileNumber || base.mobile,
    email: submitted.emailAddress || base.email,
    requestedLimit: submitted.creditLimit
      ? `TK ${submitted.creditLimit}${submitted.creditPeriod ? ` (${submitted.creditPeriod} Days)` : ""}`
      : base.requestedLimit,
    keyContact: {
      name: submitted.keyName || base.keyContact.name,
      phone: submitted.keyMobile || base.keyContact.phone,
      email: submitted.keyEmail || base.keyContact.email,
    },
    seniorContact: {
      name: submitted.seniorName || base.seniorContact?.name || "",
      phone: submitted.seniorMobile || base.seniorContact?.phone || "",
      email: submitted.seniorEmail || base.seniorContact?.email || "",
    },
    financialContact: {
      name: submitted.financialName || base.financialContact.name,
      phone: submitted.financialMobile || base.financialContact.phone,
      email: submitted.financialEmail || base.financialContact.email,
    },
    recommendationNote: submitted.recommendationNote || base.recommendationNote,
  };
}

export async function buildRecordFromWorkflowFromServer(selectedRecord = null) {
  const snapshot = await getWorkflowSnapshotFromServer();
  const submitted = snapshot.submitted || {};
  const base = {
    ...SAMPLE_RECORD_DETAIL,
    ...(selectedRecord || {}),
  };

  return {
    ...base,
    identifier: selectedRecord?.identifier || submitted?.identifier || snapshot.rateAction?.identifier || "",
    accountName: submitted.accountName || selectedRecord?.accountName || base.accountName,
    address: submitted.primaryAddress || base.address,
    businessType: submitted.businessType || base.businessType,
    mobile: submitted.mobileNumber || base.mobile,
    email: submitted.emailAddress || base.email,
    requestedLimit: submitted.creditLimit
      ? `TK ${submitted.creditLimit}${submitted.creditPeriod ? ` (${submitted.creditPeriod} Days)` : ""}`
      : base.requestedLimit,
    keyContact: {
      name: submitted.keyName || base.keyContact.name,
      phone: submitted.keyMobile || base.keyContact.phone,
      email: submitted.keyEmail || base.keyContact.email,
    },
    seniorContact: {
      name: submitted.seniorName || base.seniorContact?.name || "",
      phone: submitted.seniorMobile || base.seniorContact?.phone || "",
      email: submitted.seniorEmail || base.seniorContact?.email || "",
    },
    financialContact: {
      name: submitted.financialName || base.financialContact.name,
      phone: submitted.financialMobile || base.financialContact.phone,
      email: submitted.financialEmail || base.financialContact.email,
    },
    recommendationNote: submitted.recommendationNote || base.recommendationNote,
  };
}

export function getSalesRecords() {
  const snapshot = getWorkflowSnapshot();
  const workflowStatus = getSalesWorkflowStatus(snapshot);
  const records = readRecords();

  if (snapshot.submitted) {
    const submittedRecord = {
      identifier: snapshot.submitted.identifier,
      accountName: snapshot.submitted.accountName || "",
      status: workflowStatus.status,
      revision: snapshot.approval?.status === "Revision Requested" || snapshot.finalization?.stage === "client-rejected" ? "R1" : "New",
      tone: workflowStatus.tone,
    };
    const existingIndex = records.findIndex((record) => record.identifier === submittedRecord.identifier);
    if (existingIndex >= 0) records[existingIndex] = submittedRecord;
    else records.push(submittedRecord);
  }

  return records;
}

export async function getSalesRecordsFromServer() {
  const db = await fetchDatabase();
  if (db.apiError) return getSalesRecords();

  return db.records || [];
}

export function getLineManagerRecords() {
  const snapshot = getWorkflowSnapshot();
  const workflowStatus = getLineManagerWorkflowStatus(snapshot);
  const records = readRecords();

  if (snapshot.rateAction) {
    const rateRecord = {
      identifier: snapshot.rateAction.identifier || "",
      accountName: snapshot.rateAction.accountName || "",
      status: workflowStatus.status,
      revision: snapshot.approval?.status === "Revision Requested" ? "R1" : "New",
      tone: workflowStatus.tone,
    };
    const existingIndex = records.findIndex((record) => record.identifier === rateRecord.identifier);
    if (existingIndex >= 0) records[existingIndex] = rateRecord;
    else records.push(rateRecord);
  }

  return records.filter((record) =>
    ["PENDING LM APPROVAL", "PENDING RATE APPROVAL", "APPROVED (PENDING OFFER LETTER)", "REVISION REQUESTED BY LM"].includes(record.status)
  );
}

export async function getLineManagerRecordsFromServer() {
  const db = await fetchDatabase();
  if (db.apiError) return getLineManagerRecords();

  return (db.records || []).filter((record) =>
    ["PENDING LM APPROVAL", "PENDING RATE APPROVAL", "APPROVED (PENDING OFFER LETTER)", "REVISION REQUESTED BY LM"].includes(record.status)
  );
}
