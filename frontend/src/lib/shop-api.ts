/**
 * اتصال قالب سایت به API جنگو (backend/).
 * آدرس بک‌اند از VITE_API_URL خوانده می‌شود؛ پیش‌فرض سرور محلی جنگو.
 */
export const API_URL = (
  import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  price: number;
  discount_price: number | null;
  final_price: number;
  stock: number;
  in_stock: boolean;
  is_wireless: boolean;
  switch_type: string | null;
  main_image: string | null;
  rating: number | null;
  reviews_count: number;
};

export type ApiProductImage = {
  id: number;
  image: string;
  alt: string;
  is_main: boolean;
};

export type ApiProductDetail = ApiProduct & {
  description: string;
  specs: Record<string, string>;
  weight_grams: number | null;
  images: ApiProductImage[];
  seller_name: string | null;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  product_count: number;
};

export type ApiBrand = {
  id: number;
  name: string;
  slug: string;
};

export type ProductStatus = "pending" | "approved" | "rejected";

export type SellerProduct = {
  id: number;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  brand: number;
  brand_name: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  switch_type: string;
  weight_grams: number | null;
  is_wireless: boolean;
  specs: Record<string, string>;
  is_active: boolean;
  status: ProductStatus;
  status_label: string;
  rejection_reason: string;
  images: ApiProductImage[];
  created_at: string;
  updated_at: string;
};

export type SellerProductInput = {
  name: string;
  category: number;
  brand: number;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  switch_type: string;
  weight_grams: number | null;
  is_wireless: boolean;
  is_active: boolean;
  specs: Record<string, string>;
};

export type Address = {
  id: number;
  receiver: string;
  province: string;
  city: string;
  line: string;
  postal_code: string;
  is_default: boolean;
};

export type CartItem = {
  id: number;
  product: ApiProduct;
  quantity: number;
  line_total: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  items_count: number;
  total: number;
};

export type OrderItem = {
  id: number;
  product: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Payment = {
  id: number;
  amount: number;
  status: string;
  status_label: string;
  reference_id: string | null;
  gateway: string;
  created_at: string;
};

export type Order = {
  id: number;
  status: string;
  status_label: string;
  tracking_code: string;
  items_total: number;
  discount_total: number;
  shipping_cost: number;
  grand_total: number;
  items: OrderItem[];
  payments?: Payment[];
  created_at: string;
};

export type CouponValidation = {
  code: string;
  percent: number;
  max_amount: number | null;
  discount_amount: number;
  cart_total: number;
  payable_amount: number;
};

export type PaymentResult = {
  detail: string;
  status?: string;
  reference_id?: string;
  payment_id?: number;
  order?: Order;
};

export type Review = {
  id: number;
  product: number;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  is_approved: boolean;
  created_at: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(extractMessage(body) ?? `درخواست با خطای ${status} مواجه شد.`);
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;

  for (const key of ["detail", "non_field_errors"]) {
    const value = record[key];

    if (typeof value === "string") return value;

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
}

// --- نگهداری توکن ---------------------------------------------------------

const REFRESH_KEY = "gg_refresh";
let accessToken: string | null = null;

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string, refresh?: string): void {
  accessToken = access;

  if (refresh && typeof window !== "undefined") {
    window.localStorage.setItem(REFRESH_KEY, refresh);
  }
}

function clearTokens(): void {
  accessToken = null;

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function isLoggedIn(): boolean {
  return Boolean(accessToken ?? getRefreshToken());
}

// --- هسته درخواست‌ها --------------------------------------------------

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal | undefined;
};

// چند درخواست همزمان باید فقط یک refresh بزنند؛ بک‌اند refresh token را
// بعد از هر استفاده باطل می‌کند و بار دوم ۴۰۱ می‌گیرد.
let refreshInFlight: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = doRefreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function doRefreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new ApiError(401, { detail: "ابتدا وارد شوید." });
  }

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    throw new ApiError(401, await safeJson(response));
  }

  const data = (await response.json()) as {
    access: string;
    refresh?: string;
  };

  setTokens(data.access, data.refresh);

  return data.access;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options;

  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;

  const run = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (!isForm && body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (auth) {
      if (!accessToken) {
        accessToken = await refreshAccessToken().catch(() => null);
      }

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      requestInit.body = isForm
        ? (body as FormData)
        : JSON.stringify(body);
    }

    if (signal !== undefined) {
      requestInit.signal = signal;
    }

    return fetch(`${API_URL}${path}`, requestInit);
  };

  let response = await run();

  if (response.status === 401 && auth && getRefreshToken()) {
    try {
      await refreshAccessToken();
      response = await run();
    } catch {
      // اگر تازه‌سازی هم شکست بخورد، همان خطای ۴۰۱ اصلی برگردانده می‌شود.
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw new ApiError(response.status, await safeJson(response));
  }

  return (await response.json()) as T;
}

// --- احراز هویت ------------------------------------------------------

export type CurrentUser = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  is_staff: boolean;
  date_joined: string;
};

export async function login(
  email: string,
  password: string,
): Promise<CurrentUser> {
  const tokens = await request<{
    access: string;
    refresh: string;
  }>("/auth/login/", {
    method: "POST",
    body: { email, password },
  });

  setTokens(tokens.access, tokens.refresh);

  return fetchMe();
}

export async function register(payload: {
  email: string;
  full_name: string;
  phone: string;
  password: string;
  password_confirm: string;
}): Promise<void> {
  await request("/auth/register/", {
    method: "POST",
    body: payload,
  });
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();

  clearTokens();

  if (refresh) {
    await request("/auth/logout/", {
      method: "POST",
      body: { refresh },
    }).catch(() => undefined);
  }
}

export async function fetchMe(
  signal?: AbortSignal,
): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me/", {
    auth: true,
    signal,
  });
}

export async function updateMe(payload: {
  full_name?: string;
  phone?: string;
}): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me/", {
    method: "PATCH",
    auth: true,
    body: payload,
  });
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  const tokens = await request<{
    access: string;
    refresh: string;
  }>("/auth/change-password/", {
    method: "POST",
    auth: true,
    body: payload,
  });

  setTokens(tokens.access, tokens.refresh);
}

// --- آدرس‌ها -----------------------------------------------------------

export async function fetchAddresses(
  signal?: AbortSignal,
): Promise<Address[]> {
  const data = await request<Address[] | Paginated<Address>>(
    "/auth/addresses/",
    {
      auth: true,
      signal,
    },
  );

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export async function createAddress(
  payload: Omit<Address, "id">,
): Promise<Address> {
  return request<Address>("/auth/addresses/", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function deleteAddress(id: number): Promise<void> {
  await request(`/auth/addresses/${id}/`, {
    method: "DELETE",
    auth: true,
  });
}

// --- کاتالوگ عمومی -----------------------------------------------------

export type ProductFilters = {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  is_wireless?: boolean;
  ordering?: string;
  page?: number;
};

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();

  return query ? `?${query}` : "";
}

export async function fetchProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal,
): Promise<Paginated<ApiProduct>> {
  return request<Paginated<ApiProduct>>(`/products/${toQuery(filters)}`, {
    signal,
  });
}

export async function fetchProduct(
  slug: string,
  signal?: AbortSignal,
): Promise<ApiProductDetail> {
  return request<ApiProductDetail>(`/products/${slug}/`, { signal });
}

export async function fetchCategories(
  signal?: AbortSignal,
): Promise<ApiCategory[]> {
  return request<ApiCategory[]>("/categories/", { signal });
}

export async function fetchBrands(
  signal?: AbortSignal,
): Promise<ApiBrand[]> {
  return request<ApiBrand[]>("/brands/", { signal });
}

export async function fetchReviews(
  productId: number,
  signal?: AbortSignal,
): Promise<Paginated<Review>> {
  return request<Paginated<Review>>(
    `/reviews/${toQuery({ product: productId })}`,
    { signal },
  );
}

export async function createReview(payload: {
  product: number;
  rating: number;
  title: string;
  body: string;
}): Promise<Review> {
  return request<Review>("/reviews/", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

// --- سبد خرید ------------------------------------------------------------

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  return request<Cart>("/cart/", { auth: true, signal });
}

export async function addToCart(
  productId: number,
  quantity = 1,
): Promise<CartItem> {
  return request<CartItem>("/cart/items/", {
    method: "POST",
    auth: true,
    body: { product_id: productId, quantity },
  });
}

export async function updateCartItem(
  id: number,
  quantity: number,
): Promise<CartItem> {
  return request<CartItem>(`/cart/items/${id}/`, {
    method: "PATCH",
    auth: true,
    body: { quantity },
  });
}

export async function removeCartItem(id: number): Promise<void> {
  await request(`/cart/items/${id}/`, {
    method: "DELETE",
    auth: true,
  });
}

// --- تسویه حساب و سفارش‌ها ------------------------------------------------

export async function checkout(payload: {
  address_id: number;
  coupon_code?: string;
}): Promise<Order> {
  return request<Order>("/checkout/", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** مسیر واقعی بک‌اند: POST /api/coupons/validate/ */
export async function validateCoupon(
  code: string,
): Promise<CouponValidation> {
  return request<CouponValidation>("/coupons/validate/", {
    method: "POST",
    auth: true,
    body: { code },
  });
}

/** مسیر واقعی بک‌اند: POST /api/payments/process/ */
export async function processPayment(payload: {
  order_id: number;
  simulate_success?: boolean;
}): Promise<PaymentResult> {
  return request<PaymentResult>("/payments/process/", {
    method: "POST",
    auth: true,
    body: {
      order_id: payload.order_id,
      simulate_success: payload.simulate_success ?? true,
    },
  });
}

export async function fetchOrders(
  signal?: AbortSignal,
): Promise<Paginated<Order>> {
  return request<Paginated<Order>>("/orders/", {
    auth: true,
    signal,
  });
}

export async function fetchOrder(
  id: number,
  signal?: AbortSignal,
): Promise<Order> {
  return request<Order>(`/orders/${id}/`, {
    auth: true,
    signal,
  });
}

// --- پنل فروشنده -----------------------------------------------------------

export async function fetchMyProducts(
  signal?: AbortSignal,
): Promise<SellerProduct[]> {
  return request<SellerProduct[]>("/panel/products/", {
    auth: true,
    signal,
  });
}

export async function fetchMyProduct(
  id: number,
  signal?: AbortSignal,
): Promise<SellerProduct> {
  return request<SellerProduct>(`/panel/products/${id}/`, {
    auth: true,
    signal,
  });
}

export async function createMyProduct(
  payload: SellerProductInput,
): Promise<SellerProduct> {
  return request<SellerProduct>("/panel/products/", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function updateMyProduct(
  id: number,
  payload: Partial<SellerProductInput>,
): Promise<SellerProduct> {
  return request<SellerProduct>(`/panel/products/${id}/`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
}

export async function deleteMyProduct(id: number): Promise<void> {
  await request(`/panel/products/${id}/`, {
    method: "DELETE",
    auth: true,
  });
}

export async function uploadProductImage(
  productId: number,
  file: File,
  options: { alt?: string; isMain?: boolean } = {},
): Promise<ApiProductImage> {
  const form = new FormData();

  form.set("image", file);

  if (options.alt) {
    form.set("alt", options.alt);
  }

  if (options.isMain) {
    form.set("is_main", "true");
  }

  return request<ApiProductImage>(`/panel/products/${productId}/images/`, {
    method: "POST",
    auth: true,
    body: form,
  });
}

export async function setMainImage(
  productId: number,
  imageId: number,
): Promise<ApiProductImage> {
  return request<ApiProductImage>(
    `/panel/products/${productId}/images/${imageId}/`,
    {
      method: "PATCH",
      auth: true,
      body: { is_main: true },
    },
  );
}

export async function deleteProductImage(
  productId: number,
  imageId: number,
): Promise<void> {
  await request(`/panel/products/${productId}/images/${imageId}/`, {
    method: "DELETE",
    auth: true,
  });
}

/** آدرس کامل تصویر؛ اگر بک‌اند مسیر نسبی برگرداند به آن دامنه اضافه می‌شود. */
export function mediaUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const origin = API_URL.replace(/\/api$/, "");

  return `${origin}${path}`;
}