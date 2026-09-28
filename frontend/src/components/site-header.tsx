import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { fetchCart, isLoggedIn } from "@/lib/shop-api";

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

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/products", search: { search: term || undefined } });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-base font-black text-primary-foreground">
            G
          </span>
          <span className="text-lg font-extrabold tracking-tight">گیم‌گیر</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link className="transition-colors hover:text-foreground" to="/products">
            محصولات
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/">
            صفحه اصلی
          </Link>
          {user && (
            <Link className="transition-colors hover:text-foreground" to="/panel">
              پنل فروشنده
            </Link>
          )}
        </nav>

        <form onSubmit={submitSearch} className="ms-auto hidden items-center rounded-full border border-input bg-muted/40 px-3 py-2 sm:flex">
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جست‌وجوی محصول..."
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-56"
          />
          <button type="submit" className="text-muted-foreground" aria-label="جست‌وجو">
            ⌕
          </button>
        </form>

        <Link
          to="/cart"
          className="relative rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          سبد خرید
          {cartCount > 0 && (
            <span className="absolute -top-2 -left-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Link>

        <div className="relative">
          {user ? (
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              {user.full_name || user.email.split("@")[0]}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              ورود
            </Link>
          )}

          {user && menuOpen && (
            <div className="absolute left-0 top-12 w-44 rounded-xl border border-border bg-popover p-2 text-sm shadow-lg">
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
              <button
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
