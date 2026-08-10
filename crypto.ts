/**
 * Cryptographic utilities
 * Uses Web Crypto API (available in Cloudflare Workers)
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Generate a random hex string
 */
export async function generateToken(length = 32): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash a string with SHA-256
 */
export async function sha256(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sign data with HMAC-SHA256
 */
export async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify HMAC signature
 */
export async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await sign(data, secret);
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encrypt data with AES-GCM
 */
export async function encrypt(
  plaintext: string,
  key: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data with AES-GCM
 */
export async function decrypt(
  ciphertext: string,
  key: string
): Promise<string> {
  const combined = new Uint8Array(
    atob(ciphertext).split("").map((c) => c.charCodeAt(0))
  );
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );
  return decoder.decode(decrypted);
}

/**
 * Hash IP address (keep first 3 octets for privacy)
 */
export function hashIP(ip: string): string {
  // Simple hash for demo - in production use sha256
  const parts = ip.split(".");
  if (parts.length === 4) {
    return parts.slice(0, 3).join(".") + ".xxx";
  }
  return ip;
}

/**
 * Hash user agent (substring for privacy)
 */
export function hashUA(ua: string): string {
  return ua.slice(0, 50);
}
