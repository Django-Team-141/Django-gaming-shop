import { createFileRoute } from "@tanstack/react-router";
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
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const productQuery = useQuery({ queryKey: ["product", slug], queryFn: ({ signal }) => fetchProduct(slug, signal) });
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
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "افزودن به سبد ناموفق بود.");
    } finally {
      setAdding(false);
    }
  }

  if (productQuery.isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">در حال بارگذاری...</p>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">محصول پیدا نشد.</p>
        <SiteFooter />
      </div>
    );
  }

  const discounted = product.discount_price && product.discount_price < product.price;
  const images = product.images.length > 0 ? product.images : [{ id: 0, image: "", alt: product.name, is_main: true }];
  const currentImage = images[Math.min(activeImage, images.length - 1)];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
              {mediaUrl(currentImage?.image) ? (
                <img src={mediaUrl(currentImage!.image)!} alt={currentImage!.alt || product.name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-5xl text-muted-foreground">🎮</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${index === activeImage ? "border-primary" : "border-border"}`}
                  >
                    {mediaUrl(img.image) && <img src={mediaUrl(img.image)!} alt={img.alt} className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{product.brand ?? "بدون برند"} · {product.category}</p>
            <h1 className="mt-2 text-2xl font-black">{product.name}</h1>
            {product.seller_name && (
              <p className="mt-2 text-xs text-muted-foreground">فروشنده: {product.seller_name}</p>
            )}
            <div className="mt-3 text-sm text-muted-foreground">
              {product.rating ? `★ ${product.rating} از ۵` : "هنوز امتیازی ثبت نشده"} ({toman(product.reviews_count)} نظر)
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-primary">{toman(product.final_price)}</span>
              <span className="text-sm text-muted-foreground">تومان</span>
              {discounted && <span className="text-sm text-muted-foreground line-through">{toman(product.price)}</span>}
            </div>

            <p className="mt-2 text-sm">{product.in_stock ? `موجودی: ${toman(product.stock)} عدد` : "ناموجود"}</p>

            <div className="mt-6 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={Math.max(product.stock, 1)}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={!product.in_stock || adding}
                className="flex-1 rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-neon)" }}
              >
                {product.in_stock ? (adding ? "در حال افزودن..." : "افزودن به سبد") : "ناموجود"}
              </button>
            </div>

            {product.description && (
              <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}

            {Object.keys(product.specs).length > 0 && (
              <dl className="mt-8 divide-y divide-border rounded-2xl border border-border">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between px-4 py-2.5 text-sm">
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

function ReviewsSection({ productId, canReview }: { productId: number; canReview: boolean }) {
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
      void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ثبت نظر ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  const reviews = reviewsQuery.data?.results ?? [];

  return (
    <section className="mt-16">
      <h2 className="text-xl font-black">نظرات کاربران</h2>
      <div className="mt-6 space-y-4">
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">هنوز نظری ثبت نشده.</p>}
        {reviews.map((review) => (
          <div key={review.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">{review.user_name}</p>
              <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-chart-3">{"★".repeat(review.rating)}</p>
            {review.title && <p className="mt-2 font-bold">{review.title}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
          </div>
        ))}
      </div>

      {canReview && (
        <div className="glass-panel mt-8 rounded-2xl p-6">
          <p className="font-bold">ثبت نظر (فقط برای خریداران این محصول)</p>
          <div className="mt-3 flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={value <= rating ? "text-chart-3" : "text-muted-foreground"}
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
