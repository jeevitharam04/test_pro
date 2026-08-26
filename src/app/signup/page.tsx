import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand">EduCare</div>
        <h1>Start a school workspace with strict tenant isolation.</h1>
        <p>
          The first user becomes principal and can invite teachers, parents, and
          students into the school boundary.
        </p>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">School setup</p>
        <h2 className="title">Create account</h2>
        <SignupForm />
        <p>
          Already onboarded? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
