"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession, getRoleRoute } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getRoleRoute(getCurrentSession()));
  }, [router]);

  return <main className="route-loader">Loading...</main>;
}
