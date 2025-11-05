// Safe Capacitor imports (won't break on server-side)
let Capacitor = null;
let isNative = false;
let platform = 'web';

if (typeof window !== 'undefined') {
  try {
    Capacitor = require('@capacitor/core');
    isNative = Capacitor.isNativePlatform();
    platform = Capacitor.getPlatform();
  } catch (e) {
    // Capacitor not available (development or web-only)
    isNative = false;
    platform = 'web';
  }
}

export { isNative, platform };

// Helper to check if running on iOS
export const isIOS = platform === 'ios';

// Helper to check if running on web
export const isWeb = platform === 'web';
