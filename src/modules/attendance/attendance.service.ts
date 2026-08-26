import { AttendanceStatus } from "@prisma/client";

export function calculateAttendancePercentage(records: Array<{ status: AttendanceStatus }>) {
  if (records.length === 0) {
    return 0;
  }

  const present = records.filter((record) => record.status === AttendanceStatus.PRESENT).length;
  const leave = records.filter((record) => record.status === AttendanceStatus.LEAVE).length;
  const weighted = present + leave * 0.5;

  return Number(((weighted / records.length) * 100).toFixed(2));
}
