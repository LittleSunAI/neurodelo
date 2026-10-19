import { cleanupExpiredSessions } from "./session";
import { clearExpiredRateLimits } from "./rate-limit";
import { cleanupLocalAuthTokens } from "./local-auth-store";
import { cleanupStoredObjects } from "./object-storage";
import { cleanupLocalJobs } from "./jobs";

export function runLocalMaintenance() {
  return {
    expiredSessions: cleanupExpiredSessions(),
    expiredRateLimits: clearExpiredRateLimits(),
    expiredResetTokens: cleanupLocalAuthTokens(),
    staleObjects: cleanupStoredObjects(),
    staleJobs: cleanupLocalJobs(),
    completedAt: new Date().toISOString(),
  };
}
