/**
 * Official Node.js & TypeScript Client SDK for DocForge PDF API Engine
 */

class DocForgeError extends Error {
  constructor(message, statusCode = 500, errorCode = 'sdk_error') {
    super(message);
    this.name = 'DocForgeError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

class DocForge {
  /**
   * Initialize DocForge Client
   * @param {Object} config - Client configuration
   * @param {string} config.apiKey - Production or Test API Key (e.g. df_live_...)
   * @param {string} [config.baseUrl='http://localhost:4000'] - DocForge API Base Endpoint
   */
  constructor({ apiKey, baseUrl = 'http://localhost:4000', timeoutMs = 30000 }) {
    if (!apiKey) {
      throw new DocForgeError('API Key is required to initialize DocForge client.', 401, 'missing_api_key');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Compiles HTML/CSS template + JSON payload into a PDF document
   * @param {Object} params - Render Parameters
   * @param {string} [params.template_id] - Server-side registered template ID
   * @param {number} [params.version] - Specific template version number (defaults to latest)
   * @param {string} [params.html] - HTML template string with Handlebars variables
   * @param {string} [params.css=''] - Custom CSS stylesheet string
   * @param {Object} [params.data={}] - JSON key-value data model
   * @param {Object} [params.options={}] - Custom formatting, watermark, and theme options
   * @param {string} [params.response_type='binary'] - Output format ('binary', 'json', or 'base64')
   * @returns {Promise<Buffer|Object>} Raw PDF Buffer or JSON object
   */
  async render({ template_id, version, html, css = '', data = {}, options = {}, response_type = 'binary' }) {
    if (!html && !template_id) {
      throw new DocForgeError('Parameter "html" or "template_id" is required for rendering.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/render`;
    const payload = {
      template_id,
      version,
      html,
      css,
      data,
      options,
      response_type
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocForge-Key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errJson = {};
        try { errJson = await response.json(); } catch (e) {}
        throw new DocForgeError(
          errJson.message || `API request failed with status ${response.status}`,
          response.status,
          errJson.error || 'api_error'
        );
      }

      if (response_type === 'binary') {
        const arrayBuf = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuf);
        
        // Attach metadata properties onto Buffer object
        pdfBuffer.hash = response.headers.get('X-DocForge-Document-Hash');
        pdfBuffer.renderTimeMs = parseInt(response.headers.get('X-DocForge-Render-Time-Ms') || '0', 10);
        return pdfBuffer;
      }

      return await response.json();
    } catch (err) {
      if (err instanceof DocForgeError) throw err;
      throw new DocForgeError(`DocForge Connection Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Enqueues an asynchronous batch PDF rendering job
   * @param {Object} params - Batch parameters
   * @param {Array<Object>} params.items - Array of render payload items
   * @param {string} [params.template_id] - Server-side template ID
   * @param {number} [params.version] - Template version
   * @param {string} [params.webhook_url] - Target completion webhook URL
   * @returns {Promise<Object>} Accepted batch job details with batch_id
   */
  async renderBatch({ template_id, version, html, css, options = {}, items = [], webhook_url }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new DocForgeError('Parameter "items" must be a non-empty array.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/render/batch`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocForge-Key': this.apiKey
        },
        body: JSON.stringify({ template_id, version, html, css, options, items, webhook_url })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new DocForgeError(resJson.message || 'Failed to enqueue batch job', response.status, resJson.error);
      }
      return resJson;
    } catch (err) {
      if (err instanceof DocForgeError) throw err;
      throw new DocForgeError(`DocForge Batch Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Queries status and item results for an asynchronous batch job
   * @param {string} batchId - Target batch_id
   * @returns {Promise<Object>} Batch job status and items list
   */
  async getJobStatus(batchId) {
    if (!batchId) {
      throw new DocForgeError('Batch ID parameter is required.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/jobs/${encodeURIComponent(batchId)}`;
    try {
      const response = await fetch(endpoint, {
        headers: { 'X-DocForge-Key': this.apiKey }
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new DocForgeError(resJson.message || 'Failed to fetch job status', response.status, resJson.error);
      }
      return resJson;
    } catch (err) {
      if (err instanceof DocForgeError) throw err;
      throw new DocForgeError(`DocForge Job Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Registers or updates a server-side HTML/CSS template
   * @param {Object} params - Template parameters
   * @param {string} params.template_id - Unique string identifier (e.g. 'saas_invoice')
   * @param {string} params.name - Human readable template name
   * @param {string} params.html - HTML Handlebars template layout
   * @param {string} [params.css=''] - Custom CSS stylesheet
   * @param {Object} [params.default_options={}] - Default render options
   * @returns {Promise<Object>} Created template version metadata
   */
  async createTemplate({ template_id, name, html, css = '', default_options = {} }) {
    if (!template_id || !name || !html) {
      throw new DocForgeError('Parameters "template_id", "name", and "html" are required.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/templates`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocForge-Key': this.apiKey
        },
        body: JSON.stringify({ template_id, name, html, css, default_options })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new DocForgeError(resJson.message || 'Failed to save template', response.status, resJson.error);
      }
      return resJson;
    } catch (err) {
      if (err instanceof DocForgeError) throw err;
      throw new DocForgeError(`DocForge Template Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Lists registered templates
   * @returns {Promise<Object>} Array of templates with version summaries
   */
  async listTemplates() {
    const endpoint = `${this.baseUrl}/v1/templates`;
    try {
      const response = await fetch(endpoint, {
        headers: { 'X-DocForge-Key': this.apiKey }
      });
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Template Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Fetches template details and version history
   * @param {string} templateId - Target template ID
   * @param {number} [version] - Optional version number
   * @returns {Promise<Object>} Template details
   */
  async getTemplate(templateId, version = null) {
    let endpoint = `${this.baseUrl}/v1/templates/${encodeURIComponent(templateId)}`;
    if (version) endpoint += `?version=${version}`;

    try {
      const response = await fetch(endpoint, {
        headers: { 'X-DocForge-Key': this.apiKey }
      });
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Template Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Verifies document authenticity against DocForge ledger
   * @param {string} hash - SHA-256 document hash string
   * @returns {Promise<Object>} Ledger verification details
   */
  async verify(hash) {
    if (!hash) {
      throw new DocForgeError('Document hash parameter is required for verification.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/verify/${encodeURIComponent(hash)}`;
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Verification Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Triggers a Merkle Tree Root batch anchor
   * @returns {Promise<Object>} Anchor result with merkle_root and blockchain_tx_hash
   */
  async anchorLedger() {
    const endpoint = `${this.baseUrl}/v1/ledger/anchor`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'X-DocForge-Key': this.apiKey }
      });
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Anchor Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Verifies document Merkle Inclusion Proof
   * @param {string} hash - Document SHA-256 hash
   * @returns {Promise<Object>} Merkle proof verification details
   */
  async verifyProof(hash) {
    if (!hash) {
      throw new DocForgeError('Document hash parameter is required.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/verify/proof/${encodeURIComponent(hash)}`;
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Proof Verification Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Fetches active Dead Letter Queue (DLQ) entries for failed webhooks
   * @returns {Promise<Object>} Array of DLQ items
   */
  async getWebhookDlq() {
    const endpoint = `${this.baseUrl}/v1/webhooks/dlq`;
    try {
      const response = await fetch(endpoint, {
        headers: { 'X-DocForge-Key': this.apiKey }
      });
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge DLQ Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Re-triggers a failed webhook dispatch item from DLQ
   * @param {string} dlqId - Target DLQ entry ID
   * @returns {Promise<Object>} Retry result status
   */
  async retryWebhookDlq(dlqId) {
    if (!dlqId) {
      throw new DocForgeError('Parameter "dlqId" is required.', 400, 'invalid_parameter');
    }

    const endpoint = `${this.baseUrl}/v1/webhooks/dlq/retry`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocForge-Key': this.apiKey
        },
        body: JSON.stringify({ dlq_id: dlqId })
      });
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge DLQ Retry Error: ${err.message}`, 500, 'network_error');
    }
  }

  /**
   * Checks API cluster health status
   * @returns {Promise<Object>} Cluster health status
   */
  async health() {
    const endpoint = `${this.baseUrl}/v1/health`;
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (err) {
      throw new DocForgeError(`DocForge Health Check Error: ${err.message}`, 500, 'network_error');
    }
  }
}

module.exports = {
  DocForge,
  DocForgeError
};
