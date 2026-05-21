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
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DATABASE_SSL=true
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:5175
BARBER_STAFF_ID=STYLECUT001
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

## Main Features

- Browse salon services with price ranges and durations
- Browse grooming products with prices and stock status
- Book appointments with customer details, service, date, and time
- View backend appointment data through API routes
