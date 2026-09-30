import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toman } from "@/lib/format";
import {
  addToCart,
  ApiError,
  fetchBrands,
  fetchCategories,
  fetchProducts,
  isLoggedIn,
  mediaUrl,
  type ApiProduct,
} from "@/lib/shop-api";

const searchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  ordering: z.string().optional(),
});

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: "همه محصولات | گیم‌گیر" }] }),
  validateSearch: searchSchema,
  component: ProductsPage,
});

function discountPercent(product: ApiProduct) {
  if (
    product.discount_price === null ||
    product.discount_price >= product.price ||
    product.price <= 0
  ) {
    return null;
  }
  return Math.round(
    ((product.price - product.discount_price) / product.price) * 100,
  );
}

function ProductCard({ product }: { product: ApiProduct }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const percent = discountPercent(product);
  const imageUrl = mediaUrl(product.main_image);
  const lowStock =
    product.in_stock && product.stock > 0 && product.stock <= 3;

  async function handleAdd() {
    if (!isLoggedIn()) {
      toast.error("برای افزودن به سبد ابتدا وارد شو.");
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, 1);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("به سبد خرید اضافه شد.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "افزودن به سبد ناموفق بود.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="glass-panel group flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block bg-muted/30"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-4xl text-muted-foreground">
            🎮
          </div>
        )}

        {/* بج‌ها */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {percent !== null && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground shadow">
              ٪{percent} تخفیف
            </span>
          )}
          {!product.in_stock && (
            <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white shadow">
              ناموجود
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-black shadow">
              موجودی کم
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">
          {product.brand ?? "بدون برند"}
        </p>

        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="mt-1 line-clamp-2 text-sm font-bold leading-6 transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs text-chart-3">
          {"★".repeat(Math.round(product.rating ?? 0))}
          <span className="text-muted-foreground">
            {"★".repeat(5 - Math.round(product.rating ?? 0))}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({product.reviews_count} نظر)
          </span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <span className="text-base font-extrabold text-primary">
            {toman(product.final_price)}
          </span>
          <span className="text-xs text-muted-foreground">تومان</span>
          {percent !== null && (
            <span className="ms-auto text-xs text-muted-foreground line-through">
              {toman(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!product.in_stock || adding}
          className="mt-4 rounded-xl border border-input py-2.5 text-sm font-bold transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {product.in_stock
            ? adding
              ? "در حال افزودن..."
              : "افزودن به سبد"
            : "ناموجود"}
        </button>
      </div>
    </article>
  );
}

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(search.search ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (term !== (search.search ?? "")) {
        void navigate({
          search: {
            ...search,
            search: term || undefined,
          },
        });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [term, navigate, search]);

  const productFilters = {
    ...(search.search ? { search: search.search } : {}),
    ...(search.category ? { category: search.category } : {}),
    ...(search.brand ? { brand: search.brand } : {}),
    ...(search.ordering ? { ordering: search.ordering } : {}),
  };

  const productsQuery = useQuery({
    queryKey: ["products", productFilters],
    queryFn: ({ signal }) => fetchProducts(productFilters, signal),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands(),
  });

  const products = productsQuery.data?.results ?? [];
  const categories = categoriesQuery.data ?? [];
  const brands = brandsQuery.data ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">کاتالوگ</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">محصولات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            فیلتر کن، جستجو کن، و سریع به سبد اضافه کن.
          </p>
        </div>

        {/* فیلترها */}
        <div className="glass-panel mb-8 flex flex-wrap gap-3 rounded-3xl p-4">
          <div className="flex min-w-[200px] flex-1 items-center rounded-full border border-input bg-muted/40 px-3 py-2">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جست‌وجوی لحظه‌ای..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={search.category ?? ""}
            onChange={(e) =>
              void navigate({
                search: {
                  ...search,
                  category: e.target.value || undefined,
                },
              })
            }
            className="rounded-full border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={search.brand ?? ""}
            onChange={(e) =>
              void navigate({
                search: {
                  ...search,
                  brand: e.target.value || undefined,
                },
              })
            }
            className="rounded-full border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">همه برندها</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={search.ordering ?? ""}
            onChange={(e) =>
              void navigate({
                search: {
                  ...search,
                  ordering: e.target.value || undefined,
                },
              })
            }
            className="rounded-full border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">جدیدترین</option>
            <option value="price">ارزان‌ترین</option>
            <option value="-price">گران‌ترین</option>
            <option value="-created_at">تازه‌ترین</option>
          </select>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="glass-panel h-80 animate-pulse rounded-3xl"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-4 text-lg font-black">محصولی پیدا نشد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              فیلترها را عوض کن یا جستجو را پاک کن.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}