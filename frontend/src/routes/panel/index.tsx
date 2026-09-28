import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman } from "@/lib/format";
import { deleteMyProduct, fetchMyProducts, mediaUrl, ApiError, type ProductStatus } from "@/lib/shop-api";

export const Route = createFileRoute("/panel/")({
  head: () => ({ meta: [{ title: "پنل فروشنده | گیم‌گیر" }] }),
  component: PanelPage,
});

const statusStyle: Record<ProductStatus, string> = {
  approved: "bg-primary/15 text-primary",
  pending: "bg-chart-3/20 text-chart-3",
  rejected: "bg-destructive/15 text-destructive",
};

function PanelPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black">پنل فروشنده — محصولات من</h1>
          <Link
            to="/panel/new"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-neon)" }}
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

function PanelBody() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["my-products"], queryFn: () => fetchMyProducts() });
  const products = productsQuery.data ?? [];

  async function remove(id: number, name: string) {
    if (!window.confirm(`محصول «${name}» حذف شود؟`)) return;
    try {
      await deleteMyProduct(id);
      toast.success("محصول حذف شد.");
      void queryClient.invalidateQueries({ queryKey: ["my-products"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف ناموفق بود.");
    }
  }

  if (productsQuery.isLoading) {
    return <p className="mt-12 text-center text-muted-foreground">در حال بارگذاری...</p>;
  }

  if (products.length === 0) {
    return (
      <p className="mt-12 text-center text-muted-foreground">
        هنوز محصولی ثبت نکرده‌ای. از دکمهٔ بالا شروع کن.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {products.map((product) => {
        const mainImage = product.images.find((i) => i.is_main) ?? product.images[0];
        return (
          <div key={product.id} className="glass-panel flex items-center gap-4 rounded-2xl p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/30">
              {mediaUrl(mainImage?.image) && (
                <img src={mediaUrl(mainImage!.image)!} alt={product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{product.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {toman(product.price)} تومان · موجودی {toman(product.stock)}
              </p>
              {product.status === "rejected" && product.rejection_reason && (
                <p className="mt-1 text-xs text-destructive">دلیل رد: {product.rejection_reason}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[product.status]}`}>
              {product.status_label}
            </span>
            <Link to="/panel/$id" params={{ id: String(product.id) }} className="text-sm font-bold text-primary">
              ویرایش
            </Link>
            <button onClick={() => remove(product.id, product.name)} className="text-sm text-destructive">
              حذف
            </button>
          </div>
        );
      })}
    </div>
  );
}
