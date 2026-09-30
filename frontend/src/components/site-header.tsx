import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { fetchCart, isLoggedIn } from "@/lib/shop-api";

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const dateText = now.toLocaleDateString("fa-IR", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeText = now.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className="hidden flex-col items-start leading-tight lg:flex"
      title="تاریخ و ساعت سیستم"
    >
      <span className="text-[11px] font-bold text-muted-foreground">
        {dateText}
      </span>
      <span className="font-mono text-xs font-black text-primary">
        {timeText}
      </span>
    </div>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const cartQuery = useQuery({
    queryKey: ["cart-count"],
    queryFn: () => fetchCart(),
    enabled: isLoggedIn(),
    staleTime: 15_000,
    retry: false,
  });
  const cartCount = cartQuery.data?.items_count ?? 0;

  function submitSearch(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({
      to: "/products",
      search: { search: term || undefined },
    });
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-base font-black text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-neon)" }}
          >
            🎮
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            گیم‌گیر
          </span>
        </Link>

        <LiveDateTime />

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link
            className="transition-colors hover:text-foreground"
            to="/products"
          >
            محصولات
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/">
            صفحه اصلی
          </Link>
          {user && (
            <Link
              className="transition-colors hover:text-foreground"
              to="/panel"
            >
              پنل فروشنده
            </Link>
          )}
          {user && (
            <Link
              className="transition-colors hover:text-foreground"
              to="/orders"
            >
              سفارش‌ها
            </Link>
          )}
        </nav>

        <form
          onSubmit={submitSearch}
          className="ms-auto hidden items-center rounded-full border border-input bg-muted/40 px-3 py-2 sm:flex"
        >
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جست‌وجوی محصول..."
            className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-52"
          />
          <button
            type="submit"
            className="text-muted-foreground"
            aria-label="جست‌وجو"
          >
            ⌕
          </button>
        </form>

        <Link
          to="/cart"
          className="relative rounded-full border border-input px-3 py-2 text-sm font-bold transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground md:px-4"
        >
          سبد
          {cartCount > 0 && (
            <span
              className="absolute -top-2 -left-2 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-neon)" }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        <div className="relative">
          {user ? (
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full border border-input px-3 py-2 text-sm font-bold transition-colors hover:bg-accent md:px-4"
            >
              {user.full_name || user.email.split("@")[0]}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-black text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-neon)" }}
            >
              ورود
            </Link>
          )}

          {user && menuOpen && (
            <div className="absolute left-0 top-12 z-50 w-48 rounded-xl border border-border bg-popover p-2 text-sm shadow-lg">
              <Link
                to="/panel"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 hover:bg-accent"
              >
                پنل فروشنده
              </Link>
              <Link
                to="/orders"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 hover:bg-accent"
              >
                سفارش‌های من
              </Link>
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 hover:bg-accent md:hidden"
              >
                محصولات
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout().then(() => {
                    queryClient.removeQueries({ queryKey: ["cart-count"] });
                    queryClient.removeQueries({ queryKey: ["cart"] });
                    void navigate({ to: "/" });
                  });
                }}
                className="block w-full rounded-lg px-3 py-2 text-right text-destructive hover:bg-accent"
              >
                خروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}