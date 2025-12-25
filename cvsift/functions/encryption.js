const {KeyManagementServiceClient} = require("@google-cloud/kms");
const crypto = require("crypto");

/**
 * Encryption utility for protecting PII in CVSift
 *
 * Uses Google Cloud KMS for key management and AES-256-GCM for encryption.
 * This ensures POPIA/GDPR compliance by encrypting sensitive candidate data at rest.
 *
 * Cost: FREE for most users (within free tier: 100 key versions, 10K operations/month)
 */

// Initialize KMS client
const kmsClient = new KeyManagementServiceClient();

// KMS key configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || "cvsift-3dff8";
const LOCATION = "global"; // or "us-central1" for regional
const KEY_RING = "cvsift-encryption";
const KEY_NAME = "cv-pii-encryption-key";

// Full key path
const keyPath = kmsClient.cryptoKeyPath(
    PROJECT_ID,
    LOCATION,
    KEY_RING,
    KEY_NAME,
);

/**
 * PII fields to encrypt in CV metadata
 * These field names match Claude AI's output format
 */
const PII_FIELDS = [
  "name",
  "email",
  "phone",
  "location", // Geographic location (city, state, country)
  "visaStatus", // Visa/work authorization status
  "linkedin", // LinkedIn profile URL
  "github", // GitHub profile URL (if present)
  "portfolio", // Portfolio website URL (if present)
];

/**
 * Encrypt a single string value using Cloud KMS
 * @param {string} plaintext - The text to encrypt
 * @return {Promise<string>} Base64-encoded encrypted data with IV
 */
async function encryptField(plaintext) {
  try {
    if (!plaintext || typeof plaintext !== "string") {
      return plaintext; // Return as-is if not a string or empty
    }

    // Generate a data encryption key (DEK) for this field
    // Using envelope encryption: DEK encrypts data, KMS encrypts DEK
    const dek = crypto.randomBytes(32); // 256-bit key for AES-256
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM

    // Encrypt the plaintext with the DEK
    const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    // Encrypt the DEK with Cloud KMS
    const [encryptResponse] = await kmsClient.encrypt({
      name: keyPath,
      plaintext: dek,
    });

    // Package everything together
    const encryptedPackage = {
      encryptedDEK: encryptResponse.ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: encrypted,
      version: "v1", // For future key rotation support
    };

    // Return as JSON string (to store in Firestore)
    return JSON.stringify(encryptedPackage);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Failed to encrypt field: ${error.message}`);
  }
}

/**
 * Decrypt a single encrypted string value using Cloud KMS
 * @param {string} encryptedData - JSON string containing encrypted package
 * @return {Promise<string>} Decrypted plaintext
 */
async function decryptField(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== "string") {
      return encryptedData; // Return as-is if not encrypted
    }

    // Check if this is actually encrypted data
    if (!encryptedData.startsWith("{")) {
      return encryptedData; // Not encrypted (backward compatibility)
    }

    const encryptedPackage = JSON.parse(encryptedData);

    // Decrypt the DEK with Cloud KMS
    const [decryptResponse] = await kmsClient.decrypt({
      name: keyPath,
      ciphertext: Buffer.from(encryptedPackage.encryptedDEK, "base64"),
    });

    const dek = Buffer.from(decryptResponse.plaintext);
    const iv = Buffer.from(encryptedPackage.iv, "base64");
    const authTag = Buffer.from(encryptedPackage.authTag, "base64");

    // Decrypt the ciphertext with the DEK
    const decipher = crypto.createDecipheriv("aes-256-gcm", dek, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedPackage.ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // Return encrypted data as fallback (allows gradual rollout)
    return "[ENCRYPTED]";
  }
}

/**
 * Encrypt all PII fields in CV metadata
 * @param {object} metadata - CV metadata object from Claude AI
 * @return {Promise<object>} Metadata with encrypted PII fields
 */
async function encryptCVMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return metadata;
  }

  const encryptedMetadata = {...metadata};

  // Encrypt each PII field
  for (const field of PII_FIELDS) {
    if (metadata[field]) {
      try {
        encryptedMetadata[field] = await encryptField(metadata[field]);
        console.log(`Encrypted field: ${field}`);
      } catch (error) {
        console.error(`Failed to encrypt field ${field}:`, error);
        // Keep original value if encryption fails (log for monitoring)
        encryptedMetadata[field] = metadata[field];
      }
    }
  }

  // Mark as encrypted for tracking
  encryptedMetadata._encrypted = true;
  encryptedMetadata._encryptedAt = new Date().toISOString();

  return encryptedMetadata;
}

/**
 * Decrypt all PII fields in CV metadata
 * @param {object} metadata - CV metadata with encrypted PII fields
 * @return {Promise<object>} Metadata with decrypted PII fields
 */
async function decryptCVMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return metadata;
  }

  // If not marked as encrypted, return as-is (backward compatibility)
  if (!metadata._encrypted) {
    return metadata;
  }

  const decryptedMetadata = {...metadata};

  // Decrypt each PII field
  for (const field of PII_FIELDS) {
    if (metadata[field]) {
      try {
        decryptedMetadata[field] = await decryptField(metadata[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
        decryptedMetadata[field] = "[DECRYPTION_FAILED]";
      }
    }
  }

  // Remove encryption metadata from returned object
  delete decryptedMetadata._encrypted;
  delete decryptedMetadata._encryptedAt;

  return decryptedMetadata;
}

/**
 * Initialize Cloud KMS key ring and key
 * Should be run once during setup
 */
async function initializeKMSKey() {
  try {
    console.log("Initializing Cloud KMS for CV encryption...");

    const locationPath = kmsClient.locationPath(PROJECT_ID, LOCATION);

    // Create key ring (idempotent - won't fail if exists)
    try {
      const [keyRing] = await kmsClient.createKeyRing({
        parent: locationPath,
        keyRingId: KEY_RING,
      });
      console.log(`Created key ring: ${keyRing.name}`);
    } catch (error) {
      if (error.code === 6) { // ALREADY_EXISTS
        console.log("Key ring already exists");
      } else {
        throw error;
      }
    }

    // Create crypto key (idempotent)
    try {
      const keyRingPath = kmsClient.keyRingPath(PROJECT_ID, LOCATION, KEY_RING);
      const [key] = await kmsClient.createCryptoKey({
        parent: keyRingPath,
        cryptoKeyId: KEY_NAME,
        cryptoKey: {
          purpose: "ENCRYPT_DECRYPT",
          versionTemplate: {
            protectionLevel: "SOFTWARE", // Free tier eligible
            algorithm: "GOOGLE_SYMMETRIC_ENCRYPTION",
          },
        },
      });
      console.log(`Created crypto key: ${key.name}`);
    } catch (error) {
      if (error.code === 6) { // ALREADY_EXISTS
        console.log("Crypto key already exists");
      } else {
        throw error;
      }
    }

    console.log("✅ KMS initialization complete!");
    console.log(`Key path: ${keyPath}`);

    return {success: true, keyPath};
  } catch (error) {
    console.error("KMS initialization error:", error);
    throw new Error(`Failed to initialize KMS: ${error.message}`);
  }
}

module.exports = {
  encryptField,
  decryptField,
  encryptCVMetadata,
  decryptCVMetadata,
  initializeKMSKey,
  PII_FIELDS,
};
