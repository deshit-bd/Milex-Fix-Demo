"use client";

import { useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import RecommendationForm from "./RecommendationForm";
import RegistryCard from "./RegistryCard";

export default function RecommendationPage({ session }) {
  const [customerCode, setCustomerCode] = useState("");

  return (
    <main className="portal">
      <Sidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="recommendation-body">
          <RecommendationForm onCustomerCodeChange={setCustomerCode} />
          <RegistryCard customerCode={customerCode} />
        </div>
      </section>
    </main>
  );
}
