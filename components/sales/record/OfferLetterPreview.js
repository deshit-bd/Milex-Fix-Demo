"use client";

import { FiPrinter, FiX } from "react-icons/fi";
import { formatRecordRateReference, formatRecordRevisionIdentifier } from "@/lib/revisions";

export default function OfferLetterPreview({ record, onClose }) {
  const date = new Intl.DateTimeFormat("en-GB").format(new Date());
  const displayIdentifier = formatRecordRevisionIdentifier(record);
  const reference = formatRecordRateReference(record);
  const approvedRate = record.lineManagerApproval?.approvedRate || record.approvedRate || record.rateAction?.rate || "As per Annexure A";
  const approvalNote = record.lineManagerApproval?.note || "";

  return (
    <div className="document-preview-overlay">
      <section className="document-preview">
        <header>
          <strong>Document Print Preview</strong>
          <div>
            <button type="button" onClick={onClose}><FiX /> Cancel</button>
            <button className="print-document" type="button" onClick={() => window.print()}><FiPrinter /> Print Document</button>
          </div>
        </header>
        <div className="document-stage">
          <article className="offer-letter">
            <div className="letter-head">
              <img src="/milex-logo.svg" alt="MileX" />
              <div><strong>123 Corporate Avenue, Dhaka</strong><span>Tel: +880 2 1234567 | www.milexair.com</span><span>ID: {displayIdentifier}</span></div>
            </div>
            <div className="letter-rule" />
            <p className="letter-date"><strong>Date:</strong> {date}</p>
            <p className="letter-date"><strong>Ref:</strong> {reference}</p>
            <div className="letter-address">
              <p>To,</p>
              <strong>{record.accountName}</strong>
              <p>{record.address}</p>
            </div>
            <h1>Subject: Service Rate Offer for Export/Import Shipments</h1>
            <p>Dear Sir/Madam,</p>
            <p>We thank you for the courtesy extended to our Key Account Manager during our recent discussions. Based on your projected volumes and shipping destinations, we are pleased to offer the following competitive rates for your logistics requirements.</p>
            <section className="rate-summary">
              <strong>Rate Summary (Detailed Excel Annexed):</strong>
              <ul>
                <li>Standard Delivery: As per Annexure A ({reference})</li>
                <li>Approved Rate: {approvedRate}</li>
                <li>Credit Facility: Offered up to BDT {record.requestedLimit}</li>
                <li>Credit Period: 30 Days from invoice generation.</li>
              </ul>
              {approvalNote && <p><strong>Special Note:</strong> {approvalNote}</p>}
            </section>
          </article>
        </div>
      </section>
    </div>
  );
}
