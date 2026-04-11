import os
import base64
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

class KeyVault:
    """
    Institutional-grade KeyVault for API credential storage.
    Encrypts exchange API secrets symmetrically using AES-128 via Fernet.
    """
    _fernet = None

    @classmethod
    def initialize(cls):
        if cls._fernet is not None:
            return

        # Attempt to get secret from environment or construct fallback for local dev
        secret = os.environ.get("KEYVAULT_SECRET")
        if not secret:
            logger.warning("KEYVAULT_SECRET not found in environment. Generating local DEV runtime key. Secrets saved during this session will become invalid across restarts unless KEYVAULT_SECRET is pinned.")
            # Generate a consistent mock one using some host details if we want, but purely local memory is safer
            secret = Fernet.generate_key()
            os.environ["KEYVAULT_SECRET"] = secret.decode('utf-8')
        else:
            # Must be a 32 url-safe base64-encoded bytes string
            secret = secret.encode('utf-8')

        try:
            cls._fernet = Fernet(secret)
        except ValueError as e:
            logger.error("Failed to initialize KeyVault Fernet. Secret must be 32 URL-safe base64-encoded bytes.")
            # Fallback to avoid complete crash
            cls._fernet = Fernet(Fernet.generate_key())

    @classmethod
    def encrypt_secret(cls, plaintext: str) -> str:
        if not cls._fernet:
            cls.initialize()
        if not plaintext:
            return ""
        try:
            encrypted_bytes = cls._fernet.encrypt(plaintext.encode('utf-8'))
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return ""

    @classmethod
    def decrypt_secret(cls, ciphertext: str) -> str:
        if not cls._fernet:
            cls.initialize()
        if not ciphertext:
            return ""
        try:
            decrypted_bytes = cls._fernet.decrypt(ciphertext.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ""
