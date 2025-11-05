// Name formatting utility
// Formats full names as "First L." for public display

export function formatNameForPublic(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return fullName || '';
  }

  const trimmed = fullName.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]; // Single name, return as-is
  
  // First name + last initial
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${firstName} ${lastInitial}.`;
}

// Get first name only (for private use if needed)
export function getFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return fullName || '';
  }
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}

// Get user initials for avatar (e.g., "John Doe" -> "JD")
export function getUserInitials(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return '?';
  }
  const trimmed = fullName.trim();
  if (!trimmed) return '?';
  
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // Single name - use first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }
  // Multiple parts - use first letter of first and last name
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return firstInitial + lastInitial;
}

