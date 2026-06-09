"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiInfo, FiLock, FiMail } from "react-icons/fi";
import Swal from "sweetalert2";
import { authenticate, DEMO_USERS, getRoleRoute } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  function updateCredential(event) {
    setCredentials((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const session = authenticate(credentials);

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "Unable to sign in",
        text: "Use one of the demo accounts shown below the form.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Signed in",
      text: `Welcome, ${session.role}`,
      timer: 900,
      showConfirmButton: false,
    });
    router.replace(getRoleRoute(session));
  }

  return (
    <main className="page-shell">
      <div className="login-stack">
        <section className="login-card">
          <img className="brand-logo" src="/milex-logo.svg" alt="MileX" />
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <div className="input-wrap">
              <FiMail />
              <input id="email" name="email" type="email" placeholder="name@milex.com" value={credentials.email} onChange={updateCredential} required />
            </div>
            <div className="password-heading">
              <label htmlFor="password">Password</label>
              <button type="button" onClick={() => Swal.fire("Please contact your administrator.")}>Forgot?</button>
            </div>
            <div className="input-wrap">
              <FiLock />
              <input id="password" name="password" type="password" placeholder="Password" value={credentials.password} onChange={updateCredential} required />
            </div>
            <button className="sign-in-button" type="submit">Sign In <FiArrowRight /></button>
          </form>
        </section>
        <section className="demo-card">
          <div className="demo-header"><FiInfo /> <span>DEMO ACCESS</span></div>
          <div className="demo-list">
            {DEMO_USERS.map((user) => (
              <button className="demo-row" type="button" key={user.email} onClick={() => setCredentials({ email: user.email, password: user.password })}>
                <span><strong>{user.role}</strong><small>{user.email}</small></span>
                <code>{user.password}</code>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
