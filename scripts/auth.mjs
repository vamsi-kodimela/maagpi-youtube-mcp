/**
 * Standalone script to trigger the YouTube OAuth flow.
 * Run with: node --env-file=.env scripts/auth.mjs
 * OR:       npm run auth
 */

// Dynamically import so we can print a status message first
console.log("Clearing any stale tokens...");

const { tokenStore } = await import("../dist/auth/token-store.js");
tokenStore.clear();

console.log("Starting OAuth flow — a browser window will open.");
console.log("If the browser does not open automatically, copy the URL printed and open it manually.\n");

const { createAuthenticatedClient } = await import("../dist/auth/oauth.js");

try {
  const client = await createAuthenticatedClient();
  const creds = client.credentials;
  console.log("\nAuthentication successful!");
  console.log(`Tokens saved to: ${tokenStore.configPath()}`);
  console.log(`Access token expires: ${new Date(creds.expiry_date ?? 0).toISOString()}`);
  process.exit(0);
} catch (err) {
  console.error("\nAuthentication failed:", err?.message ?? err);
  process.exit(1);
}
