/**
 * Password hashing using PBKDF2 via WebCrypto API.
 * Works natively in Cloudflare Workers — zero external dependencies.
 * Format: "pbkdf2:<salt_hex>:<hash_hex>"
 */

const ITERATIONS = 100_000;
const KEY_LEN = 32; // 256 bits
const ALG = "PBKDF2";

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), ALG, false, [
    "deriveBits",
  ]);

  const bits = await crypto.subtle.deriveBits(
    { name: ALG, hash: "SHA-256", salt, iterations: ITERATIONS },
    keyMaterial,
    KEY_LEN * 8,
  );

  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(new Uint8Array(bits));
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, saltHex, hashHex] = stored.split(":");
    const salt = hexToBytes(saltHex);
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), ALG, false, [
      "deriveBits",
    ]);

    const bits = await crypto.subtle.deriveBits(
      { name: ALG, hash: "SHA-256", salt, iterations: ITERATIONS },
      keyMaterial,
      KEY_LEN * 8,
    );

    const derived = bytesToHex(new Uint8Array(bits));

    // Constant-time comparison to avoid timing attacks
    if (derived.length !== hashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) {
      diff |= derived.charCodeAt(i) ^ hashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
