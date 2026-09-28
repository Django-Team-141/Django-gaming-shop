```tsx
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const footerSections = [
    {
      title: "فروشگاه",
      items: [
        { label: "صفحه اصلی", to: "/" },
        { label: "سبد خرید", to: "/cart" },
      ],
    },
    {
      title: "خدمات",
      items: [
        { label: "پیگیری سفارش", to: "/checkout" },
        { label: "تماس با ما", to: "/contact" },
      ],
    },
    {
      title: "حساب کاربری",
      items: [
        { label: "ورود", to: "/login" },
        { label: "ثبت‌نام", to: "/register" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <Link
            to="/"
            className="inline-block text-lg font-extrabold transition-colors hover:text-primary"
          >
            گیم‌گیر
          </Link>

          <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
            فروشگاه تخصصی لوازم جانبی گیمینگ. این یک نمونه‌کار نمایشی است و
            اطلاعات تماس آن واقعی نیست.
          </p>
        </div>

        {/* Footer sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <p className="font-bold">{section.title}</p>

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
        © ۱۴۰۵ گیم‌گیر — تمام حقوق محفوظ است.
      </div>
    </footer>
  );
}
```
