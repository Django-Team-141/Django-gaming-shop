import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import {
  fetchBrands,
  fetchCategories,
  fetchMyProduct,
  updateMyProduct,
  uploadProductImage,
  setMainImage,
  deleteProductImage,
  mediaUrl,
  ApiError,
  type SellerProduct,
} from "@/lib/shop-api";

export const Route = createFileRoute("/panel/$id")({
  head: () => ({ meta: [{ title: "ویرایش محصول | گیم‌گیر" }] }),
  component: EditProductPage,
});

const SWITCH_TYPES = [
  { value: "none", label: "ندارد" },
  { value: "linear", label: "خطی" },
  { value: "tactile", label: "لمسی" },
  { value: "clicky", label: "کلیکی" },
  { value: "silent", label: "سکوت" },
];

function EditProductPage() {
  const { id } = Route.useParams();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-black">ویرایش محصول</h1>
        <RequireAuth>
          <EditProductBody id={Number(id)} />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function EditProductBody({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const productQuery = useQuery({ queryKey: ["my-product", id], queryFn: ({ signal }) => fetchMyProduct(id, signal) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => fetchCategories() });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: () => fetchBrands() });

  const product = productQuery.data;
  const [form, setForm] = useState<SellerProduct | null>(null);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (product && !form) {
      setForm(product);
      const entries = Object.entries(product.specs);
      setSpecs(entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }]);
    }
  }, [product, form]);

  if (productQuery.isLoading || !form) {
    return <p className="mt-12 text-center text-muted-foreground">در حال بارگذاری...</p>;
  }

  function set<K extends keyof SellerProduct>(key: K, value: SellerProduct[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateSpec(index: number, field: "key" | "value", value: string) {
    setSpecs((prev) => prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setPending(true);
    try {
      const specsObject = Object.fromEntries(
        specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => [s.key.trim(), s.value.trim()]),
      );
      const updated = await updateMyProduct(id, {
        name: form.name,
        category: form.category,
        brand: form.brand,
        description: form.description,
        price: form.price,
        discount_price: form.discount_price,
        stock: form.stock,
        switch_type: form.switch_type,
        weight_grams: form.weight_grams,
        is_wireless: form.is_wireless,
        is_active: form.is_active,
        specs: specsObject,
      });
      setForm(updated);
      toast.success("محصول به‌روزرسانی شد.");
      void queryClient.invalidateQueries({ queryKey: ["my-products"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadProductImage(id, file);
      toast.success("تصویر اضافه شد.");
      void queryClient.invalidateQueries({ queryKey: ["my-product", id] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "بارگذاری تصویر ناموفق بود.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function makeMain(imageId: number) {
    await setMainImage(id, imageId);
    void queryClient.invalidateQueries({ queryKey: ["my-product", id] });
  }

  async function removeImage(imageId: number) {
    await deleteProductImage(id, imageId);
    void queryClient.invalidateQueries({ queryKey: ["my-product", id] });
  }

  return (
    <div className="mt-6 space-y-6">
      {form.status === "rejected" && form.rejection_reason && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          این محصول رد شده است. دلیل: {form.rejection_reason}
        </div>
      )}
      {form.status === "pending" && (
        <div className="rounded-2xl border border-chart-3/40 bg-chart-3/10 p-4 text-sm text-chart-3">
          این محصول در انتظار تأیید ادمین است و در فروشگاه نمایش داده نمی‌شود.
        </div>
      )}

      <section>
        <h2 className="text-sm font-bold">تصاویر محصول</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {form.images.map((image) => (
            <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
              {mediaUrl(image.image) && (
                <img src={mediaUrl(image.image)!} alt={image.alt} className="h-full w-full object-cover" />
              )}
              {image.is_main && (
                <span className="absolute right-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  اصلی
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-background/80 py-1">
                {!image.is_main && (
                  <button onClick={() => makeMain(image.id)} className="text-[10px] font-bold text-primary">
                    اصلی کن
                  </button>
                )}
                <button onClick={() => removeImage(image.id)} className="text-[10px] font-bold text-destructive">
                  حذف
                </button>
              </div>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input text-xs text-muted-foreground hover:border-primary">
            {uploading ? "در حال بارگذاری..." : "+ افزودن تصویر"}
            <input ref={fileInput} type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </section>

      <form onSubmit={onSubmit} className="glass-panel space-y-4 rounded-2xl p-6">
        <div>
          <label className="text-sm font-bold">نام محصول</label>
          <input
            required
            minLength={3}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold">دسته</label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            >
              {categoriesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold">برند</label>
            <select
              required
              value={form.brand}
              onChange={(e) => set("brand", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            >
              {brandsQuery.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold">توضیحات</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold">قیمت (تومان)</label>
            <input
              required
              type="number"
              min={1000}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-bold">قیمت با تخفیف</label>
            <input
              type="number"
              min={0}
              value={form.discount_price ?? ""}
              onChange={(e) => set("discount_price", e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-bold">موجودی</label>
            <input
              required
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-bold">نوع سوئیچ</label>
            <select
              value={form.switch_type}
              onChange={(e) => set("switch_type", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            >
              {SWITCH_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold">وزن (گرم)</label>
            <input
              type="number"
              min={0}
              value={form.weight_grams ?? ""}
              onChange={(e) => set("weight_grams", e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.is_wireless} onChange={(e) => set("is_wireless", e.target.checked)} />
            بی‌سیم است
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            فعال (قابل نمایش)
          </label>
        </div>

        <div>
          <label className="text-sm font-bold">مشخصات فنی</label>
          <div className="mt-2 space-y-2">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <input
                  placeholder="مثلاً گارانتی"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, "key", e.target.value)}
                  className="w-1/2 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  placeholder="مثلاً ۱۸ ماه"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  className="w-1/2 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSpecs((prev) => [...prev, { key: "", value: "" }])}
              className="text-sm font-bold text-primary"
            >
              + افزودن مشخصه
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-neon)" }}
        >
          {pending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </form>
    </div>
  );
}
