"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle, FiTag, FiXCircle } from "react-icons/fi";
import Topbar from "@/components/kam/Topbar";
import AccountInfo from "@/components/sales/record/AccountInfo";
import { SAMPLE_RECORD_DETAIL } from "@/components/sales/record/recordData";
import { fetchDatabase } from "@/lib/database";
import { formatRecordRevisionIdentifier, getRevisionNumber, getRecordRevision } from "@/lib/revisions";
import LineManagerSidebar from "./LineManagerSidebar";
import LineManagerActionBox from "./record/LineManagerActionBox";
import LineManagerAuditTrail from "./record/LineManagerAuditTrail";

function DecisionSummary({ decision }) {
  const approved = decision?.status === "Approved";

  return (
    <section className={`decision-summary ${approved ? "approved" : "revision"}`}>
      <div className="forwarded-status-icon">
        {approved ? <FiCheckCircle /> : <FiXCircle />}
      </div>
      <h2>{approved ? "Rate Approved" : "Revision Requested"}</h2>
      <p>
        {approved
          ? "Sales Coordinator can now prepare the offer letter."
          : "The file has been returned to Sales Coordinator for rate revision."}
      </p>
      {decision?.note && (
        <div className="forwarded-reference">
          <span>LINE MANAGER NOTE</span>
          <p>{decision.note}</p>
        </div>
      )}
    </section>
  );
}

function getLineManagerStatusMessage(status) {
  const messages = {
    "PENDING RATE PREPARATION": "Recommendation submitted to Sales Coordinator",
    "PENDING LM APPROVAL": "Rate submitted to Line Manager for approval",
    "PENDING RATE APPROVAL": "Rate submitted to Line Manager for approval",
    "REVISION REQUESTED BY LM": "Line Manager requested a rate revision from Sales Coordinator",
    "APPROVED (PENDING OFFER LETTER)": "Rate approved. Sales Coordinator is preparing the offer letter",
    "OFFER DELIVERED (PENDING AGREEMENT)": "Waiting for client agreement",
    "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)": "Waiting for agreement completion",
    "CLIENT FINAL DATA UPDATE": "Waiting for legal documents",
    "PENDING_PROFILE": "Waiting for account profile setup",
    "ACTIVE & DISTRIBUTED": "Customer profile distributed",
  };

  return messages[status] || "This account is moving through the approval workflow";
}

function isLineManagerActionStage(record = {}) {
  const status = record.status || "";
  return (
    status === "PENDING LM APPROVAL" ||
    status === "PENDING RATE APPROVAL"
  ) && Boolean(record.rateAction);
}

function getLineManagerHeroStatus(record = {}, decision) {
  if (decision?.status === "Approved") return "APPROVED BY LM";
  if (decision?.status === "Revision Requested") return "REVISION REQUESTED";
  if (isLineManagerActionStage(record)) return "PENDING RATE APPROVAL";
  return record.status || "PENDING RATE PREPARATION";
}

function buildRecordDetail(record = {}) {
  const submitted = record.recommendation || record;
  const base = { ...SAMPLE_RECORD_DETAIL, ...record };

  return {
    ...base,
    identifier: record.identifier || "",
    accountName: submitted.accountName || record.accountName || "",
    address: submitted.primaryAddress || record.address || "",
    businessType: submitted.businessType || record.businessType || "",
    mobile: submitted.mobileNumber || record.mobile || "",
    email: submitted.emailAddress || record.email || "",
    requestedLimit: submitted.creditLimit
      ? `TK ${submitted.creditLimit}${submitted.creditPeriod ? ` (${submitted.creditPeriod} Days)` : ""}`
      : record.requestedLimit || "",
    keyContact: {
      name: submitted.keyName || record.keyContact?.name || "",
      phone: submitted.keyMobile || record.keyContact?.phone || "",
      email: submitted.keyEmail || record.keyContact?.email || "",
    },
    seniorContact: {
      name: submitted.seniorName || record.seniorContact?.name || "",
      phone: submitted.seniorMobile || record.seniorContact?.phone || "",
      email: submitted.seniorEmail || record.seniorContact?.email || "",
    },
    financialContact: {
      name: submitted.financialName || record.financialContact?.name || "",
      phone: submitted.financialMobile || record.financialContact?.phone || "",
      email: submitted.financialEmail || record.financialContact?.email || "",
    },
    recommendationNote: submitted.recommendationNote || record.recommendationNote || "",
  };
}

export default function LineManagerRecordPlaceholder({ session, recordId }) {
  const [record, setRecord] = useState(SAMPLE_RECORD_DETAIL);
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".record-body")?.scrollTo(0, 0);
    async function loadRecord() {
      const db = await fetchDatabase();
      const dbRecord = (db.records || []).find((item) => item.identifier === recordId) || {};
      const detail = buildRecordDetail(dbRecord);
      setRecord(detail);
      setDecision(isLineManagerActionStage(detail) ? null : dbRecord.lineManagerApproval || null);
    }
    loadRecord();
  }, [recordId]);

  const effectiveRevision = getRecordRevision(record);
  const displayIdentifier = formatRecordRevisionIdentifier(record);
  const hasRevision = getRevisionNumber(effectiveRevision) > 0;

  return (
    <main className="portal">
      <LineManagerSidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="record-body">
          <section className="record-hero">
            <div><h1>{record.accountName}</h1><span><FiTag /> {record.identifier}</span>{hasRevision && <span className="rate-reference"><FiTag /> {displayIdentifier}</span>}</div>
            <strong>{getLineManagerHeroStatus(record, decision)}</strong>
          </section>
          <div className="record-layout">
            <div><AccountInfo record={record} /></div>
            <aside>
              {decision ? (
                <DecisionSummary decision={decision} />
              ) : isLineManagerActionStage(record) ? (
                <LineManagerActionBox record={record} onDecision={setDecision} />
              ) : (
                <section className="rate-action-box forwarded-status-box">
                  <div className="forwarded-status-icon"><FiCheckCircle /></div>
                  <h2>{record.status || "PENDING RATE PREPARATION"}</h2>
                  <p>{getLineManagerStatusMessage(record.status || "PENDING RATE PREPARATION")}</p>
                </section>
              )}
              <LineManagerAuditTrail record={record} decision={decision} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
