# 🔧 Frontend Environment Configuration

## Setting up the Backend URL

The frontend needs to know where your backend server is running. You can configure this using environment variables.

## Quick Setup

### Step 1: Get Your Backend URL

#### Option A: Google Colab (Recommended)
1. In your Colab notebook, look for the output from **Step 4**
2. You'll see something like:
   ```
   📡 Public URL: https://abc123.ngrok.io
   ```
3. Copy that URL (e.g., `https://abc123.ngrok.io`)

#### Option B: Local Backend
- If running locally, use: `http://localhost:8000`

### Step 2: Create Environment File

Create a file named `.env.local` in the project root (`d:\dbms\.env.local`):

```env
# Colab Backend (replace with YOUR ngrok URL from Step 1)
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io

# OR Local Backend (uncomment if using local)
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** Replace `abc123` with YOUR actual ngrok URL!

### Step 3: Restart Frontend

```bash
# Stop the current npm start (Ctrl+C)
# Then restart:
npm start
```

The frontend will now use your Colab backend! 🎉

## Verification

Open browser console (F12) and you should see:
```
🔧 API Configuration: {
  baseURL: "https://abc123.ngrok.io",
  apiURL: "https://abc123.ngrok.io/api",
  isColab: true,
  source: "Environment Variable"
}
```

## Alternative: Quick Test Without Restart

You can also test by directly updating `lib/api-config.ts` temporarily:

```typescript
const getApiUrl = (): string => {
  // TEMPORARY: Hard-code your ngrok URL for testing
  return 'https://your-ngrok-url.ngrok.io';
  
  // ... rest of code
}
```

But using `.env.local` is the recommended approach!

## Troubleshooting

### "Connection Refused" or "Network Error"
- ✅ Verify Colab notebook is still running (Step 4 cell should be active)
- ✅ Check the ngrok URL is correct (copy-paste from Colab)
- ✅ Make sure you're using `https://` (not `http://`)
- ✅ Don't include `/api` at the end of the URL

### ngrok URL Changed
- ⚠️ ngrok URLs change when you restart the Colab notebook
- ✅ Get the new URL from Step 4 output
- ✅ Update `.env.local` with the new URL
- ✅ Restart frontend

### Frontend Still Using localhost:8000
- ✅ Make sure `.env.local` file exists in project root
- ✅ Variable name must be exactly `NEXT_PUBLIC_API_URL`
- ✅ Restart the frontend after creating/editing the file
