import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export default async function TimetablePage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "timetable", "read");
  const entries = await prisma.timetableEntry.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, include: { class: true, subject: true, teacher: { include: { user: true } } }, orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }] });
  return <><div className="topbar"><div><p className="eyebrow">Schedule</p><h1 className="title">Timetable</h1></div></div><div className="panel"><table className="table"><thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Subject</th><th>Teacher</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.dayOfWeek}</td><td>{entry.startsAt}-{entry.endsAt}</td><td>{entry.class.name} {entry.class.section}</td><td>{entry.subject.name}</td><td>{entry.teacher.user.name}</td></tr>)}</tbody></table></div></>;
}
