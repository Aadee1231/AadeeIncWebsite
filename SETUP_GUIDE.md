# 🚀 Aadee Chat Business Operations Copilot - Complete Setup Guide

This guide will walk you through setting up the enhanced Aadee Chat system step-by-step, as if you're a complete beginner. Follow each section carefully.

## 📋 Prerequisites

Before starting, make sure you have:
- A Supabase account (free tier is fine)
- An OpenAI API key
- Node.js and npm installed on your computer
- Python 3.12+ installed
- Git installed

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: `aadee-chat-copilot`
5. Enter a strong database password (save this!)
6. Select a region close to you
7. Click "Create new project"
8. Wait for the project to be created (2-3 minutes)

### 1.2 Create Database Tables
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this EXACT SQL code (from the models.py file):

```sql
-- Enhanced actions table
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    session_id TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    params JSONB NOT NULL,
    description TEXT,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by TEXT
);

-- New suggestions table
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_action JSONB,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_by TEXT
);

-- Enhanced chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    user_id TEXT,
    agent TEXT DEFAULT 'king_ai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES chat_sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table (existing)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google OAuth table (existing)
CREATE TABLE IF NOT EXISTS google_oauth (
    id INTEGER PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business integrations table
CREATE TABLE business_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'google_business', 'yelp', 'facebook', etc.
    integration_id TEXT NOT NULL, -- external platform ID
    credentials JSONB, -- encrypted credentials
    config JSONB, -- platform-specific configuration
    status TEXT NOT NULL DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, platform, integration_id)
);

-- Indexes for performance
CREATE INDEX idx_actions_org_status ON actions(org_id, status);
CREATE INDEX idx_actions_created_at ON actions(created_at);
CREATE INDEX idx_suggestions_org_status ON suggestions(org_id, status);
CREATE INDEX idx_suggestions_priority ON suggestions(priority);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_business_integrations_org ON business_integrations(org_id);
```

4. Click "Run" button
5. You should see "Success. No rows returned" - this means it worked!

### 1.3 Get Your Supabase Credentials
1. In Supabase dashboard, click "Settings" in the left sidebar
2. Click "API" under Settings
3. Copy these values (you'll need them later):
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role secret key** (starts with `eyJ...`) - ⚠️ Keep this secret!

## 🔑 Step 2: Get API Keys

### 2.1 OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Click your profile → "View API keys"
4. Click "Create new secret key"
5. Name it "Aadee Chat"
6. Copy the key (starts with `sk-...`) - ⚠️ Save this immediately, you can't see it again!

### 2.2 Google API Keys (Optional for now)
For now, you can skip this and use placeholder values. Later you'll need:
- Google Cloud Console project
- Google Business Profile API access
- OAuth 2.0 credentials

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Backend Environment (.env)
1. Navigate to your project folder: `AadeeIncWebsite/server/`
2. Create a file called `.env` (no extension)
3. Copy this template and fill in YOUR values:

```env
# Aadee Chat AI Business Operations Copilot - Environment Variables

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Google APIs Configuration (use placeholders for now)
GOOGLE_API_KEY=placeholder-google-api-key
GOOGLE_OAUTH_CLIENT_ID=placeholder-client-id
GOOGLE_OAUTH_CLIENT_SECRET=placeholder-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/oauth/callback

# Google Calendar Configuration
CALENDAR_ID=primary
SLOT_MINUTES=30

# Business Platform APIs (use placeholders for now)
YELP_API_KEY=placeholder-yelp-api-key
FACEBOOK_APP_ID=placeholder-facebook-app-id
FACEBOOK_APP_SECRET=placeholder-facebook-app-secret
INSTAGRAM_ACCESS_TOKEN=placeholder-instagram-token
TWITTER_API_KEY=placeholder-twitter-api-key
TWITTER_API_SECRET=placeholder-twitter-api-secret

# Development Configuration
DEBUG=true
LOG_LEVEL=info
ENVIRONMENT=development
```

### 3.2 Frontend Environment (.env)
1. Navigate to: `AadeeIncWebsite/website/`
2. Create a file called `.env` (no extension)
3. Copy this template and fill in YOUR values:

```env
# Frontend Environment Variables

# Supabase Configuration (same as backend)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API Configuration
VITE_API_BASE=http://localhost:8000
VITE_PUBLIC_BACKEND_URL=http://localhost:8000

# Development Configuration
VITE_ENVIRONMENT=development
```

## 🚀 Step 4: Install Dependencies and Test

### 4.1 Install Backend Dependencies
1. Open terminal/command prompt
2. Navigate to backend folder:
   ```bash
   cd AadeeIncWebsite/server
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 4.2 Install Frontend Dependencies
1. In terminal, navigate to frontend folder:
   ```bash
   cd ../website
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```

### 4.3 Test Backend Server
1. Navigate back to server folder:
   ```bash
   cd ../server
   ```
2. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
3. You should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   INFO:     Application startup complete.
   ```
4. Test health endpoint in another terminal:
   ```bash
   curl http://localhost:8000/health
   ```
5. Should return: `{"status":"ok","service":"aadee-backend","version":"1.0.0"}`

### 4.4 Test Frontend
1. In a new terminal, navigate to website folder:
   ```bash
   cd AadeeIncWebsite/website
   ```
2. Start the frontend:
   ```bash
   npm run dev
   ```
3. You should see:
   ```
   Local:   http://localhost:5173/
   ```
4. Open browser and go to: `http://localhost:5173`

## 🧪 Step 5: Test the Complete End-to-End Flow

### 5.1 Test Business Hours Parsing
1. Make sure backend server is running (Step 4.3)
2. Test the chat endpoint:
   ```bash
   curl -X POST "http://localhost:8000/api/chat/message" \
     -H "Content-Type: application/json" \
     -d '{"session_id": "test-123", "text": "Update Friday to 9-3 and Sunday closed", "agent": "king_ai"}'
   ```
3. Should return a response about creating a pending action

### 5.2 Test Admin Dashboard
1. Open browser to: `http://localhost:5173/portal/admin`
2. You should see the enhanced admin dashboard with tabs:
   - Overview (statistics)
   - Actions (pending actions list)
   - Suggestions (AI recommendations)

### 5.3 Test Actions API
1. List pending actions:
   ```bash
   curl "http://localhost:8000/api/actions?org_id=demo-org&status=pending"
   ```
2. If you get "Missing Authorization header", that's expected - the frontend handles auth

### 5.4 Test Modal Worker (Background Execution)
1. In server folder, run the action worker:
   ```bash
   python modal_entry.py
   ```
2. This simulates the background worker that processes approved actions

## 🎯 Step 6: Test the Full Workflow

### 6.1 Complete User Journey
1. **Frontend**: Go to `http://localhost:5173/portal/king-ai`
2. **Chat**: Type "Update Friday hours to 9am-3pm"
3. **Backend**: Should create a pending action
4. **Admin**: Go to `http://localhost:5173/portal/admin`
5. **Approve**: Find the action and approve it
6. **Execute**: The Modal worker will process it (mocked execution)

### 6.2 Test Different Hour Formats
Try these in the chat:
- "Set weekend hours to 10-4"
- "Change Monday to 8am-6pm"
- "Close on Sundays"
- "Monday through Friday 9 to 5"

## 🔧 Troubleshooting

### Common Issues:

**"Connection refused" errors:**
- Make sure backend server is running on port 8000
- Check your Supabase URL and keys are correct

**"Missing Authorization header":**
- This is expected for direct API calls
- The frontend handles authentication automatically

**Frontend won't start:**
- Run `npm install` in the website folder
- Check Node.js version (need 16+)

**Database errors:**
- Verify all tables were created in Supabase
- Check your Supabase credentials in .env files

**OpenAI errors:**
- Verify your OpenAI API key is correct
- Make sure you have credits in your OpenAI account

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Backend health check returns success
2. ✅ Frontend loads without errors
3. ✅ Chat creates pending actions in database
4. ✅ Admin dashboard shows actions and statistics
5. ✅ Modal worker processes approved actions

## 📞 Next Steps

Once everything is working:
1. **Real API Integration**: Replace stub integrations with real Google Business Profile and Yelp APIs
2. **Authentication**: Set up proper user authentication
3. **Production Deployment**: Deploy to Vercel and Modal
4. **Monitoring**: Add logging and error tracking

## 🆘 Need Help?

If you get stuck:
1. Check the console/terminal for error messages
2. Verify all environment variables are set correctly
3. Make sure all dependencies are installed
4. Check that Supabase tables were created successfully

The system is designed to work with mocked integrations initially, so you can test the complete workflow even without real Google/Yelp API keys!
