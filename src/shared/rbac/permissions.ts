import { UserRole } from "@prisma/client";

export const permissions = {
  school: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  users: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL]
  },
  classes: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER]
  },
  subjects: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER]
  },
  students: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  attendance: {
    manage: [UserRole.PRINCIPAL, UserRole.TEACHER],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  marks: {
    manage: [UserRole.PRINCIPAL, UserRole.TEACHER],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  fees: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.PARENT, UserRole.STUDENT]
  },
  homework: {
    manage: [UserRole.PRINCIPAL, UserRole.TEACHER],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  announcements: {
    manage: [UserRole.PRINCIPAL, UserRole.TEACHER],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  timetable: {
    manage: [UserRole.PRINCIPAL],
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  },
  reports: {
    read: [UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]
  }
} as const;

export type Resource = keyof typeof permissions;
export type Action<R extends Resource> = keyof (typeof permissions)[R];

export function can<R extends Resource>(role: UserRole, resource: R, action: Action<R>) {
  const allowedRoles = permissions[resource][action] as readonly UserRole[];
  return allowedRoles.includes(role);
}

export function assertPermission<R extends Resource>(
  role: UserRole,
  resource: R,
  action: Action<R>
) {
  if (!can(role, resource, action)) {
    const error = new Error("Forbidden");
    error.name = "ForbiddenError";
    throw error;
  }
}
