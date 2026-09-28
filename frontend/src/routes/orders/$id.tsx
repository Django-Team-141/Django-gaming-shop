import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman, formatDate } from "@/lib/format";
import { fetchOrder } from "@/lib/shop-api";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

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
  const orderQuery = useQuery({ queryKey: ["order", id], queryFn: ({ signal }) => fetchOrder(id, signal) });
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return <p className="mt-12 text-center text-muted-foreground">در حال بارگذاری...</p>;
  }
  if (!order) {
    return <p className="mt-12 text-center text-muted-foreground">سفارش پیدا نشد.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-black">سفارش {order.tracking_code}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatDate(order.created_at)} · وضعیت: {order.status_label}
      </p>

      <div className="mt-6 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="glass-panel flex items-center justify-between rounded-2xl p-4 text-sm">
            <span>{item.product_name} × {item.quantity}</span>
            <span className="font-bold">{toman(item.line_total)} تومان</span>
          </div>
        ))}
      </div>

      <div className="glass-panel mt-4 space-y-1 rounded-2xl p-5 text-sm">
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
        <div className="flex justify-between font-bold">
          <span>مبلغ نهایی</span>
          <span>{toman(order.grand_total)} تومان</span>
        </div>
      </div>
    </div>
  );
}
