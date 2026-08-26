import { createClassSchema, createSubjectSchema } from "./classes";

describe("academic setup validation", () => {
  it("normalizes subject codes to uppercase", () => {
    expect(
      createSubjectSchema.parse({
        classId: "11111111-1111-4111-8111-111111111111",
        name: "Mathematics",
        code: "math9"
      }).code
    ).toBe("MATH9");
  });

  it("rejects impossible class capacity", () => {
    expect(() =>
      createClassSchema.parse({
        name: "Class 12",
        section: "A",
        capacity: 0
      })
    ).toThrow();
  });
});
