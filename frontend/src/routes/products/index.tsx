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

function ProductCard({ product }: { product: ApiProduct }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

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

  const discounted =
    product.discount_price !== null &&
    product.discount_price < product.price;

  const imageUrl = mediaUrl(product.main_image);

  return (
    <article className="glass-panel group flex flex-col overflow-hidden rounded-3xl transition-transform hover:-translate-y-1">
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

        {discounted && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
            تخفیف
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">
          {product.brand ?? "بدون برند"}
        </p>

        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="mt-1 text-sm font-bold leading-6"
        >
          {product.name}
        </Link>

        <div className="mt-2 text-[11px] text-muted-foreground">
          {product.rating ? `★ ${product.rating}` : "بدون امتیاز"} (
          {toman(product.reviews_count)} نظر)
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

        <button
          onClick={handleAdd}
          disabled={!product.in_stock || adding}
          className="mt-4 rounded-xl border border-input py-2.5 text-sm font-bold transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

  // جستجوی زنده خودکار ۳۵۰ میلی‌ثانیه پس از اتمام تایپ کاربر
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

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-black">محصولات</h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex min-w-55 flex-1 items-center rounded-full border border-input bg-muted/40 px-3 py-2">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جست‌وجوی لحظه‌ای در محصولات..."
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
            className="rounded-full border border-input bg-background px-4 py-2 text-sm"
          >
            <option value="">همه دسته‌ها</option>

            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
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
            className="rounded-full border border-input bg-background px-4 py-2 text-sm"
          >
            <option value="">همه برندها</option>

            {brandsQuery.data?.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
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
            className="rounded-full border border-input bg-background px-4 py-2 text-sm"
          >
            <option value="">جدیدترین</option>
            <option value="price">ارزان‌ترین</option>
            <option value="-price">گران‌ترین</option>
          </select>
        </div>

        {productsQuery.isLoading ? (
          <p className="mt-12 text-center text-muted-foreground">
            در حال بارگذاری...
          </p>
        ) : productsQuery.isError ? (
          <p className="mt-12 text-center text-destructive">
            دریافت محصولات با خطا مواجه شد.
          </p>
        ) : products.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            محصولی با این مشخصات پیدا نشد.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
