import os
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from .supabase_client import sb

router = APIRouter()
SCOPES=["https://www.googleapis.com/auth/calendar"]

def _flow():
    return Flow.from_client_config(
      {"web":{
        "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
        "redirect_uris": [os.environ["GOOGLE_OAUTH_REDIRECT_URI"]],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"}},
      scopes=SCOPES)

@router.get("/start")
def start():
    f = _flow()
    f.redirect_uri = os.environ["GOOGLE_OAUTH_REDIRECT_URI"]
    url, _ = f.authorization_url(access_type='offline', include_granted_scopes='true', prompt='consent')
    return RedirectResponse(url)

@router.get("/callback")
def callback(request: Request):
    code = request.query_params.get("code")
    f = _flow()
    f.redirect_uri = os.environ["GOOGLE_OAUTH_REDIRECT_URI"]
    f.fetch_token(code=code)
    creds = f.credentials
    sb.table("google_oauth").upsert({
        "id": 1,
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
    }).execute()
    return {"ok": True}
