from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.models import URL, Click
from user_agents import parse as ua_parse
import geoip2.database
import os

# Path to the GeoLite2 database
GEOIP_DB_PATH = os.environ.get("GEOIP_DB_PATH", "/app/GeoLite2-City.mmdb")
geoip_reader = None

# Try to initialize the GeoIP reader
try:
    if os.path.exists(GEOIP_DB_PATH):
        geoip_reader = geoip2.database.Reader(GEOIP_DB_PATH)
except Exception as e:
    print(f"Failed to initialize GeoIP database: {e}")

router = APIRouter(tags=["redirect"], prefix="/r")

@router.get("/{short_code}")
def redirect_to_url(
    short_code: str, 
    request: Request, 
    db: Session = Depends(get_db),
    user_agent: Optional[str] = Header(None),
    referer: Optional[str] = Header(None)
):
    db_url = db.query(URL).filter(URL.short_code == short_code).first()
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Parse user agent to get operating system and browser
    operating_system = "Unknown"
    browser = "Unknown"
    if user_agent:
        try:
            parsed_ua = ua_parse(user_agent)
            operating_system = parsed_ua.os.family
            
            # Get browser family with version for more accurate stats
            browser_family = parsed_ua.browser.family
            browser_version = parsed_ua.browser.version_string
            
            # Clean up browser family names
            if browser_family == "Chrome Mobile":
                browser_family = "Chrome (Mobile)"
            elif browser_family == "Firefox Mobile":
                browser_family = "Firefox (Mobile)"
            elif browser_family == "Mobile Safari":
                browser_family = "Safari (Mobile)"
            
            # Include version for more detailed analytics if available
            if browser_version:
                browser = f"{browser_family} {browser_version}"
            else:
                browser = browser_family
                
        except Exception as e:
            print(f"Error parsing user agent: {e}")
    
    # Get location from IP address
    location = "Unknown"
    client_host = request.client.host if request.client else None
    if client_host and geoip_reader:
        try:
            # Skip localhost or private IPs
            if not (client_host == "127.0.0.1" or client_host.startswith("192.168.") or client_host.startswith("10.")):
                response = geoip_reader.city(client_host)
                if response.city.name and response.country.name:
                    location = f"{response.city.name}, {response.country.name}"
                elif response.country.name:
                    location = response.country.name
        except Exception as e:
            print(f"Error getting location: {e}")
    
    # Record the click
    click = Click(
        url_id=db_url.id,
        referrer=referer,
        user_agent=user_agent,
        ip_address=client_host,
        operating_system=operating_system,
        location=location
    )
    db.add(click)
    db.commit()
    
    # Redirect to the original URL
    return RedirectResponse(url=db_url.original_url)
