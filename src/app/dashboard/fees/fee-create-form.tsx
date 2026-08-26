"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOption = { id: string; name: string; section: string };

export function FeeCreateForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), classId: form.get("classId") || undefined, amount: Number(form.get("amount")), dueDate: form.get("dueDate"), lateFee: Number(form.get("lateFee") || 0), discount: Number(form.get("discount") || 0) }) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) { setError(result.error?.message ?? "Unable to create fee structure"); return; }
    event.currentTarget.reset();
    setSaved("Fee structure saved for the selected branch.");
    router.refresh();
  }

  return <form className="panel form fee-form" onSubmit={onSubmit}><div className="form-section-label">Create fee structure</div><div className="create-grid fee-grid"><div className="field"><label htmlFor="fee-name">Fee name</label><input id="fee-name" name="name" placeholder="Semester tuition" required /></div><div className="field"><label htmlFor="fee-class">Branch</label><select id="fee-class" name="classId" required><option value="">Select branch</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.section}</option>)}</select></div><div className="field"><label htmlFor="fee-amount">Amount (INR)</label><input id="fee-amount" name="amount" type="number" min="0" step="0.01" required /></div><div className="field"><label htmlFor="fee-due">Due date</label><input id="fee-due" name="dueDate" type="date" required /></div><div className="field"><label htmlFor="fee-late">Late fee</label><input id="fee-late" name="lateFee" type="number" min="0" defaultValue="0" /></div><div className="field"><label htmlFor="fee-discount">Discount</label><input id="fee-discount" name="discount" type="number" min="0" defaultValue="0" /></div><button className="button" type="submit" disabled={loading}><Plus size={17} />{loading ? "Saving..." : "Create fee"}</button></div>{error ? <p className="error">{error}</p> : null}{saved ? <p className="success">{saved}</p> : null}</form>;
}
