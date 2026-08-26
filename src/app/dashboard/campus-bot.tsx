"use client";

import { Bot, Send, X } from "lucide-react";
import { useState } from "react";

type Message = { role: "bot" | "user"; text: string };

const suggestions = ["Find a student", "How do I take attendance?", "Where are assessments?"];

function replyTo(question: string) {
  const value = question.toLowerCase();
  if (value.includes("student") || value.includes("uuid") || value.includes("admission")) return "Open Students from the campus workspace. Search with the student's UUID or admission ID to view their profile, attendance, assessments, guardian, class teacher, medical details, fees, and assignments.";
  if (value.includes("attendance") || value.includes("absent")) return "Open Attendance, choose a course and date, set each learner to Present, Absent, or Leave, then select Save attendance. The register is stored against the student ID.";
  if (value.includes("mark") || value.includes("assessment") || value.includes("grade")) return "Assessments contains academic marks and grades. Select a student profile to review their latest subject and exam records.";
  if (value.includes("fee") || value.includes("finance") || value.includes("payment")) return "Finance contains fee structures and payment history. Payment gateway credentials are required before enabling live online payments.";
  if (value.includes("assignment") || value.includes("homework")) return "Assignments shows coursework, deadlines, subjects, and submission counts for each course.";
  if (value.includes("course") || value.includes("class") || value.includes("faculty")) return "Courses stores teaching groups and faculty assignments. Use the Courses page to review capacity, faculty, learners, and subjects.";
  return "I can help with student profiles, attendance, assessments, assignments, courses, faculty, and finance. Try one of the suggested questions.";
}

export function CampusBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", text: "Hi. I’m the EduCore campus assistant. What do you need to find?" }]);

  function ask(question = input) {
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }, { role: "bot", text: replyTo(clean) }]);
    setInput("");
  }

  return <div className="campus-bot"><button className="bot-launcher" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? "Close campus assistant" : "Open campus assistant"}>{open ? <X size={20} /> : <Bot size={21} />}<span className="bot-pulse" /></button>{open ? <section className="bot-panel" aria-label="Campus assistant"><header><div className="bot-title"><div className="bot-avatar"><Bot size={17} /></div><div><strong>Campus assistant</strong><small>Ready to help</small></div></div><button className="bot-close" type="button" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={17} /></button></header><div className="bot-messages">{messages.map((message, index) => <div className={`bot-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}</div><div className="bot-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}</div><form className="bot-input" onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about campus records..." aria-label="Ask the campus assistant" /><button type="submit" aria-label="Send question"><Send size={16} /></button></form></section> : null}</div>;
}
