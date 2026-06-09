import { FiCheckCircle, FiClock } from "react-icons/fi";
import { formatRecordRateReference } from "@/lib/revisions";

export default function ForwardedRateStatusBox({ record }) {
  const rateReference = formatRecordRateReference(record);

  return (
    <section className="rate-action-box forwarded-status-box">
      <div className="forwarded-status-icon"><FiCheckCircle /></div>
      <h2>Rate Forwarded</h2>
      <p>The rate file has been sent to Line Manager for approval. Sales action is locked until a decision is received.</p>
      <div className="forwarded-reference">
        <span>RATE REFERENCE</span>
        <strong>{rateReference}</strong>
      </div>
      <div className="waiting-line"><FiClock /> Waiting for Line Manager approval</div>
    </section>
  );
}
