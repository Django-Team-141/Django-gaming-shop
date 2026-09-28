import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";

/** محتوای صفحه را فقط برای کاربر واردشده نمایش می‌دهد؛ در غیراین‌صورت دعوت به ورود. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">در حال بارگذاری...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-lg font-bold">برای ادامه باید وارد حساب کاربری‌ات شوی</p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-neon)" }}
        >
          ورود یا ثبت‌نام
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
