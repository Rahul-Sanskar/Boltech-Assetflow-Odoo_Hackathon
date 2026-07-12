/**
 * Central environment configuration and startup validation.
 * Fail fast with clear messages when required variables are missing.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy backend/.env.example to backend/.env and set ${name}.`
    );
  }
  return value;
}

function loadConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const databaseUrl = requireEnv("DATABASE_URL");
  const jwtSecret = requireEnv("JWT_SECRET");
  const port = Number(process.env.PORT || 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${process.env.PORT}". Expected an integer 1–65535.`);
  }

  if (jwtSecret === "supersecretkey" && nodeEnv === "production") {
    throw new Error("JWT_SECRET must not use the insecure default value in production.");
  }

  return {
    nodeEnv,
    databaseUrl,
    jwtSecret,
    port,
    isProduction: nodeEnv === "production",
    isDevelopment: nodeEnv === "development"
  };
}

let cached;

function getConfig() {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

module.exports = {
  getConfig,
  loadConfig,
  requireEnv
};
