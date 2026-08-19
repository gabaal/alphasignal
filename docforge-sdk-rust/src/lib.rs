use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderOptions {
    pub format: Option<String>,
    pub orientation: Option<String>,
    pub theme: Option<String>,
    pub watermark: Option<String>,
    pub compress: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderPayload {
    pub html: String,
    pub css: Option<String>,
    pub data: serde_json::Value,
    pub options: Option<RenderOptions>,
}

pub struct DocForgeClient {
    pub api_key: String,
    pub base_url: String,
}

impl DocForgeClient {
    pub fn new(api_key: impl Into<String>, base_url: Option<String>) -> Self {
        Self {
            api_key: api_key.into(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:4000".to_string()),
        }
    }

    pub fn health_endpoint(&self) -> String {
        format!("{}/v1/health", self.base_url)
    }

    pub fn render_endpoint(&self) -> String {
        format!("{}/v1/render", self.base_url)
    }

    pub fn anchor_endpoint(&self) -> String {
        format!("{}/v1/ledger/anchor", self.base_url)
    }

    pub fn verify_proof_endpoint(&self, doc_hash: &str) -> String {
        format!("{}/v1/verify/proof/{}", self.base_url, doc_hash)
    }
}
