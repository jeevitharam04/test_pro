import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand">EduCore</div>
        <h1>One connected workspace for your campus.</h1>
        <p>
          Academics, attendance, assessments, fees, assignments, and campus communication
          stay organized by role and protected by your institution.
        </p>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">Campus access</p>
        <h2 className="title">Choose your portal</h2>
        <p className="subtitle">Sign in to the dashboard built for your role.</p>
        <LoginForm />
        <p>
          New school? <Link href="/signup">Create principal account</Link>
        </p>
      </section>
    </main>
  );
}
