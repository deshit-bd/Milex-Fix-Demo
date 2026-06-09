"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiDownload, FiXCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import { updateRecordStatusOnServer } from "@/lib/database";
import { formatRecordRateReference, getNextRevision, getRecordRevision } from "@/lib/revisions";
import { makeAuditEvent } from "@/lib/auditEvents";

export default function LineManagerActionBox({ record, onDecision }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const rateAction = record.rateAction || {};
  const approvedRate = rateAction.rate || "";
  const rateReference = formatRecordRateReference({ ...record, identifier: rateAction.identifier || record.identifier });
  const nextRevision = getNextRevision(getRecordRevision(record));

  function downloadRate() {
    const file = new Blob([`Rate Reference: ${rateReference}\nRate: ${rateAction.rate || "Pending"}`], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${rateReference}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function decide(status) {
    if (status === "Revision Requested" && !note.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reject note required",
        text: "Please write what Sales needs to revise.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }

    if (status === "Approved" && !approvedRate.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Approved rate required",
        text: "Please confirm or customize the approved rate before approval.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }

    const decision = {
      identifier: record.identifier,
      status,
      note,
      approvedRate: status === "Approved" ? approvedRate : "",
      decidedAt: new Date().toISOString(),
    };
    const savedRecord = await updateRecordStatusOnServer(
      record.identifier,
      status === "Approved" ? "APPROVED (PENDING OFFER LETTER)" : "REVISION REQUESTED BY LM",
      "warning",
      {
        accountName: record.accountName,
        revision: status === "Approved" ? getRecordRevision(record) : nextRevision,
        revisionNote: status === "Revision Requested" ? note : "",
        approvedRate: status === "Approved" ? approvedRate : "",
        lineManagerDecision: status,
        lineManagerDecidedAt: decision.decidedAt,
        lineManagerApproval: decision,
        auditEvent: makeAuditEvent(
          status === "Approved" ? "RATE APPROVED BY LM" : "REVISION REQUESTED BY LM",
          status === "Approved" ? `Approved ${rateReference}` : note,
          "Line Manager",
          status === "Approved" ? getRecordRevision(record) : nextRevision
        ),
      }
    );
    onDecision?.(savedRecord.lineManagerApproval || decision);
    Swal.fire({
      icon: status === "Approved" ? "success" : "info",
      title: status === "Approved" ? "Rate approved" : "Revision requested",
      text: status === "Approved" ? "Sales Coordinator can now prepare the offer letter." : "The file has been returned to Sales Coordinator for rate revision.",
      confirmButtonColor: "#078b4d",
    }).then(() => router.replace("/line-manager/dashboard"));
  }

  return (
    <section className="lm-action-box">
      <h2>Required Action</h2>
      <div className="attached-rate">
        <span>ATTACHED RATE FORM</span>
        <strong>{rateReference}</strong>
        <button type="button" onClick={downloadRate}><FiDownload /> Download Excel to Verify</button>
      </div>
      <label>NOTE<textarea placeholder="Write approval note or rejection reason..." value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className="lm-decision-actions">
        <button type="button" onClick={() => decide("Approved")}><FiCheckCircle /> Approve</button>
        <button type="button" onClick={() => decide("Revision Requested")}><FiXCircle /> Reject</button>
      </div>
    </section>
  );
}
