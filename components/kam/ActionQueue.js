"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { fetchDatabase } from "@/lib/database";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function isKamTask(record) {
  return [
    "OFFER DELIVERED (PENDING AGREEMENT)",
    "CLIENT ACCEPTED OFFER (PENDING AGREEMENT)",
    "PENDING_PROFILE",
    "FINAL PROFILE DATA",
    "CLIENT FINAL DATA UPDATE",
  ].includes(record.status);
}

export default function ActionQueue() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDatabase().then((db) => {
      setRecords((db.records || []).filter(isKamTask));
      setLoading(false);
    });
  }, []);

  return (
    <section className="queue-card">
      <header>
        <div><FiClock /><strong>Action Required Queue</strong></div>
        <button type="button" onClick={() => router.push("/kam/tasks?filter=queue")}>View All</button>
      </header>
      {loading ? (
        <LoadingSpinner />
      ) : records.length ? (
        <div className="sales-queue-item">
          <div>
            <h2>{records[0].accountName}</h2>
            <div className="queue-tags">
              <span>{records[0].identifier}</span>
              <strong><i className="status-dot" /> {records[0].status}</strong>
            </div>
          </div>
          <button type="button" onClick={() => router.push(`/kam/tasks/${records[0].identifier}`)}>Process File</button>
        </div>
      ) : (
        <p>No tasks pending for your role</p>
      )}
    </section>
  );
}
