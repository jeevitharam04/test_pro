import Link from "next/link";
import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { StudentCreateForm } from "./student-create-form";
import { StudentSearch } from "./student-search";

export default async function StudentsPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "students", "read");
  const studentFilter = session.role === "PRINCIPAL"
    ? {}
    : session.role === "STUDENT"
      ? { userId: session.userId }
      : session.role === "PARENT"
        ? { parents: { some: { parent: { userId: session.userId } } } }
        : { class: { classTeacher: { userId: session.userId } } };
  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: session.schoolId, deletedAt: null, ...studentFilter },
      include: { user: true, class: true },
      orderBy: [{ class: { name: "asc" } }, { rollNo: "asc" }]
    }),
    prisma.class.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <div className="topbar"><div><p className="eyebrow">Enrollment</p><h1 className="title">Students</h1><p className="subtitle">Search any student to view their complete academic and family record.</p></div></div>
      {session.role === "PRINCIPAL" || session.role === "TEACHER" ? <StudentSearch /> : null}
      {session.role === "PRINCIPAL" ? <StudentCreateForm classes={classes} /> : null}
      <div className="panel" style={{ marginTop: 16 }}>
        <table className="table"><thead><tr><th>Student</th><th>Unique ID</th><th>Admission</th><th>Class</th><th>Roll</th></tr></thead>
          <tbody>{students.map((student) => <tr key={student.id}><td><Link className="table-primary" href={`/dashboard/students/${student.id}`}>{student.user?.name ?? "Profile pending"}</Link></td><td><Link className="student-id" href={`/dashboard/students/${student.id}`}>{student.id.slice(0, 8)}...</Link></td><td>{student.admissionNo}</td><td>{student.class.name} {student.class.section}</td><td>{student.rollNo ?? "-"}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
