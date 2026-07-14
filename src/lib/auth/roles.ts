export const appRoles = ["user", "admin", "founder"] as const;

export type AppRole = (typeof appRoles)[number];

const roleRank: Record<AppRole, number> = {
  user: 0,
  admin: 1,
  founder: 2
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export function hasRole(role: AppRole, required: AppRole) {
  return roleRank[role] >= roleRank[required];
}

export const roleLabels: Record<AppRole, string> = {
  user: "User",
  admin: "Admin",
  founder: "Founder"
};

