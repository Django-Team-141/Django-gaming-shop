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

function OrdersPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-black">سفارش‌های من</h1>
        <RequireAuth>
          <OrdersBody />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrdersBody() {
  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders() });
  const orders = ordersQuery.data?.results ?? [];

  if (ordersQuery.isLoading) {
    return <p className="mt-12 text-center text-muted-foreground">در حال بارگذاری...</p>;
  }

  if (orders.length === 0) {
    return <p className="mt-12 text-center text-muted-foreground">هنوز سفارشی ثبت نکرده‌ای.</p>;
  }

  return (
    <div className="mt-8 space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to="/orders/$id"
          params={{ id: String(order.id) }}
          className="glass-panel flex items-center justify-between rounded-2xl p-4"
        >
          <div>
            <p className="text-sm font-bold">کد پیگیری: {order.tracking_code}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.created_at)} · {order.status_label}</p>
          </div>
          <p className="font-bold text-primary">{toman(order.grand_total)} تومان</p>
        </Link>
      ))}
    </div>
  );
}
