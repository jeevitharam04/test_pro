import Link from "next/link";
import { BarChart3, Bell, BookOpen, CalendarDays, ClipboardList, CreditCard, FileText, GraduationCap, Menu, Users } from "lucide-react";
import { requireTenantSession } from "@/shared/auth/session";
import { LogoutButton } from "./logout-button";
import { CampusBot } from "./campus-bot";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTenantSession();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark">E</div><div><div className="brand">EduCore</div><span className="brand-caption">Campus operations</span></div><button className="mobile-menu" aria-label="Open navigation"><Menu size={20} /></button></div>
        <div className="profile-chip"><div className="avatar">{session.name.slice(0, 1).toUpperCase()}</div><div><strong>{session.name}</strong><span>{session.role.toLowerCase()}</span></div></div>
        <div className="nav-label">Campus workspace</div>
        <nav className="nav" aria-label="Dashboard">
          <Link className="active" href="/dashboard"><BarChart3 size={18} /> Overview</Link>
          {session.role === "PRINCIPAL" ? <><Link href="/dashboard/users"><Users size={18} /> Faculty & users</Link><Link href="/dashboard/classes"><BookOpen size={18} /> Departments & courses</Link><Link href="/dashboard/students"><GraduationCap size={18} /> Students</Link><Link href="/dashboard/attendance"><CalendarDays size={18} /> Attendance overview</Link><Link href="/dashboard/marks"><ClipboardList size={18} /> Examinations</Link><Link href="/dashboard/homework"><FileText size={18} /> Assignments</Link><Link href="/dashboard/fees"><CreditCard size={18} /> Fees & finance</Link><Link href="/dashboard/announcements"><Bell size={18} /> Announcements</Link><Link href="/dashboard/timetable"><CalendarDays size={18} /> Timetable</Link><Link href="/dashboard/reports"><BarChart3 size={18} /> Analytics</Link></> : null}
          {session.role === "TEACHER" ? <><Link href="/dashboard/classes"><BookOpen size={18} /> My courses</Link><Link href="/dashboard/students"><GraduationCap size={18} /> Students</Link><Link href="/dashboard/attendance"><CalendarDays size={18} /> Take attendance</Link><Link href="/dashboard/marks"><ClipboardList size={18} /> Assessments</Link><Link href="/dashboard/homework"><FileText size={18} /> Assignments</Link><Link href="/dashboard/timetable"><CalendarDays size={18} /> Timetable</Link><Link href="/dashboard/announcements"><Bell size={18} /> Announcements</Link><Link href="/dashboard/reports"><BarChart3 size={18} /> Reports</Link></> : null}
          {session.role === "PARENT" ? <><Link href="/dashboard/students"><Users size={18} /> My children</Link><Link href="/dashboard/attendance"><CalendarDays size={18} /> Attendance</Link><Link href="/dashboard/marks"><ClipboardList size={18} /> Results</Link><Link href="/dashboard/homework"><FileText size={18} /> Assignments</Link><Link href="/dashboard/fees"><CreditCard size={18} /> Fees</Link><Link href="/dashboard/announcements"><Bell size={18} /> Announcements</Link><Link href="/dashboard/timetable"><CalendarDays size={18} /> Calendar</Link></> : null}
          {session.role === "STUDENT" ? <><Link href="/dashboard/students"><GraduationCap size={18} /> My profile</Link><Link href="/dashboard/attendance"><CalendarDays size={18} /> Attendance</Link><Link href="/dashboard/marks"><ClipboardList size={18} /> Results</Link><Link href="/dashboard/homework"><FileText size={18} /> Assignments</Link><Link href="/dashboard/timetable"><CalendarDays size={18} /> Timetable</Link><Link href="/dashboard/announcements"><Bell size={18} /> Announcements</Link></> : null}
          <LogoutButton />
        </nav>
      </aside>
      <main className="main">{children}<CampusBot /></main>
    </div>
  );
}
