# گیم‌گیر — فروشگاه لوازم جانبی گیمینگ

پروژه کامل یک فروشگاه اینترنتی فارسی (RTL) با تمرکز بر امنیت:

- `backend/` — Django 5 + Django REST Framework (کاربر سفارشی، JWT، کاتالوگ، سبد و سفارش، نظرات)
- `frontend/` — قالب فروشگاه با React + TanStack Start + Tailwind که داده‌ها را از API می‌خواند

## ۱. اجرای بک‌اند

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # ویندوز: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # SECRET_KEY را عوض کن
python manage.py migrate
python manage.py seed_demo     # داده نمونه
python manage.py createsuperuser
python manage.py runserver
```

- پنل مدیریت: http://127.0.0.1:8000/admin/
- مستندات API: http://127.0.0.1:8000/api/docs/
- تست‌ها: `pytest`

جزئیات بیشتر در `backend/README.md`.

## ۲. اجرای فرانت‌اند

```bash
cd frontend
cp .env.example .env           # آدرس API
npm install                    # یا bun install
npm run dev                    # http://localhost:8080
```

آدرس فرانت‌اند باید در `CORS_ALLOWED_ORIGINS` فایل `backend/.env` باشد، وگرنه مرورگر داده‌ها را نمی‌گیرد.

## نکته‌های امنیتی پیاده‌شده

- رمزها و کلیدها فقط در `.env`
- JWT با عمر کوتاه و چرخش refresh
- محدودیت نرخ درخواست و قفل حساب پس از ۵ ورود ناموفق (django-axes)
- CORS و CSRF محدود به دامنه‌های مشخص
- HSTS، ریدایرکت HTTPS و کوکی امن در حالت production
- مجوز دقیق روی هر endpoint؛ سبد، آدرس و سفارش فقط برای مالک
- کاهش موجودی انبار در تراکنش اتمی با `select_for_update`
- ثبت نظر فقط برای خریدار واقعی و پس از تأیید ادمین
