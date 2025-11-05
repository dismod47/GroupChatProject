# iOS Universal Links Configuration

To enable universal links for `/groups/:id`, you need to configure the following in Xcode:

## 1. Associated Domains Setup

1. Open your project in Xcode
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Associated Domains"
6. Add your domain: `applinks:yourdomain.com`

## 2. Apple App Site Association (AASA) File

Create a file at `https://yourdomain.com/.well-known/apple-app-site-association` with this content:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.campusstudygroups.app",
        "paths": [
          "/groups/*"
        ]
      }
    ]
  }
}
```

Replace `TEAMID` with your Apple Developer Team ID.

The file must:
- Be served over HTTPS
- Have `Content-Type: application/json` header
- Not have a `.json` extension
- Be accessible without authentication

## 3. Update capacitor.config.json

Update the `server.url` to your production domain when building for release, or remove it to bundle the static build.



