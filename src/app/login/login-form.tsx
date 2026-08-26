"use client";

import { GraduationCap, LogIn, ShieldCheck, Users, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("principal");
  const [email, setEmail] = useState("principal@demo.edu");
  const roleAccounts = {
    principal: { label: "Principal / Admin", description: "Manage the institution", email: "principal@demo.edu", icon: ShieldCheck },
    teacher: { label: "Faculty", description: "Teach and assess learners", email: "teacher@demo.edu", icon: Users },
    parent: { label: "Parent", description: "Monitor your child", email: "parent@demo.edu", icon: UserRound },
    student: { label: "Student", description: "View your academics", email: "student@demo.edu", icon: GraduationCap }
  } as const;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error?.message ?? "Unable to sign in");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="role-picker" aria-label="Choose sign-in role">
        {Object.entries(roleAccounts).map(([key, account]) => { const Icon = account.icon; return <button className={`role-option ${role === key ? "selected" : ""}`} type="button" key={key} onClick={() => { setRole(key); setEmail(account.email); setError(""); }}><span className="role-option-icon"><Icon size={17} /></span><span className="role-option-copy"><strong>{account.label}</strong><small>{account.description}</small></span></button>; })}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" defaultValue="Password@123" required />
      </div>
      <p className="login-hint">Local demo account · Password: <strong>Password@123</strong></p>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        <LogIn size={18} aria-hidden />
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
