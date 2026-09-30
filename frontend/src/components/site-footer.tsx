import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const footerSections = [
    {
      title: "فروشگاه",
      items: [
        { label: "صفحه اصلی", to: "/" as const },
        { label: "محصولات", to: "/products" as const },
        { label: "سبد خرید", to: "/cart" as const },
      ],
    },
    {
      title: "خدمات",
      items: [
        { label: "پیگیری سفارش", to: "/orders" as const },
        { label: "پنل فروشنده", to: "/panel" as const },
        { label: "تماس با ما", to: "/contact" as const },
      ],
    },
    {
      title: "حساب کاربری",
      items: [
        { label: "ورود", to: "/login" as const },
        { label: "ثبت‌نام", to: "/register" as const },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-neon)" }}
            >
              🎮
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              گیم‌گیر
            </span>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            فروشگاه تخصصی لوازم جانبی گیمینگ. این یک نمونه‌کار نمایشی است و
            اطلاعات تماس آن واقعی نیست.
          </p>

          <p className="mt-4 text-xs font-bold text-primary">
            GAME10 · ۱۰٪ تخفیف اولین سفارش
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <p className="font-black">{section.title}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © ۱۴۰۵ گیم‌گیر — نمونه‌کار رزومه · تمام حقوق محفوظ است.
      </div>
    </footer>
  );
}