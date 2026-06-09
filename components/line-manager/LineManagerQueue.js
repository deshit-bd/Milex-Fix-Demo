"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { RATE_ACTION_KEY } from "@/components/sales/record/recordData";
import { fetchDatabase, readRecords } from "@/lib/database";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function LineManagerQueue() {
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      setLoading(true);
      const db = await fetchDatabase();
      const records = db.apiError ? readRecords() : db.records || [];
      const pendingRecord = records.find(
        (record) => record.status === "PENDING LM APPROVAL" || record.status === "PENDING RATE APPROVAL"
      );
      if (pendingRecord) {
        setItem({
          identifier: pendingRecord.identifier,
          accountName: pendingRecord.accountName,
          queueStatus: "Pending Rate Approval",
        });
        setLoading(false);
        return;
      }
      if (!db.apiError) {
        setLoading(false);
        return;
      }
      const forwardedRate = localStorage.getItem(RATE_ACTION_KEY);
      if (!forwardedRate) {
        setLoading(false);
        return;
      }
      const parsedRate = JSON.parse(forwardedRate);
      if (!parsedRate.accountName) {
        setLoading(false);
        return;
      }
      setItem({
        identifier: parsedRate.identifier,
        accountName: parsedRate.accountName || "",
        queueStatus: "Pending Rate Approval",
      });
      setLoading(false);
    }
    loadQueue();
  }, []);

  function processFile() {
    if (!item) return;
    router.push(`/line-manager/tasks/${item.identifier}`);
  }

  return (
    <section className="queue-card sales-queue">
      <header>
        <div><FiClock /><strong>Action Required Queue</strong></div>
        <button type="button" onClick={() => router.push("/line-manager/tasks?filter=queue")}>View All</button>
      </header>
      {loading ? (
        <LoadingSpinner />
      ) : item ? (
        <article className="sales-queue-item">
          <div>
            <h2>{item.accountName}</h2>
            <div className="queue-tags">
              <span>{item.identifier}</span>
              <strong className="lm-status"><i className="status-dot" /> {item.queueStatus}</strong>
            </div>
          </div>
          <button type="button" onClick={processFile}>Process File</button>
        </article>
      ) : (
        <p>No tasks pending for your role</p>
      )}
    </section>
  );
}
