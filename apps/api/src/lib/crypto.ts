import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/** Generate a device bearer token and its storable sha256 hash. */
export function generateDeviceToken(): { token: string; hash: string } {
  const token = "zd_" + randomBytes(24).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** scrypt password hash, stored as "salt:derivedKey" (both hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${dk}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, dkHex] = stored.split(":");
  if (!salt || !dkHex) return false;
  const expected = Buffer.from(dkHex, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
