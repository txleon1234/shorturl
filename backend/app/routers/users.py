from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import auth
from ..database import get_db
from ..models.models import User, SiteSettings
from ..schemas.schemas import UserCreate, User as UserSchema, UserDetail

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if registration is enabled
    settings = db.query(SiteSettings).first()
    if settings and not settings.registration_enabled:
        # Check if any users exist, if no users, allow registration
        users_count = db.query(User).count()
        if users_count > 0:
            raise HTTPException(
                status_code=403, 
                detail="User registration is currently disabled"
            )
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    
    # If this is the first user, make them admin
    users_count = db.query(User).count()
    is_admin = 1 if users_count == 0 else 0
    
    db_user = User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_password,
        is_admin=is_admin
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(auth.get_current_user)):
    return current_user

@router.get("/me/details", response_model=UserDetail)
def read_users_me_details(current_user: User = Depends(auth.get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserSchema)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
