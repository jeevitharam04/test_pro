"use client";

import { School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolName: form.get("schoolName"),
        schoolSlug: form.get("schoolSlug"),
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password")
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      const fieldErrors = result.error?.details?.fieldErrors as Record<string, string[]> | undefined;
      const details = fieldErrors ? Object.entries(fieldErrors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`)).join(" ") : "";
      setError(details || result.error?.message || "Unable to create school");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="schoolName">School name</label>
        <input id="schoolName" name="schoolName" required />
      </div>
      <div className="field">
        <label htmlFor="schoolSlug">School URL slug</label>
        <input id="schoolSlug" name="schoolSlug" placeholder="green-valley-school" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={60} title="Use lowercase letters, numbers, and single hyphens only" required />
      </div>
      <div className="field">
        <label htmlFor="name">Principal name</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" minLength={8} maxLength={20} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} maxLength={100} required />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        <School size={18} aria-hidden />
        {loading ? "Creating..." : "Create school"}
      </button>
    </form>
  );
}
