# Auth Routes for our DriveLegal project
# handles login, signup and google sign in
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core import (
    get_db, hash_password, verify_password, 
    create_access_token, create_refresh_token, get_current_user_id,
    settings
)
from app.models import User
from app.schemas import UserRegister, UserLogin, UserOut, MessageResponse
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/auth", tags=["Authentication"])

# response model for tokens
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    user: Optional[dict] = None

class GoogleAuthRequest(BaseModel):
    credential: str

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # check if user already exists in our db
    print(f"DEBUG: Registering new user with email {payload.email}")
    result = await db.execute(select(User).where(User.email == payload.email))
    check_user = result.scalar_one_or_none()
    
    if check_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    # creating the new user object
    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        country_code=payload.country_code,
        preferred_language=payload.preferred_language,
    )
    db.add(new_user)
    await db.flush()

    # generate tokens for the user session
    at = create_access_token({"sub": str(new_user.id)})
    rt = create_refresh_token({"sub": str(new_user.id)})

    return TokenResponse(
        access_token=at,
        refresh_token=rt,
        user_id=new_user.id,
        email=new_user.email,
        user={"id": new_user.id, "email": new_user.email, "full_name": new_user.full_name, "country_code": new_user.country_code},
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    # find user by email
    print(f"DEBUG: Login attempt for {payload.email}")
    result = await db.execute(select(User).where(User.email == payload.email))
    user_obj = result.scalar_one_or_none()

    # verify password
    if not user_obj or not verify_password(payload.password, user_obj.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user_obj.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # create tokens
    at = create_access_token({"sub": str(user_obj.id)})
    rt = create_refresh_token({"sub": str(user_obj.id)})

    return TokenResponse(
        access_token=at,
        refresh_token=rt,
        user_id=user_obj.id,
        email=user_obj.email,
        user={"id": user_obj.id, "email": user_obj.email, "full_name": user_obj.full_name, "country_code": user_obj.country_code},
    )

@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    # this handles google login
    try:
        print("DEBUG: Verifying Google Token...")
        # verify with google servers
        idinfo = id_token.verify_oauth2_token(
            payload.credential, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        )

        user_email = idinfo['email']
        user_name = idinfo.get('name')

        # check if this google user is already in our db
        result = await db.execute(select(User).where(User.email == user_email))
        existing_user = result.scalar_one_or_none()

        if not existing_user:
            print(f"DEBUG: Creating new account for Google user {user_email}")
            # create new user for first-time Google sign-in
            existing_user = User(
                email=user_email,
                full_name=user_name,
                hashed_password="google-auth-no-password", 
                is_active=True
            )
            db.add(existing_user)
            await db.flush()
        
        if not existing_user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")

        # tokens for google user
        at = create_access_token({"sub": str(existing_user.id)})
        rt = create_refresh_token({"sub": str(existing_user.id)})

        return TokenResponse(
            access_token=at,
            refresh_token=rt,
            user_id=existing_user.id,
            email=existing_user.email,
            user={"id": existing_user.id, "email": existing_user.email, "full_name": existing_user.full_name, "country_code": existing_user.country_code},
        )
    except Exception as err:
        print(f"ERROR in Google Auth: {str(err)}")
        raise HTTPException(status_code=401, detail="Google authentication failed")

@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # returns info about the logged in user
    result = await db.execute(select(User).where(User.id == user_id))
    user_data = result.scalar_one_or_none()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data
