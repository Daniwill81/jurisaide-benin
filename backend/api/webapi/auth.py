from fastapi import APIRouter, Depends, HTTPException, status
from api.models.user.user import User
from api.serializers.auth import Token, UserLogin, UserCreate, GoogleAuth
from api.xlib.auth import verify_password, get_password_hash, create_access_token

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    user_exists = await User.find_one(User.username == user_in.username)
    if user_exists:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        passport_number=user_in.passport_number,
        hashed_password=get_password_hash(user_in.password)
    )
    await user.insert()
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    # Search by username OR passport_number
    user = await User.find_one({
        "$or": [
            {"username": login_data.identifier},
            {"passport_number": login_data.identifier}
        ]
    })
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect identifier or password",
        )
    
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect identifier or password",
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_login(auth_data: GoogleAuth):
    # This should verify the Google token with Google's API
    # For MVP, we'll placeholder this or implement a basic check
    # In a real app, use google-auth library to verify
    
    # Placeholder: assume token is user email for now (DEBUG ONLY)
    # real implementation: idinfo = id_token.verify_oauth2_token(auth_data.token, requests.Request(), CLIENT_ID)
    
    # Dummy logic for demonstration:
    email = f"{auth_data.token}@gmail.com" # Dummy!
    user = await User.find_one(User.email == email)
    
    if not user:
        user = User(
            email=email,
            full_name="Google User",
            google_id=auth_data.token, # Dummy!
            is_active=True
        )
        await user.insert()
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
