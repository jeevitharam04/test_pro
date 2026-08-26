import { AttendanceStatus } from "@prisma/client";
import { calculateAttendancePercentage } from "./attendance.service";

describe("calculateAttendancePercentage", () => {
  it("returns weighted percentage for present and leave records", () => {
    expect(
      calculateAttendancePercentage([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LEAVE },
        { status: AttendanceStatus.ABSENT }
      ])
    ).toBe(62.5);
  });

  it("returns zero when there are no records", () => {
    expect(calculateAttendancePercentage([])).toBe(0);
  });
});
