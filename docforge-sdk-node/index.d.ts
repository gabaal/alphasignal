export interface DocForgeOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface RenderOptions {
  format?: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation?: 'portrait' | 'landscape';
  watermark?: 'none' | 'CONFIDENTIAL' | 'DRAFT' | 'PAID' | 'SAMPLE' | string;
  theme?: 'light' | 'dark' | 'emerald';
  enable_signature_stamp?: boolean;
}

export interface RenderParams {
  template_id?: string;
  version?: number;
  html?: string;
  css?: string;
  data?: Record<string, any>;
  options?: RenderOptions;
  response_type?: 'binary' | 'json' | 'base64';
}

export interface TemplateParams {
  template_id: string;
  name: string;
  html: string;
  css?: string;
  default_options?: RenderOptions;
}

export interface TemplateResponse {
  status: string;
  message?: string;
  template?: {
    template_id: string;
    version: number;
    name: string;
    created_at: string;
  };
  templates?: Array<{
    template_id: string;
    name: string;
    latest_version: number;
    total_versions: number;
    last_updated_at: string;
  }>;
}

export interface JsonRenderResponse {
  status: 'success';
  document_hash: string;
  render_time_ms: number;
  download_url?: string;
  base64?: string;
}

export interface VerifyResponse {
  is_valid: boolean;
  document_hash?: string;
  issued_at?: string;
  account_id?: string;
  tamper_check?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  timestamp: string;
  rendering_engine: string;
}

export interface BatchParams {
  template_id?: string;
  version?: number;
  html?: string;
  css?: string;
  options?: RenderOptions;
  items: Array<Record<string, any>>;
  webhook_url?: string;
}

export interface BatchResponse {
  status: 'accepted';
  batch_id: string;
  total_items: number;
  status_url: string;
}

export interface JobStatusResponse {
  status: string;
  job?: {
    batch_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress_percent: number;
    total_items: number;
    processed_items: number;
    failed_items: number;
    webhook_url?: string;
    created_at: string;
    completed_at?: string;
    items: Array<{
      item_id: string;
      custom_id?: string;
      status: string;
      document_hash?: string;
      download_url?: string;
      error?: string;
    }>;
  };
}

export class DocForgeError extends Error {
  statusCode?: number;
  errorCode?: string;
  constructor(message: string, statusCode?: number, errorCode?: string);
}

export class DocForge {
  constructor(options: DocForgeOptions);
  render(params: RenderParams): Promise<Buffer | JsonRenderResponse>;
  renderBatch(params: BatchParams): Promise<BatchResponse>;
  getJobStatus(batchId: string): Promise<JobStatusResponse>;
  createTemplate(params: TemplateParams): Promise<TemplateResponse>;
  listTemplates(): Promise<TemplateResponse>;
  getTemplate(templateId: string, version?: number): Promise<TemplateResponse>;
  verify(hash: string): Promise<VerifyResponse>;
  health(): Promise<HealthResponse>;
}
