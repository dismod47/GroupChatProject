# Quick Start: Capacitor iOS Setup

This is a quick reference guide. For detailed instructions, see [CAPACITOR_IOS_SETUP.md](./CAPACITOR_IOS_SETUP.md).

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize iOS project:**
   ```bash
   npx cap add ios
   ```

3. **Configure app in `capacitor.config.json`:**
   - Update `appId` (bundle identifier)
   - Update `appName` (display name)
   - For development: keep `server.url: "http://localhost:3000"`
   - For production: remove `server` section or point to production URL

## Development Workflow

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Sync and open Xcode
npm run cap:sync
npm run cap:ios
```

Then run the app from Xcode (simulator or device).

## Production Build

### Option A: Static Export (Recommended)

1. Update `next.config.js`:
   ```js
   output: 'export',
   ```

2. Build and sync:
   ```bash
   npm run build
   npm run cap:sync
   npm run cap:ios
   ```

3. Remove `server.url` from `capacitor.config.json` before syncing.

### Option B: Production Server

1. Update `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "https://yourdomain.com"
     }
   }
   ```

2. Sync:
   ```bash
   npm run cap:sync
   ```

## Universal Links

1. **In Xcode:** Add Associated Domains capability: `applinks:yourdomain.com`

2. **On server:** Create `.well-known/apple-app-site-association` file (see [ios-config.md](./ios-config.md))

3. **Test:** Universal links for `/groups/:id` will automatically open the app

## Features Added

✅ **Native Share Button** - Share group links from group pages (iOS only)  
✅ **Universal Links** - Deep linking to `/groups/:id` URLs  
✅ **Settings Page** - Theme toggle (light/dark mode)  
✅ **All web logic preserved** - No breaking changes to existing functionality

## Build for TestFlight

1. Open Xcode: `npm run cap:ios`
2. Update version/build number
3. Configure signing (select Team)
4. **Product → Archive**
5. **Distribute App → App Store Connect**
6. Upload and wait for processing
7. Add to TestFlight in App Store Connect

## Need Help?

See [CAPACITOR_IOS_SETUP.md](./CAPACITOR_IOS_SETUP.md) for detailed troubleshooting and configuration.



