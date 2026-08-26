import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { TeacherCreateForm } from "./teacher-create-form";

export default async function UsersPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "users", "read");

  const users = await prisma.user.findMany({
    where: { schoolId: session.schoolId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true
    }
  });

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">Access control</p>
          <h1 className="title">Users</h1>
        </div>
      </div>
      {session.role === "PRINCIPAL" ? <TeacherCreateForm /> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.lastLoginAt ? user.lastLoginAt.toLocaleString() : "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
