package docforge

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Client represents the DocForge Go SDK Client
type Client struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

// RenderOptions defines layout, theme, and watermarking options
type RenderOptions struct {
	Format               string `json:"format,omitempty"`
	Orientation          string `json:"orientation,omitempty"`
	Theme                string `json:"theme,omitempty"`
	Watermark            string `json:"watermark,omitempty"`
	EnableSignatureStamp bool   `json:"enable_signature_stamp,omitempty"`
	DisplayHeaderFooter  bool   `json:"display_header_footer,omitempty"`
	HeaderTemplate       string `json:"header_template,omitempty"`
	FooterTemplate       string `json:"footer_template,omitempty"`
	FillableForms        bool   `json:"fillable_forms,omitempty"`
	Compress             bool   `json:"compress,omitempty"`
	RTL                  bool   `json:"rtl,omitempty"`
}

// RenderPayload defines the POST /v1/render request
type RenderPayload struct {
	TemplateID   string        `json:"template_id,omitempty"`
	Version      int           `json:"version,omitempty"`
	HTML         string        `json:"html,omitempty"`
	CSS          string        `json:"css,omitempty"`
	Data         interface{}   `json:"data,omitempty"`
	Options      RenderOptions `json:"options,omitempty"`
	ResponseType string        `json:"response_type,omitempty"`
}

// RenderResult represents binary PDF output with hash metadata
type RenderResult struct {
	PDFBytes     []byte
	DocumentHash string
	RenderTimeMS int
}

// NewClient initializes a new DocForge client
func NewClient(apiKey, baseURL string) *Client {
	if baseURL == "" {
		baseURL = "http://localhost:4000"
	}
	return &Client{
		APIKey:  apiKey,
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Render compiles HTML/CSS template to PDF
func (c *Client) Render(payload RenderPayload) (*RenderResult, error) {
	endpoint := fmt.Sprintf("%s/v1/render", c.BaseURL)
	if payload.ResponseType == "" {
		payload.ResponseType = "binary"
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-DocForge-Key", c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API Error (%d): %s", resp.StatusCode, string(body))
	}

	pdfBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	docHash := resp.Header.Get("X-DocForge-Document-Hash")
	return &RenderResult{
		PDFBytes:     pdfBytes,
		DocumentHash: docHash,
	}, nil
}

// AnchorLedger triggers a Merkle root batch anchor
func (c *Client) AnchorLedger() (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("%s/v1/ledger/anchor", c.BaseURL)
	req, err := http.NewRequest("POST", endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-DocForge-Key", c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

// VerifyProof queries Merkle inclusion proof for a document hash
func (c *Client) VerifyProof(docHash string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("%s/v1/verify/proof/%s", c.BaseURL, url.PathEscape(docHash))
	resp, err := c.HTTPClient.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

// Health checks cluster health status
func (c *Client) Health() (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("%s/v1/health", c.BaseURL)
	resp, err := c.HTTPClient.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
