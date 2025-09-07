import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def _clean(v): return v.strip().strip('"').strip("'") if v else v

SUPABASE_URL = _clean(os.getenv("SUPABASE_URL"))
SUPABASE_SERVICE_ROLE_KEY = _clean(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

if not SUPABASE_URL or not SUPABASE_URL.startswith("http"):
    raise RuntimeError("SUPABASE_URL missing/invalid")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY missing")

sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)