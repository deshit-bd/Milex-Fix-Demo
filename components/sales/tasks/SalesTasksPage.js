"use client";

import { useSearchParams } from "next/navigation";
import Topbar from "@/components/kam/Topbar";
import SalesSidebar from "../SalesSidebar";
import RecordsTable from "./RecordsTable";

export default function SalesTasksPage({ session }) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const title = filter === "queue" ? "Your Queue" : filter === "pipeline" ? "Pipeline Accounts" : "Task Queue & Record";
  const description =
    filter === "queue"
      ? "Accounts currently waiting for your rate preparation or follow-up."
      : filter === "pipeline"
        ? "Accounts currently moving through approval, offer, agreement, or profile setup."
        : "Manage and review your active task queue";

  return (
    <main className="portal">
      <SalesSidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="records-body">
          <h1>{title}</h1>
          <p>{description}</p>
          <RecordsTable />
        </div>
      </section>
    </main>
  );
}
