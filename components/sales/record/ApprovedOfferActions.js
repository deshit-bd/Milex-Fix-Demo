"use client";

import { useState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import OfferLetterPreview from "./OfferLetterPreview";
import { updateRecordStatusOnServer } from "@/lib/database";
import { getRecordRevision } from "@/lib/revisions";
import { makeAuditEvent } from "@/lib/auditEvents";

export default function ApprovedOfferActions({ record, offerSent = false, onDocumentGenerated }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const effectiveOfferSent =
    offerSent ||
    Boolean(record.offerDocument) ||
    (record.status || "").includes("OFFER DELIVERED") ||
    (record.status || "").includes("CLIENT ACCEPTED") ||
    Boolean(record.finalization);

  async function generateOfferLetter() {
    const payload = {
      identifier: record.identifier,
      accountName: record.accountName,
      type: "Offer Letter",
      status: "Offer Delivered",
      clientAccepted: false,
      generatedAt: new Date().toISOString(),
    };
    await updateRecordStatusOnServer(record.identifier, "OFFER DELIVERED (PENDING AGREEMENT)", "warning", {
      accountName: record.accountName,
      revision: record.revision || "New",
      offerDocument: payload,
      auditEvent: makeAuditEvent("OFFER LETTER DELIVERED BY SALES COORDINATOR", "Offer letter delivered to the client", "Sales Coordinator", getRecordRevision(record)),
    });
    onDocumentGenerated?.(payload);
    setPreviewOpen(true);
  }

  return (
    <>
      <section className="approved-action-box">
        {!effectiveOfferSent ? (
          <>
            <p>RATE APPROVED BY LM. PREPARE OFFICIAL LETTERHEAD.</p>
            <div>
              <button type="button" onClick={generateOfferLetter}><FiMail /> Generate &amp; Email<br />Offer Letter</button>
            </div>
          </>
        ) : (
          <>
            <p>OFFER DELIVERED. KAM WILL COLLECT CUSTOMER SIGNATURE &amp; AGREEMENT.</p>
            <div className="handoff-note">
              <FiCheckCircle />
              <span>Record is now available in KAM Task Queue &amp; Record.</span>
            </div>
          </>
        )}
      </section>
      {previewOpen && <OfferLetterPreview record={record} onClose={() => setPreviewOpen(false)} />}
    </>
  );
}
