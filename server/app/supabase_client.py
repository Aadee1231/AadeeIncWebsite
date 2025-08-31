import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env when running locally (safe; in Modal you'll use secrets instead)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. "
        "Create a .env file or set environment variables."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
