import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman } from "@/lib/format";
import {
  deleteMyProduct,
  fetchMyProducts,
  mediaUrl,
  ApiError,
  type ProductStatus,
  type SellerProduct,
} from "@/lib/shop-api";

export const Route = createFileRoute("/panel/")({
  head: () => ({ meta: [{ title: "پنل فروشنده | گیم‌گیر" }] }),
  component: PanelPage,
});

const statusStyle: Record<ProductStatus, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  rejected: "bg-destructive/15 text-destructive border border-destructive/30",
};

function PanelPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">فروشنده</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              پنل فروشنده
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              محصولاتت را مدیریت کن؛ بعد از تأیید ادمین در فروشگاه دیده می‌شوند.
            </p>
          </div>
          <Link
            to="/panel/new"
            className="rounded-xl px-5 py-2.5 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
            style={{
              backgroundImage: "var(--gradient-neon)",
              boxShadow: "var(--shadow-neon)",
            }}
          >
            + ثبت محصول جدید
          </Link>
        </div>

        <RequireAuth>
          <PanelBody />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stats({ products }: { products: SellerProduct[] }) {
  const total = products.length;
  const pending = products.filter((p) => p.status === "pending").length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= 3,
  ).length;

  const cards = [
    { label: "کل محصولات", value: total, tone: "text-primary" },
    { label: "در انتظار تأیید", value: pending, tone: "text-amber-400" },
    { label: "موجودی کم", value: lowStock, tone: "text-destructive" },
  ];

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className={`mt-2 text-2xl font-black ${card.tone}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PanelBody() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["my-products"],
    queryFn: () => fetchMyProducts(),
  });
  const products = productsQuery.data ?? [];

  async function remove(id: number, name: string) {
    if (!window.confirm(`محصول «${name}» حذف شود؟`)) return;
    try {
      await deleteMyProduct(id);
      toast.success("محصول حذف شد.");
      void queryClient.invalidateQueries({ queryKey: ["my-products"] });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "حذف ناموفق بود.",
      );
    }
  }

  if (productsQuery.isLoading) {
    return (
      <div className="mt-8 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel h-20 animate-pulse rounded-2xl"
            />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="glass-panel h-24 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <div className="glass-panel mt-8 rounded-3xl p-8 text-center">
        <p className="font-black">دریافت محصولات انجام نشد</p>
        <button
          type="button"
          onClick={() => void productsQuery.refetch()}
          className="mt-4 rounded-xl border border-input px-5 py-2.5 text-sm font-bold hover:bg-accent"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel relative mt-8 overflow-hidden rounded-3xl p-10 text-center">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundImage: "var(--gradient-neon)" }}
        />
        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-4xl">
          🏪
        </div>
        <h2 className="relative mt-6 text-2xl font-black">
          هنوز محصولی ثبت نکرده‌ای
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          اولین محصولت را ثبت کن تا بعد از تأیید ادمین در فروشگاه دیده شود.
        </p>
        <Link
          to="/panel/new"
          className="relative mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-black text-primary-foreground"
          style={{
            backgroundImage: "var(--gradient-neon)",
            boxShadow: "var(--shadow-neon)",
          }}
        >
          ثبت محصول جدید
        </Link>
      </div>
    );
  }

  return (
    <>
      <Stats products={products} />

      <div className="mt-8 space-y-3">
        {products.map((product) => {
          const mainImage =
            product.images.find((i) => i.is_main) ?? product.images[0];
          const image = mediaUrl(mainImage?.image);
          const lowStock = product.stock > 0 && product.stock <= 3;

          return (
            <div
              key={product.id}
              className="glass-panel flex flex-col gap-4 rounded-2xl p-4 transition-all hover:border-primary/30 sm:flex-row sm:items-center"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/30">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl text-muted-foreground">
                    🎮
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {toman(product.price)} تومان · موجودی {product.stock}
                  {lowStock && (
                    <span className="ms-2 font-bold text-amber-400">
                      · موجودی کم
                    </span>
                  )}
                </p>
                {product.status === "rejected" && product.rejection_reason && (
                  <p className="mt-1 text-xs text-destructive">
                    دلیل رد: {product.rejection_reason}
                  </p>
                )}
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle[product.status]}`}
              >
                {product.status_label}
              </span>

              <div className="flex items-center gap-3">
                <Link
                  to="/panel/$id"
                  params={{ id: String(product.id) }}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  ویرایش
                </Link>
                <button
                  type="button"
                  onClick={() => remove(product.id, product.name)}
                  className="text-sm font-medium text-destructive hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}