# Vercel Deployment Guide with Neon Postgres

This guide will help you deploy the Campus Study Groups app to Vercel using Neon Postgres (a serverless PostgreSQL provider).

## Prerequisites

- A Vercel account (free tier available)
- A Neon account (free tier available)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up Neon Postgres Database

1. **Sign up for Neon**: Go to [neon.tech](https://neon.tech) and sign up (free tier available)
2. **Create a new project**:
   - Click **"Create Project"**
   - Choose a project name (e.g., "study-groups")
   - Select a region closest to your users (or where Vercel deploys)
   - Choose PostgreSQL version (15 or 16 recommended)
   - Click **"Create Project"**
3. **Wait for database creation** (usually takes 10-20 seconds)

## Step 2: Get Your Database Connection String

1. Once your Neon project is created, you'll see the **Connection Details** panel
2. **Copy the connection string** - You have two options:
   
   **Option A: Direct Connection String** (for Prisma)
   - Look for the connection string that looks like:
     ```
     postgres://username:password@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Click **"Copy"** next to the connection string
   
   **Option B: Connection String with Connection Pooling** (recommended for serverless)
   - In the Connection Details, look for **"Pooled connection"** or **"Connection pooling"**
   - Use the pooled connection string (it starts with your project name instead of `ep-xxxxx`)
   - This is better for Vercel serverless functions
   - Example: `postgres://project:password@pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

**Note**: Neon provides both pooled and direct connections. For Vercel serverless functions, use the **pooled connection** if available.

## Step 3: Add Environment Variables in Vercel

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (or create a new one if you haven't)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   **Required:**
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the Neon connection string you copied in Step 2
   - **Important**: Use the **pooled connection string** if available (better for serverless)
   
   **Optional:**
   - **Name**: `MAINTENANCE_MODE`
   - **Value**: `0` (set to `1` to enable maintenance mode)

5. **Important**: Make sure to select all environments (Production, Preview, Development)
6. Click **Save**

## Step 4: Update Your Local Environment (Optional - for testing)

Create a `.env.local` file in your project root:

```env
DATABASE_URL="your_postgres_connection_string_here"
MAINTENANCE_MODE=0
```

**Note**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 5: Run Database Migrations

### For Local Development:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npm run seed
```

### For Vercel Deployment:

Vercel will automatically run migrations during build if you have a `postinstall` script. Otherwise, you can:

1. **Option A: Add to package.json** (recommended):
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "vercel-build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

2. **Option B: Run migrations manually** after first deployment:
   ```bash
   npx prisma migrate deploy
   ```

## Step 6: Deploy to Vercel

### First Time Deployment:

1. **Connect your Git repository**:
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import your Git repository
   - Configure build settings:
     - Framework Preset: **Next.js**
     - Build Command: `npm run build` (or use the `vercel-build` script above)
     - Output Directory: `.next`

2. **Add environment variables** (from Step 3)

3. **Deploy!**

### Subsequent Deployments:

Vercel will automatically deploy when you push to your connected Git branch.

## Step 7: Run Initial Database Seed (After First Deployment)

After your first successful deployment:

1. **Option A: Use Vercel CLI** (recommended):
   ```bash
   # Install Vercel CLI if needed
   npm i -g vercel
   
   # Pull environment variables
   vercel env pull .env.local
   
   # Run seed script
   npm run seed
   ```

2. **Option B: Use Prisma Studio** (for manual seeding):
   ```bash
   # Pull env vars first
   vercel env pull .env.local
   
   # Open Prisma Studio
   npx prisma studio
   ```

## Troubleshooting

### Database Connection Issues

- **Error: "Can't reach database server"**
  - Verify `DATABASE_URL` is set correctly in Vercel environment variables
  - Check that your Neon database is active (not paused)
  - Ensure you're using the pooled connection string for serverless functions
  - Check Neon dashboard for connection limits or issues
  - Verify the connection string includes `?sslmode=require` at the end

### Migration Issues

- **Error: "Migration failed"**
  - Run `npx prisma migrate reset` locally (if you have a local Postgres setup)
  - Or manually create tables using Prisma Studio
  - Check that `DATABASE_URL` has proper permissions

### Build Issues

- **Error: "Prisma Client not generated"**
  - Add `prisma generate` to your build script
  - Or add `"postinstall": "prisma generate"` to package.json

### Environment Variables

- Make sure `DATABASE_URL` is set for **all environments** (Production, Preview, Development)
- Restart your deployment after adding environment variables

## Neon Free Tier Limits

- **Storage**: 3 GB (very generous!)
- **Compute**: 0.5 vCPU, 1 GB RAM
- **Automatic backups**: Point-in-time recovery
- **Branches**: Up to 10 database branches
- **No time limits**: Free tier doesn't expire

**Note**: Neon databases may pause after inactivity to save resources. They automatically resume when you connect. The first connection after pause may take a few seconds.

For production use beyond free tier, Neon has affordable paid plans starting at $19/month.

## Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open database GUI
npx prisma studio

# Seed database
npm run seed

# View database in Neon
# Go to: Neon Dashboard → Your Project → SQL Editor (or use Prisma Studio)
```

## Step 8: Connect Neon to Vercel (Optional Integration)

Neon offers a Vercel integration that automatically manages your database connection:

1. In your Neon dashboard, go to **Settings** → **Integrations**
2. Click **"Connect Vercel"**
3. Follow the prompts to authorize Neon with Vercel
4. Select your Vercel project
5. Neon will automatically add the `DATABASE_URL` environment variable

This is optional but makes it easier to manage connections.

## Next Steps

After successful deployment:
1. ✅ Test all features (create groups, join groups, chat, etc.)
2. ✅ Monitor database usage in Neon dashboard
3. ✅ Set up Vercel Analytics (optional)
4. ✅ Configure custom domain (optional)
5. ✅ Set up Neon database branches for preview environments (optional)

---

**Need Help?**
- [Neon Documentation](https://neon.tech/docs)
- [Neon Vercel Integration](https://neon.tech/docs/guides/vercel)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

