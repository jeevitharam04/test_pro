"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOption = { id: string; name: string; section: string };

export function StudentCreateForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [createdRoll, setCreatedRoll] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedId("");
    setCreatedRoll("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email") || undefined,
        classId: form.get("classId"),
      })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error?.message ?? "Unable to add student");
      return;
    }
    event.currentTarget.reset();
    setCreatedId(result.data?.admissionNo ?? "");
    setCreatedRoll(result.data?.rollNo ?? "");
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 100px auto" }}>
        <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" /></div>
        <div className="auto-id"><span>Admission ID</span><strong>Auto allocated</strong><small>Unique for this college</small></div>
        <div className="auto-id"><span>Roll number</span><strong>Auto allocated</strong><small>Next number in branch</small></div>
        <div className="field"><label htmlFor="classId">Class</label><select id="classId" name="classId" required>{classes.map((classRecord) => <option key={classRecord.id} value={classRecord.id}>{classRecord.name} {classRecord.section}</option>)}</select></div>
        <button className="button" type="submit" disabled={loading} style={{ alignSelf: "end" }}><Plus size={18} />{loading ? "Adding..." : "Add"}</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {createdId ? <p className="success">Student saved. Admission ID: <strong>{createdId}</strong></p> : null}
      {createdRoll ? <p className="success">Roll number: <strong>{createdRoll}</strong></p> : null}
    </form>
  );
}
