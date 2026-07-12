const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const userId = req.user?.id ?? "anonymous";
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} user=${userId} status=${res.statusCode} ${durationMs}ms`
    );
  });

  next();
};

module.exports = requestLogger;
