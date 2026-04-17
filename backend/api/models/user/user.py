from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr, Field

class User(Document):
    username: Optional[str] = Indexed(str, unique=True)
    email: EmailStr = Indexed(str, unique=True)
    hashed_password: Optional[str] = None
    first_name: str
    last_name: str
    google_id: Optional[str] = Indexed(str, unique=True)
    is_active: bool = True
    is_superuser: bool = False

    class Settings:
        name = "users"
