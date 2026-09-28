import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { fetchBrands, fetchCategories, createMyProduct, ApiError } from "@/lib/shop-api";

export const Route = createFileRoute("/panel/new")({
  head: () => ({ meta: [{ title: "ثبت محصول جدید | گیم‌گیر" }] }),
  component: NewProductPage,
});

const SWITCH_TYPES = [
  { value: "none", label: "ندارد" },
  { value: "linear", label: "خطی" },
  { value: "tactile", label: "لمسی" },
  { value: "clicky", label: "کلیکی" },
  { value: "silent", label: "سکوت" },
];

function NewProductPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-black">ثبت محصول جدید</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          بعد از ذخیره می‌توانی از صفحهٔ ویرایش، تصویر اضافه کنی. محصول تا تأیید ادمین در فروشگاه نمایش داده نمی‌شود.
        </p>
        <RequireAuth>
          <NewProductForm />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function NewProductForm() {
  const navigate = useNavigate();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => fetchCategories() });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: () => fetchBrands() });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [switchType, setSwitchType] = useState("none");
  const [weight, setWeight] = useState("");
  const [isWireless, setIsWireless] = useState(false);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [pending, setPending] = useState(false);

  function updateSpec(index: number, field: "key" | "value", value: string) {
    setSpecs((prev) => prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!category || !brand) {
      toast.error("دسته و برند را انتخاب کن.");
      return;
    }
    setPending(true);
    try {
      const specsObject = Object.fromEntries(
        specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => [s.key.trim(), s.value.trim()]),
      );
      const created = await createMyProduct({
        name,
        category: Number(category),
        brand: Number(brand),
        description,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock),
        switch_type: switchType,
        weight_grams: weight ? Number(weight) : null,
        is_wireless: isWireless,
        is_active: true,
        specs: specsObject,
      });
      toast.success("محصول ثبت شد و برای تأیید ارسال شد.");
      void navigate({ to: "/panel/$id", params: { id: String(created.id) } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ثبت محصول ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel mt-6 space-y-4 rounded-2xl p-6">
      <div>
        <label className="text-sm font-bold">نام محصول</label>
        <input
          required
          minLength={3}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold">دسته</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          >
            <option value="">انتخاب کن</option>
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
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          >
            <option value="">انتخاب کن</option>
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold">قیمت با تخفیف (اختیاری)</label>
          <input
            type="number"
            min={0}
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
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
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold">نوع سوئیچ</label>
          <select
            value={switchType}
            onChange={(e) => setSwitchType(e.target.value)}
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
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={isWireless} onChange={(e) => setIsWireless(e.target.checked)} />
        بی‌سیم است
      </label>

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
        {pending ? "در حال ثبت..." : "ثبت محصول"}
      </button>
    </form>
  );
}
