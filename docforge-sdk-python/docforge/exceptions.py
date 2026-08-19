class DocForgeError(Exception):
    """Base Exception for DocForge SDK Errors"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = "sdk_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

    def __str__(self):
        return f"[{self.error_code}] Status {self.status_code}: {self.message}"
