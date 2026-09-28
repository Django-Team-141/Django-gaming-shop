# فروشگاه گیم‌گیر (فرانت‌اند)

React 19 + TanStack Router/Start + Tailwind CSS 4، فارسی و راست‌به‌چپ.

## اجرا

```bash
cp .env.example .env
npm install
npm run dev      # http://localhost:8080
npm run build    # نسخه production
```

`VITE_API_URL` باید به API جنگو اشاره کند (پیش‌فرض `http://127.0.0.1:8000/api`؛ فایل `backend/README.md` را ببین).

## صفحات

| مسیر | توضیح |
| --- | --- |
| `/` | صفحه اصلی: دسته‌بندی‌ها و جدیدترین محصولات |
| `/products` | فهرست محصولات با جست‌وجو، فیلتر دسته/برند و مرتب‌سازی |
| `/products/$slug` | جزئیات محصول، گالری تصویر، نظرات و ثبت نظر |
| `/login`, `/register` | ورود و ثبت‌نام |
| `/cart` | سبد خرید |
| `/checkout` | انتخاب یا ثبت آدرس و تسویه حساب |
| `/orders`, `/orders/$id` | سفارش‌های من |
| `/panel` | پنل فروشنده: فهرست محصولات من |
| `/panel/new` | ثبت محصول جدید |
| `/panel/$id` | ویرایش محصول و مدیریت تصاویر |

## ساختار

- `src/routes/__root.tsx` — چیدمان کلی، AuthProvider، متادیتا، صفحه ۴۰۴ و صفحه خطا
- `src/lib/shop-api.ts` — اتصال کامل به API (احراز هویت، کاتالوگ، سبد، سفارش، پنل فروشنده)
- `src/lib/auth-context.tsx` — نگهداری کاربر واردشده و توکن‌ها
- `src/components/site-header.tsx`, `site-footer.tsx` — هدر و فوتر مشترک
- `src/components/require-auth.tsx` — محافظت از صفحاتی که به ورود نیاز دارند
- `src/styles.css` — توکن‌های رنگ، گرادیان و فونت وزیرمتن

توکن دسترسی در حافظه نگه داشته می‌شود و با هر بارگذاری صفحه از روی refresh token (در localStorage) دوباره گرفته می‌شود.
