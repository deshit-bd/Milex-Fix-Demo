"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentSession, getRoleRoute } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getCurrentSession();
    if (session) router.replace(getRoleRoute(session));
  }, [router]);

  return <LoginForm />;
}
