import { expect, test } from "@playwright/test";

const authGuardScenario = process.env.E2E_AUTH_GUARD_SCENARIO;
const normalizeEmail = (email: string) => email.trim().toLowerCase();

test.beforeAll(() => {
  if (authGuardScenario !== "non-owner") {
    return;
  }

  const authEmail = process.env.E2E_AUTH_EMAIL;
  const allowedEmails = new Set(
    (process.env.OWNER_GOOGLE_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );

  expect(authEmail, "E2E_AUTH_EMAIL must be set for non-owner guard tests").toBeTruthy();
  expect(
    allowedEmails.has(normalizeEmail(authEmail ?? "")),
    "E2E_AUTH_EMAIL must not be included in OWNER_GOOGLE_EMAILS",
  ).toBe(false);
});

test("unauthenticated users cannot access owner pages or export API", async ({
  page,
  request,
}) => {
  test.skip(
    authGuardScenario !== "unauthenticated",
    "Run with E2E_AUTH_GUARD_SCENARIO=unauthenticated.",
  );

  const response = await request.get("/api/export");
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({
    ok: false,
    error: {
      code: "UNAUTHORIZED",
      message: "Sign in required",
    },
  });

  await page.goto("/shopping");
  await expect(page).toHaveURL(/\/api\/auth\/signin(?!\?error=)/);
  await expect(page).not.toHaveURL(/error=AccessDenied/);
});

test("non-owner sessions are denied owner pages and owner APIs", async ({
  page,
  request,
}) => {
  test.skip(
    authGuardScenario !== "non-owner",
    "Run with E2E_AUTH_GUARD_SCENARIO=non-owner.",
  );

  const response = await request.get("/api/export");
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toEqual({
    ok: false,
    error: {
      code: "FORBIDDEN",
      message: "Owner access required",
    },
  });

  await page.goto("/shopping");
  await expect(page).toHaveURL(/\/api\/auth\/signin\?error=AccessDenied/);
});
