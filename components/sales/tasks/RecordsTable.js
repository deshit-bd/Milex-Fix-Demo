"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchServerDatabase } from "@/lib/database";
import { isPipelineAccount, isQueueAccountForRole } from "@/lib/recordFilters";
import { getRecordRevision } from "@/lib/revisions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function RecordsTable() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("queue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const currentFilter = new URLSearchParams(window.location.search).get("filter");
    const nextFilter = ["pipeline", "queue"].includes(currentFilter) ? currentFilter : "queue";
    setFilter(nextFilter);

    fetchServerDatabase().then((db) => {
      const serverRecords = db.records || [];
      const recordFilter =
        nextFilter === "pipeline"
          ? isPipelineAccount
          : nextFilter === "queue"
            ? (record) => isQueueAccountForRole(record, "Sales Coordinator")
          : isPipelineAccount;

      setRecords(serverRecords.filter(recordFilter));
      setError("");
    }).catch((loadError) => {
      setRecords([]);
      setError(loadError.message || "Could not load records");
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  function openRecord(record) {
    router.push(`/sales/tasks/${record.identifier}`);
  }

  const emptyMessage = filter === "queue" ? "No queue items yet" : "No pipeline accounts yet";

  return (
    <div className="records-table-wrap">
      <table className="records-table">
        <thead>
          <tr><th>Identifier</th><th>Account Name</th><th>Current Status</th><th>Revision</th><th>Action</th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="empty-table-cell" colSpan="5"><LoadingSpinner /></td>
            </tr>
          ) : error ? (
            <tr>
              <td className="empty-table-cell" colSpan="5">{error}</td>
            </tr>
          ) : records.length ? (
            records.map((record) => (
              <tr key={record.identifier}>
                <td>{record.identifier}</td>
                <td>{record.accountName}</td>
                <td><span className={`record-status ${record.tone}`}>{record.status}</span></td>
                <td>{getRecordRevision(record)}</td>
                <td><button type="button" onClick={() => openRecord(record)}>Open Record &gt;</button></td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="empty-table-cell" colSpan="5">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
