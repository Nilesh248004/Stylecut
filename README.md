# StyleCut Salon PERN Website

StyleCut is a PERN stack salon website for showing salon services, service price ranges, grooming products, and appointment booking.

## Tech Stack

- PostgreSQL
- Express.js
- React.js
- Node.js

## Project Structure

```text
Stylecut/
  client/      React frontend
  server/      Express API
  database/    PostgreSQL schema and seed data
```

## Setup With Neon

1. Create a Neon project and copy the pooled PostgreSQL connection string.

2. Configure the server:

```bash
cp server/.env.example server/.env
```

Update `server/.env`:

```env
PORT=5001
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=verify-full
DATABASE_SSL=true
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:5175
BARBER_STAFF_ID=your_staff_id
BARBER_ACCESS_CODE=change-this-access-code
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Configure the client:

```bash
cp client/.env.example client/.env
```

Update `client/.env` with the same Google OAuth web client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

3. Create the database tables and seed data in Neon:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

You can also paste the SQL from `database/schema.sql` and `database/seed.sql` into the Neon SQL editor.

If your auth tables already exist, run the Google auth migration too:

```bash
psql "$DATABASE_URL" -f database/migrations/005_google_client_auth.sql
```

4. Install dependencies:

```bash
npm run install:all
```

5. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:5001`

Backend checks:

- API health: `http://localhost:5001/api/health`
- Neon connection health: `http://localhost:5001/api/health/db`

## Authentication

- Client registration and login are stored in Neon through `/api/auth/client/register` and `/api/auth/client/login`.
- Google client login uses `/api/auth/client/google`. Set `GOOGLE_CLIENT_ID` in the server and `VITE_GOOGLE_CLIENT_ID` in the client.
- Barber login is stored in Neon through `/api/auth/barber/login`.
- Set `BARBER_STAFF_ID` and `BARBER_ACCESS_CODE` in `server/.env` before sharing the app.

## Meta WhatsApp Templates

Create these templates in the same WhatsApp Business Account used by `META_BUSINESS_ACCOUNT_ID` and `META_PHONE_NUMBER_ID`.

Use category `Utility` and language `English (US)` (`META_TEMPLATE_LANGUAGE=en_US`).

### booking

```text
Hello {{1}},

Thank you for choosing STYLECUT.

Your booking for {{2}} has been confirmed for {{3}} at {{4}}.

We look forward to welcoming you and helping you look your best.
```

Sample values: `Nilesh`, `Hair Color`, `23-05-2026`, `10:00 AM`.

### booking_accepted

```text
Hello {{1}},

Your STYLECUT booking for {{2}} on {{3}} at {{4}} has been accepted.

See you soon.
```

Sample values: `Nilesh`, `Hair Color`, `23-05-2026`, `10:00 AM`.

### booking_completed

```text
Hello {{1}},

Your STYLECUT booking for {{2}} on {{3}} at {{4}} is completed.

Thank you for choosing STYLECUT.
```

Sample values: `Nilesh`, `Hair Color`, `23-05-2026`, `10:00 AM`.

### product_order_confirmation

```text
Hello {{1}},

Your STYLECUT product order for {{2}} item(s), totaling Rs. {{3}}, is confirmed.

Delivery address: {{4}}.

We will notify you when your order is accepted.
```

Sample values: `Nilesh`, `2`, `1499`, `12 MG Road, Chennai`.

### product_order_accepted

```text
Good news.

Your STYLECUT order #{{1}} has been accepted.

Estimated delivery: {{2}}.
```

Sample values: `42`, `25-05-2026`.

### product_order_completed

```text
Your STYLECUT order #{{1}} has been delivered.

Thank you for shopping with STYLECUT.
```

Sample value: `42`.

### product_order_cancelled

```text
Your STYLECUT order #{{1}} has been cancelled.

Please contact us if you need assistance or want to reorder.
```

Sample value: `42`.

## Main Features

- Browse salon services with price ranges and durations
- Browse grooming products with prices and stock status
- Book appointments with customer details, service, date, and time
- View backend appointment data through API routes
