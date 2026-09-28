# 🎮 Gaming Gear E-Commerce Platform

A production-ready full-stack e-commerce web application designed for gaming peripherals, featuring atomic concurrency control, stock reservation, dynamic specifications, and rate-limiting security.

## ✨ Key Technical Highlights

- **Concurrency-Safe Checkout:** Uses database row-level locking (`select_for_update`) to prevent race conditions during high-demand inventory checkout.
- **Coupon Lifecycle & Rate Limits:** Prevents duplicate coupon abuse with `CouponUsage` ledger and concurrency-safe quota validation.
- **Brute-Force & Security Protection:** Protected via `django-axes` against credential stuffing, enforced CORS whitelisting, and strict security headers.
- **Debounced Live Search & Query Invalidation:** Instant client-side state synchronization with TanStack Query.
- **Automated Inventory Restocking:** Background command to release reserved stock from unfulfilled/expired pending orders.
- **Mock Payment Gateway:** Full transaction life-cycle handling (`PENDING` ➔ `PAID` / `FAILED`).

## 🛠 Tech Stack

- **Backend:** Python 3.12, Django 5, Django REST Framework, SimpleJWT, PostgreSQL / SQLite.
- **Frontend:** React 19, TypeScript, TanStack Start, Tailwind CSS.
- **Containerization:** Docker & Docker Compose.

## 🚀 Quick Start with Docker

```bash
docker-compose up --build

The API will be available at http://localhost:8000/api/ and the interactive OpenAPI documentation at http://localhost:8000/api/docs/