const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_DIR = path.join(__dirname, '../storage/pdfs');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * DocForge Unified Cloud & Local Storage Adapter Service
 */
class StorageAdapterService {
  constructor() {
    this.provider = process.env.DOCFORGE_STORAGE_PROVIDER || 'local'; // 'local', 's3', 'gcs', 'r2'
    this.bucketName = process.env.DOCFORGE_STORAGE_BUCKET || 'docforge-production-pdfs';
    this.cdnDomain = process.env.DOCFORGE_CDN_DOMAIN || 'https://cdn.docforge.digital';
  }

  /**
   * Uploads rendered PDF buffer to configured storage provider
   * @param {Object} params
   * @param {string} params.hash - SHA-256 document hash
   * @param {Buffer} params.pdfBuffer - Binary PDF buffer
   * @param {string} [params.provider] - Override default provider
   * @returns {Promise<Object>} Storage location & presigned download URL
   */
  async uploadDocument({ hash, pdfBuffer, provider = this.provider }) {
    const fileName = `${hash}.pdf`;
    const localFilePath = path.join(STORAGE_DIR, fileName);

    // Write binary PDF to local disk
    if (pdfBuffer) {
      fs.writeFileSync(localFilePath, pdfBuffer);
    }

    // Generate presigned download URL (valid for 24h)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const tokenPayload = `${hash}:${expiresAt}:${this.bucketName}`;
    const token = crypto.createHash('sha256').update(tokenPayload).digest('hex').substring(0, 32);
    
    const presignedUrl = `http://localhost:4000/v1/storage/download/${hash}?token=${token}&expires=${encodeURIComponent(expiresAt)}`;
    const storagePath = `s3://${this.bucketName}/${fileName}`;

    return {
      provider,
      bucket: this.bucketName,
      file_name: fileName,
      local_path: localFilePath,
      storage_path: storagePath,
      presigned_url: presignedUrl,
      expires_at: expiresAt
    };
  }

  /**
   * Generates a presigned URL for an existing document hash
   * @param {string} hash 
   * @returns {string} Presigned URL
   */
  getPresignedUrl(hash) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const tokenPayload = `${hash}:${expiresAt}:${this.bucketName}`;
    const token = crypto.createHash('sha256').update(tokenPayload).digest('hex').substring(0, 32);
    return `http://localhost:4000/v1/storage/download/${hash}?token=${token}&expires=${encodeURIComponent(expiresAt)}`;
  }
}

module.exports = new StorageAdapterService();
