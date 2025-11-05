# Capacitor iOS Setup Guide

This guide walks you through setting up the iOS app, building in Xcode, and uploading to TestFlight.

## Prerequisites

- macOS with Xcode installed
- Apple Developer account ($99/year)
- Node.js and npm installed
- CocoaPods installed (`sudo gem install cocoapods`)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This installs Capacitor and all required plugins.

### 2. Initialize Capacitor iOS Project

```bash
npx cap add ios
```

This creates the `ios/` directory with the Xcode project.

### 3. Configure Your App

Edit `capacitor.config.json` and update:
- `appId`: Your bundle identifier (e.g., `com.yourcompany.campusstudygroups`)
- `appName`: Your app's display name
- `server.url`: For development, keep as `http://localhost:3000`. For production, either:
  - Set to your production server URL, OR
  - Remove the `server` section to bundle the static build

## Development Mode

For development, you can run the Next.js server and point Capacitor to it:

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Keep `server.url` in capacitor.config.json:**
   ```json
   {
     "server": {
       "url": "http://localhost:3000",
       "cleartext": true
     }
   }
   ```

3. **Sync Capacitor:**
   ```bash
   npm run cap:sync
   ```

4. **Open in Xcode:**
   ```bash
   npm run cap:ios
   ```

5. **Run on simulator or device** from Xcode.

## Production Build

For production, you have two options:

### Option A: Static Export (Recommended)

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Update next.config.js** to enable static export:
   ```js
   const nextConfig = {
     output: 'export',
     // ... rest of config
   }
   ```

3. **Rebuild:**
   ```bash
   npm run build
   ```

4. **Remove or comment out `server.url` in capacitor.config.json:**
   ```json
   {
     // "server": {
     //   "url": "...",
     //   "cleartext": true
     // }
   }
   ```

5. **Sync and build:**
   ```bash
   npm run cap:sync
   npm run cap:ios
   ```

### Option B: Point to Production Server

1. **Update capacitor.config.json:**
   ```json
   {
     "server": {
       "url": "https://yourdomain.com"
     }
   }
   ```

2. **Sync:**
   ```bash
   npm run cap:sync
   ```

## Universal Links Setup

### 1. Configure Associated Domains in Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Associated Domains"
6. Add your domain: `applinks:yourdomain.com`

### 2. Create Apple App Site Association File

Create a file at `https://yourdomain.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.campusstudygroups.app",
        "paths": ["/groups/*"]
      }
    ]
  }
}
```

Replace:
- `TEAMID` with your Apple Developer Team ID (found in Apple Developer portal)
- `com.campusstudygroups.app` with your bundle identifier

**Important:** The file must:
- Be served over HTTPS
- Have `Content-Type: application/json` header
- NOT have a `.json` extension
- Be accessible without authentication
- Return 200 status code

### 3. Verify AASA File

Test your AASA file:
```bash
curl https://yourdomain.com/.well-known/apple-app-site-association
```

Or use Apple's validator:
https://search.developer.apple.com/appsearch-validation-tool

## Building for TestFlight

### 1. Update Version and Build Number

In Xcode:
1. Select your project in the navigator
2. Select your app target
3. In "General" tab:
   - Update "Version" (e.g., 1.0.0)
   - Update "Build" (e.g., 1)

### 2. Configure Signing

1. Go to "Signing & Capabilities"
2. Enable "Automatically manage signing"
3. Select your Team
4. Xcode will automatically configure provisioning profiles

### 3. Archive the Build

1. Select "Any iOS Device" or a connected device (not simulator)
2. Go to **Product → Archive**
3. Wait for the archive to complete

### 4. Upload to App Store Connect

1. When archive completes, Organizer window opens
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Next**
5. Select distribution options:
   - **Upload**: For TestFlight
   - **Export**: To save IPA locally
6. Follow the prompts:
   - Select your distribution certificate
   - Choose upload options
   - Click **Upload**
7. Wait for upload to complete

### 5. Process in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Navigate to **My Apps** → Your App
3. Go to **TestFlight** tab
4. Wait for processing (usually 5-30 minutes)
5. Add build to a test group
6. Add internal or external testers
7. Testers receive email invitations

## Testing Universal Links

### On Device

1. **Test via Notes app:**
   - Open Notes app
   - Type a URL like `https://yourdomain.com/groups/123`
   - Long-press the link
   - You should see "Open in [Your App]"

2. **Test via Safari:**
   - Open Safari
   - Navigate to `https://yourdomain.com/groups/123`
   - You should see a banner to open in the app

### Via Command Line

```bash
xcrun simctl openurl booted "https://yourdomain.com/groups/123"
```

## Troubleshooting

### Universal Links Not Working

1. **Check AASA file:**
   ```bash
   curl -I https://yourdomain.com/.well-known/apple-app-site-association
   ```
   Should return `Content-Type: application/json`

2. **Verify domain is registered** in Xcode capabilities

3. **Check bundle identifier** matches in:
   - Xcode project
   - capacitor.config.json
   - AASA file

4. **Restart device** after installing app

5. **Check iOS version** - Universal links require iOS 9+

### Build Errors

1. **CocoaPods issues:**
   ```bash
   cd ios/App
   pod deintegrate
   pod install
   ```

2. **Capacitor sync issues:**
   ```bash
   npm run cap:sync
   ```

3. **Xcode cache:**
   - Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
   - Delete DerivedData folder

### Server Connection Issues (Development)

1. **iOS Simulator:** Use `http://localhost:3000`
2. **Physical Device:** Use your Mac's local IP (e.g., `http://192.168.1.100:3000`)
   - Find IP: System Preferences → Network
   - Update `server.url` in capacitor.config.json

## Useful Commands

```bash
# Sync web assets to iOS
npm run cap:sync

# Open Xcode project
npm run cap:ios

# Copy web assets only
npm run cap:copy

# Build Next.js for production
npm run build

# Run Next.js dev server
npm run dev
```

## Notes

- **Development:** Use `server.url` to point to your dev server
- **Production:** Either bundle static build or point to production server
- **Universal Links:** Only work with HTTPS in production
- **TestFlight:** External testing requires App Review for first build
- **Updates:** After web code changes, run `npm run cap:sync` before building in Xcode



