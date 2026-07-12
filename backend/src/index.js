require("dotenv").config();

const { getConfig } = require("./config/env");
const prisma = require("./config/db");

let config;
try {
  config = getConfig();
} catch (err) {
  console.error("\n[startup] Configuration error:");
  console.error(`  ${err.message}\n`);
  process.exit(1);
}

const app = require("./app");

async function verifyDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("\n[startup] Database connection failed:");
    console.error(`  ${err.message}`);
    console.error("  Check DATABASE_URL and that migrations have been applied (npx prisma migrate deploy).\n");
    process.exit(1);
  }
}

async function start() {
  await verifyDatabase();

  const server = app.listen(config.port, () => {
    console.log(`AssetFlow API listening on port ${config.port} (${config.nodeEnv})`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n[startup] Port ${config.port} is already in use. Set a free PORT in .env.\n`);
    } else {
      console.error("\n[startup] Server failed to start:", err.message);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log("Database connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
