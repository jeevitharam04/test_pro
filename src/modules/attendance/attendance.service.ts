import { AttendanceStatus } from "@prisma/client";

export function calculateAttendancePercentage(
  records: Array<{ status: AttendanceStatus }>,
  config: { presentAdditionPercent?: number; absentDeductionPercent?: number; leavePercentChange?: number } = {}
) {
  if (records.length === 0) {
    return 0;
  }

  const present = records.filter((record) => record.status === AttendanceStatus.PRESENT).length;
  const leave = records.filter((record) => record.status === AttendanceStatus.LEAVE).length;
  const basePercentage = (present / records.length) * 100;
  const adjustment =
    ((present * (config.presentAdditionPercent ?? 0)) -
      (records.length - present - leave) * (config.absentDeductionPercent ?? 0) +
      leave * (config.leavePercentChange ?? 0)) /
    records.length;

  return Number(Math.min(100, Math.max(0, basePercentage + adjustment)).toFixed(2));
}
