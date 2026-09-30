import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman, formatDate } from "@/lib/format";
import { fetchOrders } from "@/lib/shop-api";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "سفارش‌های من | گیم‌گیر" }] }),
  component: OrdersPage,
});

function statusTone(status: string) {
  if (status === "paid" || status === "shipped" || status === "delivered") {
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
  if (status === "pending") {
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }
  if (status === "cancelled" || status === "failed") {
    return "bg-destructive/15 text-destructive border-destructive/30";
  }
  return "bg-muted text-muted-foreground border-border";
}

function OrdersPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">حساب کاربری</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            سفارش‌های من
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            وضعیت و جزئیات سفارش‌هایت را اینجا ببین.
          </p>
        </div>

        <RequireAuth>
          <OrdersBody />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrdersBody() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const orders = ordersQuery.data?.results ?? [];

  if (ordersQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel h-24 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center">
        <p className="text-2xl">!</p>
        <p className="mt-3 font-black">دریافت سفارش‌ها انجام نشد</p>
        <button
          type="button"
          onClick={() => void ordersQuery.refetch()}
          className="mt-4 rounded-xl border border-input px-5 py-2.5 text-sm font-bold hover:bg-accent"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="glass-panel relative overflow-hidden rounded-3xl p-10 text-center">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundImage: "var(--gradient-neon)" }}
        />
        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-4xl">
          📦
        </div>
        <h2 className="relative mt-6 text-2xl font-black">
          هنوز سفارشی نداری
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          وقتی اولین خریدت را ثبت کنی، اینجا نمایش داده می‌شود.
        </p>
        <Link
          to="/products"
          className="relative mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
          style={{
            backgroundImage: "var(--gradient-neon)",
            boxShadow: "var(--shadow-neon)",
          }}
        >
          شروع خرید
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to="/orders/$id"
          params={{ id: String(order.id) }}
          className="glass-panel flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black tracking-tight">
                {order.tracking_code}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone(order.status)}`}
              >
                {order.status_label}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(order.created_at)}
              {order.items?.length
                ? ` · ${order.items.length} قلم`
                : ""}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
            <p className="text-base font-black text-primary">
              {toman(order.grand_total)}
              <span className="ms-1 text-xs font-medium text-muted-foreground">
                تومان
              </span>
            </p>
            <span className="text-xs font-bold text-primary">جزئیات ←</span>
          </div>
        </Link>
      ))}
    </div>
  );
}