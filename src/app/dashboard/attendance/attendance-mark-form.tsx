"use client";

import { Check, CircleAlert, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StudentOption = { id: string; name: string; admissionNo: string; rollNo: string | null };
type ClassOption = { id: string; name: string; section: string; students: StudentOption[] };
type Status = "PRESENT" | "ABSENT" | "LEAVE";

export function AttendanceMarkForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const selectedClass = classes.find((item) => item.id === classId) ?? classes[0];
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"DAILY" | "SUBJECT_WISE" | "SESSION_WISE">("DAILY");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setAll(status: Status) {
    setStatuses(Object.fromEntries((selectedClass?.students ?? []).map((student) => [student.id, status])));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClass) return;
    setSaving(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/v1/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: selectedClass.id,
        mode,
        markedOn: new Date(`${date}T00:00:00`).toISOString(),
        records: selectedClass.students.map((student) => ({ studentId: student.id, status: statuses[student.id] ?? "PRESENT" }))
      })
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error?.message ?? "Unable to save attendance");
      return;
    }
    setMessage(`${selectedClass.students.length} student records saved successfully.`);
    router.refresh();
  }

  if (!classes.length) return <div className="panel empty-state">Create a class and enroll students before marking attendance.</div>;

  return (
    <form className="panel attendance-form" onSubmit={submit}>
      <div className="attendance-toolbar">
        <div className="field"><label htmlFor="attendance-class">Class</label><select id="attendance-class" value={classId} onChange={(event) => { setClassId(event.target.value); setStatuses({}); }}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section}</option>)}</select></div>
        <div className="field"><label htmlFor="attendance-date">Date</label><input id="attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <div className="field"><label htmlFor="attendance-mode">Attendance type</label><select id="attendance-mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="DAILY">Daily</option><option value="SUBJECT_WISE">Subject-wise</option><option value="SESSION_WISE">Session-wise</option></select></div>
      </div>
      <div className="register-heading"><div><p className="eyebrow">{selectedClass?.students.length ?? 0} learners</p><h2>Daily register</h2></div><div className="register-actions"><button className="status-button present" type="button" onClick={() => setAll("PRESENT")}><Check size={15} /> All present</button><button className="status-button neutral" type="button" onClick={() => setAll("ABSENT")}><CircleAlert size={15} /> All absent</button></div></div>
      <div className="attendance-list">{selectedClass?.students.map((student, index) => { const status = statuses[student.id] ?? "PRESENT"; return <div className="attendance-row" key={student.id}><span className="roll-number">{student.rollNo ?? String(index + 1).padStart(2, "0")}</span><span className="student-name"><strong>{student.name}</strong><small>{student.admissionNo}</small></span><div className="status-options">{(["PRESENT", "ABSENT", "LEAVE"] as Status[]).map((option) => <button className={`status-choice ${option.toLowerCase()} ${status === option ? "selected" : ""}`} type="button" key={option} onClick={() => setStatuses((current) => ({ ...current, [student.id]: option }))}>{option[0] + option.slice(1).toLowerCase()}</button>)}</div></div>; })}</div>
      <div className="form-footer">{error ? <p className="error">{error}</p> : null}{message ? <p className="success">{message}</p> : null}<button className="button" type="submit" disabled={saving}><Save size={17} />{saving ? "Saving register..." : "Save attendance"}</button></div>
    </form>
  );
}
