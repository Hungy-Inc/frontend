# Vercel Deployment Guide

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Backend deployed and running

## Step 1: Backend Setup (Render)

### Check Backend Status
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Check if your backend service is running
3. If it shows "Hibernated" or "Failed", restart it

### Common Backend Issues
- **503 Error**: Service is hibernated or crashed
- **Environment Variables**: Ensure all required env vars are set
- **Database Connection**: Check if database is accessible

### Backend Health Check
```bash
curl -I https://backend-1-7yki.onrender.com/
# Should return 200 OK, not 503
```

## Step 2: Frontend Deployment (Vercel)

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Method 2: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Environment Variables in Vercel
1. In Vercel project settings, go to "Environment Variables"
2. Add:
   ```
   NEXT_PUBLIC_API_URL = https://backend-1-7yki.onrender.com
   ```

## Step 3: Testing

### Local Testing
```bash
# Test with deployed backend
npm run dev
# Visit http://localhost:3000
```

### Production Testing
1. Deploy to Vercel
2. Test all major features:
   - Login
   - Dashboard
   - Inventory
   - Kitchen Details
   - User Management

## Troubleshooting

### Network Issues
- **CORS Errors**: Backend needs to allow Vercel domain
- **API Timeouts**: Check backend response times
- **503 Errors**: Backend is down, restart Render service

### Build Issues
- **Missing Dependencies**: Check package.json
- **TypeScript Errors**: Fix type issues before deployment
- **Environment Variables**: Ensure all required vars are set

### Runtime Issues
- **Authentication**: Check JWT token handling
- **Database**: Verify database connections
- **File Uploads**: Check file size limits

## Environment Configuration

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production (Vercel)
```
NEXT_PUBLIC_API_URL=https://backend-1-7yki.onrender.com
```

## Performance Optimization

### Build Optimization
- Enable Next.js optimizations
- Use dynamic imports for large components
- Optimize images with Next.js Image component

### Runtime Optimization
- Implement proper caching
- Use React.memo for expensive components
- Optimize API calls with proper error handling

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor Core Web Vitals
- Track user interactions

### Error Tracking
- Set up error monitoring (Sentry, LogRocket)
- Monitor API failures
- Track user experience issues

## Security

### Environment Variables
- Never commit sensitive data to Git
- Use Vercel's environment variable system
- Rotate API keys regularly

### API Security
- Implement proper CORS policies
- Use HTTPS for all API calls
- Validate user inputs

## Backup Strategy

### Database
- Regular database backups
- Test restore procedures
- Monitor database health

### Code
- Use Git for version control
- Tag releases for easy rollback
- Keep deployment logs

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify backend is running
3. Test API endpoints directly
4. Check browser console for errors
5. Review this troubleshooting guide 