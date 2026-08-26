import Link from "next/link";
import { ArrowLeft, CalendarCheck2, ClipboardList, CreditCard, HeartPulse, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/prisma/client";
import { calculateAttendancePercentage } from "@/modules/attendance/attendance.service";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

type Props = { params: Promise<{ id: string }> };

export default async function StudentProfilePage({ params }: Props) {
  const session = await requireTenantSession();
  assertPermission(session.role, "students", "read");
  const { id } = await params;
  const accessFilter = session.role === "PRINCIPAL"
    ? {}
    : session.role === "STUDENT"
      ? { userId: session.userId }
      : session.role === "PARENT"
        ? { parents: { some: { parent: { userId: session.userId } } } }
        : { class: { classTeacher: { userId: session.userId } } };
  const student = await prisma.student.findFirst({
    where: { schoolId: session.schoolId, deletedAt: null, ...accessFilter, OR: [{ id }, { admissionNo: id }] },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      class: { include: { classTeacher: { include: { user: { select: { name: true, email: true } } } } } },
      parents: { include: { parent: { include: { user: { select: { name: true, email: true, phone: true } } } } } },
      attendance: { where: { deletedAt: null }, include: { subject: { select: { name: true } } }, orderBy: { markedOn: "desc" }, take: 12 },
      marks: { where: { deletedAt: null }, include: { subject: { select: { name: true } }, examType: { select: { name: true, maxMarks: true } } }, orderBy: { updatedAt: "desc" }, take: 12 },
      submissions: { where: { deletedAt: null }, include: { homework: { select: { title: true, deadline: true, subject: { select: { name: true } } } } }, orderBy: { updatedAt: "desc" }, take: 8 },
      payments: { where: { deletedAt: null }, include: { feeStructure: { select: { name: true, dueDate: true } } }, orderBy: { createdAt: "desc" }, take: 8 }
    }
  });
  if (!student) notFound();

  const attendancePercentage = calculateAttendancePercentage(student.attendance);
  const fullName = student.user?.name ?? "Profile pending";
  return <>
    <div className="topbar profile-heading"><div><Link className="back-link" href="/dashboard/students"><ArrowLeft size={15} /> Students</Link><p className="eyebrow">Student profile</p><h1 className="title">{fullName}</h1><p className="subtitle">Student ID: <strong>{student.id}</strong></p></div></div>
    <section className="profile-hero panel"><div className="profile-avatar">{fullName.slice(0, 1).toUpperCase()}</div><div className="profile-identity"><h2>{fullName}</h2><p>{student.class.name} {student.class.section} <span className="dot">•</span> Admission {student.admissionNo}</p><div className="profile-tags"><span>Roll {student.rollNo ?? "-"}</span><span>{student.user?.email ?? "No email"}</span></div></div><div className="profile-rate"><span>Attendance</span><strong>{attendancePercentage}%</strong><div className="progress"><span style={{ width: `${attendancePercentage}%` }} /></div></div></section>
    <section className="profile-grid"><div className="profile-main"><ProfileSection icon={<HeartPulse size={18} />} title="Personal & medical information"><div className="detail-grid"><Detail label="Full name" value={fullName} /><Detail label="Date of birth" value={student.dateOfBirth?.toLocaleDateString() ?? "Not provided"} /><Detail label="Blood group" value={student.bloodGroup ?? "Not provided"} /><Detail label="Phone" value={student.user?.phone ?? "Not provided"} /><Detail label="Email" value={student.user?.email ?? "Not provided"} /><Detail label="Admission number" value={student.admissionNo} /></div></ProfileSection><ProfileSection icon={<CalendarCheck2 size={18} />} title="Attendance history"><div className="mini-list">{student.attendance.length ? student.attendance.map((record) => <div className="mini-row" key={record.id}><span>{record.markedOn.toLocaleDateString()} {record.subject ? `• ${record.subject.name}` : ""}</span><Status value={record.status} /></div>) : <Empty text="No attendance records yet" />}</div></ProfileSection><ProfileSection icon={<ClipboardList size={18} />} title="Marks & assessments"><div className="mini-list">{student.marks.length ? student.marks.map((mark) => <div className="mini-row" key={mark.id}><span><strong>{mark.subject.name}</strong><small>{mark.examType.name} · Max {mark.examType.maxMarks}</small></span><span className="score">{mark.marks.toString()} <b>{mark.grade}</b></span></div>) : <Empty text="No marks recorded yet" />}</div></ProfileSection></div><aside className="profile-side"><ProfileSection icon={<Users size={18} />} title="Parent / guardian">{student.parents.length ? student.parents.map(({ parent }) => <div className="contact-card" key={parent.id}><strong>{parent.user.name}</strong><span>{parent.relationship}</span><small>{parent.user.phone ?? parent.user.email}</small></div>) : <Empty text="No guardian linked" />}<div className="class-teacher"><span>Class teacher</span><strong>{student.class.classTeacher?.user.name ?? "Not assigned"}</strong><small>{student.class.classTeacher?.user.email ?? ""}</small></div></ProfileSection><ProfileSection icon={<CreditCard size={18} />} title="Fee payments"><div className="mini-list">{student.payments.length ? student.payments.map((payment) => <div className="mini-row" key={payment.id}><span>{payment.feeStructure.name}<small>{payment.createdAt.toLocaleDateString()}</small></span><Status value={payment.status} /></div>) : <Empty text="No payments recorded yet" />}</div></ProfileSection><ProfileSection icon={<ClipboardList size={18} />} title="Homework"><div className="mini-list">{student.submissions.length ? student.submissions.map((submission) => <div className="mini-row" key={submission.id}><span>{submission.homework.title}<small>{submission.homework.subject.name} · Due {submission.homework.deadline.toLocaleDateString()}</small></span><Status value={submission.status} /></div>) : <Empty text="No homework submissions yet" />}</div></ProfileSection></aside></section>
  </>;
}

function ProfileSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <section className="panel profile-section"><div className="profile-section-title"><span>{icon}</span><h2>{title}</h2></div>{children}</section>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><span>{label}</span><strong>{value}</strong></div>; }
function Status({ value }: { value: string }) { return <span className={`record-status ${value.toLowerCase()}`}>{value.replaceAll("_", " ")}</span>; }
function Empty({ text }: { text: string }) { return <p className="empty-state">{text}</p>; }
