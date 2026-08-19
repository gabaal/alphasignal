import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Union, List, Optional
from .exceptions import DocForgeError

class RenderedPDFResult:
    """Wrapper class for binary PDF results with hash & render time metadata"""
    def __init__(self, pdf_bytes: bytes, document_hash: str, render_time_ms: int):
        self.pdf_bytes = pdf_bytes
        self.document_hash = document_hash
        self.render_time_ms = render_time_ms

    def save(self, file_path: str) -> None:
        """Saves binary PDF to local disk"""
        with open(file_path, "wb") as f:
            f.write(self.pdf_bytes)

    def __len__(self):
        return len(self.pdf_bytes)


class DocForgeClient:
    """Official Python Client for DocForge PDF API Engine"""
    
    def __init__(self, api_key: str, base_url: str = "http://localhost:4000", timeout: int = 30):
        if not api_key:
            raise DocForgeError("API Key is required to initialize DocForgeClient.", status_code=401, error_code="missing_api_key")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _make_request(self, endpoint: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Union[bytes, Dict[str, Any]]:
        headers = {
            "Content-Type": "application/json",
            "X-DocForge-Key": self.api_key
        }
        req_data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(endpoint, data=req_data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                status_code = resp.status
                content_type = resp.headers.get("Content-Type", "")
                
                if "application/pdf" in content_type:
                    pdf_bytes = resp.read()
                    doc_hash = resp.headers.get("X-DocForge-Document-Hash", "")
                    render_time_ms = int(resp.headers.get("X-DocForge-Render-Time-Ms", "0"))
                    return RenderedPDFResult(pdf_bytes, doc_hash, render_time_ms)

                body = resp.read().decode("utf-8")
                return json.loads(body)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            err_msg = err_body
            err_code = "api_error"
            try:
                err_json = json.loads(err_body)
                err_msg = err_json.get("message", err_body)
                err_code = err_json.get("error", err_code)
            except Exception:
                pass
            raise DocForgeError(err_msg, status_code=e.code, error_code=err_code)
        except urllib.error.URLError as e:
            raise DocForgeError(f"DocForge Connection Error: {e.reason}", status_code=500, error_code="network_error")

    def render(
        self,
        template_id: Optional[str] = None,
        version: Optional[int] = None,
        html: Optional[str] = None,
        css: str = "",
        data: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
        response_type: str = "binary"
    ) -> Union[RenderedPDFResult, Dict[str, Any]]:
        """
        Compiles HTML/CSS or server-side template_id into a PDF document
        """
        if not html and not template_id:
            raise DocForgeError("Parameter 'html' or 'template_id' is required for rendering.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/render"
        payload = {
            "template_id": template_id,
            "version": version,
            "html": html,
            "css": css,
            "data": data or {},
            "options": options or {},
            "response_type": response_type
        }

        return self._make_request(endpoint, method="POST", payload=payload)

    def render_batch(
        self,
        items: List[Dict[str, Any]],
        template_id: Optional[str] = None,
        version: Optional[int] = None,
        html: Optional[str] = None,
        css: str = "",
        options: Optional[Dict[str, Any]] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enqueues an asynchronous batch PDF rendering job
        """
        if not items or not isinstance(items, list):
            raise DocForgeError("Parameter 'items' must be a non-empty list.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/render/batch"
        payload = {
            "template_id": template_id,
            "version": version,
            "html": html,
            "css": css,
            "options": options or {},
            "items": items,
            "webhook_url": webhook_url
        }

        return self._make_request(endpoint, method="POST", payload=payload)

    def get_job_status(self, batch_id: str) -> Dict[str, Any]:
        """
        Queries real-time progress and results for an async batch job
        """
        if not batch_id:
            raise DocForgeError("Parameter 'batch_id' is required.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/jobs/{urllib.parse.quote(batch_id)}"
        return self._make_request(endpoint, method="GET")

    def create_template(
        self,
        template_id: str,
        name: str,
        html: str,
        css: str = "",
        default_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Registers or updates a server-side HTML/CSS template version
        """
        if not template_id or not name or not html:
            raise DocForgeError("Parameters 'template_id', 'name', and 'html' are required.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/templates"
        payload = {
            "template_id": template_id,
            "name": name,
            "html": html,
            "css": css,
            "default_options": default_options or {}
        }

        return self._make_request(endpoint, method="POST", payload=payload)

    def list_templates(self) -> Dict[str, Any]:
        """
        Lists all registered server-side templates
        """
        endpoint = f"{self.base_url}/v1/templates"
        return self._make_request(endpoint, method="GET")

    def get_template(self, template_id: str, version: Optional[int] = None) -> Dict[str, Any]:
        """
        Fetches template details and version history
        """
        endpoint = f"{self.base_url}/v1/templates/{urllib.parse.quote(template_id)}"
        if version is not None:
            endpoint += f"?version={version}"

        return self._make_request(endpoint, method="GET")

    def verify(self, document_hash: str) -> Dict[str, Any]:
        """
        Verifies document hash authenticity against DocForge cryptographic ledger
        """
        if not document_hash:
            raise DocForgeError("Parameter 'document_hash' is required for verification.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/verify/{urllib.parse.quote(document_hash)}"
        req = urllib.request.Request(endpoint)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else "{}"
            try:
                return json.loads(body)
            except Exception:
                return {"is_valid": False, "message": body}

    def anchor_ledger(self) -> Dict[str, Any]:
        """
        Triggers a Merkle Tree Root batch anchor
        """
        endpoint = f"{self.base_url}/v1/ledger/anchor"
        return self._make_request(endpoint, method="POST")

    def verify_proof(self, document_hash: str) -> Dict[str, Any]:
        """
        Verifies Merkle inclusion proof for a given document hash
        """
        if not document_hash:
            raise DocForgeError("Parameter 'document_hash' is required.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/verify/proof/{urllib.parse.quote(document_hash)}"
        req = urllib.request.Request(endpoint)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else "{}"
            try:
                return json.loads(body)
            except Exception:
                return {"is_valid": False, "message": body}

    def get_webhook_dlq(self) -> Dict[str, Any]:
        """
        Lists retained dead-letter queue (DLQ) webhook items
        """
        endpoint = f"{self.base_url}/v1/webhooks/dlq"
        return self._make_request(endpoint, method="GET")

    def retry_webhook_dlq(self, dlq_id: str) -> Dict[str, Any]:
        """
        Re-triggers a failed webhook dispatch item from DLQ
        """
        if not dlq_id:
            raise DocForgeError("Parameter 'dlq_id' is required.", status_code=400, error_code="invalid_parameter")

        endpoint = f"{self.base_url}/v1/webhooks/dlq/retry"
        return self._make_request(endpoint, method="POST", payload={"dlq_id": dlq_id})

    def health(self) -> Dict[str, Any]:
        """
        Checks API cluster health status
        """
        endpoint = f"{self.base_url}/v1/health"
        req = urllib.request.Request(endpoint)
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

