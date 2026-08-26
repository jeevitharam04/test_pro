"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TeacherOption = {
  id: string;
  user: {
    name: string;
  };
};

export function ClassCreateForm({ teachers }: { teachers: TeacherOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        section: form.get("section"),
        capacity: Number(form.get("capacity")),
        classTeacherId: form.get("classTeacherId") || undefined
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error?.message ?? "Unable to create class");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="grid" style={{ gridTemplateColumns: "1fr 120px 120px 1fr auto" }}>
        <div className="field">
          <label htmlFor="name">Academic group</label>
          <input id="name" name="name" placeholder="Engineering" required />
        </div>
        <div className="field">
          <label htmlFor="section">Branch / semester</label>
          <input id="section" name="section" placeholder="IT / CSE - Semester 1" required />
        </div>
        <div className="field">
          <label htmlFor="capacity">Capacity</label>
          <input id="capacity" name="capacity" type="number" min={1} max={200} defaultValue={40} required />
        </div>
        <div className="field">
          <label htmlFor="classTeacherId">Assign faculty</label>
          <select id="classTeacherId" name="classTeacherId" defaultValue="">
            <option value="">Unassigned</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user.name}
              </option>
            ))}
          </select>
        </div>
        <button className="button" type="submit" disabled={loading} style={{ alignSelf: "end" }}>
          <Plus size={18} aria-hidden />
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
