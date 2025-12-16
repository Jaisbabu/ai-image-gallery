# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend) [RECOMMENDED]

**Frontend (Vercel):**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import project from GitHub
4. Select `frontend` folder as root directory
5. Add environment variables:
   ```
   REACT_APP_SUPABASE_URL=your_url
   REACT_APP_SUPABASE_ANON_KEY=your_key
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
6. Deploy!

**Backend (Railway):**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub repo
4. Select `backend` folder
5. Add Redis service from Railway marketplace
6. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   REDIS_URL=${{Redis.REDIS_URL}}
   FRONTEND_URL=https://your-app.vercel.app
   ```
7. Upload `google-vision-credentials.json` as file in Railway
8. Deploy!

---

### Option 2: Netlify (Frontend) + Render (Backend)

**Frontend (Netlify):**
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. New site from Git
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
5. Add environment variables
6. Deploy!

**Backend (Render):**
1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Root directory: `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add Redis service
8. Add environment variables
9. Deploy!

---

## Environment Variables Checklist

### Frontend
- [x] REACT_APP_SUPABASE_URL
- [x] REACT_APP_SUPABASE_ANON_KEY
- [x] REACT_APP_API_URL

### Backend
- [x] NODE_ENV (production)
- [x] PORT
- [x] SUPABASE_URL
- [x] SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] GOOGLE_APPLICATION_CREDENTIALS
- [x] REDIS_URL
- [x] FRONTEND_URL

---

## Google Cloud Credentials

### Railway/Render Upload Method:
1. Go to dashboard
2. Upload `google-vision-credentials.json` as file
3. Set env var: `GOOGLE_APPLICATION_CREDENTIALS=./google-vision-credentials.json`

### Alternative (Environment Variable):
```bash
# Encode JSON to base64
cat google-vision-credentials.json | base64

# Add to environment
GOOGLE_CREDENTIALS_BASE64=<base64_string>
```

Then in your code:
```javascript
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString()
);
```

---

## Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Backend health check responds: `GET https://api.example.com/health`
- [ ] Sign up creates new user
- [ ] Login works
- [ ] Image upload succeeds
- [ ] AI processing completes (check after 30 seconds)
- [ ] Search returns results
- [ ] Images load properly
- [ ] Delete works
- [ ] Logout works

---

## Common Deployment Issues

### Issue: "Failed to connect to backend"
**Solution:** Check REACT_APP_API_URL includes `/api` and uses `https://`

### Issue: "Supabase RLS policy error"
**Solution:** Make sure you ran the database setup SQL script

### Issue: "Storage bucket not found"
**Solution:** Create `images` bucket in Supabase Storage (make it private)

### Issue: "Google Vision API error"
**Solution:** 
1. Check API is enabled in Google Cloud
2. Verify credentials file is uploaded correctly
3. Check service account has "Cloud Vision" role

### Issue: "Redis connection failed"
**Solution:** 
1. Add Redis addon in Railway/Render
2. Update REDIS_URL environment variable
3. For development, set `REDIS_URL=redis://localhost:6379`

### Issue: "CORS error"
**Solution:** Update FRONTEND_URL in backend .env to match deployed frontend URL

---

## Scaling Considerations

### When to Scale:
- More than 100 concurrent users
- Processing more than 1000 images/day
- Response times > 3 seconds

### How to Scale:
1. **Backend**: Increase instance count (horizontal scaling)
2. **Redis**: Upgrade to Redis Pro
3. **Database**: Upgrade Supabase plan
4. **Storage**: Supabase storage auto-scales
5. **AI API**: Monitor Google Cloud quotas

### Cost Optimization:
- Enable image caching
- Implement lazy loading
- Use CDN for thumbnails
- Batch AI processing during off-peak

---

## Monitoring

**Essential Metrics:**
- API response time
- Image upload success rate
- AI processing completion rate
- Error rate by endpoint
- Storage usage

**Tools:**
- Railway/Render built-in metrics
- Supabase dashboard
- Google Cloud Monitoring
- Sentry for error tracking (optional)

---

## Backup Strategy

**What to Backup:**
1. Database (Supabase handles automatically)
2. Storage bucket (enable Point-in-Time Recovery)
3. Environment variables (keep secure copy)

**How:**
- Supabase: Enable automatic backups (Settings > Database)
- Storage: Use Supabase Storage backups
- Code: Keep in GitHub

---

## Production Checklist

Before going live:
- [ ] All environment variables set
- [ ] Database setup complete
- [ ] Storage bucket created
- [ ] RLS policies enabled
- [ ] Google Vision API enabled
- [ ] Redis connected
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Documentation complete

---

## Need Help?

1. Check Railway/Render/Vercel logs
2. Check browser console for frontend errors
3. Check Supabase logs for database issues
4. Check Google Cloud logs for Vision API issues
5. Create GitHub issue with logs

**Tip:** Most issues are environment variable misconfigurations!
