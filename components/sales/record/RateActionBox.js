"use client";

import { useEffect, useState } from "react";
import { FiAlertCircle, FiArrowRight, FiDownload, FiPaperclip } from "react-icons/fi";
import Swal from "sweetalert2";
import { runDatabaseAction } from "@/lib/database";
import { formatRecordRateReference, getRecordRevision, getRevisionNumber } from "@/lib/revisions";
import { makeAuditEvent } from "@/lib/auditEvents";

export default function RateActionBox({ record, existingRateAction = null, initialRevisionNote = "", revisionSource = "line-manager", onForward }) {
  const [rate, setRate] = useState("");
  const [fileName, setFileName] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const visibleRevisionNote = revisionNote.trim().toLowerCase() === "ok" ? "" : revisionNote;
  const effectiveRevision = getRecordRevision(record);
  const rateReference = formatRecordRateReference(record);
  const hasRevision = getRevisionNumber(effectiveRevision) > 0;

  useEffect(() => {
    if (existingRateAction?.identifier === record.identifier) {
      setRate(existingRateAction.rate || "");
      setFileName(hasRevision ? `${rateReference}-rate.csv` : existingRateAction.attachment || "");
    }
    setRevisionNote(initialRevisionNote);
  }, [existingRateAction, hasRevision, initialRevisionNote, rateReference, record.identifier]);

  function generateRate() {
    setRate("$5.00/Kg + $25");
    setFileName(`${rateReference}-rate.csv`);
  }

  function downloadRateCsv() {
    const recommendation = record.recommendation || {};
    const routes = [
      { country: recommendation.destinationCountry || "Primary Destination", rateFor: recommendation.rateFor || "Import & Export" },
      ...(recommendation.additionalRoutes || []),
    ].filter((route) => route.country || route.rateFor);
    const rows = [
      ["Rate Reference", rateReference],
      ["Account", record.accountName],
      ["Shipment Type", [
        recommendation.shipmentDocument ? "Document" : "",
        recommendation.shipmentNonDocument ? "Non-Document" : "",
        recommendation.shipmentOthers ? `Others: ${recommendation.shipmentOtherText || ""}` : "",
      ].filter(Boolean).join(" | ")],
      ["Generated Rate", rate || "$5.00/Kg + $25"],
      [],
      ["Country", "Rate For"],
      ...routes.map((route) => [route.country || "", route.rateFor || ""]),
    ];
    const csv = rows.map((row) => row.map((cell = "") => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const file = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${rateReference}-rate.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function forward() {
    if (!rate) {
      Swal.fire({ icon: "warning", title: "Generate a rate first", confirmButtonColor: "#078b4d" });
      return;
    }
    const payload = {
      identifier: record.identifier,
      accountName: record.accountName,
      rate,
      attachment: fileName,
      status: "Forwarded to Line Manager",
    };
    const result = await runDatabaseAction("forwardRate", {
      identifier: record.identifier,
      accountName: record.accountName,
      rateAction: payload,
      auditEvent: makeAuditEvent("RATE PREPARATION BY SC", `Forwarded ${rateReference} to Line Manager`, "Sales Coordinator", effectiveRevision),
    });
    if (!result.ok) {
      Swal.fire({
        icon: "error",
        title: "Forward failed",
        text: result.error || "The rate could not be saved to the database.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }
    onForward?.(payload);
    Swal.fire({ icon: "success", title: "Forwarded to Line Manager", timer: 1200, showConfirmButton: false });
  }

  return (
    <section className="rate-action-box">
      {revisionNote && (
        <div className="revision-note-alert">
          <FiAlertCircle />
          <div>
            <span>{revisionSource === "client" ? "CLIENT REVISION REQUEST" : "LINE MANAGER REVISION REQUEST"}</span>
            {visibleRevisionNote && <p>{visibleRevisionNote}</p>}
          </div>
        </div>
      )}
      <label>RATE REFERENCE NUMBER<input value={rateReference} readOnly /></label>
      <label>SYSTEM COMPUTED RATE MATRIX
        <div className="rate-input"><input placeholder="ex: $5.00/Kg + $25" value={rate} onChange={(event) => setRate(event.target.value)} /><button type="button" onClick={generateRate}>Generate Rate</button></div>
      </label>
      <label>SUPPORTING DOCUMENTS
        <span className="attachment-input"><FiPaperclip /> {fileName || "Attach Excel Calculations"}<input type="file" accept=".xls,.xlsx,.csv" onChange={(event) => setFileName(event.target.files[0]?.name || "")} /></span>
      </label>
      <button className="download-rate-csv" type="button" onClick={downloadRateCsv}><FiDownload /> Download CSV Rate Sheet</button>
      <button className="forward-action" type="button" onClick={forward}>Forward to Line Manager <FiArrowRight /></button>
    </section>
  );
}
