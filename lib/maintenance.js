/**
 * Check if maintenance mode is enabled
 * Returns true if MAINTENANCE_MODE environment variable is set to '1'
 */
function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === '1';
}

// Export as CommonJS for require() usage
module.exports = { isMaintenanceMode };

