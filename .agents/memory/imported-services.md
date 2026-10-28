---
name: Imported service boundaries
description: Scope of imported-project setup and why existing service data must be preserved.
---

Preserve the imported Supabase service and keep the separate PostgreSQL API explicitly unconfigured until connection details and intended database are confirmed. Never provision a replacement database simply to remove startup errors.

**Why:** The user requested running the imported project, not a storage migration. A separate database could diverge from the frontend's existing data and trigger unwanted startup seeding.

**How to apply:** Ask for the intended service before database provisioning, schema application, or credential changes; use read-only checks when verifying an imported live service.
