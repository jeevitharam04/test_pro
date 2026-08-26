import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export default async function HomeworkPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "homework", "read");
  const homework = await prisma.homework.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, include: { class: true, subject: true, _count: { select: { submissions: true } } }, orderBy: { deadline: "asc" }, take: 100 });
  return <><div className="topbar"><div><p className="eyebrow">Assignments</p><h1 className="title">Homework</h1></div></div><div className="panel"><table className="table"><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Deadline</th><th>Submissions</th></tr></thead><tbody>{homework.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.class.name} {item.class.section}</td><td>{item.subject.name}</td><td>{item.deadline.toLocaleDateString()}</td><td>{item._count.submissions}</td></tr>)}</tbody></table></div></>;
}
