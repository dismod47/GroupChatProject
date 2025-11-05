# Quick Deployment Checklist

## ✅ Code Changes Completed

- [x] Updated Prisma schema from SQLite to PostgreSQL
- [x] Updated migration lock file
- [x] Added Vercel build scripts to package.json
- [x] Created deployment guide (VERCEL_DEPLOYMENT.md)

## 📋 What You Need to Do

### Step 1: Set Up Neon Postgres (5 minutes)

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Click **"Create Project"**
3. Name it (e.g., "study-groups") and choose region
4. Click **"Create Project"** (wait 10-20 seconds)

### Step 2: Get Database Connection String

1. In Neon dashboard, find your **Connection Details** panel
2. **Copy the connection string** (use **pooled connection** if available - better for serverless)
3. It should look like: `postgres://user:pass@pooler.region.aws.neon.tech/dbname?sslmode=require`

### Step 3: Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the Neon connection string from Step 2
   - **Select**: All environments (Production, Preview, Development)
4. Click **Save**

### Step 4: Deploy

1. Push your code to Git (if not already)
2. Vercel will automatically deploy
3. The build will:
   - Generate Prisma client
   - Run database migrations
   - Build your Next.js app

### Step 5: Seed the Database (After First Deployment)

**Option A: Using Vercel CLI** (Recommended)
```bash
npm i -g vercel
vercel env pull .env.local
npm run seed
```

**Option B: Using Prisma Studio**
```bash
vercel env pull .env.local
npx prisma studio
# Manually add courses and test data
```

## 🔍 Verify Everything Works

After deployment:
1. Visit your Vercel URL
2. Check homepage loads
3. Try creating a course/group
4. Test authentication

## ⚠️ Important Notes

- **Don't commit `.env.local`** - It's already in `.gitignore`
- **Connection String**: Use the **pooled connection** from Neon (better for serverless)
- **SSL Required**: Make sure connection string includes `?sslmode=require`
- **Database Pausing**: Neon free tier may pause after inactivity - it auto-resumes on first connection
- **First migration**: Will run automatically during build
- **Local development**: You'll need `DATABASE_URL` in `.env.local` for testing

## 📚 Full Guide

See `VERCEL_DEPLOYMENT.md` for detailed instructions and troubleshooting.

---

**Neon Free Tier (Very Generous!):**
- 3 GB storage
- 0.5 vCPU, 1 GB RAM
- Point-in-time recovery
- Up to 10 database branches
- No expiration!

