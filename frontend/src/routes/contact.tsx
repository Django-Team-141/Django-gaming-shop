import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      {
        title: "تماس با ما | گیم‌گیر",
      },
      {
        name: "description",
        content:
          "راه‌های ارتباط با گیم‌گیر، پشتیبانی خرید، پیگیری سفارش و ارسال پیام به تیم ما.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen overflow-hidden bg-background text-foreground"
    >
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,hsl(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_20%_70%,hsl(270_80%_60%/0.08),transparent_30%)]" />

          <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                پشتیبانی و ارتباط با ما
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
                با ما در
                <span className="block bg-gradient-to-l from-primary via-primary to-purple-400 bg-clip-text text-transparent">
                  ارتباط باش
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                سوالی درباره محصولات، سفارش، ارسال یا خدمات فروشگاه داری؟
                از طریق یکی از راه‌های ارتباطی زیر با ما در تماس باش. تیم
                پشتیبانی گیم‌گیر آماده پاسخ‌گویی به توست.
              </p>
            </div>
          </div>
        </section>

        {/* Contact cards */}
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ContactCard
              icon="☎"
              title="تماس تلفنی"
              description="پشتیبانی و مشاوره خرید"
              value="021-12345678"
              href="tel:+982112345678"
            />

            <ContactCard
              icon="✉"
              title="ایمیل"
              description="پاسخ‌گویی به درخواست‌ها"
              value="support@gamingear.ir"
              href="mailto:support@gamingear.ir"
            />

            <ContactCard
              icon="◷"
              title="ساعات پاسخ‌گویی"
              description="شنبه تا پنجشنبه"
              value="۹ تا ۲۱"
            />

            <ContactCard
              icon="⌖"
              title="دفتر مرکزی"
              description="تهران، مرکز شهر"
              value="خیابان نمونه، پلاک ۱۲"
            />
          </div>
        </section>

        {/* Main contact area */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Form */}
            <div className="glass-panel rounded-3xl p-5 md:p-8">
              <div className="mb-7">
                <p className="text-sm font-bold text-primary">
                  پیام مستقیم
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  پیام خودت را برای ما بفرست
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  فرم زیر نمایشی است و برای نسخه فعلی سایت نیازی به ارسال
                  واقعی اطلاعات ندارد.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-xl text-emerald-400">
                    ✓
                  </div>

                  <h3 className="mt-4 font-black">
                    پیام شما دریافت شد
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    ممنون که با گیم‌گیر در ارتباط هستی. تیم پشتیبانی
                    درخواستت را بررسی خواهد کرد.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-5 rounded-xl border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-accent"
                  >
                    ارسال پیام جدید
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="نام و نام خانوادگی"
                      name="name"
                      placeholder="مثلاً علی رضایی"
                      required
                    />

                    <Field
                      label="ایمیل"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <Field
                    label="موضوع"
                    name="subject"
                    placeholder="موضوع پیام"
                    required
                  />

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-bold"
                    >
                      پیام
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      placeholder="پیامت را اینجا بنویس..."
                      className="w-full resize-none rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl px-5 py-3.5 text-sm font-black text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      backgroundImage: "var(--gradient-neon)",
                      boxShadow: "var(--shadow-neon)",
                    }}
                  >
                    ارسال پیام
                  </button>
                </form>
              )}
            </div>

            {/* Information */}
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 md:p-8">
                <p className="text-sm font-bold text-primary">
                  قبل از تماس
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  سوالت را سریع‌تر حل کن
                </h2>

                <div className="mt-6 space-y-4">
                  <InfoItem
                    number="01"
                    title="پیگیری سفارش"
                    text="برای پیگیری سفارش، شماره سفارش خود را آماده داشته باش."
                  />

                  <InfoItem
                    number="02"
                    title="مشاوره خرید"
                    text="اگر بین چند محصول مردد هستی، مشخصات و بودجه‌ات را بگو."
                  />

                  <InfoItem
                    number="03"
                    title="مشکل فنی"
                    text="مدل محصول و شرح دقیق مشکل باعث پاسخ سریع‌تر می‌شود."
                  />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
                <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative">
                  <p className="text-sm font-bold text-primary">
                    پشتیبانی گیمینگ
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    برای انتخاب تجهیزات مناسب کمکت می‌کنیم
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    انتخاب موس، کیبورد، هدست یا سایر تجهیزات گیمینگ همیشه
                    فقط به مشخصات روی کاغذ محدود نمی‌شود. اگر نیاز به
                    راهنمایی داری، با ما تماس بگیر.
                  </p>

                  <a
                    href="tel:+982112345678"
                    className="mt-5 inline-flex rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    تماس با پشتیبانی
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/50 bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-primary">
                سوالات متداول
              </p>

              <h2 className="mt-2 text-3xl font-black">
                قبل از تماس این موارد را ببین
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Faq
                question="چطور وضعیت سفارش را پیگیری کنم؟"
                answer="بعد از ثبت سفارش می‌توانی اطلاعات سفارش را از بخش سفارش‌های حساب کاربری بررسی کنی."
              />

              <Faq
                question="آیا امکان مشاوره قبل از خرید وجود دارد؟"
                answer="بله. می‌توانی از طریق تلفن یا ایمیل با تیم پشتیبانی تماس بگیری."
              />

              <Faq
                question="فرم تماس واقعاً پیام را ارسال می‌کند؟"
                answer="در نسخه فعلی این صفحه نمایشی است و پیام به سرور ارسال نمی‌شود."
              />

              <Faq
                question="چه زمانی پاسخ دریافت می‌کنم؟"
                answer="تیم پشتیبانی در ساعات کاری مشخص‌شده درخواست‌ها را بررسی می‌کند."
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  value,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="font-black">{title}</h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>

        <p className="mt-2 truncate text-sm font-bold text-primary">
          {value}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="glass-panel flex items-start gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="glass-panel flex items-start gap-4 rounded-2xl p-5">
      {content}
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function InfoItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-xs font-black text-primary">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-black">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-2xl border border-border bg-card/40 p-5">
      <summary className="cursor-pointer list-none text-sm font-black marker:hidden">
        <div className="flex items-center justify-between gap-4">
          <span>{question}</span>

          <span className="text-lg text-primary transition-transform group-open:rotate-45">
            +
          </span>
        </div>
      </summary>

      <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
        {answer}
      </p>
    </details>
  );
}