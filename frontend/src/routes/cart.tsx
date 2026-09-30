import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman } from "@/lib/format";
import {
  fetchCart,
  mediaUrl,
  removeCartItem,
  updateCartItem,
  ApiError,
  type CartItem,
} from "@/lib/shop-api";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "سبد خرید | گیم‌گیر" }],
  }),
  component: CartPage,
});

function CartSteps() {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {[
        { n: 1, label: "سبد", active: true },
        { n: 2, label: "آدرس", active: false },
        { n: 3, label: "پرداخت", active: false },
      ].map((step, index, arr) => (
        <li key={step.n} className="flex flex-1 items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={
                step.active
                  ? "grid h-9 w-9 place-items-center rounded-full text-sm font-black text-primary-foreground"
                  : "grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-bold text-muted-foreground"
              }
              style={
                step.active
                  ? {
                      backgroundImage: "var(--gradient-neon)",
                      boxShadow: "var(--shadow-neon)",
                    }
                  : undefined
              }
            >
              {step.n}
            </span>
            <span
              className={
                step.active
                  ? "text-[11px] font-bold text-primary"
                  : "text-[11px] text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
          {index < arr.length - 1 && (
            <div className="mb-5 h-0.5 flex-1 rounded-full bg-border" />
          )}
        </li>
      ))}
    </ol>
  );
}

function CartPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">خرید شما</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            سبد خرید
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            محصولات انتخاب‌شده را بررسی کن و برای ثبت سفارش ادامه بده.
          </p>
        </div>

        <CartSteps />

        <RequireAuth>
          <CartBody />
        </RequireAuth>
      </main>

      <SiteFooter />
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const queryClient = useQueryClient();
  const image = mediaUrl(item.product.main_image);

  const hasDiscount =
    item.product.discount_price !== null &&
    item.product.discount_price < item.product.price;

  async function changeQuantity(quantity: number) {
    if (quantity < 1) {
      return;
    }

    try {
      await updateCartItem(item.id, quantity);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "تغییر تعداد محصول انجام نشد.",
      );
    }
  }

  async function handleRemove() {
    try {
      await removeCartItem(item.id);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("محصول از سبد خرید حذف شد.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "حذف محصول انجام نشد.",
      );
    }
  }

  return (
    <article className="glass-panel group rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          to="/products/$slug"
          params={{ slug: item.product.slug }}
          className="relative shrink-0"
        >
          <div className="h-24 w-full overflow-hidden rounded-xl bg-muted/40 sm:h-24 sm:w-24">
            {image ? (
              <img
                src={image}
                alt={item.product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl text-muted-foreground">
                🎮
              </div>
            )}
          </div>
          {hasDiscount && (
            <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow">
              تخفیف
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to="/products/$slug"
            params={{ slug: item.product.slug }}
            className="line-clamp-2 text-sm font-extrabold leading-6 transition-colors hover:text-primary"
          >
            {item.product.name}
          </Link>

          <p className="mt-2 text-xs text-muted-foreground">
            قیمت واحد: {toman(item.product.final_price)} تومان
            {hasDiscount && (
              <span className="ms-2 line-through opacity-70">
                {toman(item.product.price)}
              </span>
            )}
          </p>

          {!item.product.in_stock && (
            <p className="mt-1 text-xs font-bold text-destructive">
              این محصول ناموجود شده
            </p>
          )}

          <button
            type="button"
            onClick={handleRemove}
            className="mt-3 text-xs font-medium text-destructive transition-colors hover:underline"
          >
            حذف از سبد
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 sm:block sm:text-center">
          <p className="mb-2 text-xs text-muted-foreground">تعداد</p>
          <div className="inline-flex items-center rounded-xl border border-input bg-background/60 p-1">
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="کاهش تعداد"
              className="grid h-8 w-8 place-items-center rounded-lg text-lg transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>
            <span className="w-9 text-center text-sm font-bold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity + 1)}
              aria-label="افزایش تعداد"
              className="grid h-8 w-8 place-items-center rounded-lg text-lg transition-colors hover:bg-accent"
            >
              +
            </button>
          </div>
        </div>

        <div className="min-w-32 text-left sm:text-right">
          <p className="text-xs text-muted-foreground">قیمت نهایی</p>
          <p className="mt-1 text-base font-black text-primary">
            {toman(item.line_total)}
            <span className="ms-1 text-xs font-medium text-muted-foreground">
              تومان
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

function CartBody() {
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
  });

  const cart = cartQuery.data;

  if (cartQuery.isLoading) {
    return <CartLoading />;
  }

  if (cartQuery.isError) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-2xl">
          !
        </div>
        <h2 className="mt-4 text-lg font-black">
          دریافت سبد خرید انجام نشد
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          اتصال به اطلاعات سبد خرید با مشکل مواجه شد. دوباره تلاش کن.
        </p>
        <button
          type="button"
          onClick={() => void cartQuery.refetch()}
          className="mt-5 rounded-xl border border-input px-5 py-2.5 text-sm font-bold transition-colors hover:bg-accent"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold">محصولات انتخاب‌شده</p>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {cart.items_count} قلم
          </span>
        </div>

        <div className="space-y-3">
          {cart.items.map((item) => (
            <CartRow key={item.id} item={item} />
          ))}
        </div>

        <Link
          to="/products"
          className="mt-5 inline-flex items-center text-sm font-bold text-primary transition-colors hover:underline"
        >
          ← ادامه خرید
        </Link>
      </section>

      <aside className="glass-panel rounded-3xl p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-black">خلاصه سفارش</h2>

        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع محصولات</span>
            <span className="font-bold">{toman(cart.total)} تومان</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">هزینه ارسال</span>
            <span className="font-bold text-emerald-400">
              محاسبه در مرحله بعد
            </span>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  مبلغ قابل پرداخت
                </p>
                <p className="mt-1 text-xl font-black text-primary">
                  {toman(cart.total)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">تومان</span>
            </div>
          </div>
        </div>

        <Link
          to="/checkout"
          className="mt-6 block rounded-xl px-5 py-3.5 text-center text-sm font-black text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
          style={{
            backgroundImage: "var(--gradient-neon)",
            boxShadow: "var(--shadow-neon)",
          }}
        >
          ادامه و نهایی‌سازی خرید
        </Link>

        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-xs leading-5 text-muted-foreground">
            با ادامه خرید، اطلاعات سفارش و آدرس تحویل را در مرحله بعد
            بررسی خواهی کرد.
          </p>
        </div>

        <ul className="mt-4 space-y-2 text-[11px] text-muted-foreground">
          <li>🛡️ امکان بازگشت تا ۷ روز</li>
          <li>🚚 ارسال سریع پس از پرداخت</li>
          <li>🔒 پرداخت امن (Mock برای دمو)</li>
        </ul>
      </aside>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="glass-panel relative mx-auto max-w-xl overflow-hidden rounded-3xl p-10 text-center">
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "var(--gradient-neon)" }}
      />
      <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-primary/10 text-5xl">
        🛒
      </div>
      <h2 className="relative mt-6 text-2xl font-black">سبد خریدت خالیه</h2>
      <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        هنوز محصولی به سبد خرید اضافه نکردی. از بین تجهیزات گیمینگ
        فروشگاه، محصول موردنظرت را انتخاب کن.
      </p>
      <div className="relative mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/products"
          className="inline-flex rounded-xl px-6 py-3 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
          style={{
            backgroundImage: "var(--gradient-neon)",
            boxShadow: "var(--shadow-neon)",
          }}
        >
          مشاهده محصولات
        </Link>
        <Link
          to="/"
          className="inline-flex rounded-xl border border-input px-6 py-3 text-sm font-bold hover:bg-accent"
        >
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
}

function CartLoading() {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="glass-panel h-32 animate-pulse rounded-2xl"
          />
        ))}
      </div>
      <div className="glass-panel h-72 animate-pulse rounded-3xl" />
    </div>
  );
}