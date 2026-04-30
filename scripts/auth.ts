import { tokenStore } from "../src/auth/token-store.js";
import { createAuthenticatedClient } from "../src/auth/oauth.js";

console.log("Clearing any stale tokens...");
tokenStore.clear();

console.log("Starting OAuth flow — a browser window will open.");
console.log("If the browser does not open, copy the URL printed below and open it manually.\n");

try {
  const client = await createAuthenticatedClient();
  const creds = client.credentials;
  console.log("\nAuthentication successful!");
  console.log(`Tokens saved to: ${tokenStore.configPath()}`);
  console.log(`Access token expires: ${new Date(creds.expiry_date ?? 0).toISOString()}`);
  process.exit(0);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("\nAuthentication failed:", msg);
  process.exit(1);
}
