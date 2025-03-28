from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import auth
from ..database import get_db
from ..models.models import SiteSettings, User
from ..schemas.site_settings import SiteSettings as SiteSettingsSchema, SiteSettingsUpdate

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

def get_site_settings(db: Session):
    """Get the site settings or create if not exists"""
    settings = db.query(SiteSettings).first()
    if not settings:
        settings = SiteSettings(registration_enabled=True)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def check_is_admin(user: User):
    """Check if user is admin, raise exception if not"""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )

@router.get("/", response_model=SiteSettingsSchema)
def read_settings(db: Session = Depends(get_db)):
    """Get current site settings"""
    return get_site_settings(db)

@router.patch("/", response_model=SiteSettingsSchema)
def update_settings(
    settings_update: SiteSettingsUpdate, 
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update site settings - admin only"""
    check_is_admin(current_user)
    
    db_settings = get_site_settings(db)
    
    if settings_update.registration_enabled is not None:
        db_settings.registration_enabled = settings_update.registration_enabled
    
    db.commit()
    db.refresh(db_settings)
    return db_settings
