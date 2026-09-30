import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toman, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import {
  addToCart,
  createReview,
  fetchProduct,
  fetchReviews,
  isLoggedIn,
  mediaUrl,
  ApiError,
} from "@/lib/shop-api";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({ meta: [{ title: "محصول | گیم‌گیر" }] }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: ({ signal }) => fetchProduct(slug, signal),
  });
  const product = productQuery.data;

  async function handleAdd() {
    if (!product) return;
    if (!isLoggedIn()) {
      toast.error("برای افزودن به سبد ابتدا وارد شو.");
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.success("به سبد خرید اضافه شد.");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
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

  if (productQuery.isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
          <div className="glass-panel aspect-square animate-pulse rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 w-1/2 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 text-xl font-black">محصول پیدا نشد</p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-black text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-neon)" }}
          >
            بازگشت به محصولات
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const discounted =
    product.discount_price !== null &&
    product.discount_price < product.price;
  const percent =
    discounted && product.price > 0
      ? Math.round(
          ((product.price - (product.discount_price as number)) /
            product.price) *
            100,
        )
      : null;
  const lowStock =
    product.in_stock && product.stock > 0 && product.stock <= 3;

  const images =
    product.images.length > 0
      ? product.images
      : [{ id: 0, image: "", alt: product.name, is_main: true }];
  const currentImage = images[Math.min(activeImage, images.length - 1)];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/products"
          className="text-sm font-bold text-primary hover:underline"
        >
          ← همه محصولات
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          {/* گالری */}
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/30">
              {mediaUrl(currentImage?.image) ? (
                <img
                  src={mediaUrl(currentImage!.image)!}
                  alt={currentImage!.alt || product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-5xl text-muted-foreground">
                  🎮
                </div>
              )}

              <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                {percent !== null && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow">
                    ٪{percent} تخفیف
                  </span>
                )}
                {!product.in_stock && (
                  <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white shadow">
                    ناموجود
                  </span>
                )}
                {lowStock && (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-black shadow">
                    موجودی کم
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={
                      index === activeImage
                        ? "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-primary"
                        : "h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border"
                    }
                  >
                    {mediaUrl(img.image) && (
                      <img
                        src={mediaUrl(img.image)!}
                        alt={img.alt}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* اطلاعات */}
          <div>
            <p className="text-sm text-muted-foreground">
              {product.brand ?? "بدون برند"}
              {product.category ? ` · ${product.category}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight">
              {product.name}
            </h1>
            {product.seller_name && (
              <p className="mt-2 text-xs text-muted-foreground">
                فروشنده: {product.seller_name}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-chart-3">
                {"★".repeat(Math.round(product.rating ?? 0))}
              </span>
              <span className="text-muted-foreground">
                {"★".repeat(5 - Math.round(product.rating ?? 0))}
              </span>
              <span className="text-xs text-muted-foreground">
                ({product.reviews_count} نظر)
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-extrabold text-primary">
                {toman(product.final_price)}
              </span>
              <span className="text-sm text-muted-foreground">تومان</span>
              {discounted && (
                <span className="text-sm text-muted-foreground line-through">
                  {toman(product.price)}
                </span>
              )}
            </div>

            <p
              className={
                product.in_stock
                  ? "mt-3 text-sm text-emerald-400"
                  : "mt-3 text-sm font-bold text-destructive"
              }
            >
              {product.in_stock
                ? `موجود · ${product.stock} عدد`
                : "ناموجود"}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={Math.max(product.stock, 1)}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                className="w-20 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!product.in_stock || adding}
                className="flex-1 rounded-xl px-6 py-3 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  backgroundImage: "var(--gradient-neon)",
                  boxShadow: product.in_stock
                    ? "var(--shadow-neon)"
                    : undefined,
                }}
              >
                {product.in_stock
                  ? adding
                    ? "در حال افزودن..."
                    : "افزودن به سبد"
                  : "ناموجود"}
              </button>
            </div>

            {product.description && (
              <div className="glass-panel mt-8 rounded-2xl p-5">
                <h2 className="text-sm font-black">توضیحات</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            {Object.keys(product.specs).length > 0 && (
              <dl className="glass-panel mt-6 divide-y divide-border overflow-hidden rounded-2xl">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between px-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        <ReviewsSection productId={product.id} canReview={Boolean(user)} />
      </main>
      <SiteFooter />
    </div>
  );
}

function ReviewsSection({
  productId,
  canReview,
}: {
  productId: number;
  canReview: boolean;
}) {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ["reviews", productId],
    queryFn: ({ signal }) => fetchReviews(productId, signal),
  });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submitReview() {
    setPending(true);
    try {
      await createReview({ product: productId, rating, title, body });
      toast.success("نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.");
      setTitle("");
      setBody("");
      void queryClient.invalidateQueries({
        queryKey: ["reviews", productId],
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "ثبت نظر ناموفق بود.",
      );
    } finally {
      setPending(false);
    }
  }

  const reviews = reviewsQuery.data?.results ?? [];

  return (
    <section className="mt-16">
      <h2 className="text-xl font-black">نظرات کاربران</h2>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            هنوز نظری ثبت نشده.
          </p>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">{review.user_name}</p>
              <span className="text-xs text-muted-foreground">
                {formatDate(review.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm text-chart-3">
              {"★".repeat(review.rating)}
            </p>
            {review.title && (
              <p className="mt-2 font-bold">{review.title}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {review.body}
            </p>
          </div>
        ))}
      </div>

      {canReview && (
        <div className="glass-panel mt-8 rounded-2xl p-6">
          <p className="font-bold">
            ثبت نظر (فقط برای خریداران این محصول)
          </p>
          <div className="mt-3 flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={
                  value <= rating
                    ? "text-chart-3"
                    : "text-muted-foreground"
                }
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان (اختیاری)"
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="نظر شما..."
            rows={3}
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={submitReview}
            disabled={pending || body.trim().length < 10}
            className="mt-3 rounded-xl border border-input px-5 py-2.5 text-sm font-bold hover:bg-accent disabled:opacity-50"
          >
            {pending ? "در حال ارسال..." : "ثبت نظر"}
          </button>
        </div>
      )}
    </section>
  );
}