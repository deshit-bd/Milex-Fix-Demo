"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession, getRoleRoute } from "@/lib/auth";

export default function RoleGuard({ allowedRole, blockedRole, children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const activeSession = getCurrentSession();
    const denied =
      !activeSession ||
      (allowedRole && activeSession.role !== allowedRole) ||
      (blockedRole && activeSession.role === blockedRole);

    if (denied) {
      router.replace(getRoleRoute(activeSession));
      return;
    }

    setSession(activeSession);
  }, [allowedRole, blockedRole, router]);

  return session ? children(session) : <main className="route-loader">Loading...</main>;
}
