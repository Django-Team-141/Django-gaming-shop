# 🎮 Gaming Gear E-Commerce Platform

فروشگاه کامل لوازم جانبی گیمینگ — بک‌اند Django + DRF و فرانت‌اند React 19.

## ✨ ویژگی‌های فنی مهم

- **Checkout اتمی:** قفل ردیف با `select_for_update` برای جلوگیری از race condition روی موجودی
- **کوپن امن:** مدل `CouponUsage` + محدودیت تعداد استفاده کل و به ازای هر کاربر
- **ضد بروت‌فورس:** `django-axes` (قفل حساب بعد از ۵ تلاش ناموفق)
- **پرداخت Mock:** چرخه کامل `PENDING → PAID / FAILED`
- **بازگردانی موجودی:** دستور `cancel_expired_orders` برای سفارش‌های پرداخت‌نشده منقضی‌شده
- **پنل فروشنده:** ثبت محصول با تأیید ادمین + آپلود تصویر (WebP)
- **امنیت:** JWT با rotation و blacklist، CORS محدود، HSTS در production

## 🛠 Tech Stack

| لایه | تکنولوژی |
|------|----------|
| Backend | Python 3.12, Django 5, DRF, SimpleJWT, django-axes, PostgreSQL / SQLite |
| Frontend | React 19, TypeScript, TanStack Start/Router, TanStack Query, Tailwind CSS 4 |
| DevOps | Docker, Docker Compose, GitHub Actions |

## 🚀 اجرا با Docker (پیشنهادی)

```bash
docker-compose up --build