// HMAC-SHA256 gate token — works in both Edge and Node.js runtimes via Web Crypto API.
// The signed payload is a fixed string; the signing key is GATE_SIGNING_KEY env var.
// Cookie forgery requires knowing the key; simple string equality can't be spoofed.

const ALGO = { name: "HMAC", hash: "SHA-256" } as const;
const PAYLOAD = new TextEncoder().encode("blindfold:gate:v1");

async function importKey(): Promise<CryptoKey> {
  const secret = process.env.GATE_SIGNING_KEY ?? "";
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), ALGO, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): ArrayBuffer {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr.buffer as ArrayBuffer;
}

export async function signGateToken(): Promise<string> {
  const key = await importKey();
  const sig = await crypto.subtle.sign(ALGO, key, PAYLOAD);
  return toHex(sig);
}

export async function verifyGateToken(token: string): Promise<boolean> {
  try {
    // SHA-256 HMAC = 32 bytes = 64 hex chars
    if (!token || token.length !== 64) return false;
    const key = await importKey();
    return crypto.subtle.verify(ALGO, key, fromHex(token), PAYLOAD);
  } catch {
    return false;
  }
}
