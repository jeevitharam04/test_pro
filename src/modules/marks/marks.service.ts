import { prisma } from "@/infrastructure/prisma/client";
import { calculateGrade, calculatePercentage } from "./grade.service";

export function listExamTypes(schoolId: string) {
  return prisma.examType.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: "asc" } });
}

export function createExamType(
  schoolId: string,
  input: { name: string; maxMarks: number; weightage?: number }
) {
  return prisma.examType.create({ data: { schoolId, ...input } });
}

export async function upsertMarks(
  schoolId: string,
  input: {
    classId: string;
    subjectId: string;
    examTypeId: string;
    records: Array<{ studentId: string; marks: number; remarks?: string }>;
  }
) {
  const examType = await prisma.examType.findFirstOrThrow({
    where: { id: input.examTypeId, schoolId, deletedAt: null }
  });

  return prisma.$transaction(
    input.records.map((record) => {
      const percentage = calculatePercentage(record.marks, examType.maxMarks);
      return prisma.mark.upsert({
        where: {
          schoolId_studentId_subjectId_examTypeId: {
            schoolId,
            studentId: record.studentId,
            subjectId: input.subjectId,
            examTypeId: input.examTypeId
          }
        },
        update: {
          marks: record.marks,
          percentage,
          grade: calculateGrade(percentage),
          remarks: record.remarks
        },
        create: {
          schoolId,
          classId: input.classId,
          studentId: record.studentId,
          subjectId: input.subjectId,
          examTypeId: input.examTypeId,
          marks: record.marks,
          percentage,
          grade: calculateGrade(percentage),
          remarks: record.remarks
        }
      });
    })
  );
}

export function listMarks(schoolId: string, filters: { classId?: string; studentId?: string }) {
  return prisma.mark.findMany({
    where: { schoolId, classId: filters.classId, studentId: filters.studentId, deletedAt: null },
    include: {
      student: { include: { user: { select: { name: true } } } },
      subject: { select: { name: true } },
      examType: { select: { name: true, maxMarks: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 200
  });
}
