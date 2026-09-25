import { getPlanConfig, hasCapacityForPlan } from "./subscription.service";

describe("school subscription limits", () => {
  it("uses the expected starter, growth, and institution ceilings", () => {
    expect(getPlanConfig("starter")).toMatchObject({ maxStudents: 300, maxTeachers: 20, maxStorageGb: 10, monthlySms: 100 });
    expect(getPlanConfig("growth")).toMatchObject({ maxStudents: 800, maxTeachers: 50, maxStorageGb: 50, monthlySms: 500 });
    expect(getPlanConfig("institution")).toMatchObject({ maxStudents: Infinity, maxTeachers: Infinity, maxStorageGb: 200, monthlySms: Infinity });
  });

  it("blocks a student or teacher when the current school limit is reached", () => {
    expect(hasCapacityForPlan("starter", { students: 300, teachers: 10 }, "STUDENT")).toBe(false);
    expect(hasCapacityForPlan("starter", { students: 299, teachers: 10 }, "STUDENT")).toBe(true);
    expect(hasCapacityForPlan("starter", { students: 50, teachers: 20 }, "TEACHER")).toBe(false);
    expect(hasCapacityForPlan("growth", { students: 799, teachers: 10 }, "STUDENT")).toBe(true);
    expect(hasCapacityForPlan("institution", { students: 5000, teachers: 1000 }, "STUDENT")).toBe(true);
  });
});
