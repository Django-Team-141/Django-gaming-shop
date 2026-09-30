import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { register as apiRegister, ApiError } from "@/lib/shop-api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "ثبت‌نام | گیم‌گیر" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    password_confirm: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiRegister(form);
      await login(form.email, form.password);
      toast.success("ثبت‌نام با موفقیت انجام شد.");
      void navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "ثبت‌نام انجام نشد. دوباره تلاش کن.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl">
          ✨
        </div>
        <h1 className="text-3xl font-black">ساخت حساب کاربری</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          قبلاً ثبت‌نام کردی؟{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            وارد شو
          </Link>
        </p>

        <form
          onSubmit={onSubmit}
          className="glass-panel mt-8 space-y-4 rounded-3xl p-6"
        >
          <Field label="نام و نام خانوادگی">
            <input
              required
              value={form.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="ایمیل">
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="شماره تماس">
            <input
              required
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="09xxxxxxxxx"
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="رمز عبور (حداقل ۱۰ کاراکتر)">
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="تکرار رمز عبور">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.password_confirm}
              onChange={(e) => setField("password_confirm", e.target.value)}
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl px-6 py-3 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              backgroundImage: "var(--gradient-neon)",
              boxShadow: "var(--shadow-neon)",
            }}
          >
            {pending ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}