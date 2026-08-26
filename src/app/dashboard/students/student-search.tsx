"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StudentSearch() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function findStudent(value: string) {
    const clean = value.trim();
    const looksComplete = /^ADM-\d{4,}$/i.test(clean) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean);
    if (!looksComplete) return;
    setSearching(true);
    setNotFound(false);
    const response = await fetch(`/api/v1/students/${encodeURIComponent(clean)}`);
    setSearching(false);
    if (!response.ok) {
      setNotFound(true);
      return;
    }
    const result = await response.json();
    router.push(`/dashboard/students/${result.data.id}`);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void findStudent(studentId);
  }

  return <form className="student-search" onSubmit={onSubmit}><Search size={18} /><input aria-label="Search student by ID" value={studentId} onChange={(event) => { setStudentId(event.target.value); setNotFound(false); void findStudent(event.target.value); }} placeholder="Enter student ID or admission number" /><button className="button" type="submit" disabled={searching}>{searching ? <LoaderCircle className="spin" size={16} /> : null}{searching ? "Finding..." : "Find student"}</button>{notFound ? <span className="search-result-error">No student found</span> : null}</form>;
}
