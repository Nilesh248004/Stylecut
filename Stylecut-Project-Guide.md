# StyleCut Quick Guide

A concise overview of the StyleCut project.

## What it is

StyleCut is a salon web app with:
- `client/` — React frontend for customers and barbers
- `server/` — Express backend API
- `database/` — PostgreSQL schema and migrations

## How it works

1. User opens the website.
2. Frontend pages call backend APIs via `client/src/api.js`.
3. Backend routes in `server/src/index.js` read/write data with `server/src/db.js`.
4. Data is stored in tables for bookings, orders, clients, and barbers.

## Main files

- `client/src/App.jsx` — routing
- `client/src/BarberAuth.jsx` — barber login
- `client/src/ClientAuth.jsx` — customer login/signup
- `client/src/BarberDashboard.jsx` — barber dashboard
- `client/src/Book.jsx` / `client/src/Products.jsx` — service and product pages
- `server/src/index.js` — API routes
- `server/src/config.js` — environment config
- `server/src/db.js` — database connection
- `server/src/whatsapp.js` — notification helper
- `server/.env.example` — example server settings

## Run locally

1. Install dependencies:
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
2. Copy `server/.env.example` to `server/.env`.
3. Start the app:
   - `npm run dev`
   - or `npm run dev:server` and `npm run dev:client`
4. Open `http://localhost:5173`

## Why it matters

This project shows a complete front-to-back web app with role-based login, booking, product ordering, and database storage.
