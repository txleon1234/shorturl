from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class SiteSettings(BaseModel):
    id: int
    registration_enabled: bool
    last_updated: datetime
    
    class Config:
        orm_mode = True
        
class SiteSettingsCreate(BaseModel):
    registration_enabled: bool
    
class SiteSettingsUpdate(BaseModel):
    registration_enabled: Optional[bool] = None
