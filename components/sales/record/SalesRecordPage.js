"use client";

import { useEffect, useState } from "react";
import { FiTag } from "react-icons/fi";
import Topbar from "@/components/kam/Topbar";
import SalesSidebar from "../SalesSidebar";
import AccountInfo from "./AccountInfo";
import AuditTrail from "./AuditTrail";
import RateActionBox from "./RateActionBox";
import ForwardedRateStatusBox from "./ForwardedRateStatusBox";
import ApprovedOfferActions from "./ApprovedOfferActions";
import { fetchDatabase } from "@/lib/database";
import { formatRecordRevisionIdentifier, getRevisionNumber, getRecordRevision } from "@/lib/revisions";
import { SAMPLE_RECORD_DETAIL } from "./recordData";

function getApprovedStatus(finalizationStage, offerDelivered, customerAccepted) {
  if (finalizationStage === "activated") return "PROFILE ACTIVATED";
  if (finalizationStage === "documents") return "CLIENT FINAL DATA UPDATE";
  if (finalizationStage === "final-profile") return "PENDING_PROFILE";
  if (finalizationStage === "client-rejected") return "OFFER REJECTED (REVISION REQUIRED)";
  if (customerAccepted) return "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)";
  if (offerDelivered) return "OFFER DELIVERED (WAITING CUSTOMER RESPONSE)";
  return "APPROVED (PENDING OFFER LETTER)";
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

export default function SalesRecordPage({ session, recordId }) {
  const [record, setRecord] = useState(SAMPLE_RECORD_DETAIL);
  const [approved, setApproved] = useState(false);
  const [revisionRequested, setRevisionRequested] = useState(false);
  const [offerDelivered, setOfferDelivered] = useState(false);
  const [finalizationStage, setFinalizationStage] = useState("");
  const [rateForwarded, setRateForwarded] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [customerAccepted, setCustomerAccepted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".record-body")?.scrollTo(0, 0);
    async function loadRecord() {
      const db = await fetchDatabase();
      const currentRecord = (db.records || []).find((item) => item.identifier === recordId) || {};
      const parsedApproval = currentRecord.lineManagerApproval || null;
      const parsedRateAction = currentRecord.rateAction || null;
      const parsedOfferDocument = currentRecord.offerDocument || null;
      const parsedFinalization = currentRecord.finalization || null;
      const status = currentRecord.status || "";
      const hasDeliveredOffer =
        Boolean(parsedOfferDocument) ||
        status.includes("OFFER DELIVERED") ||
        status.includes("CLIENT ACCEPTED") ||
        Boolean(parsedFinalization);
      const hasCustomerAccepted =
        Boolean(parsedOfferDocument?.clientAccepted) ||
        status.includes("CLIENT ACCEPTED") ||
        Boolean(parsedFinalization);
      const clientRejected = parsedFinalization?.stage === "client-rejected" || status === "OFFER REJECTED (REVISION REQUIRED)";
      setApproved(Boolean((parsedApproval?.status === "Approved" || currentRecord.status?.startsWith("APPROVED")) && !clientRejected));
      setRevisionRequested(Boolean(parsedApproval?.status === "Revision Requested" || currentRecord.status === "REVISION REQUESTED BY LM" || clientRejected));
      setRevisionNote(
        clientRejected
          ? currentRecord.finalization?.rejectReason || currentRecord.offerRejectReason || currentRecord.revisionNote || ""
          : parsedApproval?.note || currentRecord.revisionNote || ""
      );
      setRateForwarded(Boolean(parsedRateAction));
      setOfferDelivered(hasDeliveredOffer);
      setCustomerAccepted(hasCustomerAccepted);
      setFinalizationStage(parsedFinalization?.stage || "");
      setRecord(buildRecordDetail(currentRecord));
    }
    loadRecord();
  }, [recordId]);

  function handleDocumentGenerated() {
    setOfferDelivered(true);
  }

  const effectiveRevision = getRecordRevision(record);
  const displayIdentifier = formatRecordRevisionIdentifier(record);
  const hasRevision = getRevisionNumber(effectiveRevision) > 0;

  return (
    <main className="portal">
      <SalesSidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="record-body">
          <section className="record-hero">
            <div>
              <h1>{record.accountName}</h1>
              <span><FiTag /> {record.identifier}</span>
              {hasRevision && <span className="rate-reference"><FiTag /> {displayIdentifier}</span>}
            </div>
            <strong>{approved ? getApprovedStatus(finalizationStage, offerDelivered, customerAccepted) : revisionRequested ? finalizationStage === "client-rejected" ? "OFFER REJECTED (REVISION REQUIRED)" : "REVISION REQUESTED BY LM" : rateForwarded ? "PENDING LM APPROVAL" : "PENDING RATE PREPARATION"}</strong>
          </section>
          <div className="record-layout">
            <div>
              <AccountInfo record={record} />
            </div>
            <aside>
              {approved ? (
                <ApprovedOfferActions
                  record={record}
                  offerSent={offerDelivered}
                  onDocumentGenerated={handleDocumentGenerated}
                />
              ) : revisionRequested ? (
                <RateActionBox
                  record={record}
                  existingRateAction={record.rateAction}
                  initialRevisionNote={revisionNote || "Line Manager requested a revision. Please update the rate and forward it again."}
                  revisionSource={finalizationStage === "client-rejected" ? "client" : "line-manager"}
                  onForward={() => { setRateForwarded(true); setRevisionRequested(false); }}
                />
              ) : rateForwarded ? (
                <ForwardedRateStatusBox record={record} />
              ) : (
                <RateActionBox record={record} existingRateAction={record.rateAction} onForward={() => setRateForwarded(true)} />
              )}
              <AuditTrail record={record} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
