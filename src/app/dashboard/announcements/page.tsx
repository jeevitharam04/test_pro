import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { AnnouncementCreateForm } from "./announcement-create-form";

export default async function AnnouncementsPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "announcements", "read");
  const [announcements, classes] = await Promise.all([
    prisma.announcement.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.class.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, select: { id: true, name: true, section: true }, orderBy: [{ name: "asc" }, { section: "asc" }] })
  ]);
  return <><div className="topbar"><div><p className="eyebrow">Communication</p><h1 className="title">Announcements</h1><p className="subtitle">Publish campus, academic, examination, fee, and event updates to the right audience.</p></div></div>{session.role === "PRINCIPAL" ? <AnnouncementCreateForm classes={classes} /> : null}<div className="grid announcement-list">{announcements.map((item) => <article className="panel announcement-card" key={item.id}><div className="announcement-meta"><span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span><span>{item.category}</span><span>{item.audience}</span></div><h2>{item.title}</h2><p>{item.body}</p><p className="metric-label">Published {item.publishAt?.toLocaleString() ?? item.createdAt.toLocaleString()}{item.expiresAt ? ` · Expires ${item.expiresAt.toLocaleDateString()}` : ""}</p></article>)}</div></>;
}
