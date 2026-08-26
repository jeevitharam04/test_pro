"use client";

import { Megaphone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOption = { id: string; name: string; section: string };

export function AnnouncementCreateForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), body: form.get("body"), category: form.get("category"), priority: form.get("priority"), audience: form.get("audience"), classId: form.get("classId") || undefined, publishAt: form.get("publishAt") || undefined, expiresAt: form.get("expiresAt") || undefined }) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) { setError(result.error?.message ?? "Unable to publish announcement"); return; }
    event.currentTarget.reset();
    setMessage("Announcement published and visible to the selected audience.");
    router.refresh();
  }

  return <form className="panel form announcement-form" onSubmit={submit}><div className="form-section-label"><Megaphone size={17} /> Create announcement</div><div className="announcement-grid"><div className="field announcement-title"><label htmlFor="announcement-title">Title</label><input id="announcement-title" name="title" placeholder="Semester examination schedule" required /></div><div className="field"><label htmlFor="announcement-category">Category</label><select id="announcement-category" name="category" defaultValue="GENERAL"><option>GENERAL</option><option>ACADEMIC</option><option>EXAMINATION</option><option>FEES</option><option>EVENTS</option><option>PLACEMENTS</option><option>HOLIDAYS</option><option>EMERGENCY</option></select></div><div className="field"><label htmlFor="announcement-priority">Priority</label><select id="announcement-priority" name="priority" defaultValue="NORMAL"><option>NORMAL</option><option>MEDIUM</option><option>HIGH</option></select></div><div className="field"><label htmlFor="announcement-audience">Audience</label><select id="announcement-audience" name="audience" defaultValue="EVERYONE"><option>EVERYONE</option><option>STUDENTS</option><option>TEACHERS</option><option>PARENTS</option></select></div><div className="field"><label htmlFor="announcement-class">Target branch (optional)</label><select id="announcement-class" name="classId" defaultValue=""><option value="">All branches</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.section}</option>)}</select></div><div className="field"><label htmlFor="announcement-publish">Publish date</label><input id="announcement-publish" name="publishAt" type="datetime-local" /></div><div className="field"><label htmlFor="announcement-expires">Expiry date</label><input id="announcement-expires" name="expiresAt" type="datetime-local" /></div><div className="field announcement-body"><label htmlFor="announcement-body">Description</label><textarea id="announcement-body" name="body" rows={3} placeholder="Share the details with your campus community" required /></div></div><div className="form-footer">{error ? <p className="error">{error}</p> : null}{message ? <p className="success">{message}</p> : null}<button className="button" type="submit" disabled={saving}><Send size={16} />{saving ? "Publishing..." : "Publish announcement"}</button></div></form>;
}
