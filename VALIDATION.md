# Validation record

- Strict TypeScript check: passed. Vercel-target production build: passed on 2026-09-24. Local homepage HTTP check: 200. Final in-app browser revisit was blocked by its error-page navigation policy; earlier visual checks are listed below.
- Node calculator tests: 5 passed (rounding, savings cap, roof limits, zero roof, bill conversion, invalid inputs).
- Database permissions: tests/permissions.sql passed on 2026-09-24. Tests cover admin visibility; assigned-only lead/profile reads; customer access through assigned projects; blocked employee publication, role escalation and reassignment; unapproved, view-only and inactive users; anonymous reads/raw inserts; public field injection; server quotation arithmetic. All fixtures rolled back.
- A real browser enquiry was saved with status new and no assignee in the preceding session; its temporary lead was removed.
- Earlier browser checks: desktop/light/dark homepage, mobile menu and no horizontal overflow, calculator roof cap and quote validation.
- Temporary QA administrator creation previously timed out. On resumption the exact UUID was queried and did not exist. No persistent test admin was created.
- Remaining live verification: confirmed owner/staff login, email confirmation/reset delivery, authenticated CRUD and private uploads, Vercel deployment. These require authorised accounts and deployment access.
- GitHub connector returned no repositories and Vercel returned no teams on resumption. No remote push or deployment is claimed.


