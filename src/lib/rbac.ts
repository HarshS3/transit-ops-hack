// Client-safe RBAC map — no next/headers imports here.
export const RBAC: Record<string, string[]> = {
  FLEET_MANAGER: ["dashboard", "fleet", "drivers", "trips", "maintenance", "fuel", "analytics", "settings"],
  DISPATCHER: ["dashboard", "fleet", "drivers", "trips", "maintenance", "fuel", "analytics", "settings"],
  SAFETY_OFFICER: ["dashboard", "drivers", "trips", "analytics"],
  FINANCIAL_ANALYST: ["dashboard", "fuel", "analytics"],
};
