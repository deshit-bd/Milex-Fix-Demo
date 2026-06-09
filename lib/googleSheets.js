import crypto from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const TABLES = {
  records: { sheet: "Records", key: "identifier", headers: ["identifier", "json", "updatedAt"] },
  customers: { sheet: "Customers", key: "customerId", headers: ["customerId", "json", "updatedAt"] },
  workflow: { sheet: "Workflow", key: "key", headers: ["key", "json", "updatedAt"] },
};

function getConfig() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Google Sheets env vars are missing.");
  }

  return { clientEmail, privateKey, spreadsheetId };
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken() {
  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPES.join(" "),
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedToken = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(privateKey, "base64");
  const assertion = `${unsignedToken}.${signature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed: ${await response.text()}`);
  }

  const token = await response.json();
  return token.access_token;
}

async function sheetsFetch(path, options = {}) {
  const { spreadsheetId } = getConfig();
  const token = await getAccessToken();
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed: ${await response.text()}`);
  }

  return response.json();
}

async function ensureTable(table) {
  const spreadsheet = await sheetsFetch("?fields=sheets.properties.title");
  const exists = spreadsheet.sheets?.some((item) => item.properties?.title === table.sheet);

  if (!exists) {
    await sheetsFetch(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: table.sheet } } }],
      }),
    });
  }

  const values = await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A1:C1`)}`);
  if (!values.values?.length) {
    await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A1:C1`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [table.headers] }),
    });
  }
}

async function readTable(name) {
  const table = TABLES[name];
  await ensureTable(table);
  const result = await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A2:C`)}`);

  return (result.values || [])
    .filter((row) => row[0])
    .map((row) => {
      try {
        return JSON.parse(row[1] || "{}");
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function upsertTableRow(name, keyValue, data) {
  const table = TABLES[name];
  await ensureTable(table);
  const result = await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A2:C`)}`);
  const values = result.values || [];
  const rowIndex = values.findIndex((row) => row[0] === keyValue);
  const nextRow = [keyValue, JSON.stringify(data), new Date().toISOString()];

  if (rowIndex >= 0) {
    const sheetRow = rowIndex + 2;
    await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A${sheetRow}:C${sheetRow}`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [nextRow] }),
    });
  } else {
    await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A:C`)}:append?valueInputOption=RAW`, {
      method: "POST",
      body: JSON.stringify({ values: [nextRow] }),
    });
  }

  return data;
}

async function deleteTableRow(name, keyValue) {
  const table = TABLES[name];
  await ensureTable(table);
  const result = await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A2:C`)}`);
  const values = result.values || [];
  const rowIndex = values.findIndex((row) => row[0] === keyValue);

  if (rowIndex < 0) return false;

  const sheetRow = rowIndex + 2;
  await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A${sheetRow}:C${sheetRow}`)}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return true;
}

async function clearTable(name) {
  const table = TABLES[name];
  await ensureTable(table);
  await sheetsFetch(`/values/${encodeURIComponent(`${table.sheet}!A2:C`)}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function readSheetDatabase() {
  const [records, customers, workflowRows] = await Promise.all([
    readTable("records"),
    readTable("customers"),
    readTable("workflow"),
  ]);
  const workflow = Object.fromEntries(workflowRows.map((item) => [item.key, item.value]));
  const nextCustomerNumber = Number(workflow.nextCustomerNumber || 1);

  return { records, customers, workflow, nextCustomerNumber };
}

export async function upsertSheetRecord(record) {
  return upsertTableRow("records", record.identifier, record);
}

export async function deleteSheetRecord(identifier) {
  return deleteTableRow("records", identifier);
}

export async function upsertSheetCustomer(customer) {
  return upsertTableRow("customers", customer.customerId, customer);
}

export async function writeSheetWorkflowItem(key, value) {
  return upsertTableRow("workflow", key, { key, value });
}

export async function deleteSheetWorkflowItem(key) {
  return deleteTableRow("workflow", key);
}

export async function resetSheetDatabase() {
  await Promise.all([clearTable("records"), clearTable("customers"), clearTable("workflow")]);
  return { records: [], customers: [], workflow: {}, nextCustomerNumber: 1 };
}

export async function generateSheetCustomerCode() {
  const db = await readSheetDatabase();
  const maxRecordNumber = db.records.reduce((max, record) => {
    const match = String(record.identifier || "").match(/^MLX(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const nextNumber = Math.max(db.nextCustomerNumber || 1, maxRecordNumber + 1);
  const identifier = `MLX${String(nextNumber).padStart(6, "0")}`;
  await writeSheetWorkflowItem("nextCustomerNumber", nextNumber + 1);
  return identifier;
}
