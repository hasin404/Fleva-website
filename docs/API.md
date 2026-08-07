# FLEVA — API Documentation

Base URL: `/api/v1`

All API responses follow the format:
```json
{ "success": true, "data": {} }
```
On error:
```json
{ "success": false, "message": "Error description" }
```

---

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | — |
| POST | `/auth/login` | Login (returns JWT + refresh token) | — |
| POST | `/auth/logout` | Logout (clears refresh token cookie) | — |
| POST | `/auth/refresh` | Refresh access token | Cookie |
| POST | `/auth/forgot-password` | Send OTP to email | — |
| POST | `/auth/reset-password` | Reset password with OTP | — |
| POST | `/auth/verify-email` | Verify email with OTP | — |
| GET | `/auth/me` | Get current user profile | JWT |
| PUT | `/auth/profile` | Update profile | JWT |
| PUT | `/auth/password` | Change password | JWT |
| POST | `/auth/address` | Add shipping address | JWT |
| DELETE | `/auth/address/:id` | Delete address | JWT |

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "success": true,
  "accessToken": "eyJ...",
  "user": { "name": "John", "email": "user@example.com", "role": "user" }
}
```

---

## Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List products (paginated, filterable) | — |
| GET | `/products/:id` | Get single product | — |
| GET | `/products/slug/:slug` | Get product by slug | — |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

### Query Parameters
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20)
- `category` — Filter by category ID
- `search` — Text search
- `sort` — Sort field: `price`, `-price`, `rating`, `newest`
- `minPrice`, `maxPrice` — Price range filter
- `featured` — Boolean, filter featured products
- `bestseller` — Boolean, filter best sellers

---

## Search

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/search` | Full-text product search | — |
| GET | `/search/suggest` | Autocomplete suggestions | — |

### Search Query Parameters
- `q` — Search term
- `category`, `brand`, `minPrice`, `maxPrice`, `rating`, `availability`, `tags`
- `sort` — `relevance`, `newest`, `oldest`, `price-asc`, `price-desc`, `popularity`, `rating`, `discount`
- `page`, `limit`

---

## Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/orders` | Create order | JWT/Guest |
| GET | `/orders/my` | Get user's orders | JWT |
| GET | `/orders/:id` | Get single order | JWT |
| GET | `/orders/admin/all` | List all orders (admin) | Admin |
| PUT | `/orders/:id/status` | Update order status | Admin |
| PUT | `/orders/:id/cancel` | Cancel order | JWT |

### Create Order Request
```json
{
  "items": [{ "product": "productId", "qty": 2 }],
  "shippingAddress": {
    "name": "John", "phone": "01XXXXXXXXX", "email": "john@example.com",
    "street": "123 Main St", "city": "Dhaka", "zip": "1000"
  },
  "paymentMethod": "bkash"
}
```

---

## Cart (Server-side — logged-in users)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/cart` | Get user's cart | JWT |
| POST | `/cart/add` | Add item to cart | JWT |
| PUT | `/cart/update` | Update item quantity | JWT |
| DELETE | `/cart/remove/:productId` | Remove item | JWT |
| DELETE | `/cart/clear` | Clear entire cart | JWT |

---

## Wishlist

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wishlist` | Get user's wishlist | JWT |
| POST | `/wishlist/toggle` | Add/remove product from wishlist | JWT |

---

## Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reviews/:productId` | Get reviews for a product | — |
| POST | `/reviews/:productId` | Create review | JWT |
| PUT | `/reviews/:reviewId` | Update review | JWT |
| DELETE | `/reviews/:reviewId` | Delete review | JWT/Admin |
| PUT | `/reviews/:reviewId/approve` | Approve/reject review | Admin |
| POST | `/reviews/:reviewId/reply` | Reply to review | Admin |

---

## Coupons

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/coupons` | List coupons | Admin |
| GET | `/coupons/:id` | Get coupon details | Admin |
| POST | `/coupons` | Create coupon | Admin |
| PUT | `/coupons/:id` | Update coupon | Admin |
| DELETE | `/coupons/:id` | Delete coupon | Admin |
| POST | `/coupons/validate` | Validate coupon code | JWT |

---

## Banners

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/banners` | List active banners | — |
| GET | `/banners/:id` | Get banner | Admin |
| POST | `/banners` | Create banner | Admin |
| PUT | `/banners/:id` | Update banner | Admin |
| DELETE | `/banners/:id` | Delete banner | Admin |

---

## Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/cod` | Process Cash on Delivery | JWT |
| POST | `/payments/mobile` | Process bKash/Nagad payment | JWT |
| POST | `/payments/stripe/create-intent` | Create Stripe payment intent | JWT |
| POST | `/payments/sslcommerz/init` | Initialize SSLCommerz payment | JWT |
| POST | `/payments/verify` | Payment webhook/verification | — |

---

## Tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tracking/:orderNumber` | Track order by number | — |
| GET | `/tracking/my/:orderId` | Track logged-in user's order | JWT |

---

## Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | Get user's notifications | JWT |
| PUT | `/notifications/:id/read` | Mark as read | JWT |
| PUT | `/notifications/read-all` | Mark all as read | JWT |

---

## Analytics (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/analytics/dashboard` | Dashboard stats | Admin |
| GET | `/analytics/sales` | Sales breakdown | Admin |
| GET | `/analytics/products` | Product performance | Admin |

---

## Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/customers` | List customers | Admin |
| PUT | `/admin/customers/:id` | Update customer (lock/role) | Admin |
| GET | `/admin/activity-logs` | View activity logs | Admin |

---

## AI Assistant

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai/chat` | Send message to AI assistant | — |

### Chat Request
```json
{
  "message": "What are your best sellers?",
  "sessionId": "optional-session-id"
}
```

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

---

## Authentication Flow

1. **Signup** → Receive verification OTP via email
2. **Verify Email** → Account activated
3. **Login** → Receive `accessToken` (15min) + `refreshToken` (7d, HTTP-only cookie)
4. **API Requests** → Send `Authorization: Bearer <accessToken>` header
5. **Token Expired** → Call `/auth/refresh` to get new access token
6. **Logout** → Refresh token cookie cleared

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request / validation error |
| 401 | Unauthorized / token expired |
| 403 | Forbidden / insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate entry) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
