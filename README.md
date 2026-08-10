# Car Rental API

Express + MySQL + Sequelize (ES modules) backend for Green Rental Experience.

## Requirements

- Node.js 20+
- MySQL 8 (XAMPP, Docker, or local service) listening on `3306`

## Setup

1. Create the database:

```sql
CREATE DATABASE car_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy env and adjust secrets/credentials:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `DB_*` | MySQL connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets (min 32 chars) |
| `CLIENT_URL` | Client origin (`http://localhost:5173`) |
| `ADMIN_URL` | Admin origin (`http://localhost:5174`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |

3. Install and start — bootstrap runs once automatically:

```bash
npm install
npm run dev
```

On first start the server will:
1. Sync tables
2. Create search indexes (once)
3. Run `fleet:import` if `fleetFromPdf.json` is missing (once; needs Python)
4. Seed admin + cars (once)

Progress is stored in the `app_bootstrap` table. Later starts skip finished steps.

Force a full re-run:

```bash
# option A
FORCE_BOOTSTRAP=1 npm run dev

# option B
npm run bootstrap:reset
npm run dev
```

Manual scripts still work: `npm run fleet:import`, `npm run db:seed`, `npm run db:indexes`.

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Watch mode (`node --watch`) |
| `npm start` | Production start |
| `npm run db:sync` | Sync Sequelize models |
| `npm run db:seed` | Upsert admin; seed cars if empty |
| `npm run db:seed:force` | Replace fleet cars from JSON |
| `npm run db:indexes` | Create search/filter indexes (FULLTEXT + composites) |
| `npm run bootstrap:reset` | Clear one-time bootstrap flags |
| `npm run fleet:import` | Download Drive photos → `fleetFromPdf.json` |

## Search / filter performance

Fleet search uses:
- Composite indexes on `(is_active, type, price)` and `(is_active, featured, price)`
- MySQL `FULLTEXT` on `name, brand, model` (boolean prefix mode)
- Prefix `LIKE 'term%'` fallback (no leading `%`)
- Lean column lists (no `SELECT *` on list endpoints)
- Pagination (`page` / `limit`)
- Short TTL in-memory cache for unfiltered list pages
- Availability via `NOT EXISTS` on bookings (indexed by status/car/dates)

## Monorepo apps

From the repo root:

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — Client (Vite :5173, proxies /api and /uploads)
cd client && npm install && npm run dev

# Terminal 3 — Admin (Vite :5174)
cd admin && npm install && npm run dev
```

Default admin login (from `.env`):

- Email: `admin@greenrental.ae`
- Password: `Admin123!@#` (must be quoted in `.env` as `ADMIN_PASSWORD="Admin123!@#"` — bare `#` is treated as a comment)

## Auth

- `POST /api/auth/register` — client accounts only
- `POST /api/auth/login` — access JWT + httpOnly refresh cookie
- `POST /api/auth/refresh` — rotate refresh token
- `POST /api/auth/logout` — revoke refresh
- `GET/PUT /api/users/me` — profile (Bearer access token)

## Main routes

- Public cars: `GET /api/cars`, `/api/cars/featured`, `/api/cars/:id`
- Bookings: `POST /api/bookings`, `GET /api/bookings/mine`, `PATCH /api/bookings/:id/cancel`
- Admin (role `admin`): `/api/admin/cars`, `/api/admin/bookings`, `/api/admin/stats/*`

Uploads are served from `/uploads`.

### Production photos

Car images are stored under `uploads/fleet/`. In production:

1. Set `PUBLIC_URL=https://api.greenrentalexperience.com` on the API
2. Set client/admin `VITE_API_URL=https://api.greenrentalexperience.com/api` at build time
3. On API start, missing photos are auto-downloaded from Google Drive (`ensureFleetAssets`)
4. Images are served at `/uploads/...` and `/api/uploads/...` (use the `/api` path if the host only proxies `/api`)

Manual restore: `npm run fleet:assets`

## Notes

- Stripe is not implemented; bookings include nullable `paymentStatus` / `stripePaymentIntentId` for later.
- If MySQL is not running (e.g. XAMPP MySQL stopped), seed and API startup will fail with `ECONNREFUSED 127.0.0.1:3306`.
