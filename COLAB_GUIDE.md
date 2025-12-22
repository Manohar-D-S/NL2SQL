# 🌐 Using Google Colab as Backend Server

## Why Use Google Colab?

✅ **Free GPU** - Faster model inference  
✅ **No local setup** - No need to install Python/dependencies  
✅ **Always accessible** - Access from anywhere  
✅ **Easy sharing** - Share the notebook with teammates  
✅ **Auto-scaling** - Google handles the infrastructure  

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Upload Notebook to Colab

1. Go to [Google Colab](https://colab.research.google.com/)
2. Click **File → Upload notebook**
3. Upload `NL2SQL_Backend_Colab.ipynb` from your project folder

**OR** open it directly from your Google Drive:
- Upload the `.ipynb` file to your Google Drive
- Right-click → Open with → Google Colaboratory

### Step 2: Enable GPU (Important!)

1. In Colab, click **Runtime → Change runtime type**
2. Select **T4 GPU** from the dropdown
3. Click **Save**

### Step 3: Run All Cells

1. Click **Runtime → Run all**
2. Wait for all cells to execute (~2-3 minutes on first run)
3. The notebook will:
   - ✅ Install dependencies
   - ✅ Download BART model (~1.6GB)
   - ✅ Start FastAPI server
   - ✅ Create ngrok tunnel

### Step 4: Copy the Public URL

After Step 4 executes, you'll see output like:

```
======================================================================
🎉 BACKEND SERVER IS RUNNING!
======================================================================

📡 Public URL: https://abc123.ngrok.io

🔗 API Endpoints:
   - Translation: https://abc123.ngrok.io/api/translate/
   - Health: https://abc123.ngrok.io/api/health
   - Docs: https://abc123.ngrok.io/docs

💡 Usage in Frontend:
   Update your frontend to use: https://abc123.ngrok.io

⚠️  Keep this notebook running to keep the server alive!
======================================================================
```

**Copy** the `https://abc123.ngrok.io` URL (yours will be different)

---

## 🔧 Connect Frontend to Colab Backend

### Option 1: Update Frontend API Base URL

Find where your frontend makes API calls (usually in a config file or hook) and update the base URL:

**Before:**
```typescript
const API_BASE_URL = "http://localhost:8000"
```

**After:**
```typescript
const API_BASE_URL = "https://abc123.ngrok.io" // Your ngrok URL
```

### Option 2: Use Environment Variable

Create/update `.env.local` in your frontend root:

```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

Then in your code:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
```

### Common Files to Update:

Look for API calls in:
- `hooks/use-translate.ts`
- `lib/api.ts`
- `services/api.ts`

---

## 🧪 Test the Connection

### Test 1: Health Check

Open in browser:
```
https://your-ngrok-url.ngrok.io/api/health
```

You should see:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

### Test 2: API Documentation

Visit the interactive API docs:
```
https://your-ngrok-url.ngrok.io/docs
```

Try the `/api/translate/` endpoint with:
```json
{
  "natural_language": "Show all students",
  "database": "students_db",
  "schema_context": "CREATE TABLE students (id INT, name VARCHAR(100));"
}
```

### Test 3: From Frontend

1. Start your frontend: `npm start`
2. Open `http://localhost:3000`
3. Type a query: "Show all students with marks above 80"
4. Click "Translate"
5. You should see SQL candidates appear!

---

## ⚠️ Important Notes

### Ngrok Tunnel Limitations

**Free ngrok** has some limitations:
- ✅ 1 tunnel at a time
- ✅ URL changes when you restart the notebook
- ⚠️ 20 connections/minute limit
- ⚠️ Session expires after 2 hours of inactivity

**Solution:** Get a free ngrok account at [ngrok.com](https://ngrok.com) and add your auth token to the notebook:

```python
NGROK_AUTH_TOKEN = "your_token_here"  # In Step 4 of the notebook
```

Benefits:
- ✅ Persistent URL (doesn't change)
- ✅ Higher rate limits
- ✅ Longer session duration

### Keep Notebook Running

⚠️ **The notebook must stay running for the backend to work!**

If you close the Colab tab:
- Backend will stop after ~90 minutes
- Solution: Keep the Colab tab open in background

For long-term hosting, consider:
- **Railway.app** (free tier)
- **Render.com** (free tier)
- **Hugging Face Spaces** (free GPU)
- **Google Cloud Run** (pay-as-you-go)

---

## 🎯 Workflow Summary

```
User → Frontend (localhost:3000)
         ↓
    API Request
         ↓
    Ngrok Tunnel
         ↓
  Google Colab (FastAPI Server)
         ↓
    BART Model (GPU)
         ↓
   SQL Generated
         ↓
  Response to Frontend
         ↓
    User sees SQL!
```

---

## 🐛 Troubleshooting

### "Connection Refused" Error

**Cause:** Ngrok tunnel not active  
**Solution:** Re-run Step 4 in the Colab notebook

### "Model Not Found" Error

**Cause:** Model download failed  
**Solution:** Re-run Step 2 in the Colab notebook

### "CORS Error" in Frontend

**Cause:** Frontend can't access the ngrok URL  
**Solution:** CORS is already enabled in the notebook, but verify:
1. You're using `https://` (not `http://`)
2. The ngrok URL is correct in your frontend
3. The Colab notebook is still running

### Ngrok URL Changed

**Cause:** You restarted the notebook  
**Solution:** 
1. Copy the new ngrok URL from Step 4 output
2. Update your frontend with the new URL
3. OR: Use an ngrok auth token for persistent URLs

### "Rate Limit Exceeded"

**Cause:** Free ngrok has 20 req/min limit  
**Solution:** Add ngrok auth token (see "Ngrok Tunnel Limitations" above)

---

## 💡 Pro Tips

1. **Bookmark the ngrok URL** - You'll need it every time you restart
2. **Use GPU runtime** - 10x faster than CPU
3. **Test in Colab first** - Use the test cell (Step 5) before connecting frontend
4. **Monitor logs** - Check Colab output for errors
5. **Save your work** - Colab auto-saves, but download the notebook just in case

---

## 📊 Performance Comparison

| Setup | Speed | Cost | Setup Time |
|-------|-------|------|------------|
| Local CPU | ~2-5s/query | Free | 30 min |
| Local GPU | ~0.5-1s/query | Free | 30 min |
| **Colab GPU** | **~0.3-0.5s/query** | **Free** | **5 min** ✅ |
| OpenAI API | ~1-2s/query | ~$0.002/query | 2 min |

**Winner: Colab GPU** 🏆 - Best performance with zero setup!

---

## 🎓 Next Steps

1. ✅ Upload notebook to Colab
2. ✅ Enable GPU runtime
3. ✅ Run all cells
4. ✅ Copy ngrok URL
5. ✅ Update frontend API URL
6. ✅ Test the integration
7. 🚀 Build awesome NL2SQL features!

**Need help?** Check the Colab notebook output for detailed logs and errors.
