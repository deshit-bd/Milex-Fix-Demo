"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/kam/Sidebar";
import Topbar from "@/components/kam/Topbar";
import { fetchDatabase, fetchServerDatabase } from "@/lib/database";
import { isPipelineAccount, isQueueAccountForRole } from "@/lib/recordFilters";
import { getRecordRevision } from "@/lib/revisions";
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

export default function KamTasksPage({ session }) {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("tasks");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const currentFilter = new URLSearchParams(window.location.search).get("filter");
    const nextFilter = ["pipeline", "queue"].includes(currentFilter) ? currentFilter : "tasks";
    setFilter(nextFilter);

    fetchServerDatabase().catch(() => fetchDatabase()).then((db) => {
      const allRecords = db.records || [];
      const recordFilter =
        nextFilter === "pipeline"
          ? isPipelineAccount
          : nextFilter === "queue"
            ? (record) => isQueueAccountForRole(record, "KAM")
            : isKamTask;

      setRecords(allRecords.filter(recordFilter));
      setLoading(false);
    });
  }, []);

  const isPipelineView = filter === "pipeline";
  const isQueueView = filter === "queue";

  return (
    <main className="portal">
      <Sidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="records-body">
          <h1>{isPipelineView ? "Pipeline Accounts" : isQueueView ? "Your Queue" : "Task Queue & Record"}</h1>
          <p>
            {isPipelineView
              ? "Accounts currently moving through approval, offer, agreement, or profile setup."
              : isQueueView
                ? "Accounts currently waiting on rate preparation or approval follow-up."
                : "Customer offer delivery, agreement upload, and profile setup tasks."}
          </p>
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
                ) : records.length ? (
                  records.map((record) => (
                    <tr key={record.identifier}>
                      <td>{record.identifier}</td>
                      <td>{record.accountName}</td>
                      <td><span className={`record-status ${record.tone || "warning"}`}>{record.status}</span></td>
                      <td>{getRecordRevision(record)}</td>
                      <td><button type="button" onClick={() => router.push(`/kam/tasks/${record.identifier}`)}>Open Record &gt;</button></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-table-cell" colSpan="5">
                      {isPipelineView ? "No pipeline accounts yet" : isQueueView ? "No queue items yet" : "No KAM tasks pending"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
