import { NextResponse } from "next/server";
import {
  deleteSheetRecord,
  deleteSheetWorkflowItem,
  generateSheetCustomerCode,
  readSheetDatabase,
  resetSheetDatabase,
  upsertSheetCustomer,
  upsertSheetRecord,
  writeSheetWorkflowItem,
} from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

const INITIAL_DB = {
  records: [],
  customers: [],
  workflow: {},
  nextCustomerNumber: 1,
};
const CACHE_TTL_MS = 45_000;

function getCachedDb() {
  const cache = globalThis.__milexSheetDbCache;
  if (!cache) return null;
  return Date.now() < cache.expiresAt ? cache.db : null;
}

function setCachedDb(db) {
  globalThis.__milexSheetDbCache = {
    db,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return db;
}

function getDevTestDb() {
  if (!globalThis.__milexDevTestDb) {
    globalThis.__milexDevTestDb = structuredClone(INITIAL_DB);
  }
  return globalThis.__milexDevTestDb;
}

function isDevTestRequest(request) {
  return process.env.NODE_ENV !== "production" && request.headers.get("x-milex-test-local") === "1";
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function friendlyError(error) {
  return {
    ok: false,
    error: error.message,
    setup:
      "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID in .env.local/Vercel, then share the Sheet with the service account email.",
  };
}

async function getDb({ force = false } = {}) {
  if (!force) {
    const cachedDb = getCachedDb();
    if (cachedDb) return cachedDb;
  }

  return setCachedDb(await readSheetDatabase());
}

function normalizeIdentifier(identifier) {
  return identifier ? String(identifier).replace(/^MLX-/, "MLX") : "";
}


function makeServerAuditEvent(title, description = "", actor = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    actor,
    at: new Date().toISOString(),
  };
}

function withAuditEvent(record, auditEvent) {
  if (!auditEvent?.title) return record;
  return {
    ...record,
    auditEvents: [...(record.auditEvents || []), auditEvent],
  };
}

export async function GET() {
  try {
    return json({ ok: true, db: await getDb() });
  } catch (error) {
    const cache = globalThis.__milexSheetDbCache;
    if (cache?.db) {
      return json({ ok: true, db: cache.db, warning: error.message });
    }
    return json({ ...friendlyError(error), db: INITIAL_DB }, 503);
  }
}

export async function POST(request) {
  try {
    const { type, payload = {} } = await request.json();

    if (isDevTestRequest(request)) {
      const db = getDevTestDb();
      const upsertRecord = (record) => {
        const index = db.records.findIndex((item) => item.identifier === record.identifier);
        const nextRecord = { revision: "New", tone: "info", ...db.records[index], ...record };
        if (index >= 0) db.records[index] = nextRecord;
        else db.records.push(nextRecord);
        return nextRecord;
      };

      if (type === "resetDatabase") {
        globalThis.__milexDevTestDb = structuredClone(INITIAL_DB);
        return json({ ok: true, db: getDevTestDb() });
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
          auditEvents: [makeServerAuditEvent("RECOMMENDATION FORM", "CREATED BY KAM", "")],
          rateAction: null,
          lineManagerApproval: null,
          offerDocument: null,
          finalization: null,
          revisionNote: "",
        });
        return json({ ok: true, record, db });
      }

      if (type === "forwardRate") {
        const identifier = normalizeIdentifier(payload.identifier);
        const existing = db.records.find((item) => item.identifier === identifier);
        const record = upsertRecord(withAuditEvent({
          ...existing,
          accountName: payload.accountName || existing?.accountName || "",
          identifier,
          status: "PENDING LM APPROVAL",
          tone: "warning",
          rateAction: { ...(payload.rateAction || {}), identifier },
          lineManagerApproval: null,
          lineManagerDecision: "",
          lineManagerDecidedAt: "",
          offerDocument: null,
          finalization: null,
          revisionNote: "",
          rateForwardedAt: new Date().toISOString(),
        }, payload.auditEvent));
        return json({ ok: true, record, db });
      }

      if (type === "updateRecordStatus") {
        const identifier = normalizeIdentifier(payload.identifier);
        const extras = { ...(payload.extras || {}) };
        const auditEvent = extras.auditEvent;
        delete extras.auditEvent;
        const existing = db.records.find((item) => item.identifier === identifier);
        const record = upsertRecord(withAuditEvent({
          ...existing,
          ...extras,
          identifier,
          status: payload.status,
          tone: payload.tone || "info",
        }, auditEvent));
        return json({ ok: true, record, db });
      }

      if (type === "upsertCustomer") {
        const customer = { status: "ACTIVE & DISTRIBUTED", ...(payload.customer || {}) };
        const index = db.customers.findIndex((item) => item.customerId === customer.customerId);
        if (index >= 0) db.customers[index] = { ...db.customers[index], ...customer };
        else db.customers.push(customer);
        return json({ ok: true, customer, db });
      }

      if (type === "deleteRecord") {
        const identifier = normalizeIdentifier(payload.identifier);
        db.records = db.records.filter((item) => item.identifier !== identifier);
        return json({ ok: true, db });
      }
    }

    if (type === "generateCustomerCode") {
      return json({ ok: true, identifier: await generateSheetCustomerCode() });
    }

    if (type === "resetDatabase") {
      return json({ ok: true, db: setCachedDb(await resetSheetDatabase()) });
    }

    if (type === "writeWorkflowItem") {
      await writeSheetWorkflowItem(payload.key, payload.value);
      return json({ ok: true });
    }

    if (type === "deleteWorkflowItem") {
      await deleteSheetWorkflowItem(payload.key);
      return json({ ok: true });
    }

    if (type === "upsertRecord") {
      payload.record.identifier = normalizeIdentifier(payload.record.identifier);
      const db = await getDb();
      const existing = db.records.find((item) => item.identifier === payload.record.identifier);
      const record = { revision: "New", tone: "info", ...existing, ...payload.record };
      await upsertSheetRecord(record);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true, record });
    }

    if (type === "deleteRecord") {
      await deleteSheetRecord(payload.identifier);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true });
    }

    if (type === "updateRecordStatus") {
      payload.identifier = normalizeIdentifier(payload.identifier);
      const db = await getDb();
      const existing = db.records.find((item) => item.identifier === payload.identifier);
      const extras = { ...(payload.extras || {}) };
      const auditEvent = extras.auditEvent;
      delete extras.auditEvent;
      const record = withAuditEvent({
        revision: "New",
        tone: payload.tone || "info",
        ...existing,
        ...extras,
        identifier: payload.identifier,
        status: payload.status,
        tone: payload.tone || "info",
      }, auditEvent);
      await upsertSheetRecord(record);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true, record });
    }

    if (type === "forwardRate") {
      payload.identifier = normalizeIdentifier(payload.identifier);
      const db = await getDb();
      const existing = db.records.find((item) => item.identifier === payload.identifier);
      const rateAction = { ...(payload.rateAction || {}), identifier: payload.identifier };
      const record = withAuditEvent({
        revision: existing?.revision || "New",
        tone: "warning",
        ...existing,
        accountName: payload.accountName || existing?.accountName || "",
        identifier: payload.identifier,
        status: "PENDING LM APPROVAL",
        tone: "warning",
        rateAction,
        lineManagerApproval: null,
        lineManagerDecision: "",
        lineManagerDecidedAt: "",
        offerDocument: null,
        finalization: null,
        revisionNote: "",
        rateForwardedAt: new Date().toISOString(),
      }, payload.auditEvent);
      await upsertSheetRecord(record);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true, record });
    }

    if (type === "upsertCustomer") {
      const db = await getDb();
      const existing = db.customers.find((item) => item.customerId === payload.customer.customerId);
      const customer = { status: "ACTIVE & DISTRIBUTED", ...existing, ...payload.customer };
      await upsertSheetCustomer(customer);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true, customer });
    }

    if (type === "submitRecommendation") {
      const recommendation = payload.record;
      recommendation.identifier = normalizeIdentifier(recommendation.identifier);
      const record = {
        ...recommendation,
        identifier: recommendation.identifier,
        accountName: recommendation.accountName,
        status: "PENDING RATE PREPARATION",
        revision: "New",
        tone: "info",
        recommendation: { ...recommendation, submittedAt: recommendation.submittedAt || new Date().toISOString() },
        submittedAt: recommendation.submittedAt || new Date().toISOString(),
        auditEvents: [makeServerAuditEvent("RECOMMENDATION FORM", "CREATED BY KAM", "")],
        rateAction: null,
        lineManagerApproval: null,
        offerDocument: null,
        finalization: null,
        revisionNote: "",
      };
      await upsertSheetRecord(record);
      globalThis.__milexSheetDbCache = null;
      return json({ ok: true, record });
    }

    return json({ ok: false, error: `Unknown action: ${type}` }, 400);
  } catch (error) {
    return json(friendlyError(error), 503);
  }
}
