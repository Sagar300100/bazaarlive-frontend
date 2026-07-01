// functions/kms.js
// ──────────────────────────────────────────────────────────────────
// Wraps Google Cloud KMS symmetric encrypt/decrypt for sensitive
// seller PII (full PAN number, full bank account number).
//
// The key resource name is NOT a secret. Security relies on IAM: only
// the Cloud Function's service account
// (1036868169073-compute@developer.gserviceaccount.com) has
// cloudkms.cryptoKeyEncrypterDecrypter granted on the key. Anyone
// leaking this file gains nothing without also stealing service
// account credentials.
//
// Rotation: the key auto-rotates every 90 days. KMS is version-aware,
// so old ciphertext keeps decrypting via its original key version.
// New writes use the current primary version.
// ──────────────────────────────────────────────────────────────────

import { KeyManagementServiceClient } from "@google-cloud/kms";

// Trimmed to the CryptoKey (no /cryptoKeyVersions/N suffix) so KMS
// picks the current primary version on every encrypt call.
export const KMS_KEY_NAME =
  process.env.KMS_KEY_NAME ||
  "projects/bazaarlive-78422/locations/in/keyRings/anynall-kyc/cryptoKeys/pii-encryption-v1";

let client = null;
function getClient() {
  if (!client) client = new KeyManagementServiceClient();
  return client;
}

/**
 * Encrypt a short plaintext string. Returns base64 ciphertext ready
 * for Firestore storage. Throws if KMS is unreachable — caller should
 * abort the write rather than fall back to plaintext.
 */
export async function encryptField(plaintext) {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encryptField: plaintext must be a non-empty string");
  }
  if (plaintext.length > 64 * 1024) {
    // KMS symmetric encrypt supports up to 64KiB per request; PAN and
    // bank account are ~20 bytes so this is defensive.
    throw new Error("encryptField: plaintext exceeds 64KiB");
  }
  const [result] = await getClient().encrypt({
    name: KMS_KEY_NAME,
    plaintext: Buffer.from(plaintext, "utf8"),
  });
  return Buffer.from(result.ciphertext).toString("base64");
}

/**
 * Decrypt a base64 ciphertext back to its original UTF-8 string.
 * Guarded by IAM — will throw PERMISSION_DENIED if the caller isn't
 * granted decrypter on the key. Currently only intended for internal
 * server code (never expose via a public route unless auditing the
 * caller carefully first).
 */
export async function decryptField(ciphertextB64) {
  if (typeof ciphertextB64 !== "string" || ciphertextB64.length === 0) {
    throw new Error("decryptField: ciphertext must be a non-empty string");
  }
  const [result] = await getClient().decrypt({
    name: KMS_KEY_NAME,
    ciphertext: Buffer.from(ciphertextB64, "base64"),
  });
  return Buffer.from(result.plaintext).toString("utf8");
}
