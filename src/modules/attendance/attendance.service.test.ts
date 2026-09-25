import { AttendanceStatus } from "@prisma/client";
import { calculateAttendancePercentage } from "./attendance.service";

describe("calculateAttendancePercentage", () => {
  it("uses configured adjustments and does not treat leave as half credit", () => {
    expect(
      calculateAttendancePercentage([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LEAVE },
        { status: AttendanceStatus.ABSENT }
      ], { presentAdditionPercent: 2, absentDeductionPercent: 2, leavePercentChange: 0 })
    ).toBe(50.5);
  });

  it("clamps adjusted percentages to the valid range", () => {
    expect(calculateAttendancePercentage([{ status: AttendanceStatus.PRESENT }], { presentAdditionPercent: 10 })).toBe(100);
    expect(calculateAttendancePercentage([{ status: AttendanceStatus.ABSENT }], { absentDeductionPercent: 10 })).toBe(0);
  });

  it("returns zero when there are no records", () => {
    expect(calculateAttendancePercentage([])).toBe(0);
  });
});
