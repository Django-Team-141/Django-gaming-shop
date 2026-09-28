import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequireAuth } from "@/components/require-auth";
import { toman } from "@/lib/format";
import {
  checkout as apiCheckout,
  createAddress,
  fetchAddresses,
  fetchCart,
  ApiError,
} from "@/lib/shop-api";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "تسویه حساب | گیم‌گیر" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-black">تسویه حساب</h1>
        <RequireAuth>
          <CheckoutBody />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  );
}

function CheckoutBody() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: () => fetchCart() });
  const addressesQuery = useQuery({ queryKey: ["addresses"], queryFn: ({ signal }) => fetchAddresses(signal) });

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiver: "",
    province: "",
    city: "",
    line: "",
    postal_code: "",
  });
  const [pending, setPending] = useState(false);

  const addresses = addressesQuery.data ?? [];
  const activeAddressId = selectedAddress ?? addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null;

  async function submitNewAddress(event: FormEvent) {
    event.preventDefault();
    try {
      const created = await createAddress({ ...newAddress, is_default: addresses.length === 0 });
      toast.success("آدرس اضافه شد.");
      setSelectedAddress(created.id);
      setShowNewAddress(false);
      setNewAddress({ receiver: "", province: "", city: "", line: "", postal_code: "" });
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ثبت آدرس ناموفق بود.");
    }
  }

  async function submitCheckout() {
    if (!activeAddressId) {
      toast.error("ابتدا یک آدرس انتخاب کن.");
      return;
    }
    setPending(true);
    try {
      const order = await apiCheckout({
        address_id: activeAddressId,
        coupon_code: couponCode || undefined,
      });
      toast.success("سفارش با موفقیت ثبت شد.");
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      void navigate({ to: "/orders/$id", params: { id: String(order.id) } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ثبت سفارش ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  const cart = cartQuery.data;

  return (
    <div className="mt-8 space-y-6">
      <section>
        <h2 className="text-sm font-bold">آدرس تحویل</h2>
        <div className="mt-3 space-y-2">
          {addresses.map((address) => (
            <label key={address.id} className="glass-panel flex cursor-pointer items-start gap-3 rounded-2xl p-4">
              <input
                type="radio"
                name="address"
                checked={activeAddressId === address.id}
                onChange={() => setSelectedAddress(address.id)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-bold">{address.receiver}</p>
                <p className="mt-1 text-muted-foreground">
                  {address.province}، {address.city}، {address.line} — {address.postal_code}
                </p>
              </div>
            </label>
          ))}
        </div>

        {showNewAddress ? (
          <form onSubmit={submitNewAddress} className="glass-panel mt-3 space-y-3 rounded-2xl p-4">
            <input
              required
              placeholder="نام گیرنده"
              value={newAddress.receiver}
              onChange={(e) => setNewAddress((a) => ({ ...a, receiver: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="استان"
                value={newAddress.province}
                onChange={(e) => setNewAddress((a) => ({ ...a, province: e.target.value }))}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="شهر"
                value={newAddress.city}
                onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              required
              placeholder="آدرس کامل"
              value={newAddress.line}
              onChange={(e) => setNewAddress((a) => ({ ...a, line: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="کد پستی (۱۰ رقم)"
              value={newAddress.postal_code}
              onChange={(e) => setNewAddress((a) => ({ ...a, postal_code: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-xl border border-input px-4 py-2 text-sm font-bold hover:bg-accent">
              ذخیره آدرس
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewAddress(true)}
            className="mt-3 text-sm font-bold text-primary"
          >
            + افزودن آدرس جدید
          </button>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold">کد تخفیف (اختیاری)</h2>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="کد تخفیف"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
        />
      </section>

      {cart && (
        <section className="glass-panel rounded-2xl p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع سبد</span>
            <span>{toman(cart.total)} تومان</span>
          </div>
        </section>
      )}

      <button
        onClick={submitCheckout}
        disabled={pending || !cart || cart.items.length === 0}
        className="w-full rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        style={{ backgroundImage: "var(--gradient-neon)" }}
      >
        {pending ? "در حال ثبت سفارش..." : "ثبت نهایی سفارش"}
      </button>
    </div>
  );
}
