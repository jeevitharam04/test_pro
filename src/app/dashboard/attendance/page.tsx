import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { AttendanceMarkForm } from "./attendance-mark-form";

export default async function AttendancePage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "attendance", "read");
  const attendanceScope = session.role === "PRINCIPAL"
    ? {}
    : session.role === "TEACHER"
      ? { class: { classTeacher: { userId: session.userId } } }
      : session.role === "PARENT"
        ? { student: { parents: { some: { parent: { userId: session.userId } } } } }
        : { student: { userId: session.userId } };
  const [records, classes] = await Promise.all([
    prisma.attendance.findMany({
      where: { schoolId: session.schoolId, deletedAt: null, ...attendanceScope },
      include: { student: { include: { user: true } }, class: true, subject: true },
      orderBy: { markedOn: "desc" },
      take: 100
    }),
    prisma.class.findMany({
      where: { schoolId: session.schoolId, deletedAt: null, ...(session.role === "TEACHER" ? { classTeacher: { userId: session.userId } } : {}) },
      orderBy: [{ name: "asc" }, { section: "asc" }],
      include: { students: { where: { deletedAt: null }, include: { user: { select: { name: true } } }, orderBy: { rollNo: "asc" } } }
    })
  ]);
  const classOptions = classes.map((classRecord) => ({ id: classRecord.id, name: classRecord.name, section: classRecord.section, students: classRecord.students.map((student) => ({ id: student.id, name: student.user?.name ?? "Profile pending", admissionNo: student.admissionNo, rollNo: student.rollNo })) }));
  return <><div className="topbar"><div><p className="eyebrow">{session.role === "TEACHER" ? "Daily register" : "Attendance overview"}</p><h1 className="title">Attendance</h1><p className="subtitle">{session.role === "TEACHER" ? "Take attendance for your assigned courses and keep families informed." : "Monitor attendance trends, history, and low-attendance learners."}</p></div></div>{session.role === "TEACHER" ? <AttendanceMarkForm classes={classOptions} /> : null}<ModuleTable title="Recent activity" eyebrow="History" headers={["Student", "Class", "Status", "Date"]} rows={records.map((record) => [record.student.user?.name ?? record.student.admissionNo, `${record.class.name} ${record.class.section}`, record.status, record.markedOn.toLocaleDateString()])} /></>;
}

function ModuleTable({ title, eyebrow, headers, rows }: { title: string; eyebrow: string; headers: string[]; rows: string[][] }) {
  return <div className="panel history-panel"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div><table className="table"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
