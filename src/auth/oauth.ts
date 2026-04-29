import { createServer } from "node:http";
import { URL } from "node:url";
import { OAuth2Client } from "google-auth-library";
import getPort from "get-port";
import open from "open";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { tokenStore } from "./token-store.js";
import type { StoredTokens } from "./types.js";
import { YouTubeMcpError } from "../errors/types.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
];

function buildOAuth2Client(redirectUri?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri,
  });
}

function wireTokenPersistence(client: OAuth2Client, existing: StoredTokens): void {
  client.on("tokens", (tokens) => {
    const updated: StoredTokens = {
      ...existing,
      access_token: tokens.access_token ?? existing.access_token,
      expiry_date: tokens.expiry_date ?? existing.expiry_date,
      stored_at: Date.now(),
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    };
    tokenStore.set(updated);
  });
}

async function runOAuthFlow(): Promise<OAuth2Client> {
  const port = await getPort({ port: [8080, 8081, 8082, 9090, 9091] });
  const redirectUri = `http://127.0.0.1:${port}/oauth/callback`;
  const client = buildOAuth2Client(redirectUri);

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== "/oauth/callback") return;

      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        code
          ? "<html><body><h2>Authentication successful!</h2><p>You can close this tab.</p></body></html>"
          : `<html><body><h2>Authentication failed</h2><p>${error}</p></body></html>`
      );

      server.close();

      if (code) resolve(code);
      else reject(new Error(`OAuth error: ${error}`));
    });

    server.listen(port, "127.0.0.1", () => {
      logger.info("YouTube MCP: Opening browser for OAuth authentication...");
      logger.info(`Auth URL: ${authUrl}`);

      open(authUrl).catch(() => {
        logger.warn(
          `Could not open browser automatically. Open this URL manually:\n${authUrl}`
        );
      });
    });

    server.on("error", reject);

    setTimeout(() => {
      server.close();
      reject(new Error("OAuth flow timed out after 5 minutes. Please retry."));
    }, 5 * 60 * 1000);
  });

  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new YouTubeMcpError(
      YouTubeMcpErrorCode.AUTH_REQUIRED,
      "OAuth token exchange did not return required tokens. Ensure 'offline' access type and 'consent' prompt are set."
    );
  }

  const stored: StoredTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    scope: tokens.scope ?? SCOPES.join(" "),
    token_type: "Bearer",
    stored_at: Date.now(),
  };

  tokenStore.set(stored);
  logger.info(`Tokens saved to: ${tokenStore.configPath()}`);

  client.setCredentials(tokens);
  wireTokenPersistence(client, stored);

  return client;
}

export async function createAuthenticatedClient(): Promise<OAuth2Client> {
  const stored = tokenStore.get();

  if (!stored) {
    logger.info("No stored tokens found. Starting OAuth flow...");
    return runOAuthFlow();
  }

  const client = buildOAuth2Client();
  client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expiry_date,
    token_type: stored.token_type,
  });

  wireTokenPersistence(client, stored);

  if (tokenStore.isExpired(stored)) {
    logger.info("Access token expired, refreshing...");
    try {
      const { credentials } = await client.refreshAccessToken();
      const updated: StoredTokens = {
        ...stored,
        access_token: credentials.access_token ?? stored.access_token,
        expiry_date: credentials.expiry_date ?? stored.expiry_date,
        stored_at: Date.now(),
        ...(credentials.refresh_token ? { refresh_token: credentials.refresh_token } : {}),
      };
      tokenStore.set(updated);
      client.setCredentials(credentials);
    } catch (err) {
      logger.warn("Token refresh failed, starting new OAuth flow...", { err });
      tokenStore.clear();
      return runOAuthFlow();
    }
  }

  return client;
}
