"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeacherCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreated("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        role: "TEACHER",
        employeeCode: form.get("employeeCode")
      })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error?.message ?? "Unable to add faculty");
      return;
    }
    event.currentTarget.reset();
    setCreated(`${result.data.name} can sign in with ${result.data.email}. Password: Password@123`);
    router.refresh();
  }

  return <form className="panel form" onSubmit={onSubmit}><div className="form-section-label">Add faculty login</div><div className="create-grid"><div className="field"><label htmlFor="teacher-name">Full name</label><input id="teacher-name" name="name" required /></div><div className="field"><label htmlFor="teacher-email">Email</label><input id="teacher-email" name="email" type="email" required /></div><div className="field"><label htmlFor="teacher-phone">Phone</label><input id="teacher-phone" name="phone" minLength={8} maxLength={20} required /></div><div className="field"><label htmlFor="employeeCode">Employee code</label><input id="employeeCode" name="employeeCode" placeholder="Auto generated if empty" /></div><button className="button" type="submit" disabled={loading}><Plus size={17} />{loading ? "Creating..." : "Add faculty"}</button></div>{error ? <p className="error">{error}</p> : null}{created ? <p className="success">{created}</p> : null}</form>;
}
