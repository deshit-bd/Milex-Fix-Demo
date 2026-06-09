"use client";

import { FiLogOut } from "react-icons/fi";
import RoleGuard from "@/components/shared/RoleGuard";
import { logout } from "@/lib/auth";

export default function PendingRolePage() {
  return (
    <RoleGuard blockedRole="KAM">
      {(session) => (
        <main className="page-shell">
          <section className="pending-role-card">
            <img className="dashboard-logo" src="/milex-logo.svg" alt="MileX" />
            <p className="pending-role-label">{session.role}</p>
            <h1>Dashboard coming soon</h1>
            <p>
              This role has been kept separate from the KAM dashboard. Its
              workflow will be added when the design is ready.
            </p>
            <button className="logout-button" type="button" onClick={logout}>
              <FiLogOut /> Sign Out
            </button>
          </section>
        </main>
      )}
    </RoleGuard>
  );
}
