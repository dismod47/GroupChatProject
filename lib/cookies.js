// Simple cookie utilities for storing user name
// Only use on client-side (in useEffect hooks)

import Cookies from 'js-cookie';

const COOKIE_NAME = 'study_group_user_name';

export function getUserName() {
  if (typeof window === 'undefined') return null;
  return Cookies.get(COOKIE_NAME) || null;
}

export function setUserName(name) {
  if (typeof window === 'undefined') return;
  // Store for 30 days
  Cookies.set(COOKIE_NAME, name.trim(), { expires: 30 });
}

export function clearUserName() {
  if (typeof window === 'undefined') return;
  Cookies.remove(COOKIE_NAME);
}

