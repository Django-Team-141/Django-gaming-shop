import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman, formatDate } from "@/lib/format";
import {
  fetchOrder,
  processPayment,
  ApiError,
  type Order,
} from "@/lib/shop-api";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: "جزئیات سفارش | گیم‌گیر" }] }),
  component: OrderDetailPage,
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

function OrderDetailPage() {
  const { id } = Route.useParams();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <RequireAuth>
          <OrderBody id={Number(id)} />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrderBody({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: ({ signal }) => fetchOrder(id, signal),
  });

  const order = orderQuery.data;

  async function handlePay(simulateSuccess: boolean) {
    setPaying(true);
    try {
      const result = await processPayment({
        order_id: id,
        simulate_success: simulateSuccess,
      });
      toast.success(result.detail || "وضعیت پرداخت به‌روز شد.");
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "پرداخت انجام نشد.",
      );
    } finally {
      setPaying(false);
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-panel h-24 animate-pulse rounded-3xl" />
        <div className="glass-panel h-40 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="text-4xl">📦</p>
        <p className="mt-4 font-bold">سفارش پیدا نشد</p>
        <Link
          to="/orders"
          className="mt-4 inline-block text-sm font-bold text-primary"
        >
          بازگشت به لیست سفارش‌ها
        </Link>
      </div>
    );
  }

  const payments = (order as Order & { payments?: Array<{
    id: number;
    amount: number;
    status: string;
    status_label: string;
    reference_id: string | null;
    gateway: string;
    created_at: string;
  }> }).payments ?? [];

  const latestPayment = payments[0];
  const canPay = order.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">جزئیات سفارش</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {order.tracking_code}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(order.status)}`}
        >
          {order.status_label}
        </span>
      </div>

      {/* نوار مراحل سفارش */}
      <div className="glass-panel rounded-3xl p-5">
        <p className="text-xs font-bold text-muted-foreground">وضعیت جریان</p>
        <div className="mt-4 flex justify-between gap-2 text-center text-[11px]">
          {[
            { key: "pending", label: "ثبت" },
            { key: "paid", label: "پرداخت" },
            { key: "shipped", label: "ارسال" },
            { key: "delivered", label: "تحویل" },
          ].map((step, index, arr) => {
            const orderKeys = ["pending", "paid", "shipped", "delivered"];
            const currentIdx = orderKeys.indexOf(order.status);
            const stepIdx = index;
            const active = currentIdx >= stepIdx && currentIdx !== -1;
            const isCancelled =
              order.status === "cancelled" || order.status === "failed";
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <span
                  className={
                    active && !isCancelled
                      ? "grid h-8 w-8 place-items-center rounded-full text-xs font-black text-primary-foreground"
                      : "grid h-8 w-8 place-items-center rounded-full border border-border text-xs text-muted-foreground"
                  }
                  style={
                    active && !isCancelled
                      ? { backgroundImage: "var(--gradient-neon)" }
                      : undefined
                  }
                >
                  {index + 1}
                </span>
                <span className="mt-2 font-bold">{step.label}</span>
                {index < arr.length - 1 ? null : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* اقلام */}
      <section className="space-y-2">
        <h2 className="text-sm font-black">اقلام سفارش</h2>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="glass-panel flex items-center justify-between rounded-2xl p-4 text-sm"
          >
            <div>
              <p className="font-bold">{item.product_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.quantity} × {toman(item.unit_price)} تومان
              </p>
            </div>
            <span className="font-black text-primary">
              {toman(item.line_total)}
            </span>
          </div>
        ))}
      </section>

      {/* جمع */}
      <section className="glass-panel space-y-2 rounded-3xl p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">جمع کالاها</span>
          <span>{toman(order.items_total)} تومان</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-primary">
            <span>تخفیف</span>
            <span>−{toman(order.discount_total)} تومان</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">ارسال</span>
          <span>{toman(order.shipping_cost)} تومان</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-black">
          <span>مبلغ نهایی</span>
          <span className="text-primary">
            {toman(order.grand_total)} تومان
          </span>
        </div>
      </section>

      {/* پرداخت */}
      <section className="glass-panel rounded-3xl p-5">
        <h2 className="text-sm font-black">پرداخت (Mock Gateway)</h2>

        {latestPayment && (
          <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">وضعیت</span>
              <span className="font-bold">{latestPayment.status_label}</span>
            </div>
            {latestPayment.reference_id && (
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">کد پیگیری</span>
                <span className="font-mono text-xs">
                  {latestPayment.reference_id}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">درگاه</span>
              <span>{latestPayment.gateway}</span>
            </div>
          </div>
        )}

        {canPay ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              disabled={paying}
              onClick={() => handlePay(true)}
              className="rounded-xl px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-neon)" }}
            >
              {paying ? "..." : "✓ شبیه‌سازی پرداخت موفق"}
            </button>
            <button
              disabled={paying}
              onClick={() => handlePay(false)}
              className="rounded-xl border border-destructive/40 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              {paying ? "..." : "✗ شبیه‌سازی پرداخت ناموفق"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            این سفارش دیگر در وضعیت قابل پرداخت نیست.
          </p>
        )}
      </section>

      <Link
        to="/orders"
        className="inline-block text-sm font-bold text-primary hover:underline"
      >
        ← همه سفارش‌ها
      </Link>
    </div>
  );
}