import app from "./app";
import env from "./config/env";

const server = app.listen(env.port, () => {
  console.log(
    `Server running at ${env.port} in ${env.nodeEnv} mode`
  );
});

process.on("unhandledRejection", (error: unknown) => {
  console.error("Unhandled rejection:", error);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error: unknown) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});
