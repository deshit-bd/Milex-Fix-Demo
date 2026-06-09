"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle, FiTag } from "react-icons/fi";
import Sidebar from "@/components/kam/Sidebar";
import Topbar from "@/components/kam/Topbar";
import AccountInfo from "@/components/sales/record/AccountInfo";
import ClientFinalizationPanel from "@/components/sales/record/ClientFinalizationPanel";
import AuditTrail from "@/components/sales/record/AuditTrail";
import { fetchDatabase } from "@/lib/database";
import { formatRecordRevisionIdentifier, getRevisionNumber, getRecordRevision } from "@/lib/revisions";
import { SAMPLE_RECORD_DETAIL } from "@/components/sales/record/recordData";

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
    seniorContact: {
      name: submitted.seniorName || record.seniorContact?.name || "",
      phone: submitted.seniorMobile || record.seniorContact?.phone || "",
      email: submitted.seniorEmail || record.seniorContact?.email || "",
    },
    keyContact: {
      name: submitted.keyName || record.keyContact?.name || "",
      phone: submitted.keyMobile || record.keyContact?.phone || "",
      email: submitted.keyEmail || record.keyContact?.email || "",
    },
    financialContact: {
      name: submitted.financialName || record.financialContact?.name || "",
      phone: submitted.financialMobile || record.financialContact?.phone || "",
      email: submitted.financialEmail || record.financialContact?.email || "",
    },
    recommendationNote: submitted.recommendationNote || record.recommendationNote || "",
  };
}

function getStatus(stage, status) {
  if (stage === "activated") return "ACTIVE & DISTRIBUTED";
  if (stage === "documents") return "CLIENT FINAL DATA UPDATE";
  if (stage === "final-profile") return "PENDING_PROFILE";
  if (stage === "client-rejected") return "OFFER REJECTED (REVISION REQUIRED)";
  return status || "OFFER DELIVERED (PENDING AGREEMENT)";
}

function getPipelineMessage(status) {
  const messages = {
    "PENDING RATE PREPARATION": "Recommendation submitted to Sales Coordinator",
    "PENDING LM APPROVAL": "Rate submitted to Line Manager for approval",
    "PENDING RATE APPROVAL": "Rate submitted to Line Manager for approval",
    "REVISION REQUESTED BY LM": "Line Manager requested a rate revision from Sales Coordinator",
    "APPROVED (PENDING OFFER LETTER)": "Rate approved. Sales Coordinator is preparing the offer letter",
    "OFFER REJECTED (REVISION REQUIRED)": "Customer rejected the offer. Sales Coordinator must revise it",
  };

  return messages[status] || "This account is moving through the approval workflow";
}

export default function KamAgreementPage({ session, recordId }) {
  const [record, setRecord] = useState(SAMPLE_RECORD_DETAIL);
  const [finalizationStage, setFinalizationStage] = useState("");
  const agreementAvailable =
    Boolean(record.finalization) ||
    [
      "OFFER DELIVERED (PENDING AGREEMENT)",
      "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)",
      "PENDING_PROFILE",
      "FINAL PROFILE DATA",
      "CLIENT FINAL DATA UPDATE",
      "ACTIVE & DISTRIBUTED",
    ].includes(record.status);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".record-body")?.scrollTo(0, 0);
    fetchDatabase().then((db) => {
      const currentRecord = (db.records || []).find((item) => item.identifier === recordId) || {};
      setRecord(buildRecordDetail(currentRecord));
      setFinalizationStage(currentRecord.finalization?.stage || "client-decision");
    });
  }, [recordId]);

  function handleFinalizationChange(finalization, savedRecord = {}) {
    setRecord((current) => ({ ...current, ...savedRecord, finalization, status: savedRecord.status || getStatus(finalization.stage, current.status) }));
  }

  const effectiveRevision = getRecordRevision(record);
  const displayIdentifier = formatRecordRevisionIdentifier(record);
  const hasRevision = getRevisionNumber(effectiveRevision) > 0;

  return (
    <main className="portal">
      <Sidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="record-body">
          <section className="record-hero">
            <div>
              <h1>{record.accountName}</h1>
              <span><FiTag /> {record.identifier}</span>
              {hasRevision && <span className="rate-reference"><FiTag /> {displayIdentifier}</span>}
            </div>
            <strong>{getStatus(finalizationStage, record.status)}</strong>
          </section>
          <div className="record-layout">
            <div>
              <AccountInfo record={record} />
              {agreementAvailable && finalizationStage !== "client-decision" && finalizationStage !== "client-rejected" && (
                <ClientFinalizationPanel
                  record={record}
                  onStageChange={setFinalizationStage}
                  onFinalizationChange={handleFinalizationChange}
                />
              )}
            </div>
            <aside>
              {agreementAvailable && finalizationStage === "client-decision" ? (
                <ClientFinalizationPanel
                  record={record}
                  onStageChange={setFinalizationStage}
                  onFinalizationChange={handleFinalizationChange}
                />
              ) : !agreementAvailable ? (
                <section className="rate-action-box forwarded-status-box">
                  <div className="forwarded-status-icon"><FiCheckCircle /></div>
                  <h2>{record.status || "PENDING RATE PREPARATION"}</h2>
                  <p>{getPipelineMessage(record.status || "PENDING RATE PREPARATION")}</p>
                </section>
              ) : null}
              <AuditTrail record={record} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
