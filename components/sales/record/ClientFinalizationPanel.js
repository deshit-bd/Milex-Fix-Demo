"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle, FiFileText, FiPrinter, FiUploadCloud, FiXCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import {
  FINAL_PROFILE_INITIAL,
  LEGAL_DOCUMENTS_INITIAL,
} from "./recordData";
import { updateRecordStatusOnServer, upsertCustomerOnServer } from "@/lib/database";
import { getNextRevision } from "@/lib/revisions";
import { makeAuditEvent } from "@/lib/auditEvents";

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function withDefaultExpiryDates(documents) {
  const today = getToday();
  return documents.map((document) => ({
    ...document,
    expiryDate: document.expiryDate || today,
  }));
}

export default function ClientFinalizationPanel({ record, onStageChange, onFinalizationChange }) {
  const [stage, setStage] = useState("client-decision");
  const [rejectReason, setRejectReason] = useState("");
  const [profile, setProfile] = useState(FINAL_PROFILE_INITIAL);
  const [documents, setDocuments] = useState(() => withDefaultExpiryDates(LEGAL_DOCUMENTS_INITIAL));
  const nextRevision = getNextRevision(record.revision);

  useEffect(() => {
    const saved = record.finalization;
    if (!saved) return;
    setStage(saved.stage || "client-decision");
    setRejectReason(saved.rejectReason || "");
    setProfile({ ...FINAL_PROFILE_INITIAL, ...(saved.profile || {}) });
    setDocuments(
      LEGAL_DOCUMENTS_INITIAL.map((item) => ({
        ...item,
        ...(saved.documents || []).find((savedItem) => savedItem.id === item.id),
      })).map((document) => ({
        ...document,
        expiryDate: document.expiryDate || getToday(),
      }))
    );
    onStageChange?.(saved.stage || "client-decision");
  }, [onStageChange, record.finalization]);

  async function persist(nextStage = stage, nextProfile = profile, nextDocuments = documents, nextRejectReason = rejectReason, nextStatus = record.status || "CLIENT FINAL DATA UPDATE", nextTone = record.tone || "info", auditEvent = null) {
    const payload = {
      identifier: record.identifier,
      accountName: record.accountName,
      stage: nextStage,
      rejectReason: nextRejectReason,
      profile: nextProfile,
      documents: nextDocuments,
      updatedAt: new Date().toISOString(),
    };
    await updateRecordStatusOnServer(record.identifier, nextStatus, nextTone, {
      accountName: record.accountName,
      finalization: payload,
      ...(auditEvent ? { auditEvent } : {}),
    });
    setStage(nextStage);
    onStageChange?.(nextStage);
    onFinalizationChange?.(payload);
  }

  async function agreeClient() {
    if (!profile.signedAgreementFile) {
      Swal.fire({
        icon: "warning",
        title: "Signed agreement required",
        text: "Upload the signed agreement before moving to account profile setup.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }
    await persist(
      "final-profile",
      profile,
      documents,
      rejectReason,
      "PENDING_PROFILE",
      "info",
      makeAuditEvent("PENDING_PROFILE", `Signed agreement uploaded: ${profile.signedAgreementFile}`, "KAM")
    );
    Swal.fire({ icon: "success", title: "Agreement signed", text: "Final account profile can now be completed.", confirmButtonColor: "#078b4d" });
  }

  async function rejectOffer() {
    if (!rejectReason.trim()) {
      Swal.fire({ icon: "warning", title: "Reject reason required", confirmButtonColor: "#078b4d" });
      return;
    }
    const payload = {
      identifier: record.identifier,
      accountName: record.accountName,
      stage: "client-rejected",
      rejectReason,
      profile,
      documents: withDefaultExpiryDates(documents),
      updatedAt: new Date().toISOString(),
    };
    const savedRecord = await updateRecordStatusOnServer(record.identifier, "OFFER REJECTED (REVISION REQUIRED)", "danger", {
      accountName: record.accountName,
      revision: nextRevision,
      revisionNote: rejectReason,
      finalization: payload,
      auditEvent: makeAuditEvent("OFFER REJECTED BY CLIENT", rejectReason, "KAM", nextRevision),
    });
    setStage("client-rejected");
    onStageChange?.("client-rejected");
    onFinalizationChange?.(payload, savedRecord);
    Swal.fire({ icon: "info", title: "Offer rejected", text: "Revision has been triggered for Sales Coordinator.", confirmButtonColor: "#078b4d" });
  }

  function updateProfile(event) {
    const nextProfile = { ...profile, [event.target.name]: event.target.value };
    setProfile(nextProfile);
  }

  function setAccountMode(accountMode) {
    const nextProfile = {
      ...profile,
      accountMode,
      provisionalReason: accountMode === "Regular Account" ? "" : profile.provisionalReason,
      provisionalExpiryDate: accountMode === "Provisional Account" ? profile.provisionalExpiryDate || getDateAfterDays(30) : "",
    };
    setProfile(nextProfile);
    persist(stage, nextProfile);
  }

  function updateSignedAgreement(event) {
    const fileName = event.target.files[0]?.name || "";
    const nextProfile = { ...profile, signedAgreementFile: fileName };
    const nextDocuments = documents.map((document) =>
      document.id === "signed-agreement" ? { ...document, fileName } : document
    );
    setProfile(nextProfile);
    setDocuments(nextDocuments);
    persist(stage, nextProfile, nextDocuments);
  }

  async function saveProfile() {
    await persist("final-profile", profile, documents, rejectReason, "PENDING_PROFILE", "info");
    Swal.fire({ icon: "success", title: "Draft saved", timer: 900, showConfirmButton: false });
  }

  async function continueToDocuments(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const nextProfile = {
      ...profile,
      provisionalExpiryDate:
        profile.accountMode === "Provisional Account"
          ? profile.provisionalExpiryDate || getDateAfterDays(30)
          : "",
    };
    setProfile(nextProfile);
    await persist("documents", nextProfile, documents, rejectReason, "CLIENT FINAL DATA UPDATE", "info");
  }

  function updateDocument(id, field, value) {
    const nextDocuments = documents.map((document) =>
      document.id === id ? { ...document, [field]: value } : document
    );
    setDocuments(nextDocuments);
    persist(stage, profile, nextDocuments);
  }

  async function activateProfile() {
    const missingRequired = documents.filter((document) => document.required && !document.fileName);
    if (missingRequired.length) {
      Swal.fire({
        icon: "warning",
        title: "Required documents missing",
        text: `Please upload: ${missingRequired.map((document) => document.title).join(", ")}`,
        confirmButtonColor: "#078b4d",
      });
      return;
    }
    await upsertCustomerOnServer({
      customerId: record.identifier,
      accountName: record.accountName,
      status: "ACTIVE & DISTRIBUTED",
      accountMode: profile.accountMode,
      provisionalExpiryDate: profile.provisionalExpiryDate,
    });
    await persist("activated", profile, documents, rejectReason, "ACTIVE & DISTRIBUTED", "success");
    Swal.fire({
      icon: "success",
      title: "Profile activated",
      text: `${record.accountName} is ready for distribution.`,
      confirmButtonColor: "#078b4d",
    });
  }

  if (stage === "client-rejected") {
    return (
      <section className="finalization-card">
        <header><FiXCircle /> <strong>Client Rejected Offer</strong></header>
      </section>
    );
  }

  if (stage === "documents" || stage === "activated") {
    return (
      <section className="finalization-card documents-panel">
        <header>
          <span><FiFileText /> <strong>Supporting Documentation</strong></span>
          <button type="button" onClick={() => window.print()}><FiPrinter /> Print Profile</button>
        </header>
        <p>Dates default to today. Update any legal expiry date if the document expires later. Maximum file size: 10MB.</p>
        <div className="document-grid">
          {documents.map((document) => (
            <article className="document-tile" key={document.id}>
              <FiFileText />
              <strong>{document.title}{document.required && <i> *</i>}</strong>
              <span>{document.fileName || "Pending upload"}</span>
              <input
                aria-label={`${document.title} document number`}
                placeholder="Document number"
                value={document.documentNumber}
                onChange={(event) => updateDocument(document.id, "documentNumber", event.target.value)}
              />
              <input
                aria-label={`${document.title} expiry date`}
                type="date"
                value={document.expiryDate}
                onChange={(event) => updateDocument(document.id, "expiryDate", event.target.value)}
              />
              <label>
                <FiUploadCloud /> Upload File
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => updateDocument(document.id, "fileName", event.target.files[0]?.name || "")} />
              </label>
            </article>
          ))}
        </div>
        <button className="activate-profile" type="button" disabled={stage === "activated"} onClick={activateProfile}>
          {stage === "activated" ? "Profile Activated" : "Activate & Distribute Profile"}
        </button>
      </section>
    );
  }

  if (stage === "final-profile" && profile.signedAgreementFile) {
    return (
      <form className="finalization-card profile-panel" onSubmit={continueToDocuments}>
        <header><FiCheckCircle /> <strong>Final Account Profile Data</strong></header>
        <div className="agreement-complete-banner">
          <FiCheckCircle />
          <div>
            <strong>Customer Signature &amp; Agreement Completed</strong>
            <p>Signed agreement uploaded: {profile.signedAgreementFile}. Status is now PENDING_PROFILE.</p>
          </div>
        </div>
        <p>Status: PENDING_PROFILE. Complete account mode, tax info, final limits, and legal expiry details.</p>
        <fieldset className="account-mode-group">
          <legend>Are all mandatory signed documents available?</legend>
          <div>
            {[
              ["Regular Account", "Yes - Regular Account"],
              ["Provisional Account", "No - Provisional Account"],
            ].map(([accountMode, label]) => (
              <button
                key={accountMode}
                type="button"
                className={profile.accountMode === accountMode ? "active" : ""}
                onClick={() => setAccountMode(accountMode)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {profile.accountMode === "Provisional Account" && (
          <>
            <label className="provisional-reason">
              Reason of Provisional Account Mandatory
              <textarea
                name="provisionalReason"
                placeholder="ex. Managing Director Sign Missing"
                value={profile.provisionalReason}
                onChange={updateProfile}
                required
              />
            </label>
            <div className="provisional-expiry-alert">
              Strict 30-Day Expiry Timer: {profile.provisionalExpiryDate || getDateAfterDays(30)}
            </div>
          </>
        )}
        <div className="profile-grid">
          <label>Name of Managing Partner<input name="managingPartner" value={profile.managingPartner} onChange={updateProfile} required /></label>
          <label>BIN Number<input name="binNumber" value={profile.binNumber} onChange={updateProfile} required /></label>
          <label>TIN Number<input name="tinNumber" value={profile.tinNumber} onChange={updateProfile} required /></label>
          <label>Destinations<input name="destinations" placeholder="Comma separated" value={profile.destinations} onChange={updateProfile} /></label>
          <label>Preferred Carrier<input name="preferredCarrier" placeholder="DHL, UPS" value={profile.preferredCarrier} onChange={updateProfile} /></label>
          <label>Nature of Business<input name="natureOfBusiness" value={profile.natureOfBusiness} onChange={updateProfile} /></label>
          <label>Account Specifics<input name="accountSpecifics" value={profile.accountSpecifics} onChange={updateProfile} /></label>
          <label>Final Amount Limit (BDT)<input name="finalAmountLimit" value={profile.finalAmountLimit} onChange={updateProfile} /></label>
          <label>Final Time Limit (Days)<input name="finalTimeLimit" value={profile.finalTimeLimit} onChange={updateProfile} /></label>
        </div>
        <div className="finalization-actions">
          <button className="outline-action" type="button" onClick={saveProfile}>Save Draft</button>
          <button className="next-action" type="submit">Next</button>
        </div>
      </form>
    );
  }

  return (
    <section className="finalization-card decision-panel">
      <header><FiCheckCircle /> <strong>Required Action</strong></header>
      <p>1. Action Required: Generate &amp; Print Documents</p>
      <div className="print-actions">
        <button type="button" onClick={() => window.print()}><FiPrinter /> Reprint Offer</button>
        <button type="button" onClick={() => Swal.fire({ icon: "success", title: "Service Level Agreement generated", text: "Print the SLA PDF and collect the customer signature.", confirmButtonColor: "#078b4d" })}><FiPrinter /> Generate SLA PDF</button>
      </div>
      <p>2. Upload Signed Agreement</p>
      <label className="signed-agreement-upload">
        <FiUploadCloud /> {profile.signedAgreementFile || "Upload signed agreement"}
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={updateSignedAgreement} />
      </label>
      <p>3. Agreement Signature Status</p>
      <button className="customer-agreed" type="button" onClick={agreeClient}><FiCheckCircle /> Agreement Signed - Continue</button>
      <label className="reject-reason">
        If no, enter reason & reject
        <input placeholder="e.g. Rate too high" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </label>
      <button className="reject-offer" type="button" onClick={rejectOffer}><FiXCircle /> Reject Offer (Trigger {nextRevision})</button>
    </section>
  );
}
