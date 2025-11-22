from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.auth import get_current_user, hash_password, get_user_by_username

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    shared_with: list[str] = []

    class Config:
        from_attributes = True


class ShareRequest(BaseModel):
    username: str


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if username exists
    existing = await get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    user = User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserResponse(id=user.id, username=user.username, is_active=user.is_active)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        is_active=current_user.is_active,
        shared_with=[u.username for u in current_user.shared_with],
    )


@router.post("/share", response_model=UserResponse)
async def share_with_user(
    share_req: ShareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Share your contacts with another user (grants full CRUD access)."""
    target_user = await get_user_by_username(db, share_req.username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    if target_user in current_user.shared_with:
        raise HTTPException(status_code=400, detail="Already shared with this user")

    current_user.shared_with.append(target_user)
    await db.flush()

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        is_active=current_user.is_active,
        shared_with=[u.username for u in current_user.shared_with],
    )


@router.delete("/share/{username}")
async def unshare_with_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove sharing with a user."""
    target_user = await get_user_by_username(db, username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user not in current_user.shared_with:
        raise HTTPException(status_code=400, detail="Not shared with this user")

    current_user.shared_with.remove(target_user)
    await db.flush()

    return {"message": f"Removed sharing with {username}"}


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    from app.auth import verify_password

    # Verify current password
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    current_user.hashed_password = hash_password(password_change.new_password)
    await db.flush()

    return {"message": "Password changed successfully"}
