"use client";

import { useSearchParams } from "next/navigation";
import Topbar from "@/components/kam/Topbar";
import LineManagerSidebar from "../LineManagerSidebar";
import LineManagerRecordsTable from "./LineManagerRecordsTable";

export default function LineManagerTasksPage({ session }) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const title = filter === "queue" ? "Your Queue" : filter === "pipeline" ? "Pipeline Accounts" : "Task Queue & Record";
  const description =
    filter === "queue"
      ? "Accounts currently waiting for your approval decision."
      : filter === "pipeline"
        ? "Accounts currently moving through approval, offer, agreement, or profile setup."
        : "Manage and review your active task queue";

  return (
    <main className="portal">
      <LineManagerSidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="records-body">
          <h1>{title}</h1>
          <p>{description}</p>
          <LineManagerRecordsTable />
        </div>
      </section>
    </main>
  );
}
