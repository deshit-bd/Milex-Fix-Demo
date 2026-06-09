"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiUser } from "react-icons/fi";

function getBarcodeBars(customerCode = "") {
  if (!customerCode) return [];
  const seedBars = customerCode.split("").flatMap((character, index) => {
    const value = character.charCodeAt(0) + index;
    return [
      { width: (value % 4) + 1, gap: (value % 2) + 1 },
      { width: (value % 3) + 1, gap: 1 },
    ];
  });
  return Array.from({ length: Math.ceil(80 / seedBars.length) }, () => seedBars).flat();
}

export default function RegistryCard({ customerCode }) {
  const [createdDate, setCreatedDate] = useState("");
  const barcodeBars = getBarcodeBars(customerCode);

  useEffect(() => {
    setCreatedDate(
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  return (
    <aside className="registry-card">
      <div className="registry-title">
        <h2>System Registry</h2>
        <span>Status: Draft</span>
      </div>
      <p>CUSTOMER CODE</p>
      <strong>{customerCode || "Generating..."}</strong>
      <div className="registry-divider" />
      <p>SCANNABLE IDENTITY</p>
      <div className="barcode" aria-label={customerCode ? `Barcode ${customerCode}` : "Pending barcode"}>
        {barcodeBars.map((bar, index) => (
          <span key={`${customerCode}-${index}`} style={{ width: `${bar.width}px`, marginRight: `${bar.gap}px` }} />
        ))}
      </div>
      <div className="registry-divider" />
      <p>CREATED BY</p>
      <div className="registry-meta"><FiUser /> <span>KAM User</span></div>
      <p>CREATED DATE</p>
      <div className="registry-meta"><FiCalendar /> <span>{createdDate}</span></div>
    </aside>
  );
}
