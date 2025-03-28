from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from pathlib import Path

# Define the static directory where frontend build is stored
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")

router = APIRouter(tags=["frontend"])

@router.get("/{path:path}", response_class=HTMLResponse)
async def serve_frontend(path: str, request: Request):
    """
    Serve the frontend for all non-API paths. Returns the index.html file
    from the static directory, letting the frontend router handle the path.
    """
    # Check if the static directory exists
    if not os.path.exists(STATIC_DIR):
        return HTMLResponse(content="Frontend not found", status_code=404)
    
    # Return the index.html file
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            content = f.read()
            return HTMLResponse(content=content)
    else:
        return HTMLResponse(content="Frontend index not found", status_code=404)
