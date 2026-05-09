export function isTestHarnessEnabled() {
  return process.env.NUTRI_ALLOW_TEST_AUTH_OVERRIDE === "1" && Boolean(process.env.NUTRI_TEST_CLERK_USER_ID);
}
