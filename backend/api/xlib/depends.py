from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt  # type: ignore[import-untyped]

from api.models.user.user import User
from api.xlib.auth import ALGORITHM, SECRET_KEY

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub") if isinstance(payload, dict) else None
        if not isinstance(user_id, str):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await User.get(user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_optional_user(token: str = Depends(oauth2_scheme)) -> User | None:
    if not token:
        return None
    try:
        return await get_current_user(token)
    except HTTPException:
        return None
