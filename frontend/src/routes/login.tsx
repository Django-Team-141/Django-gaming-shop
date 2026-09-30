import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/shop-api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ورود | گیم‌گیر" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email, password);
      toast.success("خوش آمدی!");
      void navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "ورود انجام نشد. دوباره تلاش کن.",
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
          🎮
        </div>
        <h1 className="text-3xl font-black">ورود به حساب</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          هنوز حساب نساختی؟{" "}
          <Link to="/register" className="font-bold text-primary hover:underline">
            ثبت‌نام کن
          </Link>
        </p>

        <form
          onSubmit={onSubmit}
          className="glass-panel mt-8 space-y-4 rounded-3xl p-6"
        >
          <div>
            <label className="text-sm font-bold">ایمیل</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold">رمز عبور</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

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
            {pending ? "در حال ورود..." : "ورود"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}