import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { ClassCreateForm } from "./class-create-form";

export default async function ClassesPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "classes", "read");

  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: session.schoolId, deletedAt: null },
      include: {
        classTeacher: {
          select: {
            id: true,
            user: { select: { name: true } }
          }
        },
        _count: { select: { students: true, subjects: true } }
      },
      orderBy: [{ name: "asc" }, { section: "asc" }]
    }),
    prisma.teacher.findMany({
      where: { schoolId: session.schoolId, deletedAt: null },
      select: {
        id: true,
        user: { select: { name: true } }
      },
      orderBy: { user: { name: "asc" } }
    })
  ]);

  const hierarchy = classes.reduce<Record<string, typeof classes>>((groups, classRecord) => {
    const group = classRecord.name === "Engineering" ? "Engineering" : classRecord.name;
    (groups[group] ??= []).push(classRecord);
    return groups;
  }, {});

  return (
    <>
      <div className="topbar">
        <div><p className="eyebrow">Academic setup</p><h1 className="title">Courses & branches</h1><p className="subtitle">Organize Engineering into Core and IT streams, then assign faculty to each branch.</p></div>
      </div>

      {session.role === "PRINCIPAL" ? <ClassCreateForm teachers={teachers} /> : null}

      <div className="academic-tree">
        {Object.entries(hierarchy).map(([group, groupClasses]) => <section className="tree-group" key={group}><div className="tree-root"><span className="tree-dot" />{group}</div><div className="tree-branches">{groupClasses.map((classRecord) => <article className="branch-card" key={classRecord.id}><div className="branch-line" /><div className="branch-content"><div><p className="eyebrow">{group === "Engineering" ? "Stream" : "Branch"}</p><h2>{classRecord.section}</h2><p>{classRecord._count.students} students <span className="dot">•</span> {classRecord._count.subjects} subjects</p></div><div className="faculty-assignment"><span>Assigned faculty</span><strong>{classRecord.classTeacher?.user.name ?? "Unassigned"}</strong><small>{classRecord.classTeacher?.user.name ? "Class coordinator" : "Select a teacher below"}</small></div></div></article>)}</div></section>)}
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-heading"><div><p className="eyebrow">Directory</p><h2>All course groups</h2></div></div>
        <table className="table">
          <thead>
            <tr>
              <th>Group / branch</th>
              <th>Capacity</th>
              <th>Class teacher</th>
              <th>Students</th>
              <th>Subjects</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((classRecord) => (
              <tr key={classRecord.id}>
                <td>
                  {classRecord.name} / {classRecord.section}
                </td>
                <td>{classRecord.capacity}</td>
                <td>{classRecord.classTeacher?.user.name ?? "Unassigned"}</td>
                <td>{classRecord._count.students}</td>
                <td>{classRecord._count.subjects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
