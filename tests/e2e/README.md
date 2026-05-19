# E2E test scenarios

Owner flows use `E2E_OWNER_EMAIL` to inject an owner session in non-production
Playwright runs.

Owner guard checks use `tests/e2e/owner-guard.spec.ts` with one scenario per
run:

```bash
npm run test:e2e:guard:unauth
npm run test:e2e:guard:non-owner
```

The non-owner scenario intentionally clears `E2E_OWNER_EMAIL` and injects
`E2E_AUTH_EMAIL=guest@example.com`. Keep that address out of
`OWNER_GOOGLE_EMAILS`.
