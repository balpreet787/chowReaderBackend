import postgres from "postgres";
import env from "../config/env";

const sql = postgres(env.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: "require",
});

export type DbClient =
  postgres.Sql<Record<string, never>>;

export default sql;
