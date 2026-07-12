# TransitOps — Smart Transport Operations Platform

Odoo 8-hour hackathon build. Single Next.js 14 app (App Router) + Prisma + SQLite + Tailwind + Recharts.

## Run

```bash
npm install
npx prisma db push                                 # syncs schema to SQLite database
npx dotenv-cli -e .env -- node prisma/seed.mjs     # seeds users, vehicles, drivers, trips, maintenance, fuel
npm run dev                                        # http://localhost:3000
```

If npm install fails on Prisma engine download (corporate proxy), set
`NODE_TLS_REJECT_UNAUTHORIZED=0` for the install/generate steps.

## Demo logins (password `demo1234` for all)

| Role | Email | Access |
|---|---|---|
| Fleet Manager | `fleet@transitops.in` | Everything |
| Dispatcher | `dispatch@transitops.in` | Everything |
| Safety Officer | `safety@transitops.in` | Dashboard, Drivers, Trips, Analytics |
| Financial Analyst | `finance@transitops.in` | Dashboard, Fuel/Expenses, Analytics |

## Mandatory business rules — all enforced server-side

- Vehicle registration number is unique
- Retired / In-Shop vehicles cannot appear in dispatch selection
- Drivers with expired license or Suspended status cannot be assigned
- A driver or vehicle On-Trip cannot be double-assigned
- Cargo weight cannot exceed vehicle max capacity
- Dispatch → both vehicle & driver auto-set to On Trip
- Complete → both auto-set back to Available (odometer bumped, fuel logged)
- Cancel dispatched trip → restores both
- Creating maintenance record → vehicle auto-set to In Shop
- Closing maintenance → vehicle restored to Available (unless Retired)

## Screens
0. Login (RBAC-aware, no self-assigned admin — roles created via seed)
1. Dashboard — 7 KPIs, filters, recent trips, status mix
2. Vehicle Registry
3. Drivers & Safety Profiles
4. Trip Dispatcher — live capacity/license validation, lifecycle stepper
5. Maintenance
6. Fuel & Expense Management (auto-total = Fuel + Maintenance + Other)
7. Reports & Analytics — Fuel Efficiency, Fleet Utilization, Op Cost, Vehicle ROI, charts, CSV export
8. Settings & RBAC matrix
