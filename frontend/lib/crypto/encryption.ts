import CryptoJS from 'crypto-js';

/**
 * Generate a random AES-256 key
 * @returns {string} Base64 encoded key
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString(CryptoJS.enc.Base64);
}

/**
 * Generate a random salt for key derivation
 * @returns {string} Base64 encoded salt
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Base64);
}

/**
 * Derive a key from a password using PBKDF2
 * @param password - The password to derive from
 * @param salt - The salt for key derivation
 * @param iterations - Number of iterations (default: 10000)
 * @returns {string} Base64 encoded derived key
 */
export function deriveKeyFromPassword(
  password: string,
  salt: string,
  iterations: number = 10000
): string {
  const saltWordArray = CryptoJS.enc.Base64.parse(salt);
  const derivedKey = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: 256 / 32,
    iterations: iterations,
  });
  return derivedKey.toString(CryptoJS.enc.Base64);
}

/**
 * Encrypt data using AES-256-CBC
 * @param data - The data to encrypt (string or ArrayBuffer)
 * @param key - Base64 encoded encryption key
 * @returns {Promise<{encryptedData: string, iv: string}>} Encrypted data and IV
 */
export async function encryptData(
  data: string | ArrayBuffer,
  key: string
): Promise<{ encryptedData: string; iv: string }> {
  try {
    // Convert data to string if it's ArrayBuffer
    let dataString: string;
    if (data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data);
      dataString = CryptoJS.enc.Base64.stringify(
        CryptoJS.lib.WordArray.create(uint8Array)
      );
    } else {
      dataString = data;
    }

    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(128 / 8); // 128 bits for CBC
    
    // Parse the key
    const keyWordArray = CryptoJS.enc.Base64.parse(key);
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(dataString, keyWordArray, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encryptedData: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Base64),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-256-CBC
 * @param encryptedData - The encrypted data string
 * @param key - Base64 encoded decryption key
 * @param iv - Base64 encoded initialization vector
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(
  encryptedData: string,
  key: string,
  iv: string
): Promise<string> {
  try {
    // Parse the key and IV
    const keyWordArray = CryptoJS.enc.Base64.parse(key);
    const ivWordArray = CryptoJS.enc.Base64.parse(iv);
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt a file and return the encrypted data
 * @param file - The file to encrypt
 * @param key - Base64 encoded encryption key
 * @returns {Promise<{encryptedData: string, iv: string, originalName: string, size: number}>}
 */
export async function encryptFile(
  file: File,
  key: string
): Promise<{
  encryptedData: string;
  iv: string;
  originalName: string;
  size: number;
  mimeType: string;
}> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Encrypt the file data
    const { encryptedData, iv } = await encryptData(arrayBuffer, key);
    
    return {
      encryptedData,
      iv,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    throw new Error(`File encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt file data and return as Blob
 * @param encryptedData - The encrypted file data
 * @param key - Base64 encoded decryption key
 * @param iv - Base64 encoded initialization vector
 * @param mimeType - Original file MIME type
 * @returns {Promise<Blob>} Decrypted file as Blob
 */
export async function decryptFile(
  encryptedData: string,
  key: string,
  iv: string,
  mimeType: string
): Promise<Blob> {
  try {
    // Decrypt the data
    const decryptedBase64 = await decryptData(encryptedData, key, iv);
    
    // Convert base64 back to ArrayBuffer
    const wordArray = CryptoJS.enc.Base64.parse(decryptedBase64);
    const arrayBuffer = new ArrayBuffer(wordArray.sigBytes);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < wordArray.sigBytes; i++) {
      uint8Array[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    
    return new Blob([arrayBuffer], { type: mimeType });
  } catch (error) {
    throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a secure random filename
 * @param extension - File extension (optional)
 * @returns {string} Random filename
 */
export function generateSecureFilename(extension?: string): string {
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  const filename = randomBytes.toString(CryptoJS.enc.Hex);
  return extension ? `${filename}.${extension}` : filename;
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns {string} Base64 encoded hash
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Base64);
} 