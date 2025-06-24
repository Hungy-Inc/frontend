# Quick Vercel Deployment Guide

## ✅ Backend Status: FIXED
Your backend is now working at: `https://backend-1-7yki.onrender.com`

## 🚀 Deploy to Vercel (Choose One Method)

### Method 1: Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
5. Add Environment Variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://backend-1-7yki.onrender.com`
6. Click "Deploy"

### Method 2: Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

### Method 3: GitHub Actions (Automatic)
1. Push your code to GitHub
2. Set up GitHub Secrets in your repo:
   - `VERCEL_TOKEN`: Get from Vercel dashboard
   - `ORG_ID`: Get from Vercel dashboard  
   - `PROJECT_ID`: Get from Vercel dashboard
3. Push to main branch - automatic deployment

## 🔧 Environment Variables
Make sure this is set in Vercel:
```
NEXT_PUBLIC_API_URL = https://backend-1-7yki.onrender.com
```

## 🧪 Testing Checklist
After deployment, test:
- [ ] Login page loads
- [ ] Can log in with: `admin@communityfoodbank.org` / `password123`
- [ ] Dashboard loads with data
- [ ] Inventory Snapshot shows data
- [ ] Kitchen Details page works
- [ ] All navigation works

## 🐛 Troubleshooting
- **Build fails**: Check Vercel build logs
- **API errors**: Verify backend is running
- **CORS issues**: Backend should allow Vercel domain
- **Environment vars**: Check Vercel project settings

## 📞 Support
If you need help:
1. Check Vercel deployment logs
2. Verify backend is running: `node test-backend.js`
3. Test locally: `npm run dev`
4. Check browser console for errors 