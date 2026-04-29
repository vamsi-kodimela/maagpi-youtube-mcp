import { z } from "zod";

const ConfigSchema = z.object({
  clientId: z.string().min(1, "YOUTUBE_CLIENT_ID is required"),
  clientSecret: z.string().min(1, "YOUTUBE_CLIENT_SECRET is required"),
  transport: z.enum(["stdio", "http"]).default("stdio"),
  httpPort: z.coerce.number().int().min(1024).max(65535).default(3000),
  httpHost: z.string().default("127.0.0.1"),
  quotaLimit: z.coerce.number().int().positive().default(9000),
  cacheTtlOverride: z.coerce.number().int().positive().optional(),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  nodeEnv: z.enum(["development", "production", "test"]).default("production"),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    clientId: process.env["YOUTUBE_CLIENT_ID"],
    clientSecret: process.env["YOUTUBE_CLIENT_SECRET"],
    transport: process.env["YOUTUBE_MCP_TRANSPORT"],
    httpPort: process.env["YOUTUBE_MCP_HTTP_PORT"],
    httpHost: process.env["YOUTUBE_MCP_HTTP_HOST"],
    quotaLimit: process.env["YOUTUBE_MCP_QUOTA_LIMIT"],
    cacheTtlOverride: process.env["YOUTUBE_MCP_CACHE_TTL"],
    logLevel: process.env["YOUTUBE_MCP_LOG_LEVEL"],
    nodeEnv: process.env["NODE_ENV"],
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`YouTube MCP configuration error:\n${issues}`);
  }

  return result.data;
}

export const config = loadConfig();
