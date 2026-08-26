import { calculateGrade, calculatePercentage } from "./grade.service";

describe("marks grading", () => {
  it("calculates the default grade bands", () => {
    expect(calculateGrade(86)).toBe("A");
    expect(calculateGrade(65)).toBe("B");
    expect(calculateGrade(45)).toBe("C");
    expect(calculateGrade(32)).toBe("D");
  });

  it("rejects marks above the configured maximum", () => {
    expect(() => calculatePercentage(101, 100)).toThrow("marks must be less than or equal to max marks");
  });
});
