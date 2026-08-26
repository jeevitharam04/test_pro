import { getSchoolSummaryReport } from "@/modules/reports/report.service";
import { requireTenantSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export default async function ReportsPage() {
  const session = await requireTenantSession();
  assertPermission(session.role, "reports", "read");
  const report = await getSchoolSummaryReport(session.schoolId);
  return <><div className="topbar"><div><p className="eyebrow">Analytics</p><h1 className="title">Reports</h1></div></div><section className="grid metrics"><div className="panel"><div className="metric-label">Students</div><div className="metric-value">{report.students}</div></div><div className="panel"><div className="metric-label">Teachers</div><div className="metric-value">{report.teachers}</div></div><div className="panel"><div className="metric-label">Classes</div><div className="metric-value">{report.classes}</div></div><div className="panel"><div className="metric-label">Attendance</div><div className="metric-value">{report.attendancePercentage}%</div></div></section></>;
}
