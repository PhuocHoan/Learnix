import * as crypto from 'crypto';

/**
 * Encrypt a token value for storage in a cookie using AES-256-GCM.
 * The output format is base64-encoded concatenation of IV, authTag and ciphertext.
 */
export function encryptTokenForCookie(token: string, secret: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  // Use PBKDF2 for secure key derivation
  const key = crypto.pbkdf2Sync(secret, '', 100000, 32, 'sha256'); // 32 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, ciphertext]);
  return combined.toString('base64');
}

/**
 * Decrypt a token value from a cookie.
 * Returns null if decryption fails or if the token is not encrypted.
 */
export function decryptTokenFromCookie(
  encryptedToken: string,
  secret: string,
): string | null {
  try {
    const combined = Buffer.from(encryptedToken, 'base64');

    // Minimum length check: 12 (IV) + 16 (AuthTag) + at least 1 byte ciphertext
    if (combined.length < 29) {
      return null;
    }

    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);

    const key = crypto.pbkdf2Sync(secret, '', 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (_error) {
    // Return null if decryption fails (e.g., invalid format, wrong key)
    return null;
  }
}
