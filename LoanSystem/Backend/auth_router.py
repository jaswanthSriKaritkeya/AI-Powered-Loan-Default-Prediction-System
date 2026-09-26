from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from bson.errors import InvalidId
import jwt

from database import users_collection
from auth import (
    verify_password,
    create_access_token,
    decode_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

bearer_scheme = HTTPBearer()


# =========================================================
# LOGIN REQUEST
# =========================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(request: LoginRequest):

    email = str(request.email).lower().strip()

    user = users_collection.find_one({
        "email": email
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not verify_password(
        request.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    )
):

    token = credentials.credentials

    try:

        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        try:
            object_id = ObjectId(user_id)

        except InvalidId:
            raise HTTPException(
                status_code=401,
                detail="Invalid user ID in token"
            )

        user = users_collection.find_one({
            "_id": object_id,
            "is_active": True
        })

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found or inactive"
            )

        return user

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# =========================================================
# ADMIN AUTHORIZATION
# =========================================================

def get_current_admin(
    user: dict = Depends(get_current_user)
):

    if user.get("role") != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


# =========================================================
# AGENT AUTHORIZATION
# =========================================================

def get_current_agent(
    user: dict = Depends(get_current_user)
):

    if user.get("role") != "agent":

        raise HTTPException(
            status_code=403,
            detail="Agent access required"
        )

    return user


# =========================================================
# CURRENT USER DETAILS
# =========================================================

@router.get("/me")
def get_me(
    user: dict = Depends(get_current_user)
):

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"]
    }