import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export default async function MarksPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "marks", "read");
  const marks = await prisma.mark.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, include: { student: { include: { user: true } }, subject: true, examType: true }, orderBy: { updatedAt: "desc" }, take: 100 });
  return <><div className="topbar"><div><p className="eyebrow">Assessments</p><h1 className="title">Marks</h1></div></div><div className="panel"><table className="table"><thead><tr><th>Student</th><th>Subject</th><th>Exam</th><th>Marks</th><th>Grade</th></tr></thead><tbody>{marks.map((mark) => <tr key={mark.id}><td>{mark.student.user?.name ?? mark.student.admissionNo}</td><td>{mark.subject.name}</td><td>{mark.examType.name}</td><td>{mark.marks.toString()}</td><td>{mark.grade}</td></tr>)}</tbody></table></div></>;
}
