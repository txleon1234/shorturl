from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from .. import auth
from ..database import get_db
from ..models.models import URL, Click, User
from ..schemas.schemas import URLCreate, URL as URLSchema, URLDetail, URLStats
import random
import string
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from user_agents import parse as parse_ua

router = APIRouter(
    prefix="/api/urls",
    tags=["urls"],
    responses={404: {"description": "Not found"}},
)

# Function to generate short code
def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.post("/", response_model=URLSchema)
def create_url(url: URLCreate, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    # Generate a unique short code
    while True:
        short_code = generate_short_code()
        db_url = db.query(URL).filter(URL.short_code == short_code).first()
        if db_url is None:
            break
    
    db_url = URL(original_url=url.original_url, short_code=short_code, user_id=current_user.id)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    
    # Add click_count to match schema
    setattr(db_url, 'click_count', 0)
    
    return db_url

@router.get("/", response_model=List[URLSchema])
def read_urls(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    urls = db.query(URL).filter(URL.user_id == current_user.id).offset(skip).limit(limit).all()
    
    # Add click count to each URL
    for url in urls:
        click_count = db.query(func.count(Click.id)).filter(Click.url_id == url.id).scalar()
        setattr(url, 'click_count', click_count)
    
    return urls

@router.get("/{short_code}", response_model=URLDetail)
def read_url(short_code: str, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    db_url = db.query(URL).filter(URL.short_code == short_code, URL.user_id == current_user.id).first()
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Add click count
    click_count = db.query(func.count(Click.id)).filter(Click.url_id == db_url.id).scalar()
    setattr(db_url, 'click_count', click_count)
    
    return db_url

@router.delete("/{short_code}", status_code=204)
def delete_url(short_code: str, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    db_url = db.query(URL).filter(URL.short_code == short_code, URL.user_id == current_user.id).first()
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    
    db.delete(db_url)
    db.commit()
    return Response(status_code=204)

@router.get("/{short_code}/stats", response_model=URLStats)
def get_url_stats(short_code: str, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    db_url = db.query(URL).filter(URL.short_code == short_code, URL.user_id == current_user.id).first()
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Get all clicks for this URL
    clicks = db.query(Click).filter(Click.url_id == db_url.id).all()
    
    # Count total clicks
    total_clicks = len(clicks)
    
    # Analyze referrers
    referrers = Counter([click.referrer or "Direct/Unknown" for click in clicks])
    
    # Analyze browsers from user agents using user-agents library
    browser_names = []
    for click in clicks:
        if not click.user_agent:
            browser_names.append("Unknown")
            continue
        
        try:
            user_agent = parse_ua(click.user_agent)
            browser_family = user_agent.browser.family
            
            # Clean up browser family names for better readability
            if browser_family == "Chrome Mobile":
                browser_family = "Chrome (Mobile)"
            elif browser_family == "Firefox Mobile":
                browser_family = "Firefox (Mobile)"
            elif browser_family == "Mobile Safari":
                browser_family = "Safari (Mobile)"
            
            browser_names.append(browser_family)
        except Exception:
            # Fallback to basic detection if the library fails
            ua_lower = click.user_agent.lower()
            
            if "chrome" in ua_lower and "chromium" not in ua_lower and "edg" not in ua_lower and "opera" not in ua_lower and "opr" not in ua_lower:
                browser_names.append("Chrome")
            elif "firefox" in ua_lower:
                browser_names.append("Firefox")
            elif "safari" in ua_lower and "chrome" not in ua_lower:
                browser_names.append("Safari")
            elif "edg" in ua_lower:
                browser_names.append("Edge")
            elif "opera" in ua_lower or "opr" in ua_lower:
                browser_names.append("Opera")
            elif "msie" in ua_lower or "trident" in ua_lower:
                browser_names.append("Internet Explorer")
            elif "chromium" in ua_lower:
                browser_names.append("Chromium")
            else:
                browser_names.append("Other")
            
    browsers = Counter(browser_names)
    
    # Analyze operating systems
    operating_systems = Counter([click.operating_system or "Unknown" for click in clicks])
    
    # Analyze locations
    locations = Counter([click.location or "Unknown" for click in clicks])
    
    # Analyze clicks over time (by day)
    clicks_by_date = defaultdict(int)
    for click in clicks:
        date_str = click.clicked_at.strftime('%Y-%m-%d')
        clicks_by_date[date_str] += 1
    
    # Sort clicks by date
    clicks_over_time = dict(sorted(clicks_by_date.items()))
    
    return {
        "url_id": db_url.id,
        "short_code": db_url.short_code,
        "original_url": db_url.original_url,
        "total_clicks": total_clicks,
        "referrers": dict(referrers),
        "browsers": dict(browsers),
        "operating_systems": dict(operating_systems),
        "locations": dict(locations),
        "clicks_over_time": clicks_over_time
    }
