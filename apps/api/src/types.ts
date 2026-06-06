import type { Device } from "./db/schema";

export type Variables = {
  accountId: string;
  email: string;
  device: Device;
};

export type AppEnv = { Variables: Variables };
