import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  processPayment,
  validateCoupon,
  ApiError,
} from "@/lib/shop-api";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "تسویه حساب | گیم‌گیر" }] }),
  component: CheckoutPage,
});

function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "سبد", to: "/cart" as const },
    { n: 2 as const, label: "آدرس و تخفیف", to: "/checkout" as const },
    { n: 3 as const, label: "پرداخت", to: "/checkout" as const },
  ];

  return (
    <ol className="mb-8 flex items-center justify-between gap-2">
      {steps.map((step, index) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <li key={step.n} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={
                  active || done
                    ? "grid h-9 w-9 place-items-center rounded-full text-sm font-black text-primary-foreground"
                    : "grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-bold text-muted-foreground"
                }
                style={
                  active || done
                    ? {
                        backgroundImage: "var(--gradient-neon)",
                        boxShadow: active ? "var(--shadow-neon)" : undefined,
                      }
                    : undefined
                }
              >
                {done ? "✓" : step.n}
              </span>
              <span
                className={
                  active
                    ? "text-[11px] font-bold text-primary"
                    : "text-[11px] text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={
                  done
                    ? "mb-5 h-0.5 flex-1 rounded-full bg-primary/60"
                    : "mb-5 h-0.5 flex-1 rounded-full bg-border"
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm font-medium text-primary">تقریباً تمومه</p>
        <h1 className="mt-2 text-3xl font-black">تسویه حساب</h1>
        <div className="mt-6">
          <CheckoutSteps current={2} />
        </div>
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

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
  });

  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: ({ signal }) => fetchAddresses(signal),
  });

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiver: "",
    province: "",
    city: "",
    line: "",
    postal_code: "",
  });
  const [pending, setPending] = useState(false);

  const addresses = Array.isArray(addressesQuery.data)
    ? addressesQuery.data
    : [];

  const activeAddressId =
    selectedAddress ??
    addresses.find((a) => a.is_default)?.id ??
    addresses[0]?.id ??
    null;

  async function submitNewAddress(
    event: React.SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    try {
      const created = await createAddress({
        ...newAddress,
        is_default: addresses.length === 0,
      });
      toast.success("آدرس اضافه شد.");
      setSelectedAddress(created.id);
      setShowNewAddress(false);
      setNewAddress({
        receiver: "",
        province: "",
        city: "",
        line: "",
        postal_code: "",
      });
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "ثبت آدرس ناموفق بود.",
      );
    }
  }

  async function checkCoupon() {
    if (!couponCode.trim()) {
      setCouponMessage(null);
      return;
    }
    try {
      await validateCoupon(couponCode);
      setCouponMessage("کد تخفیف معتبر است.");
      toast.success("کد تخفیف معتبر است.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "کد نامعتبر است.";
      setCouponMessage(msg);
      toast.error(msg);
    }
  }

  async function submitCheckout() {
    if (!activeAddressId) {
      toast.error("ابتدا یک آدرس انتخاب یا ثبت کن.");
      return;
    }
    if (!cartQuery.data || cartQuery.data.items.length === 0) {
      toast.error("سبد خرید خالی است.");
      return;
    }

    setPending(true);
    try {
      const payload: { address_id: number; coupon_code?: string } = {
        address_id: activeAddressId,
      };
      const trimmedCoupon = couponCode.trim();
      if (trimmedCoupon) {
        payload.coupon_code = trimmedCoupon;
      }

      const order = await apiCheckout(payload);

      const paymentResult = await processPayment({
        order_id: order.id,
        simulate_success: true,
      });

      toast.success(
        paymentResult.detail || "پرداخت و ثبت سفارش با موفقیت انجام شد.",
      );
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });

      void navigate({
        to: "/orders/$id",
        params: { id: String(order.id) },
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "ثبت سفارش ناموفق بود.",
      );
    } finally {
      setPending(false);
    }
  }

  if (cartQuery.isLoading || addressesQuery.isLoading) {
    return (
      <p className="mt-12 text-center text-muted-foreground">
        در حال بارگذاری...
      </p>
    );
  }

  if (cartQuery.isError) {
    return (
      <p className="mt-12 text-center text-destructive">
        خطا در دریافت سبد خرید. دوباره تلاش کن.
      </p>
    );
  }

  const cart = cartQuery.data;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">آدرس تحویل</h2>
          <Link to="/cart" className="text-xs font-bold text-primary">
            بازگشت به سبد
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {addresses.length === 0 && !showNewAddress && (
            <p className="text-sm text-muted-foreground">
              هنوز آدرسی ثبت نکرده‌ای. یک آدرس اضافه کن.
            </p>
          )}

          {addresses.map((address) => (
            <label
              key={address.id}
              className={
                activeAddressId === address.id
                  ? "flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4"
                  : "flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary/30"
              }
            >
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
                  {address.province}، {address.city}، {address.line} —{" "}
                  {address.postal_code}
                </p>
              </div>
            </label>
          ))}
        </div>

        {showNewAddress ? (
          <form
            onSubmit={submitNewAddress}
            className="mt-4 space-y-3 rounded-2xl border border-dashed border-border p-4"
          >
            <input
              required
              placeholder="نام گیرنده"
              value={newAddress.receiver}
              onChange={(e) =>
                setNewAddress((a) => ({ ...a, receiver: e.target.value }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="استان"
                value={newAddress.province}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, province: e.target.value }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="شهر"
                value={newAddress.city}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, city: e.target.value }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              required
              placeholder="آدرس کامل"
              value={newAddress.line}
              onChange={(e) =>
                setNewAddress((a) => ({ ...a, line: e.target.value }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="کد پستی (۱۰ رقم)"
              value={newAddress.postal_code}
              onChange={(e) =>
                setNewAddress((a) => ({ ...a, postal_code: e.target.value }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl border border-input px-4 py-2 text-sm font-bold hover:bg-accent"
              >
                ذخیره آدرس
              </button>
              <button
                type="button"
                onClick={() => setShowNewAddress(false)}
                className="rounded-xl px-4 py-2 text-sm text-muted-foreground"
              >
                انصراف
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewAddress(true)}
            className="mt-4 text-sm font-bold text-primary"
          >
            + افزودن آدرس جدید
          </button>
        )}
      </section>

      <section className="glass-panel rounded-3xl p-5">
        <h2 className="text-sm font-black">کد تخفیف</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponMessage(null);
            }}
            placeholder="مثلاً GAME10"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={checkCoupon}
            className="rounded-xl border border-input px-4 py-2 text-sm font-bold hover:bg-accent"
          >
            بررسی
          </button>
        </div>
        {couponMessage && (
          <p className="mt-2 text-xs text-muted-foreground">{couponMessage}</p>
        )}
      </section>

      {cart && (
        <section className="glass-panel rounded-3xl p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع سبد</span>
            <span className="font-bold">{toman(cart.total)} تومان</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {cart.items_count} قلم · هزینه ارسال هنگام ثبت محاسبه می‌شود
          </p>
        </section>
      )}

      <button
        onClick={submitCheckout}
        disabled={pending || !cart || cart.items.length === 0}
        className="w-full rounded-2xl px-6 py-3.5 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        style={{
          backgroundImage: "var(--gradient-neon)",
          boxShadow: "var(--shadow-neon)",
        }}
      >
        {pending ? "در حال ثبت و پرداخت..." : "ثبت نهایی و پرداخت"}
      </button>
    </div>
  );
}