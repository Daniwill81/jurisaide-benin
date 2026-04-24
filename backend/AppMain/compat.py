"""
Passlib / bcrypt compatibility shim.

passlib 1.7.4 was written against bcrypt <= 3.x and makes two assumptions
that are broken in bcrypt >= 4.0.1:

  1. It reads the library version via ``bcrypt.__about__.__version__``.
     bcrypt 4.x removed the ``__about__`` sub-module entirely.

  2. It passes a 73-byte test password to ``bcrypt.hashpw`` during its
     internal "wrap-bug" detection.  bcrypt 4.x now *raises* a ValueError
     for passwords longer than 72 bytes instead of silently truncating them.

This module must be imported **before** any passlib or bcrypt code runs.
In practice, import it at the very top of ``AppMain/asgi.py``.
"""

import types

import bcrypt as _bcrypt

# ── Fix 1: restore __about__.__version__ ─────────────────────────────────────
if not hasattr(_bcrypt, "__about__"):
    _about = types.ModuleType("bcrypt.__about__")
    _about.__version__ = getattr(_bcrypt, "__version__", "4.0.0")
    _bcrypt.__about__ = _about  # type: ignore[attr-defined]


# ── Fix 2: wrap hashpw to truncate passwords > 72 bytes ──────────────────────
_original_hashpw = _bcrypt.hashpw


def _safe_hashpw(password: bytes, salt: bytes) -> bytes:
    """Truncate password to 72 bytes before hashing (bcrypt's hard limit)."""
    return _original_hashpw(password[:72], salt)


_bcrypt.hashpw = _safe_hashpw  # type: ignore[attr-defined]
