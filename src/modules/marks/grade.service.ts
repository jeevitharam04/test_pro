export function calculateGrade(percentage: number) {
  if (percentage >= 80) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 40) return "C";
  return "D";
}

export function calculatePercentage(marks: number, maxMarks: number) {
  if (marks > maxMarks) {
    throw new Error("marks must be less than or equal to max marks");
  }

  return Number(((marks / maxMarks) * 100).toFixed(2));
}
