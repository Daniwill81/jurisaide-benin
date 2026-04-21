import os
from datetime import datetime, timedelta
from typing import cast

from jose import jwt  # type: ignore[import-untyped]
from passlib.context import CryptContext

# Secret keys and constants - should be in .env in production
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: object, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = cast(str, jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM))
    return encoded_jwt
