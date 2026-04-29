// Set required env vars before any module imports in tests
process.env["YOUTUBE_CLIENT_ID"] = "test_client_id";
process.env["YOUTUBE_CLIENT_SECRET"] = "test_client_secret";
process.env["NODE_ENV"] = "test";
