import { prisma } from "@/infrastructure/prisma/client";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { FeeCreateForm } from "./fee-create-form";

export default async function FeesPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "fees", "read");
  const [fees, classes] = await Promise.all([
    prisma.feeStructure.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, orderBy: { dueDate: "asc" } }),
    prisma.class.findMany({ where: { schoolId: session.schoolId, deletedAt: null }, select: { id: true, name: true, section: true }, orderBy: [{ name: "asc" }, { section: "asc" }] })
  ]);
  const classById = new Map(classes.map((classRecord) => [classRecord.id, `${classRecord.name} / ${classRecord.section}`]));
  return <><div className="topbar"><div><p className="eyebrow">Collections</p><h1 className="title">Fees & finance</h1><p className="subtitle">Create fee plans for a specific Engineering branch and track due dates.</p></div></div>{session.role === "PRINCIPAL" ? <FeeCreateForm classes={classes} /> : null}<div className="panel history-panel"><div className="section-heading"><div><p className="eyebrow">Fee plans</p><h2>Branch fee structures</h2></div></div><table className="table"><thead><tr><th>Name</th><th>Branch</th><th>Amount</th><th>Due date</th><th>Late fee</th><th>Discount</th></tr></thead><tbody>{fees.map((fee) => <tr key={fee.id}><td>{fee.name}</td><td>{fee.classId ? classById.get(fee.classId) ?? "Unknown branch" : "All branches"}</td><td>₹{fee.amount.toString()}</td><td>{fee.dueDate.toLocaleDateString()}</td><td>₹{fee.lateFee.toString()}</td><td>₹{fee.discount.toString()}</td></tr>)}</tbody></table></div></>;
}
