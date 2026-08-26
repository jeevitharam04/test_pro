import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { ArrowUpRight, BarChart3, Bell, BookOpen, CalendarCheck2, ClipboardList, CreditCard, FileText, GraduationCap, Plus, ReceiptText, Settings2, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "./charts";

export default async function DashboardPage() {
  const session = await requireTenantSession();
  const school = await prisma.school.findUnique({ where: { id: session.schoolId }, select: { name: true } });

  if (session.role === "PRINCIPAL") {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [students, teachers, classes, users, newAdmissions, attendance, feePlans, paidFees, pendingFees, overdueHomework, announcements] = await Promise.all([
      prisma.student.count({ where: { schoolId: session.schoolId, deletedAt: null } }),
      prisma.teacher.count({ where: { schoolId: session.schoolId, deletedAt: null } }),
      prisma.class.count({ where: { schoolId: session.schoolId, deletedAt: null } }),
      prisma.user.count({ where: { schoolId: session.schoolId, deletedAt: null } }),
      prisma.student.count({ where: { schoolId: session.schoolId, deletedAt: null, createdAt: { gte: monthStart } } }),
      prisma.attendance.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, select: { status: true } }),
      prisma.feeStructure.aggregate({ where: { schoolId: session.schoolId, deletedAt: null }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { schoolId: session.schoolId, deletedAt: null, status: "PAID" }, _sum: { amount: true } }),
      prisma.payment.count({ where: { schoolId: session.schoolId, deletedAt: null, status: "CREATED" } }),
      prisma.homework.count({ where: { schoolId: session.schoolId, deletedAt: null, deadline: { lt: new Date() } } }),
      recentAnnouncements(session.schoolId)
    ]);
    return <PrincipalDashboard schoolName={school?.name} sessionName={session.name} students={students} teachers={teachers} classes={classes} users={users} newAdmissions={newAdmissions} attendance={attendance} feePlans={feePlans._sum.amount?.toString() ?? "0"} paidFees={paidFees._sum.amount?.toString() ?? "0"} pendingFees={pendingFees} overdueHomework={overdueHomework} announcements={announcements} />;
  }

  if (session.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({ where: { schoolId: session.schoolId, userId: session.userId, deletedAt: null }, include: { assignedClasses: { where: { deletedAt: null }, include: { _count: { select: { students: true, subjects: true } } } }, subjects: { where: { deletedAt: null }, include: { class: true } }, timetable: { where: { deletedAt: null }, include: { class: true, subject: true }, orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }], take: 8 }, homework: { where: { deletedAt: null, deadline: { gte: new Date() } }, include: { class: true, subject: true }, orderBy: { deadline: "asc" }, take: 5 } } });
    return <TeacherDashboard sessionName={session.name} courses={teacher?.assignedClasses ?? []} subjects={teacher?.subjects ?? []} timetable={teacher?.timetable ?? []} assignments={teacher?.homework ?? []} />;
  }

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findFirst({
      where: { schoolId: session.schoolId, userId: session.userId, deletedAt: null },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                class: {
                  include: {
                    timetable: {
                      include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
                      orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
                      take: 4
                    }
                  }
                },
                attendance: { where: { deletedAt: null }, select: { status: true } },
                marks: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 3, include: { subject: true, examType: true } },
                submissions: { where: { deletedAt: null }, take: 4, include: { homework: true } },
                payments: { where: { deletedAt: null }, take: 5, include: { feeStructure: true }, orderBy: { createdAt: "desc" } }
              }
            }
          }
        }
      }
    });
    return <ParentDashboard students={parent?.students.map(({ student }) => ({ ...student, timetable: student.class.timetable })) ?? []} announcements={await recentAnnouncements(session.schoolId)} />;
  }

  const studentRecord = await prisma.student.findFirst({
    where: { schoolId: session.schoolId, userId: session.userId, deletedAt: null },
    include: {
      class: {
        include: {
          timetable: {
            include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
            orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
            take: 5
          }
        }
      },
      attendance: { where: { deletedAt: null }, select: { status: true } },
      marks: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5, include: { subject: true, examType: true } },
      submissions: { where: { deletedAt: null }, take: 5, include: { homework: true } },
      payments: { where: { deletedAt: null }, include: { feeStructure: true }, orderBy: { createdAt: "desc" }, take: 5 }
    }
  });
  const student = studentRecord ? { ...studentRecord, timetable: studentRecord.class.timetable } : null;
  const announcements = await recentAnnouncements(session.schoolId);
  return <StudentDashboard student={student} announcements={announcements} />;
}

async function recentAnnouncements(schoolId: string) {
  return prisma.announcement.findMany({ where: { schoolId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, body: true, createdAt: true, category: true, priority: true, audience: true } });
}

function PrincipalDashboard({ schoolName, sessionName, students, teachers, classes, users, newAdmissions, attendance, feePlans, paidFees, pendingFees, overdueHomework, announcements }: { schoolName?: string; sessionName: string; students: number; teachers: number; classes: number; users: number; newAdmissions: number; attendance: Array<{ status: "PRESENT" | "ABSENT" | "LEAVE" }>; feePlans: string; paidFees: string; pendingFees: number; overdueHomework: number; announcements: Awaited<ReturnType<typeof recentAnnouncements>> }) {

  const cards = [
    { label: "Students", value: students, icon: GraduationCap, tone: "sage" },
    { label: "Faculty", value: teachers, icon: Users, tone: "blue" },
    { label: "Courses", value: classes, icon: BookOpen, tone: "gold" },
    { label: "Users", value: users, icon: Users, tone: "rose" },
    { label: "New admissions", value: newAdmissions, icon: GraduationCap, tone: "ink" }
  ];

  return (
    <>
      <div className="topbar dashboard-heading">
        <div>
          <p className="eyebrow">Principal workspace · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="title">{schoolName ?? "EduCore Campus"}</h1>
          <p className="subtitle">Welcome, {sessionName}. Here is your clear view of teaching, learning, and campus operations.</p>
        </div>
        <div className="heading-actions"><Link className="button secondary" href="/dashboard/attendance">Attendance overview</Link><Link className="text-link" href="/docs/api">API docs <ArrowUpRight size={15} /></Link></div>
      </div>

      <section className="grid metrics">
        {cards.map((card) => (
          <div className="panel metric-card" key={card.label}>
            <div className={`metric-icon ${card.tone}`}><card.icon size={18} /></div>
            <div className="metric-label">{card.label}</div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-foot">Active records</div>
          </div>
        ))}
        <div className="panel metric-card attendance-card"><div className="metric-icon ink"><CalendarCheck2 size={18} /></div><div className="metric-label">Attendance rate</div><div className="metric-value">{attendancePercentage(attendance)}%</div><div className="progress"><span style={{ width: `${attendancePercentage(attendance)}%` }} /></div><div className="metric-foot">All recorded sessions</div></div>
        <div className="panel metric-card"><div className="metric-icon gold"><ReceiptText size={18} /></div><div className="metric-label">Fees collected</div><div className="metric-value">₹{paidFees}</div><div className="metric-foot">Against ₹{feePlans} planned</div></div>
      </section>

      <section className="quick-admin"><div><p className="eyebrow">Management actions</p><h2>Run the campus</h2></div><div className="admin-actions"><Link href="/dashboard/students"><Plus size={17} /><span><strong>New admission</strong><small>Add student record</small></span></Link><Link href="/dashboard/users"><Plus size={17} /><span><strong>New faculty</strong><small>Create login account</small></span></Link><Link href="/dashboard/classes"><BookOpen size={17} /><span><strong>Course setup</strong><small>Branches and faculty</small></span></Link><Link href="/dashboard/fees"><ReceiptText size={17} /><span><strong>Fee structure</strong><small>Review collections</small></span></Link><Link href="/dashboard/attendance"><Settings2 size={17} /><span><strong>Attendance rules</strong><small>Monitor register</small></span></Link></div></section>
      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">At a glance</p><h2>Campus trends</h2></div><span className="period-tag">Last 5 months</span></div>
          <DashboardCharts />
        </div>
        <div className="panel notice-panel">
          <div className="section-heading"><div><p className="eyebrow">Keep everyone aligned</p><h2>Recent notices</h2></div><Link className="icon-link" href="/dashboard/announcements" aria-label="View all notices"><ArrowUpRight size={18} /></Link></div>
          {announcements.length ? announcements.map((item) => <article className="notice" key={item.id}><div className="notice-mark"><Bell size={15} /></div><div><div className="notice-labels"><span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.body}</p><time>{item.createdAt.toLocaleDateString()}</time></div></article>) : <p className="empty-state">No notices have been published yet.</p>}
        </div>
      </section>
      <section className="attention-panel panel"><div className="section-heading"><div><p className="eyebrow">Admin watchlist</p><h2>Requires attention</h2></div><TriangleAlert size={19} color="#a16c1c" /></div><div className="attention-grid"><Link href="/dashboard/fees"><strong>{pendingFees}</strong><span>Pending payments</span><ArrowUpRight size={15} /></Link><Link href="/dashboard/homework"><strong>{overdueHomework}</strong><span>Overdue assignments</span><ArrowUpRight size={15} /></Link><Link href="/dashboard/attendance"><strong>{attendance.filter((record) => record.status === "ABSENT").length}</strong><span>Absence records</span><ArrowUpRight size={15} /></Link><Link href="/dashboard/fees"><strong>₹{feePlans}</strong><span>Fee plans configured</span><ArrowUpRight size={15} /></Link></div></section>
      <section className="quick-area"><div><p className="eyebrow">Academic operations</p><h2>Jump back in</h2></div><div className="quick-links"><Link href="/dashboard/students"><GraduationCap size={18} /><span><strong>Student records</strong><small>Enrollment and profiles</small></span><ArrowUpRight size={16} /></Link><Link href="/dashboard/marks"><ClipboardList size={18} /><span><strong>Assessments</strong><small>Review academic progress</small></span><ArrowUpRight size={16} /></Link><Link href="/dashboard/reports"><CalendarCheck2 size={18} /><span><strong>Campus analytics</strong><small>Export a clear picture</small></span><ArrowUpRight size={16} /></Link></div></section>
    </>
  );
}

function TeacherDashboard({ sessionName, courses, subjects, timetable, assignments }: { sessionName: string; courses: Array<{ id: string; name: string; section: string; _count: { students: number; subjects: number } }>; subjects: Array<{ id: string; name: string; code: string; class: { name: string; section: string } }>; timetable: Array<{ id: string; startsAt: string; endsAt: string; room: string | null; dayOfWeek: number; class: { name: string; section: string }; subject: { name: string } }>; assignments: Array<{ id: string; title: string; deadline: Date; class: { name: string; section: string }; subject: { name: string } }> }) {
  return <><DashboardHeading eyebrow="Faculty workspace" title={`Welcome, ${sessionName}`} subtitle="Your assigned courses, learners, and daily teaching actions in one place." action="Take attendance" href="/dashboard/attendance" /><section className="grid metrics"><Metric label="My courses" value={courses.length} tone="sage" /><Metric label="Students" value={courses.reduce((total, course) => total + course._count.students, 0)} tone="blue" /><Metric label="Subjects" value={subjects.length} tone="gold" /><Metric label="Active assignments" value={assignments.length} tone="rose" /></section><section className="student-actions"><StudentAction href="/dashboard/attendance" label="Take attendance" icon={<CalendarCheck2 size={18} />} /><StudentAction href="/dashboard/marks" label="Enter marks" icon={<ClipboardList size={18} />} /><StudentAction href="/dashboard/homework" label="Create assignment" icon={<FileText size={18} />} /><StudentAction href="/dashboard/reports" label="Class performance" icon={<BarChart3 size={18} />} /><StudentAction href="/dashboard/reports" label="Generate report card" icon={<ReceiptText size={18} />} /><StudentAction href="/dashboard/students" label="My students" icon={<GraduationCap size={18} />} /></section><section className="student-columns"><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Class allotment</p><h2>My courses</h2></div></div>{courses.length ? courses.map((course) => <div className="role-row" key={course.id}><span><strong>{course.name} / {course.section}</strong><small>{course._count.students} learners · {course._count.subjects} subjects</small></span><Link className="text-link" href="/dashboard/attendance">Open register <ArrowUpRight size={14} /></Link></div>) : <p className="empty-state">No courses have been assigned yet.</p>}</div><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Today and next</p><h2>My timetable</h2></div></div>{timetable.length ? timetable.map((entry) => <div className="role-row" key={entry.id}><span><strong>{entry.startsAt} - {entry.endsAt} · {entry.subject.name}</strong><small>{entry.class.name} / {entry.class.section} · {entry.room ?? "Room TBA"}</small></span></div>) : <p className="empty-state">No timetable entries have been assigned.</p>}</div></section><section className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Coursework</p><h2>Active assignments</h2></div></div>{assignments.length ? assignments.map((assignment) => <div className="role-row" key={assignment.id}><span><strong>{assignment.title}</strong><small>{assignment.subject.name} · {assignment.class.name} / {assignment.class.section} · Due {assignment.deadline.toLocaleDateString()}</small></span><Link className="text-link" href="/dashboard/homework">Review <ArrowUpRight size={14} /></Link></div>) : <p className="empty-state">No active assignments.</p>}</section></>;
}

function ParentDashboard({ students, announcements }: { students: Array<{ id: string; admissionNo: string; user: { name: string } | null; class: { name: string; section: string }; attendance: Array<{ status: "PRESENT" | "ABSENT" | "LEAVE" }>; marks: Array<{ marks: unknown; subject: { name: string }; examType: { name: string } }>; submissions: Array<{ status: string; homework: { title: string; deadline: Date } }>; payments: Array<{ amount: unknown; status: string; feeStructure: { name: string; dueDate: Date } }>; timetable: Array<{ startsAt: string; endsAt: string; room: string | null; subject: { name: string }; teacher: { user: { name: string } } }> }>; announcements: Awaited<ReturnType<typeof recentAnnouncements>> }) {
  const student = students[0];
  if (!student) return <><DashboardHeading eyebrow="Parent workspace" title="Your learner overview" subtitle="A focused view of the students linked to your account." action="Contact admin" href="/dashboard" /><div className="panel empty-state">No students are linked to this parent account.</div></>;
  const pendingFees = student.payments.filter((payment) => payment.status === "CREATED").length;
  const pendingAssignments = student.submissions.filter((submission) => submission.status === "PENDING" || submission.status === "OVERDUE").length;
  return <><DashboardHeading eyebrow="Parent workspace" title="Your learner overview" subtitle="Monitor attendance, results, assignments, and fees for your linked student." action="View full profile" href={`/dashboard/students/${student.id}`} />{students.length > 1 ? <div className="child-switcher"><span>Select student</span>{students.map((item) => <Link className={item.id === student.id ? "selected" : ""} href={`/dashboard/students/${item.id}`} key={item.id}>{item.user?.name ?? "Student"}</Link>)}</div> : null}<section className="panel learner-hero"><div className="profile-avatar">{(student.user?.name ?? "S").slice(0, 1)}</div><div><p className="eyebrow">Active learner</p><h2>{student.user?.name ?? "Student"}</h2><p>{student.class.name} / {student.class.section} · Admission {student.admissionNo}</p></div><Link className="text-link" href={`/dashboard/students/${student.id}`}>Student profile <ArrowUpRight size={14} /></Link></section><section className="grid metrics"><Metric label="Attendance" value={`${attendancePercentage(student.attendance)}%`} tone="sage" /><Metric label="Current results" value={student.marks.length} tone="blue" /><Metric label="Pending assignments" value={pendingAssignments} tone="gold" /><Metric label="Fee items due" value={pendingFees} tone="rose" /></section><section className="student-actions"><StudentAction href="/dashboard/attendance" label="View attendance" icon={<CalendarCheck2 size={18} />} /><StudentAction href="/dashboard/marks" label="View result" icon={<ClipboardList size={18} />} /><StudentAction href={`/dashboard/students/${student.id}`} label="Download marksheet" icon={<ReceiptText size={18} />} /><StudentAction href="/dashboard/fees" label="Pay fee" icon={<CreditCard size={18} />} /><StudentAction href="/dashboard/fees" label="Fee receipt" icon={<ReceiptText size={18} />} /><StudentAction href="/dashboard/homework" label="Assignments" icon={<FileText size={18} />} /><StudentAction href="/dashboard/timetable" label="Exam schedule" icon={<BookOpen size={18} />} /><StudentAction href="/dashboard/announcements" label="Announcements" icon={<Bell size={18} />} /></section><section className="student-columns"><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Academic progress</p><h2>Recent results</h2></div></div>{student.marks.length ? student.marks.map((mark, index) => <div className="role-row" key={`${mark.subject.name}-${index}`}><span><strong>{mark.subject.name}</strong><small>{mark.examType.name}</small></span><strong>{String(mark.marks)}</strong></div>) : <p className="empty-state">No results have been published yet.</p>}</div><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Today and next</p><h2>Timetable</h2></div></div>{student.timetable.length ? student.timetable.map((entry, index) => <div className="role-row" key={`${entry.subject.name}-${index}`}><span><strong>{entry.startsAt} - {entry.endsAt} · {entry.subject.name}</strong><small>{entry.teacher.user.name} · {entry.room ?? "Room TBA"}</small></span></div>) : <p className="empty-state">No timetable entries yet.</p>}</div></section><section className="student-columns"><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Finance</p><h2>Fee status</h2></div></div>{student.payments.length ? student.payments.map((payment, index) => <div className="role-row" key={`${payment.feeStructure.name}-${index}`}><span><strong>{payment.feeStructure.name}</strong><small>Due {payment.feeStructure.dueDate.toLocaleDateString()}</small></span><span className="record-status">₹{String(payment.amount)} · {payment.status}</span></div>) : <p className="empty-state">No fee records yet.</p>}</div><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Campus updates</p><h2>Announcements</h2></div></div>{announcements.length ? announcements.map((item) => <div className="role-row" key={item.id}><span><strong>{item.title}</strong><small>{item.createdAt.toLocaleDateString()}</small></span></div>) : <p className="empty-state">No announcements yet.</p>}</div></section></>;
}

function StudentDashboard({ student, announcements }: { student: { id: string; admissionNo: string; class: { name: string; section: string }; attendance: Array<{ status: "PRESENT" | "ABSENT" | "LEAVE" }>; marks: Array<{ marks: unknown; subject: { name: string }; examType: { name: string } }>; submissions: Array<{ homework: { title: string; deadline: Date } }>; payments: Array<{ amount: unknown; status: string; feeStructure: { name: string; dueDate: Date } }>; timetable: Array<{ dayOfWeek: number; startsAt: string; endsAt: string; room: string | null; subject: { name: string }; teacher: { user: { name: string } } }> } | null; announcements: Awaited<ReturnType<typeof recentAnnouncements>> }) {
  if (!student) return <DashboardHeading eyebrow="Student workspace" title="Profile not linked" subtitle="Your student profile has not been connected yet." action="Contact admin" href="/dashboard" />;
  const pendingFees = student.payments.filter((payment) => payment.status === "CREATED").length;
  return <><DashboardHeading eyebrow="Student workspace" title="Your academic overview" subtitle={`${student.class.name} / ${student.class.section} · Admission ${student.admissionNo}`} action="Open profile" href={`/dashboard/students/${student.id}`} /><section className="grid metrics"><Metric label="Attendance" value={`${attendancePercentage(student.attendance)}%`} tone="sage" /><Metric label="Assessments" value={student.marks.length} tone="blue" /><Metric label="Assignments" value={student.submissions.length} tone="gold" /><Metric label="Pending fees" value={pendingFees} tone="rose" /></section><section className="student-actions"><StudentAction href="/dashboard/marks" label="View result" icon={<ClipboardList size={18} />} /><StudentAction href={`/dashboard/students/${student.id}`} label="Download marksheet" icon={<ReceiptText size={18} />} /><StudentAction href="/dashboard/fees" label="Pay fee" icon={<CreditCard size={18} />} /><StudentAction href="/dashboard/fees" label="Fee receipts" icon={<ReceiptText size={18} />} /><StudentAction href="/dashboard/attendance" label="Check attendance" icon={<CalendarCheck2 size={18} />} /><StudentAction href="/dashboard/homework" label="Assignments" icon={<FileText size={18} />} /><StudentAction href="/dashboard/timetable" label="Exam schedule" icon={<BookOpen size={18} />} /><StudentAction href="/dashboard/timetable" label="View timetable" icon={<CalendarCheck2 size={18} />} /></section><section className="student-columns"><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Latest results</p><h2>Assessments</h2></div></div>{student.marks.length ? student.marks.map((mark, index) => <div className="role-row" key={`${mark.subject.name}-${index}`}><span><strong>{mark.subject.name}</strong><small>{mark.examType.name}</small></span><strong>{String(mark.marks)}</strong></div>) : <p className="empty-state">No assessments have been published yet.</p>}</div><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Today and next</p><h2>Timetable</h2></div></div>{student.timetable.length ? student.timetable.map((entry, index) => <div className="role-row" key={`${entry.subject.name}-${index}`}><span><strong>{entry.startsAt} - {entry.endsAt} · {entry.subject.name}</strong><small>{entry.teacher.user.name} · {entry.room ?? "Room TBA"}</small></span></div>) : <p className="empty-state">No timetable entries yet.</p>}</div></section><section className="student-columns"><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Finance</p><h2>Fee status</h2></div></div>{student.payments.length ? student.payments.map((payment, index) => <div className="role-row" key={`${payment.feeStructure.name}-${index}`}><span><strong>{payment.feeStructure.name}</strong><small>Due {payment.feeStructure.dueDate.toLocaleDateString()}</small></span><span className="record-status">₹{String(payment.amount)} · {payment.status}</span></div>) : <p className="empty-state">No fee records yet.</p>}</div><div className="panel role-list"><div className="section-heading"><div><p className="eyebrow">Campus updates</p><h2>Announcements</h2></div></div>{announcements.length ? announcements.map((item) => <div className="role-row" key={item.id}><span><strong>{item.title}</strong><small>{item.createdAt.toLocaleDateString()}</small></span></div>) : <p className="empty-state">No announcements yet.</p>}</div></section></>;
}

function StudentAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) { return <Link className="student-action" href={href}>{icon}<span>{label}</span><ArrowUpRight size={14} /></Link>; }

function DashboardHeading({ eyebrow, title, subtitle, action, href }: { eyebrow: string; title: string; subtitle: string; action: string; href: string }) { return <div className="topbar dashboard-heading"><div><p className="eyebrow">{eyebrow}</p><h1 className="title">{title}</h1><p className="subtitle">{subtitle}</p></div><div className="heading-actions"><Link className="button secondary" href={href}>{action}</Link></div></div>; }
function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) { return <div className="panel metric-card"><div className={`metric-icon ${tone}`} /><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">Current records</div></div>; }
function attendancePercentage(records: Array<{ status: "PRESENT" | "ABSENT" | "LEAVE" }>) { if (!records.length) return 0; return Math.round((records.filter((record) => record.status === "PRESENT").length / records.length) * 100); }
