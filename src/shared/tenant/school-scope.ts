export function assertTenantAccess(sessionSchoolId: string | null | undefined, resourceSchoolId: string | null | undefined) {
  if (!sessionSchoolId || !resourceSchoolId || sessionSchoolId !== resourceSchoolId) {
    const error = new Error("School access denied");
    error.name = "TenantAccessError";
    throw error;
  }
}
