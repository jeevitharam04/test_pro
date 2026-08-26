import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/shared/auth/password";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Password@123");

  const school = await prisma.school.upsert({
    where: { slug: "demo-public-school" },
    update: {},
    create: {
      name: "Demo Public School",
      slug: "demo-public-school",
      city: "Bengaluru",
      state: "Karnataka",
      subscriptionPlan: "starter",
      gradingConfig: {
        grades: [
          { grade: "A", min: 80 },
          { grade: "B", min: 60 },
          { grade: "C", min: 40 },
          { grade: "D", min: 0 }
        ]
      }
    }
  });

  const principal = await prisma.user.upsert({
    where: { email: "principal@demo.edu" },
    update: {},
    create: {
      schoolId: school.id,
      email: "principal@demo.edu",
      name: "Demo Principal",
      role: UserRole.PRINCIPAL,
      passwordHash
    }
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@demo.edu" },
    update: {},
    create: {
      schoolId: school.id,
      email: "teacher@demo.edu",
      name: "Ananya Sharma",
      role: UserRole.TEACHER,
      passwordHash
    }
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeCode: "T-1001"
    }
  });

  const additionalFaculty = [
    ["Dr. Kavitha Rao", "kavitha.rao@demo.edu", "T-1002"],
    ["Prof. Rahul Menon", "rahul.menon@demo.edu", "T-1003"],
    ["Dr. Sneha Iyer", "sneha.iyer@demo.edu", "T-1004"],
    ["Prof. Vivek Shah", "vivek.shah@demo.edu", "T-1005"],
    ["Dr. Priya Nair", "priya.nair@demo.edu", "T-1006"],
    ["Prof. Arvind Kumar", "arvind.kumar@demo.edu", "T-1007"],
    ["Dr. Meera Joshi", "meera.joshi@demo.edu", "T-1008"],
    ["Prof. Suresh Bhat", "suresh.bhat@demo.edu", "T-1009"],
    ["Dr. Neha Reddy", "neha.reddy@demo.edu", "T-1010"],
    ["Prof. Amit Verma", "amit.verma@demo.edu", "T-1011"]
  ] as const;

  const faculty = [teacher];
  for (const [name, email, employeeCode] of additionalFaculty) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { schoolId: school.id, email, name, role: UserRole.TEACHER, passwordHash }
    });
    faculty.push(await prisma.teacher.upsert({
      where: { userId: user.id },
      update: { employeeCode },
      create: { schoolId: school.id, userId: user.id, employeeCode }
    }));
  }

  const legacyClass = await prisma.class.findFirst({ where: { schoolId: school.id, name: "BCA", section: "Semester 1", deletedAt: null } });
  if (legacyClass) {
    await prisma.class.update({ where: { id: legacyClass.id }, data: { name: "Engineering", section: "CSE - Semester 1" } });
  }

  const classOne = await prisma.class.upsert({
    where: { schoolId_name_section: { schoolId: school.id, name: "Engineering", section: "CSE - Semester 1" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Engineering",
      section: "CSE - Semester 1",
      capacity: 45,
      classTeacherId: teacher.id
    }
  });

  const subject = await prisma.subject.upsert({
    where: { schoolId_classId_code: { schoolId: school.id, classId: classOne.id, code: "MATH8" } },
    update: {},
    create: {
      schoolId: school.id,
      classId: classOne.id,
      teacherId: teacher.id,
      name: "Programming Fundamentals",
      code: "CSE101"
    }
  });

  const academicBranches = [
    ["Engineering", "Core"],
    ["Engineering", "IT"],
    ["Core", "Telecommunication"],
    ["Core", "ECE"],
    ["Core", "ETE"],
    ["IT", "AI & ML"],
    ["IT", "CSE"],
    ["IT", "ISE"]
  ] as const;

  for (const [branchIndex, [name, section]] of academicBranches.entries()) {
    await prisma.class.upsert({
      where: { schoolId_name_section: { schoolId: school.id, name, section } },
      update: { classTeacherId: faculty[(branchIndex + 1) % faculty.length].id },
      create: { schoolId: school.id, name, section, capacity: 60, classTeacherId: faculty[(branchIndex + 1) % faculty.length].id }
    });
  }

  const branchClasses = await prisma.class.findMany({
    where: {
      schoolId: school.id,
      OR: [
        { name: "IT", section: "CSE" },
        { name: "IT", section: "AI & ML" },
        { name: "IT", section: "ISE" },
        { name: "Core", section: "ECE" },
        { name: "Core", section: "ETE" },
        { name: "Core", section: "Telecommunication" }
      ],
      deletedAt: null
    },
    orderBy: { section: "asc" }
  });
  const findBranch = (name: string, section: string) => branchClasses.find((classRecord) => classRecord.name === name && classRecord.section === section) ?? classOne;
  const studentCohorts = [
    classOne,
    findBranch("IT", "AI & ML"),
    findBranch("IT", "ISE"),
    findBranch("Core", "ECE"),
    findBranch("Core", "ETE"),
    findBranch("Core", "Telecommunication")
  ];

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@demo.edu" },
    update: {},
    create: {
      schoolId: school.id,
      email: "parent@demo.edu",
      name: "Ravi Kumar",
      role: UserRole.PARENT,
      passwordHash
    }
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: parentUser.id,
      relationship: "father"
    }
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@demo.edu" },
    update: {},
    create: {
      schoolId: school.id,
      email: "student@demo.edu",
      name: "Isha Kumar",
      role: UserRole.STUDENT,
      passwordHash
    }
  });

  const student = await prisma.student.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: "ADM-1001" } },
    update: {},
    create: {
      schoolId: school.id,
      userId: studentUser.id,
      classId: classOne.id,
      admissionNo: "ADM-1001",
      rollNo: "08"
    }
  });

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: {},
    create: {
      schoolId: school.id,
      parentId: parent.id,
      studentId: student.id
    }
  });

  const additionalStudents = [
    { name: "Arjun Mehta", email: "arjun.mehta@demo.edu", admissionNo: "ADM-1002", rollNo: "09", bloodGroup: "B+" },
    { name: "Meera Nair", email: "meera.nair@demo.edu", admissionNo: "ADM-1003", rollNo: "10", bloodGroup: "O+" },
    { name: "Kabir Singh", email: "kabir.singh@demo.edu", admissionNo: "ADM-1004", rollNo: "11", bloodGroup: "A+" },
    { name: "Diya Rao", email: "diya.rao@demo.edu", admissionNo: "ADM-1005", rollNo: "12", bloodGroup: "AB+" },
    { name: "Neel Joshi", email: "neel.joshi@demo.edu", admissionNo: "ADM-1006", rollNo: "13", bloodGroup: "O-" }
  ];

  const firstNames = ["Aarav", "Aditi", "Aditya", "Akshara", "Anika", "Anirudh", "Aryan", "Bhavna", "Charan", "Devika", "Dhruv", "Esha", "Gaurav", "Ishita", "Karan", "Kavya", "Krishna", "Lakshmi", "Manav", "Nandini", "Nikhil", "Pooja", "Pranav", "Rhea", "Rohan", "Sahana", "Sanjay", "Shreya", "Siddharth", "Sneha", "Tanvi", "Varun", "Vedant", "Vikram", "Yash", "Zoya"];
  const lastNames = ["Bhat", "Chandra", "Das", "Gowda", "Iyer", "Jain", "Kapoor", "Kulkarni", "Malik", "Menon", "Mishra", "Patel", "Pillai", "Reddy", "Shah", "Sharma", "Shetty", "Verma"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "O+", "O-"];
  for (let index = 0; index < 50; index += 1) {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    additionalStudents.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@demo.edu`,
      admissionNo: `ADM-${1007 + index}`,
      rollNo: String(14 + index).padStart(2, "0"),
      bloodGroup: bloodGroups[index % bloodGroups.length]
    });
  }

  for (const item of additionalStudents) {
    const additionalStudentUser = await prisma.user.upsert({
      where: { email: item.email },
      update: { name: item.name },
      create: {
        schoolId: school.id,
        email: item.email,
        name: item.name,
        role: UserRole.STUDENT,
        passwordHash
      }
    });

    const cohort = studentCohorts[Math.min(Math.floor((Number(item.admissionNo.slice(4)) - 1001) / 12), studentCohorts.length - 1)];
    await prisma.student.upsert({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: item.admissionNo } },
      update: { userId: additionalStudentUser.id, classId: cohort.id, rollNo: item.rollNo, bloodGroup: item.bloodGroup },
      create: {
        schoolId: school.id,
        userId: additionalStudentUser.id,
        classId: cohort.id,
        admissionNo: item.admissionNo,
        rollNo: item.rollNo,
        bloodGroup: item.bloodGroup
      }
    });
  }

  const seededStudents = await prisma.student.findMany({
    where: { schoolId: school.id, deletedAt: null },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { admissionNo: "asc" }
  });

  for (const seededStudent of seededStudents) {
    const parentEmail = `parent.${seededStudent.admissionNo.toLowerCase()}@demo.edu`;
    const parentUser = await prisma.user.upsert({
      where: { email: parentEmail },
      update: { name: `Parent of ${seededStudent.user?.name ?? seededStudent.admissionNo}` },
      create: {
        schoolId: school.id,
        email: parentEmail,
        name: `Parent of ${seededStudent.user?.name ?? seededStudent.admissionNo}`,
        role: UserRole.PARENT,
        passwordHash
      }
    });
    const seededParent = await prisma.parent.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: { schoolId: school.id, userId: parentUser.id, relationship: "guardian" }
    });
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: seededParent.id, studentId: seededStudent.id } },
      update: {},
      create: { schoolId: school.id, parentId: seededParent.id, studentId: seededStudent.id }
    });
  }

  const examType = await prisma.examType.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Term 1" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Term 1",
      maxMarks: 100
    }
  });

  await prisma.mark.upsert({
    where: {
      schoolId_studentId_subjectId_examTypeId: {
        schoolId: school.id,
        studentId: student.id,
        subjectId: subject.id,
        examTypeId: examType.id
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: classOne.id,
      studentId: student.id,
      subjectId: subject.id,
      examTypeId: examType.id,
      marks: 86,
      percentage: 86,
      grade: "A"
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId: school.id,
      actorUserId: principal.id,
      action: "seed.completed",
      entity: "School",
      entityId: school.id
    }
  });

  console.log("\nEduCore local demo credentials");
  console.log("Admin: principal@demo.edu / Password@123");
  console.log("Faculty: teacher@demo.edu / Password@123");
  console.log("Parent: parent@demo.edu / Password@123 (linked to ADM-1001)");
  console.log("Student: student@demo.edu / Password@123 (ADM-1001)");
  console.log("Additional students and parents: parent.adm-1002@demo.edu through parent.adm-1056@demo.edu / Password@123");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
