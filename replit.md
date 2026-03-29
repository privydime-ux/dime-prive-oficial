# DIME PRIVY — Workspace

## Overview

Full-stack adult content monetization platform. Clients pay R$2,00 via Pix for VIP access to creator content and chat.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Auth**: JWT (localStorage)
- **Payments**: Efí Bank Pix API

## Artifacts

- `artifacts/api-server` — Express 5 API server (port from ENV)
- `artifacts/dime-privy` — React + Vite frontend (previewPath: `/`)

## Environment Secrets Required

- `SESSION_SECRET` — JWT signing secret
- `EFI_CLIENT_ID` — Efí Bank API client ID
- `EFI_CLIENT_SECRET` — Efí Bank API client secret
- `EFI_PIX_KEY` — Platform Pix key for receiving payments
- `ADMIN_PASSWORD` — Password for admin@dimeprivy login
- `DATABASE_URL` — PostgreSQL connection (auto-provisioned by Replit)

## Admin Access

- URL: `/admin`
- Email: `dimeprivyoficial@gmail.com`
- Password: value of `ADMIN_PASSWORD` secret
- Session persists in localStorage

## User Roles

- `admin` — Full platform control
- `model` — Creator/criadora account
- `client` — Consumer account (no account needed to pay)

## Database Tables

- `users` — All user accounts
- `models` — Creator profiles (KYC, balance, stats)
- `photos` — Gallery photos per model
- `payments` — Pix transactions (tracks txid, status, access grants)
- `client_access` — Access grants per (model, clientToken) pair
- `chat_messages` — VIP chat messages
- `withdrawals` — Withdrawal requests with hybrid auto/manual logic
- `notifications` — Live admin notification feed
- `settings` — System settings (PIX key, fees, limits)

## Financial Logic

- **Entry (Pay-in)**: Client pays `accessValue` (default R$2,00); `lucroPlatformaFixo = R$2,00` stays with platform; `saldoBrutoModelo` = remainder
- **Exit (Payout)**: 2% fee on all withdrawals; amounts < R$450 auto-processed via Efí; amounts ≥ R$450 require admin authorization
- **Webhook**: `/api/webhook/pix` receives Efí Bank confirmation, marks payment paid, grants client access

## Key Routes (Backend `/api`)

- `POST /auth/login` — Login (admin/model/client)
- `GET /auth/me` — Get current user
- `POST /auth/register-model` — KYC registration
- `GET /models` — Public showcase (approved only)
- `GET /models/:id` — Model profile + gallery
- `POST /payments/create` — Generate Pix QR code
- `GET /payments/status/:txid` — Poll payment status
- `GET /payments/check-access/:modelId` — Check client access
- `POST /webhook/pix` — Efí Bank webhook
- `GET /chat/:modelId/messages` — VIP chat messages
- `POST /chat/:modelId/messages` — Send chat message
- `GET /admin/*` — Admin dashboard (protected)
- `POST /withdrawals/request` — Creator withdrawal request
- `GET /withdrawals/history` — Creator withdrawal history

## Frontend Pages

- `/` — Showcase (vitrine) of models
- `/login` — Login with Client/Creator toggle
- `/creator/register` — KYC registration form
- `/model/:id` — Model profile with blurred gallery
- `/checkout/:modelId` — Pix payment page
- `/chat/:modelId` — VIP chat
- `/creator` — Creator dashboard
- `/admin` — Admin panel (Elite)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── dime-privy/         # React frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```
