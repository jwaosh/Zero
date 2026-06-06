import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
  PORT: Number(process.env.PORT ?? 4000),
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? "*",
};
