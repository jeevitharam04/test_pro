import { assertTenantAccess } from "./school-scope";

describe("tenant access checks", () => {
  it("allows the matching school id", () => {
    expect(() => assertTenantAccess("school-a", "school-a")).not.toThrow();
  });

  it("rejects cross-school access", () => {
    expect(() => assertTenantAccess("school-a", "school-b")).toThrow("School access denied");
  });
});
