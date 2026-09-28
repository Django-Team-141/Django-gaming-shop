import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/hero-gaming.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toman } from "@/lib/format";
import { addToCart, fetchCategories, fetchProducts, isLoggedIn, mediaUrl, ApiError } from "@/lib/shop-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "گیم‌گیر | فروشگاه لوازم جانبی گیمینگ" },
      {
        name: "description",
        content:
          "خرید کیبورد مکانیکی، ماوس گیمینگ، هدست و پد بازی با گارانتی اصالت، ارسال سریع و پشتیبانی ۲۴ ساعته.",
      },
      { property: "og:title", content: "گیم‌گیر | فروشگاه لوازم جانبی گیمینگ" },
      {
        property: "og:description",
        content: "کیبورد، ماوس، هدست و پد گیمینگ اورجینال با گارانتی ۱۸ ماهه.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const categoryIcons = ["⌨️", "🖱️", "🎧", "🟦", "🎮", "🪑"];

const perks = [
  { title: "گارانتی اصالت", text: "۱۸ ماه گارانتی رسمی روی همه کالاها", icon: "🛡️" },
  { title: "ارسال سریع", text: "تهران همان روز، شهرستان ۴۸ ساعته", icon: "🚚" },
  { title: "۷ روز مهلت بازگشت", text: "بدون پرسش، بدون دردسر", icon: "↩️" },
  { title: "پشتیبانی ۲۴/۷", text: "مشاوره تخصصی قبل و بعد خرید", icon: "💬" },
];

function Stars({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  return (
    <span className="text-xs text-chart-3" aria-label={`امتیاز ${value} از ۵`}>
      {"★".repeat(Math.round(value))}
      <span className="text-muted-foreground">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

function HomePage() {
  const productsQuery = useQuery({
    queryKey: ["products", { ordering: "-created_at" }],
    queryFn: ({ signal }) => fetchProducts({ ordering: "-created_at" }, signal),
    staleTime: 60_000,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 60_000,
  });

  const products = (productsQuery.data?.results ?? []).slice(0, 8);
  const categories = (categoriesQuery.data ?? []).slice(0, 6);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main id="top">
        <section className="grid-glow relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                ✦ کالکشن پاییز ۱۴۰۵ رسید
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                تجهیزات <span className="neon-text">حرفه‌ای</span> برای بازی‌های رقابتی
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                کیبورد مکانیکی، ماوس سبک، هدست فضایی و هرچه برای بردن لازم داری — با گارانتی اصالت و
                ارسال سریع. فروشندگان هم می‌توانند از پنل خودشان محصول اضافه کنند.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  style={{ backgroundImage: "var(--gradient-neon)", boxShadow: "var(--shadow-neon)" }}
                >
                  مشاهده محصولات
                </Link>
                <Link
                  to="/panel"
                  className="rounded-xl border border-input px-6 py-3 text-sm font-bold transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  فروش در گیم‌گیر
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border" style={{ boxShadow: "var(--shadow-neon)" }}>
                <img
                  src={heroImg}
                  alt="کیبورد مکانیکی و ماوس گیمینگ با نورپردازی نئون"
                  width={1600}
                  height={1104}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle title="خرید بر اساس دسته‌بندی" sub="هرچه میز بازی‌ات لازم دارد" />
          {categories.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">هنوز دسته‌بندی‌ای ثبت نشده.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to="/products"
                  search={{ category: category.slug }}
                  className="glass-panel group rounded-2xl p-5 text-center transition-transform hover:-translate-y-1"
                >
                  <span className="text-2xl">{categoryIcons[index % categoryIcons.length]}</span>
                  <p className="mt-3 text-sm font-bold group-hover:text-primary">{category.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{toman(category.product_count)} کالا</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="products" className="mx-auto max-w-6xl px-4 pb-16">
          <SectionTitle title="جدیدترین محصولات" sub="تازه‌ترین کالاهای فروشگاه" />
          {productsQuery.isLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">در حال بارگذاری...</p>
          ) : products.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">هنوز محصولی ثبت نشده.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => {
                const discounted = product.discount_price && product.discount_price < product.price;
                return (
                  <article
                    key={product.id}
                    className="glass-panel group flex flex-col overflow-hidden rounded-3xl transition-transform hover:-translate-y-1"
                  >
                    <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block bg-muted/30">
                      {mediaUrl(product.main_image) ? (
                        <img
                          src={mediaUrl(product.main_image)!}
                          alt={product.name}
                          loading="lazy"
                          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center text-4xl text-muted-foreground">
                          🎮
                        </div>
                      )}
                      {discounted && (
                        <span className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                          تخفیف
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs text-muted-foreground">{product.brand ?? "بدون برند"}</p>
                      <Link
                        to="/products/$slug"
                        params={{ slug: product.slug }}
                        className="mt-1 text-sm font-bold leading-6"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <Stars rating={product.rating} />
                        <span className="text-[11px] text-muted-foreground">
                          ({toman(product.reviews_count)} نظر)
                        </span>
                      </div>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-base font-extrabold text-primary">
                          {toman(product.final_price)}
                        </span>
                        <span className="text-xs text-muted-foreground">تومان</span>
                        {discounted && (
                          <span className="ms-auto text-xs text-muted-foreground line-through">
                            {toman(product.price)}
                          </span>
                        )}
                      </div>
                      <AddToCartButton productId={product.id} inStock={product.in_stock} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="perks" className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-lg">
                  {p.icon}
                </span>
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <SectionTitle title="سوالات متداول" sub="هرچه پیش از خرید خوب است بدانی" />
          <div className="mt-8 space-y-3">
            {[
              ["ارسال چقدر طول می‌کشد؟", "سفارش‌های تهران در همان روز کاری و شهرستان‌ها بین ۲۴ تا ۴۸ ساعت به دستت می‌رسد."],
              ["گارانتی کالاها چگونه است؟", "همه کالاها ۱۸ ماه گارانتی اصالت و سلامت فیزیکی دارند و در صورت ایراد، تعویض می‌شوند."],
              ["امکان بازگشت کالا وجود دارد؟", "تا ۷ روز پس از تحویل، اگر کالا باز نشده یا مطابق توضیحات نبود، بدون پرسش بازگردانده می‌شود."],
              ["چه کسی می‌تواند نظر ثبت کند؟", "فقط کاربرانی که همان محصول را خریده‌اند، تا نظرها واقعی و قابل اعتماد بمانند."],
              ["چطور محصولم را در گیم‌گیر بفروشم؟", "از پنل فروشنده محصول را ثبت کن؛ بعد از تأیید ادمین در فروشگاه نمایش داده می‌شود."],
            ].map(([q, a]) => (
              <details key={q} className="glass-panel rounded-2xl px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-bold">{q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AddToCartButton({ productId, inStock }: { productId: number; inStock: boolean }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!isLoggedIn()) {
      toast.error("برای افزودن به سبد ابتدا وارد شو.");
      return;
    }
    setAdding(true);
    try {
      await addToCart(productId, 1);
      toast.success("به سبد خرید اضافه شد.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "افزودن به سبد ناموفق بود.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={!inStock || adding}
      className="mt-4 rounded-xl border border-input py-2.5 text-sm font-bold transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {inStock ? (adding ? "در حال افزودن..." : "افزودن به سبد") : "ناموجود"}
    </button>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
      </div>
      <span className="h-1 w-24 rounded-full" style={{ backgroundImage: "var(--gradient-neon)" }} />
    </div>
  );
}
