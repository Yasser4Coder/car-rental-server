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

3. Install, import fleet photos from the PDF Drive links (optional but recommended), then seed:

```bash
npm install
npm run fleet:import   # downloads Drive photos → uploads/fleet + fleetFromPdf.json
npm run db:seed
```

Seed creates the admin user and loads the Dubai À La Carte fleet (67 cars) from `src/seeders/fleetFromPdf.json`.

4. Start the API:

```bash
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Watch mode (`node --watch`) |
| `npm start` | Production start |
| `npm run db:sync` | Sync Sequelize models |
| `npm run db:seed` | Sync + seed admin + cars |
| `npm run db:indexes` | Create search/filter indexes (FULLTEXT + composites) |

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

## Notes

- Stripe is not implemented; bookings include nullable `paymentStatus` / `stripePaymentIntentId` for later.
- If MySQL is not running (e.g. XAMPP MySQL stopped), seed and API startup will fail with `ECONNREFUSED 127.0.0.1:3306`.
