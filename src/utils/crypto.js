import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

export class CryptoManager {
  constructor() {
    this.keyStore = new Map(); // Store keys for each transfer
  }

  // Generate a secure key
  generateKey() {
    return CryptoJS.lib.WordArray.random(KEY_LENGTH);
  }

  // Generate initialization vector
  generateIV() {
    return CryptoJS.lib.WordArray.random(IV_LENGTH);
  }

  // Encrypt data with a unique key
  encrypt(data, transferId) {
    try {
      // Generate new key if not exists
      if (!this.keyStore.has(transferId)) {
        const key = this.generateKey();
        const iv = this.generateIV();
        this.keyStore.set(transferId, { key, iv });
      }

      const { key, iv } = this.keyStore.get(transferId);
      
      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key,
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      // Calculate checksum
      const checksum = CryptoJS.SHA256(JSON.stringify(data)).toString();

      return {
        encryptedData: encrypted.toString(),
        checksum
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with stored key
  decrypt(encryptedData, transferId) {
    try {
      if (!this.keyStore.has(transferId)) {
        throw new Error('No encryption key found for this transfer');
      }

      const { key, iv } = this.keyStore.get(transferId);
      
      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        key,
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Verify checksum
  verifyChecksum(data, checksum) {
    try {
      const calculatedChecksum = CryptoJS.SHA256(JSON.stringify(data)).toString();
      return calculatedChecksum === checksum;
    } catch (error) {
      console.error('Checksum verification error:', error);
      return false;
    }
  }

  // Clean up keys after transfer
  cleanup(transferId) {
    this.keyStore.delete(transferId);
  }
}

// Export singleton instance
export const cryptoManager = new CryptoManager();
