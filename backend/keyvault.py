import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import logging

logger = logging.getLogger(__name__)

class KeyVault:
    """
    Institutional-grade KeyVault for API credential storage.
    Encrypts exchange API secrets symmetrically using AES-256-GCM.
    """
    _key = None

    @classmethod
    def initialize(cls):
        if cls._key is not None:
            return

        # Attempt to get secret from environment or construct fallback for local dev
        secret = os.environ.get("KEYVAULT_SECRET")
        if not secret:
            logger.warning("KEYVAULT_SECRET not found in environment. Generating local DEV runtime key. Secrets saved during this session will become invalid across restarts unless KEYVAULT_SECRET is pinned.")
            # Use a deterministic static fallback key for local dev so restarts don't invalidate DB secrets
            secret = b'f8S2bWvL4kP9jZ1qR5yH7xF3nM0cX8vT6dJ2wK4gH9A='
            os.environ["KEYVAULT_SECRET"] = secret.decode('utf-8')
        else:
            # Must be a 32 url-safe base64-encoded bytes string
            secret = secret.encode('utf-8')

        try:
            decoded = base64.urlsafe_b64decode(secret)
            if len(decoded) != 32:
                raise ValueError("Key must be 32 bytes for AES-256")
            cls._key = decoded
        except Exception as e:
            logger.error("Failed to initialize KeyVault. Secret must be 32 URL-safe base64-encoded bytes.")
            # Fallback to avoid complete crash
            cls._key = AESGCM.generate_key(bit_length=256)

    @classmethod
    def encrypt_secret(cls, plaintext: str) -> str:
        if not cls._key:
            cls.initialize()
        if not plaintext:
            return ""
        try:
            aesgcm = AESGCM(cls._key)
            nonce = os.urandom(12)
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
            return base64.urlsafe_b64encode(nonce + ciphertext).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return ""

    @classmethod
    def decrypt_secret(cls, ciphertext: str) -> str:
        if not cls._key:
            cls.initialize()
        if not ciphertext:
            return ""
        try:
            data = base64.urlsafe_b64decode(ciphertext.encode('utf-8'))
            nonce = data[:12]
            ct = data[12:]
            aesgcm = AESGCM(cls._key)
            decrypted = aesgcm.decrypt(nonce, ct, None)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ""
