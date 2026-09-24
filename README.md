# Easternbay Renewables V1

A responsive monochrome solar website and role-based operations workspace, recovered from the existing Lovable project and completed locally. Built with React, TypeScript, TanStack Start, Tailwind, Radix UI and Supabase PostgreSQL/Auth/Storage. The existing compatible stack and Bun lockfile were retained.

## Run locally

Use Node 22+ and Bun. Copy `.env.example` to `.env` and populate your Supabase URL and publishable key. Never use a service-role key in a VITE variable.

```sh
bun install --frozen-lockfile
bun run dev
bun run typecheck
bun run test
bun run build
```

Local preview: http://127.0.0.1:5173

The connected database has migrations through `20260924090000_complete_v1_validation.sql` applied. For a new Supabase project apply every file in `supabase/migrations` chronologically before accepting traffic. Migrations modify access policies and should be reviewed before applying to a database containing other applications. Back up an existing production database first.

## Routes

- Public: /, /products, /solutions and its three sector pages, /schemes, /projects, /calculator, /quote, /application, /contact.
- Team: /auth (also /login), /admin, /employee.
- Admin modules: leads, customers, employees, projects, tasks/site visits, products, material prices, quotations with line items and print, gallery, schemes, content, reports and private project documents.
- Employees: assigned leads/projects/tasks, linked customers, notes/status updates, quotations, private uploads and their work history. Read-only roles cannot update work.

## First owner and staff onboarding

There is no default administrator or password. Register through Team login → Request staff access and confirm the email. New signups have no staff role.

A trusted database owner then uses `scripts/provision-owner.sql` after setting the confirmed owner's email in the SQL session. It refuses an unconfirmed email and refuses to bootstrap when an administrator already exists. Do not expose that script through a public endpoint.

Subsequent staff register and verify their emails, then an administrator assigns their role from Employees. Only the owner can assign another admin. Own-role edits and own-account deactivation are blocked. Staff deactivation is enforced in database permission helpers.

Configure Supabase Auth site URL and allowlisted redirect URLs for the actual production origin, /auth, /auth?recovery=1, and localhost during development. Configure a working mail provider for confirmation/password reset delivery.

## Data and permissions

- RLS restricts customer records to admins and assigned staff. Public project reads use a projection excluding customer and employee IDs.
- Public enquiries use a validated RPC; visitors cannot choose assignment or pipeline state. The RPC limits repeated submissions for a mobile number to three per hour.
- Assigned employee updates are limited to progress fields by database triggers.
- Quotation totals are calculated in PostgreSQL, not trusted from the browser.
- Private documents use assignment policies, a 10 MB limit and allowed image/PDF types. Download links expire after 60 seconds.
- UI forms create/update records. Archive/deactivate/unpublish controls are used where appropriate; destructive deletion is not exposed.
- Reports currently load/export up to 1,000 records per module. Larger datasets need pagination/reporting queries.
- Material prices feed quotation line items. Public calculator assumptions are managed separately under calculator.assumptions; supplier prices are not publicly exposed.
- Website Content includes homepage.hero, contact.details and calculator.assumptions. Products, schemes and project galleries are independently managed.

## Publishing to GitHub and Vercel

The source is ready for a new repository; it has not been pushed. Import the writable repository into your Vercel team. Vercel uses Bun install/build and the Nitro Vercel adapter via vite.config.ts. Set the four names in .env.example for preview and production. Never commit .env. No deployed URL is claimed until a successful build and production check.

The older Lovable frontend is not synced with these changes. Do not publish it: the database access rules have changed and the local frontend uses the new safe queries and enquiry RPC. Syncing a new repository back into Lovable requires an explicit connection in Lovable.

## Content still needed

Add the official logo, phone/address/social links, verified installations and actual project photographs. The current hero image is illustrative, not an Easternbay project claim. No fabricated installation statistics are published. Seed supplier prices are examples; review them before issuing quotations. Subsidy amounts are not automatically promised.

Hero photograph: CHUTTERSNAP, [Unsplash](https://unsplash.com/photos/blue-solar-panels-s_7BE4D2va0).
Official scheme references: [PM Surya Ghar](https://pmsuryaghar.gov.in/) and [PM-KUSUM](https://pmkusum.mnre.gov.in/).

## Verification

See VALIDATION.md. Permission tests run inside a rolled-back SQL transaction; calculator tests use Node's built-in test runner. Owner login, email delivery and authenticated dashboard/upload browser flows still need verification using a real, confirmed authorised account.

