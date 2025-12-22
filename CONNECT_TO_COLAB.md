# 🚀 Connect Frontend to Colab Backend

## Quick Instructions

### ⏳ What You Need from Colab

After running **Step 4** in your Colab notebook, you'll see output like this:

```
======================================================================
🎉 BACKEND SERVER IS RUNNING!
======================================================================

📡 Public URL: https://abc123-def45.ngrok.io

🔗 API Endpoints:
   - Translation: https://abc123-def45.ngrok.io/api/translate/
   - Health: https://abc123-def45.ngrok.io/api/health
...
```

**Copy the Public URL:** `https://abc123-def45.ngrok.io`

---

## 🔧 Setup Steps

### Option 1: Using Environment File (Recommended)

1. **Create `.env.local` file** in project root (`d:\dbms\.env.local`):

```env
NEXT_PUBLIC_API_URL=https://abc123-def45.ngrok.io
```

Replace `abc123-def45.ngrok.io` with YOUR actual ngrok URL!

2. **Restart the frontend:**

```powershell
# Press Ctrl+C to stop current server
# Then restart:
npm start
```

3. **Verify connection:**
   - Open http://localhost:3000
   - Look for green "Backend Connected" badge at the top
   - Should show "Colab" and "CUDA" (or "CPU")

---

### Option 2: Quick Test (Temporary)

If you want to test quickly without creating `.env.local`:

1. **Open** `d:\dbms\lib\api-config.ts`

2. **Edit line 8** to hard-code your ngrok URL:

```typescript
const getApiUrl = (): string => {
  // TEMPORARY: Replace with your ngrok URL
  return 'https://abc123-def45.ngrok.io';
  
  // Comment out the original code below:
  // if (process.env.NEXT_PUBLIC_API_URL) {
  //   return process.env.NEXT_PUBLIC_API_URL;
  // }
  // ...
}
```

3. **Save the file** - The frontend will auto-reload!

⚠️ **Note:** This is temporary. Use Option 1 for permanent setup.

---

## ✅ Verify It's Working

### 1. Check Browser Console (F12)
You should see:
```
🔧 API Configuration: {
  baseURL: "https://abc123-def45.ngrok.io",
  apiURL: "https://abc123-def45.ngrok.io/api",
  isColab: true,
  source: "Environment Variable"
}
```

### 2. Check UI
- Green "Backend Connected" alert at the top
- Badge shows "Colab" and "CUDA" or "CPU"

### 3. Test Translation
1. Type a query: "Show all students"
2. Click "Translate"
3. You should see SQL candidates appear!

---

## 🧪 Test the Connection

### Quick API Test

Open this URL in your browser (replace with YOUR ngrok URL):
```
https://abc123-def45.ngrok.io/api/health
```

You should see:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

---

## 🐛 Troubleshooting

### Red "Backend Offline" Alert

**Causes:**
- ❌ Colab notebook not running (Step 4 cell stopped)
- ❌ Wrong ngrok URL in `.env.local`
- ❌ ngrok URL changed (happens when you restart Colab)

**Solutions:**
1. ✅ Check Colab - Step 4 cell should be running
2. ✅ Copy fresh ngrok URL from Colab Step 4 output
3. ✅ Update `.env.local` with new URL
4. ✅ Restart frontend (`npm start`)

### "Connection Refused" or CORS Error

**Cause:** Using `http://` instead of `https://`

**Solution:** Make sure the ngrok URL starts with `https://` (not `http://`)

### Frontend Still Shows "localhost:8000"

**Cause:** `.env.local` not loaded or frontend not restarted

**Solution:**
1. ✅ Verify `.env.local` file exists in project root
2. ✅ Variable name is exactly `NEXT_PUBLIC_API_URL`
3. ✅ Restart frontend with `npm start`

### ngrok URL Keeps Changing

**Cause:** Free ngrok URLs change when you restart the Colab notebook

**Solutions:**
- **Quick fix:** Update `.env.local` with new URL each time
- **Better fix:** Get free ngrok account and add auth token to Colab notebook (Step 4)
  - Sign up at [ngrok.com](https://ngrok.com)
  - Add token to notebook: `NGROK_AUTH_TOKEN = "your_token"`
  - You'll get a persistent URL that doesn't change!

---

## 📊 Expected Performance

| Action | Expected Time |
|--------|--------------|
| Health check | < 100ms |
| First translation | 1-3 seconds |
| Subsequent translations | 300-500ms |

If translation takes > 5 seconds, check if Colab is using GPU (should show "CUDA" in status badge).

---

## 💡 Pro Tips

1. **Keep Colab Tab Open** - Background tabs may pause after a while
2. **Bookmark ngrok URL** - Easy to copy/paste when it changes
3. **Check Status Badge** - Green = good, Red = reconnect needed
4. **Monitor Colab Logs** - See real-time translation requests

---

## 🎯 Next Steps After Connection

Once you see "Backend Connected" (green):

1. ✅ Test basic translation: "Show all students"
2. ✅ Try different queries
3. ✅ Check SQL candidates appear correctly
4. ✅ Execute a query to test full flow
5. 🚀 Build amazing features!

---

**Need Help?**
- Check Colab logs for errors
- Verify ngrok URL is correct
- Try the health check URL in browser
- Restart both Colab (Step 4) and frontend
