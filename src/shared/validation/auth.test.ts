import { forgotPasswordSchema, resetPasswordSchema } from "./auth";

describe("password reset validation", () => {
  it("normalizes reset request email addresses", () => {
    expect(forgotPasswordSchema.parse({ email: "Parent@School.test" }).email).toBe("parent@school.test");
  });

  it("requires a sufficiently long reset token and password", () => {
    expect(() => resetPasswordSchema.parse({ token: "short", password: "password" })).toThrow();
    expect(resetPasswordSchema.parse({ token: "a".repeat(64), password: "new-password" })).toEqual({
      token: "a".repeat(64),
      password: "new-password"
    });
  });
});