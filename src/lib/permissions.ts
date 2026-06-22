import type { Session } from "next-auth";

const APPROVED_MAINTAINERS = (process.env.APPROVED_MAINTAINERS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * Check if the current session belongs to an authorized maintainer.
 */
export function isMaintainer(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  if (APPROVED_MAINTAINERS.length === 0) return false; // No maintainers configured = nobody
  return APPROVED_MAINTAINERS.includes(session.user.id);
}

/**
 * Get the list of approved maintainer Discord IDs (for debugging).
 */
export function getMaintainers(): readonly string[] {
  return APPROVED_MAINTAINERS;
}
