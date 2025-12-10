export const PROFILE_STORAGE_KEY = "workhub:settings:profile";
export const PROFILE_UPDATE_EVENT = "workhub:profile:updated";

const USER_ROLES = ["ADMIN", "DEVELOPER", "CLIENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(role?: string | null): UserRole | null {
  if (!role) {
    return null;
  }
  const upper = role.toUpperCase();
  return USER_ROLES.find((candidate) => candidate === upper) ?? null;
}
