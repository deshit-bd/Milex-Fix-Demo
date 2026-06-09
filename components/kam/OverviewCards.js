"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiBarChart2 } from "react-icons/fi";
import { OVERVIEW_CARDS } from "./dashboardData";
import { fetchDatabase } from "@/lib/database";
import { getDashboardStatsForRole } from "@/lib/recordFilters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function getRolePath(role) {
  if (role === "KAM") return "kam";
  if (role === "Line Manager") return "line-manager";
  return "sales";
}

export default function OverviewCards({ session }) {
  const [stats, setStats] = useState({ activeAccounts: 0, pipelineAccounts: 0, yourQueue: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);
  const rolePath = getRolePath(session?.role);

  useEffect(() => {
    setLoading(true);
    fetchDatabase().then((db) => {
      setStats(getDashboardStatsForRole(db.records || [], session?.role));
      setLoading(false);
    });
  }, [session?.role]);

  const cards = OVERVIEW_CARDS.map((card) => {
    if (card.label === "Active Accounts") return { ...card, value: stats.activeAccounts };
    if (card.label === "Pipeline Accounts") return { ...card, value: stats.pipelineAccounts };
    if (card.label === "Your Queue") return { ...card, value: stats.yourQueue };
    return card;
  });

  return (
    <section className="overview-grid" aria-label="Account overview">
      {cards.map(({ label, value, icon: Icon, tone }) => {
        const cardContent = loading ? (
          <LoadingSpinner label="Loading..." />
        ) : (
          <>
            <div className="metric-icon"><Icon /></div>
            <p>{label}</p>
            <strong>{value}</strong>
          </>
        );

        const cardHref =
          label === "Active Accounts"
            ? `/${rolePath}/customers`
            : label === "Pipeline Accounts"
              ? `/${rolePath}/tasks?filter=pipeline`
              : label === "Your Queue"
                ? `/${rolePath}/tasks?filter=queue`
                : "";

        if (cardHref) {
          return (
            <Link className={`metric-card ${tone} metric-card-link`} href={cardHref} key={label} aria-label={`View ${label.toLowerCase()}`}>
              {cardContent}
            </Link>
          );
        }

        return (
          <article className={`metric-card ${tone}`} key={label}>
            {cardContent}
          </article>
        );
      })}
      <article className="conversion-card">
        {loading ? (
          <LoadingSpinner label="Loading..." />
        ) : (
          <>
            <div className="conversion-top">
              <div className="metric-icon"><FiBarChart2 /></div>
            </div>
            <p>Conversion Rate</p>
            <strong>{stats.conversionRate}<small>%</small></strong>
          </>
        )}
      </article>
    </section>
  );
}
