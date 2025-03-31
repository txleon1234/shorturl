from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

# URL Schemas
class ClickBase(BaseModel):
    clicked_at: datetime
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    operating_system: Optional[str] = None
    location: Optional[str] = None

class ClickCreate(ClickBase):
    pass

class Click(ClickBase):
    id: int
    url_id: int

    class Config:
        orm_mode = True

class URLBase(BaseModel):
    original_url: str

class URLCreate(URLBase):
    pass

class URL(URLBase):
    id: int
    short_code: str
    created_at: datetime
    user_id: int
    click_count: Optional[int] = 0

    class Config:
        orm_mode = True

class URLDetail(URL):
    clicks: List[Click] = []

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    is_admin: Optional[int] = 0

    class Config:
        orm_mode = True

class UserDetail(User):
    urls: List[URL] = []

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Stats Schemas
class URLStats(BaseModel):
    url_id: int
    short_code: str
    original_url: str
    total_clicks: int
    referrers: dict
    browsers: dict
    clicks_over_time: dict
    operating_systems: dict
    locations: dict

    class Config:
        orm_mode = True
