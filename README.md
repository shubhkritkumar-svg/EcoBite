# EcoBite

EcoBite is a full-stack eco-friendly food delivery web app for Bengaluru. Customers browse eight
independent kitchens, order in compostable or reusable packaging, choose bicycle or EV couriers, and
earn Green Points for every lower-carbon choice. Prices, bills and carbon savings are recalculated on
the server, so the browser can never send its own totals.

> Academic project. Payments and live tracking are **simulated** and labelled as such in the UI.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Lucide icons |
| Backend | Node.js, Express 5, Zod validation |
| Database | MongoDB with Mongoose |
| Auth | JWT (7-day tokens) + bcrypt password hashing |
| Tests | Vitest + Supertest + mongodb-memory-server |

## Prerequisites

- Node.js 20 or newer (developed on Node 24)
- MongoDB 6+ running locally, **or** a free MongoDB Atlas cluster, **or** no database at all by
  enabling the in-memory option below

## Quick start

```bash
cd ecobite
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm run seed                  # inserts demo users, restaurants, menus and sample orders
npm run dev
```

Open <http://localhost:5173>. The API runs at <http://localhost:5000>; check it with
<http://localhost:5000/api/health>.

`npm run seed` **resets** the collections it owns, so run it whenever you want a clean demo.

### No local MongoDB? Use the in-memory database

Set `USE_MEMORY_DB=true` in `.env` and run `npm run dev`. Mongoose starts a temporary in-memory
MongoDB and the app auto-seeds it on startup (`AUTO_SEED=true`). Everything works, but data resets
when the API process stops, so `npm run seed` on its own is not useful in this mode.

### MongoDB Atlas

Replace `MONGO_URI` in `.env` with your Atlas connection string, keep `USE_MEMORY_DB=false`, then run
`npm run seed && npm run dev`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo@ecobite.in` | `Demo@123` |
| Admin | `admin@ecobite.in` | `Admin@123` |
| Customer (seed history only) | `kabir@ecobite.in` | `Kabir@123` |

The login page has one-tap buttons that fill in the customer or admin credentials.

Seeded state: 3 users, 8 restaurants, 57 menu items, and 8 historical orders with mixed statuses
(including one cancelled order).

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the Express API and the Vite dev server together |
| `npm run seed` | Wipes and re-inserts demo data |
| `npm test` | Runs the backend test suite (43 tests, isolated in-memory DB) |
| `npm run build` | Builds the React client into `client/dist` |
| `npm start` | Starts the API; if `client/dist` exists it also serves the built frontend on port 5000 |

`npm test` downloads a MongoDB binary on first use through `mongodb-memory-server`. On a machine
without internet access, point it at an existing `mongod`:

```bash
# Git Bash example
MONGOMS_SYSTEM_BINARY="/c/path/to/mongod.exe" npm test
```

## Environment variables

All values live in the project-root `.env` (see `.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Express API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/ecobite` | MongoDB connection string |
| `JWT_SECRET` | dev fallback | Token signing key; must be 32+ chars in production |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (comma-separated list supported) |
| `USE_MEMORY_DB` | `false` | Run a temporary in-memory MongoDB |
| `AUTO_SEED` | `true` | Seed automatically when the database is empty |
| `NODE_ENV` | `development` | `production` enables strict secret checks and static file serving |

## Project structure

```text
ecobite/
├─ client/
│  ├─ src/
│  │  ├─ pages/          # Home, Restaurants, Menu, Cart, Checkout, auth, orders, eco, admin, 404
│  │  ├─ components/     # Layout, cards, modal, stepper, badges, loaders
│  │  ├─ context/        # Auth, cart and toast providers
│  │  ├─ lib/            # API helper, formatting, constants
│  │  └─ index.css       # Tailwind theme tokens and component classes
│  └─ vite.config.js     # Dev proxy /api -> http://localhost:5000
├─ server/
│  ├─ src/
│  │  ├─ models/         # User, Restaurant, MenuItem, Order, Reward
│  │  ├─ routes/         # auth, users, restaurants, menu-items, orders, rewards, admin
│  │  ├─ services/       # order placement, tracking, cancellation
│  │  ├─ utils/          # pricing, eco impact, JWT, errors
│  │  ├─ middleware/     # auth/RBAC, validation, sanitisation, rate limits, errors
│  │  ├─ validation/     # Zod schemas
│  │  └─ seed/           # demo data and reset script
│  └─ tests/             # 43 Vitest + Supertest tests
├─ scripts/verify-ui.mjs # Playwright end-to-end run that captures the screenshots
├─ docs/                 # API reference, report, screenshots
└─ .env.example
```

## How the eco numbers work

The server owns the calculation (`server/src/utils/eco.js`). For each order it compares the chosen
delivery mode, packaging and cutlery against a petrol-scooter + standard-packaging baseline:

| Factor | Value used | Basis |
| --- | --- | --- |
| Petrol two-wheeler | 0.05 kg CO₂e/km | ~2.2 L/100 km × 2.31 kg CO₂e/L |
| Electric scooter | 0.025 kg CO₂e/km | 0.035 kWh/km × ~0.71 kg CO₂e/kWh (India grid) |
| Bicycle | 0 kg CO₂e/km | Zero tailpipe emissions |
| Packaging | 0.06 / 0.025 / 0.01 kg CO₂e | Standard / compostable / reusable |
| Disposable cutlery | 0.012 kg CO₂e | One set per order |

Green Points: +10 for EV or bicycle delivery, +10 for eco packaging, +5 for skipping cutlery.
Tiers: Seedling → Sprout (100) → Sapling (250) → Forest Guardian (500). These are simplified,
documented estimates for comparing choices, not a life-cycle assessment. The Eco dashboard lists the
same assumptions for users.

Bills: ₹25 delivery (free at ₹499+), ₹10 packaging, 5% GST. Item prices always come from MongoDB.

## Security and validation

- bcrypt (cost 12) password hashing; password hashes are never returned by the API.
- JWT bearer auth; `protect` and `adminOnly` middleware guard private and admin routes.
- Zod schemas validate every write; `{ email, password }`-style operator injection is stripped.
- Helmet security headers, CORS allow-list, 100 kB JSON limit, general and auth-specific rate limits.
- Admin deletion of a restaurant with order history is refused with `409` (deactivate instead).

## Testing and verification

- `npm test` → 5 files, 43 tests passing (auth, catalog/RBAC, orders, eco maths, security).
- `node scripts/verify-ui.mjs` drives real Chrome through the main workflow (browse → add to cart →
  sign up/login → checkout → place order → simulated tracking → eco dashboard → profile → admin) and
  writes the 15 screenshots used in the report. It is optional and not part of `npm install`:
  run `npm i -D playwright-core` first, then set `CHROME_PATH` if Chrome is not at the default
  Windows location. Both dev servers must be running, with demo data seeded.
- The report in [`docs/REPORT.md`](docs/REPORT.md) contains the captured screenshots and the actual
  test results.

## API

Full endpoint reference, request bodies and error format: [`docs/API.md`](docs/API.md).

Base URL: `http://localhost:5000/api`. Protected routes expect `Authorization: Bearer <token>`.

## Known limitations

- Payment (UPI/card/COD) and delivery tracking are simulated, not integrated with a provider or GPS.
- Carbon factors are round-number estimates intended for choice comparison.
- One city (Bengaluru), one cart per kitchen, no live courier assignment.
- Menu photos are stock images; a few dish photos are approximate rather than exact matches.
