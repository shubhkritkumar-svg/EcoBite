# EcoBite API reference

Base URL: `http://localhost:5000/api`

All requests and responses use JSON. Protected routes require:

```
Authorization: Bearer <jwt>
```

Tokens are issued by the register/login endpoints and expire after 7 days by default.

## Conventions

### Error format

Validation and application errors return the same shape:

```json
{
  "message": "Please check the highlighted fields.",
  "errors": [{ "field": "password", "message": "Password must include a number" }]
}
```

`errors` is present only when field-level details exist. Status codes used: `400` bad input,
`401` missing/invalid session, `403` wrong role or origin, `404` missing resource, `409` conflict
(duplicate email, restaurant with order history), `429` rate limited, `500` unexpected.

### Rate limits

| Scope | Limit |
| --- | --- |
| All `/api/*` routes except health and auth | 1000 requests / 15 min per IP |
| `/api/auth/register` and `/api/auth/login` | 40 requests / 15 min per IP |
| `GET /api/health` | Not rate limited |

Rate-limited responses still use the `{ "message": ... }` shape.

### Money and eco values

- All amounts are integers in Indian rupees (INR).
- Delivery: ₹25, free when the item subtotal is ₹499 or more. Packaging: ₹10. GST: 5% of the item subtotal.
- The server recomputes prices, totals and carbon savings from MongoDB data; client-sent prices are ignored.
- Payments and delivery tracking are simulations. Order responses include `"simulated": true` on the
  tracking endpoint and `paymentStatus: "simulated_paid"` (or `"pending"` for cash on delivery).

## Health

### `GET /health`

No auth. Returns API status, environment, uptime and a note that payments/tracking are simulated.

```json
{
  "status": "ok",
  "name": "EcoBite API",
  "environment": "development",
  "simulation": "Payments, delivery tracking and GPS are simulated for this demo.",
  "uptimeSeconds": 42,
  "time": "2026-11-23T17:25:00.000Z"
}
```

## Authentication — `/auth`

### `POST /auth/register`

Body:

```json
{ "name": "Asha Rao", "email": "asha@example.com", "password": "Green1234", "phone": "9876543210" }
```

Rules: name 2–60 chars; valid email; password 8–72 chars with at least one letter and one digit;
phone optional, 10 digits starting 6–9. Returns `201` with `{ token, user }`. Duplicate email → `409`.

### `POST /auth/login`

```json
{ "email": "demo@ecobite.in", "password": "Demo@123" }
```

Returns `200` with `{ token, user }`. Wrong credentials return the same generic `401`
(`Incorrect email or password.`) regardless of which field was wrong. Responses never include the
password hash.

### `GET /auth/me`

Auth required. Returns `{ user }` for the current token.

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo@ecobite.in` | `Demo@123` |
| Admin | `admin@ecobite.in` | `Admin@123` |

## Users — `/users`

All routes require auth and act on the signed-in user.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/users/me` | Return the current user |
| `PATCH` | `/users/me` | Update `name` and/or `phone` |
| `POST` | `/users/me/addresses` | Add a delivery address |
| `DELETE` | `/users/me/addresses/:addressId` | Delete an address |

Address body:

```json
{ "label": "Home", "line1": "Flat 402, Lotus Residency, 12th Main", "area": "Indiranagar", "city": "Bengaluru", "pincode": "560038", "isDefault": true }
```

`line1` 5–160 chars, area/city 2–80, pincode 6 digits starting 1–9. The first address becomes the
default automatically; setting a new default clears the flag on others. Deleting the default promotes
the next saved address.

## Restaurants — `/restaurants`

### `GET /restaurants`

Public. Query parameters (all optional):

| Parameter | Values | Notes |
| --- | --- | --- |
| `search` | text | Matches name, area, cuisine or description (case-insensitive, regex-escaped) |
| `cuisine` | cuisine name or `All` | Exact cuisine match |
| `eco` | `true` / `false` | Only Eco Certified kitchens when `true` |
| `sort` | `recommended`, `rating`, `delivery`, `price_low`, `price_high` | Defaults to rating |

Response: `{ count, restaurants }`. Only active restaurants are returned (max 60).

### `GET /restaurants/cuisines`

Public. Returns `{ cuisines: string[] }` — the distinct cuisines of active restaurants.

### `GET /restaurants/:slug`

Public. Returns the restaurant and its full menu:

```json
{ "restaurant": { "name": "The Green Tiffin", "slug": "the-green-tiffin", "...": "..." }, "menu": [] }
```

Unknown or inactive slug → `404`.

### Admin restaurant writes

Requires an admin token.

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/restaurants` | Restaurant fields; `slug` optional (generated from the name) |
| `PUT` | `/restaurants/:id` | Any subset of restaurant fields |
| `DELETE` | `/restaurants/:id` | — |

Restaurant representation includes: `name`, `slug`, `description`, `cuisines[]`, `area`, `city`,
`image`, `rating`, `ratingCount`, `priceForTwo`, `deliveryTimeMins`, `distanceKm`, `isEcoCertified`,
`ecoCriteria[]`, `deliveryModes[]` (`standard`/`ev`/`bicycle`), `packagingOptions[]`
(`standard`/`compostable`/`reusable`), `isActive`.

Deleting a restaurant that has order history returns `409`. Deactivate it instead (`isActive: false`).

## Menu items — `/menu-items`

### `GET /menu-items?restaurantId=<id>`

Public. `restaurantId` is required (`400` otherwise). Optional `category` and `veg=true`.
Returns `{ count, items }` sorted by category then popularity.

### Admin menu writes

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/menu-items` | Requires `restaurant`, `name`, `description`, `price`, `category`, `image` |
| `PUT` | `/menu-items/:id` | Any subset except `restaurant` |
| `DELETE` | `/menu-items/:id` | — |

`category` is one of `Starters`, `Mains`, `Breads`, `Rice & Biryani`, `Desserts`, `Drinks`.
`price` is an integer between 1 and 5000. Optional fields: `isVeg`, `isVegan`, `spiceLevel`
(`None`/`Mild`/`Medium`/`Hot`), `calories`, `available`, `popularity`.

## Orders — `/orders`

All order routes require auth. Customers can only read/modify their own orders; admins can access
all orders. Other users' orders return `403`.

### `POST /orders`

Place an order. Send item ids, quantities and preferences only — **not** prices or totals.

```json
{
  "restaurantId": "65f1c2a9b7e4d6f8a1b2c3d4",
  "items": [{ "menuItemId": "65f1c2a9b7e4d6f8a1b2c3d5", "quantity": 1 }],
  "addressId": "65f1c2a9b7e4d6f8a1b2c3d6",
  "contactPhone": "9876543210",
  "deliveryMode": "bicycle",
  "packaging": "compostable",
  "cutlery": false,
  "paymentMethod": "demo_upi"
}
```

- Provide either `addressId` (a saved address) or an inline `address` object; optionally `saveAddress: true`.
- `deliveryMode` must be offered by the restaurant; `packaging` must be in its `packagingOptions`.
- Quantity per item: 1–10; at most 25 line items; all items must belong to the chosen restaurant.
- `paymentMethod`: `demo_upi`, `demo_card` or `cash_on_delivery` (the latter starts as `pending`;
  the two demo methods start as `simulated_paid`).

Response `201`:

```json
{
  "order": {
    "id": "65f1c2a9b7e4d6f8a1b2c3d4",
    "status": "placed",
    "itemTotal": 249,
    "deliveryFee": 25,
    "packagingFee": 10,
    "taxes": 12,
    "total": 296,
    "eco": {
      "baselineCo2Kg": 0.192,
      "actualCo2Kg": 0.025,
      "co2SavedKg": 0.167,
      "greenPointsEarned": 25,
      "distanceKm": 2.4
    },
    "statusHistory": [{ "status": "placed", "at": "..." }]
  },
  "greenPointsEarned": 25
}
```

Placing an eco order also creates a `Reward` ledger entry and increments the user's `greenPoints`
and `lifetimeSavingsKg`. The UI derives the display code shown to users (`EB-CIC03E`) from the last
six characters of the order id; the API itself returns the full `id`.

### `GET /orders?page=1`

Auth required. Returns the current user's orders, newest first, 10 per page:

```json
{ "orders": [], "total": 3, "page": 1, "pages": 1 }
```

### `GET /orders/:id`

Auth required. Returns `{ order }` with a small restaurant summary. Owner or admin only.

### `POST /orders/:id/advance`

Owner or admin. Moves a simulated order one step forward:
`placed → confirmed → preparing → out_for_delivery → delivered`.
Delivered and cancelled orders cannot advance. Response includes `"simulated": true`.

### `PATCH /orders/:id/cancel`

Owner or admin. Cancels an order that is not delivered or already cancelled and reverses any Green
Points already awarded. A simulated payment is marked `refund_simulated`.

## Rewards — `/rewards`

### `GET /rewards/summary`

Auth required. Returns:

```json
{
  "greenPoints": 145,
  "lifetimeSavingsKg": 0.93,
  "tier": { "name": "Sprout", "next": "Sapling", "nextAt": 250 },
  "progress": 58,
  "orderCount": 4,
  "ecoOrderCount": 3,
  "treesEquivalent": 0.04,
  "savingsByMode": [{ "_id": "bicycle", "orders": 2, "saved": 0.51 }],
  "assumptions": { "petrolTwoWheelerKgPerKm": 0.05, "...": "..." },
  "ledger": []
}
```

`treesEquivalent` uses a rough 21 kg CO₂ per tree-year. `progress` is the percentage towards the next tier.

### `GET /rewards?page=1`

Auth required. Paginated Green Points ledger, 25 entries per page.

## Admin — `/admin`

Every route requires an admin token.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/stats` | Dashboard counters and the six most recent orders |
| `GET` | `/admin/orders?status=&search=&page=` | All orders, newest first; 12 per page |
| `GET` | `/admin/restaurants` | All restaurants with `menuItemCount` |
| `PATCH` | `/admin/orders/:id/status` | Set an order's status |

`GET /admin/stats` returns:

```json
{
  "stats": {
    "orderCount": 10,
    "activeOrders": 3,
    "customerCount": 2,
    "restaurantCount": 8,
    "revenue": 5364,
    "avgOrderValue": 596,
    "co2SavedKg": 1.2,
    "greenPointsAwarded": 195
  },
  "recentOrders": []
}
```

Revenue and average order value exclude cancelled orders.

Status update body:

```json
{ "status": "confirmed" }
```

Allowed values: `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`. Cancelling
through this endpoint applies the same refund and Green Points reversal as the customer endpoint.
Delivered orders are final.

## Eco model

Implemented in `server/src/utils/eco.js` and returned by the API.

| Choice | CO₂e used | Green Points |
| --- | --- | --- |
| Petrol scooter (baseline) | 0.05 kg/km | 0 |
| Electric scooter | 0.025 kg/km | +10 |
| Bicycle | 0 kg/km | +10 |
| Standard packaging (baseline) | 0.06 kg | 0 |
| Compostable packaging | 0.025 kg | +10 |
| Reusable packaging | 0.01 kg | +10 |
| Disposable cutlery included (baseline) | 0.012 kg | 0 |
| Cutlery skipped | 0 | +5 |

Savings = petrol/standard/cutlery baseline − actual choices, floored at zero. Tiers: Seedling,
Sprout (100), Sapling (250), Forest Guardian (500).

These are simplified, documented estimates for comparing options on one order — not a life-cycle
assessment. The values are exposed to the client in `/rewards/summary` so the UI can show the same
assumptions.

References behind the round numbers: IPCC AR6 Working Group III (2022); IEA Global EV Outlook
(2023); Central Electricity Authority of India, *CO₂ Baseline Database for the Indian Power Sector*
(grid factor ≈ 0.71 kg CO₂/kWh); CPCB/MoEFCC Plastic Waste Management Rules (2016, as amended).

## Quick cURL example

```bash
# Sign in
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ecobite.in","password":"Demo@123"}'

# List eco-certified South Indian restaurants, fastest first
curl -s "http://localhost:5000/api/restaurants?cuisine=South%20Indian&eco=true&sort=delivery"

# Read a restaurant with its menu
curl -s http://localhost:5000/api/restaurants/the-green-tiffin
```
