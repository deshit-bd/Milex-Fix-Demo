export const DB_KEY = "milex.database.v3";
const API_URL = "/api/database";
let serverDatabaseRequest = null;

const INITIAL_DB = {
  records: [],
  customers: [],
  nextCustomerNumber: 1,
};

export function ensureDatabase() {
  if (typeof window === "undefined") return INITIAL_DB;

  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(DB_KEY);
    }
  }

  localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
  return INITIAL_DB;
}

export function readDatabase() {
  return ensureDatabase();
}

export function writeDatabase(nextDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(nextDb));
  return nextDb;
}


function makeLocalAuditEvent(title, description = "", actor = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    actor,
    at: new Date().toISOString(),
  };
}

function clearBrowserDatabaseData() {
  if (typeof window === "undefined") return;

  Object.keys(localStorage)
    .filter((key) => key.startsWith("milex.") && key !== "milex.session")
    .forEach((key) => localStorage.removeItem(key));
}

export function readRecords() {
  return readDatabase().records || [];
}

export function readCustomers() {
  return readDatabase().customers || [];
}

export function upsertRecord(record) {
  const db = readDatabase();
  const records = db.records || [];
  const existingIndex = records.findIndex((item) => item.identifier === record.identifier);
  const nextRecord = { revision: "New", tone: "info", ...records[existingIndex], ...record };
  const nextRecords =
    existingIndex >= 0
      ? records.map((item, index) => (index === existingIndex ? nextRecord : item))
      : [...records, nextRecord];

  writeDatabase({ ...db, records: nextRecords });
  return nextRecord;
}

function getStatusRank(status = "") {
  const ranks = {
    "PENDING RATE PREPARATION": 1,
    "PENDING LM APPROVAL": 2,
    "PENDING RATE APPROVAL": 2,
    "REVISION REQUESTED BY LM": 3,
    "OFFER REJECTED (REVISION REQUIRED)": 3,
    "APPROVED (PENDING OFFER LETTER)": 4,
    "OFFER DELIVERED (PENDING AGREEMENT)": 5,
    "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)": 6,
    PENDING_PROFILE: 7,
    "FINAL PROFILE DATA": 7,
    "CLIENT FINAL DATA UPDATE": 8,
    "ACTIVE & DISTRIBUTED": 9,
  };
  return ranks[status] || 0;
}

function mergeRecords(serverRecords = [], localRecords = []) {
  const merged = new Map();
  serverRecords.forEach((record) => merged.set(normalizeIdentifier(record.identifier).trim(), record));
  localRecords.forEach((localRecord) => {
    const identifier = normalizeIdentifier(localRecord.identifier).trim();
    if (!merged.has(identifier)) {
      merged.set(identifier, { ...localRecord, identifier });
    }
  });
  return Array.from(merged.values());
}

function mergeCustomers(serverCustomers = [], localCustomers = []) {
  const merged = new Map();
  serverCustomers.forEach((customer) => merged.set(normalizeIdentifier(customer.customerId).trim(), customer));
  localCustomers.forEach((localCustomer) => {
    const customerId = normalizeIdentifier(localCustomer.customerId).trim();
    if (!merged.has(customerId)) {
      merged.set(customerId, { ...localCustomer, customerId });
    }
  });
  return Array.from(merged.values());
}

export function updateRecordStatus(identifier, status, tone = "info", extras = {}) {
  const nextExtras = { ...extras };
  const auditEvent = nextExtras.auditEvent;
  delete nextExtras.auditEvent;
  const existing = readRecords().find((record) => record.identifier === identifier);
  const auditEvents = auditEvent ? [...(existing?.auditEvents || []), auditEvent] : nextExtras.auditEvents;
  return upsertRecord({ identifier, status, tone, ...nextExtras, ...(auditEvents ? { auditEvents } : {}) });
}

function normalizeIdentifier(identifier) {
  return identifier ? String(identifier).replace(/^MLX-/, "MLX") : "";
}

export function upsertCustomer(customer) {
  const db = readDatabase();
  const customers = db.customers || [];
  const existingIndex = customers.findIndex((item) => item.customerId === customer.customerId);
  const nextCustomer = { status: "ACTIVE & DISTRIBUTED", ...customers[existingIndex], ...customer };
  const nextCustomers =
    existingIndex >= 0
      ? customers.map((item, index) => (index === existingIndex ? nextCustomer : item))
      : [...customers, nextCustomer];

  writeDatabase({ ...db, customers: nextCustomers });
  return nextCustomer;
}

export function getDashboardStats(records = readRecords()) {
  const activeAccounts = records.filter((record) => record.status === "ACTIVE & DISTRIBUTED").length;
  const pipelineAccounts = records.filter((record) => record.status !== "ACTIVE & DISTRIBUTED").length;
  const yourQueue = records.filter((record) =>
    ["PENDING RATE PREPARATION", "PENDING LM APPROVAL", "PENDING RATE APPROVAL"].includes(record.status)
  ).length;
  const conversionRate = records.length ? Math.round((activeAccounts / records.length) * 100) : 0;

  return {
    activeAccounts,
    pipelineAccounts,
    yourQueue,
    conversionRate,
  };
}

export function resetDemoData() {
  if (typeof window === "undefined") return INITIAL_DB;

  Object.keys(localStorage)
    .filter((key) => key.startsWith("milex.") && key !== "milex.session")
    .forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
  return INITIAL_DB;
}

export function generateCustomerCode() {
  const db = readDatabase();
  const nextNumber = db.nextCustomerNumber || 1;
  const identifier = `MLX${String(nextNumber).padStart(6, "0")}`;

  writeDatabase({ ...db, nextCustomerNumber: nextNumber + 1 });
  return identifier;
}

export async function fetchDatabase() {
  try {
    const result = await requestServerDatabase();
    const nextDb = {
      records: result.db.records || [],
      customers: result.db.customers || [],
      nextCustomerNumber: result.db.nextCustomerNumber || 1,
      workflow: result.db.workflow || {},
    };
    writeDatabase(nextDb);
    return nextDb;
  } catch (error) {
    return { ...readDatabase(), workflow: readDatabase().workflow || {}, apiError: error.message };
  }
}

export async function fetchServerDatabase() {
  try {
    const result = await requestServerDatabase();
    writeDatabase({
      records: result.db.records || [],
      customers: result.db.customers || [],
      nextCustomerNumber: result.db.nextCustomerNumber || 1,
      workflow: result.db.workflow || {},
    });
    return result.db;
  } catch (error) {
    const cachedDb = readDatabase();
    if ((cachedDb.records || []).length || (cachedDb.customers || []).length) {
      return { ...cachedDb, apiError: error.message };
    }
    throw error;
  }
}

async function requestServerDatabase() {
  if (serverDatabaseRequest) return serverDatabaseRequest;

  serverDatabaseRequest = fetch(API_URL, { cache: "no-store" })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Database request failed");
      return result;
    })
    .finally(() => {
      serverDatabaseRequest = null;
    });

  return serverDatabaseRequest;
}

export async function runDatabaseAction(type, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Database action failed");
    if (result.db) {
      if (type === "resetDatabase") clearBrowserDatabaseData();
      writeDatabase({
        records: result.db.records || [],
        customers: result.db.customers || [],
        nextCustomerNumber: result.db.nextCustomerNumber || 1,
        workflow: result.db.workflow || {},
      });
    }
    if (result.record) upsertRecord(result.record);
    if (result.customer) upsertCustomer(result.customer);
    return result;
  } catch (error) {
    if (type === "generateCustomerCode") {
      const identifier = generateCustomerCode();
      return { ok: true, localOnly: true, identifier, db: readDatabase() };
    }

    if (type === "submitRecommendation") {
      const recommendation = { ...(payload.record || {}) };
      recommendation.identifier = normalizeIdentifier(recommendation.identifier);
      const record = upsertRecord({
        ...recommendation,
        identifier: recommendation.identifier,
        accountName: recommendation.accountName,
        status: "PENDING RATE PREPARATION",
        revision: "New",
        tone: "info",
        recommendation: { ...recommendation, submittedAt: recommendation.submittedAt || new Date().toISOString() },
        submittedAt: recommendation.submittedAt || new Date().toISOString(),
        auditEvents: [makeLocalAuditEvent("RECOMMENDATION FORM", "CREATED BY KAM", "")],
        rateAction: null,
        lineManagerApproval: null,
        offerDocument: null,
        finalization: null,
        revisionNote: "",
      });
      return { ok: true, localOnly: true, warning: error.message, record, db: readDatabase() };
    }

    if (type === "forwardRate") {
      const identifier = normalizeIdentifier(payload.identifier);
      const existing = readRecords().find((item) => item.identifier === identifier);
      const rateAction = { ...(payload.rateAction || {}), identifier };
      const record = updateRecordStatus(identifier, "PENDING LM APPROVAL", "warning", {
        ...existing,
        accountName: payload.accountName || existing?.accountName || "",
        revision: existing?.revision || "New",
        rateAction,
        lineManagerApproval: null,
        lineManagerDecision: "",
        lineManagerDecidedAt: "",
        offerDocument: null,
        finalization: null,
        revisionNote: "",
        rateForwardedAt: new Date().toISOString(),
        auditEvent: payload.auditEvent,
      });
      return { ok: true, localOnly: true, warning: error.message, record, db: readDatabase() };
    }

    return { ok: false, error: error.message, db: readDatabase() };
  }
}

export async function generateCustomerCodeFromServer() {
  const result = await runDatabaseAction("generateCustomerCode");
  return result.identifier || generateCustomerCode();
}

export async function upsertRecordOnServer(record) {
  const localRecord = upsertRecord(record);
  const result = await runDatabaseAction("upsertRecord", { record });
  return result.record ? upsertRecord(result.record) : localRecord;
}

export async function updateRecordStatusOnServer(identifier, status, tone = "info", extras = {}) {
  const localRecord = updateRecordStatus(identifier, status, tone, extras);
  const result = await runDatabaseAction("updateRecordStatus", { identifier, status, tone, extras });
  return result.record ? upsertRecord(result.record) : localRecord;
}

export async function upsertCustomerOnServer(customer) {
  const localCustomer = upsertCustomer(customer);
  const result = await runDatabaseAction("upsertCustomer", { customer });
  return result.customer ? upsertCustomer(result.customer) : localCustomer;
}
