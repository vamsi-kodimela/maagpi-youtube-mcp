import "dotenv/config";
import { createServer } from "./server.js";
import { startTransport } from "./transport/index.js";

const server = createServer();
await startTransport(server);
