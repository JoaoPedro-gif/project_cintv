export const PERMISSIONS = [
  "dashboard:view", "dashboard:edit", "data:search", "data:export", "datasource:manage",
  "ticket:create", "ticket:edit", "ticket:assign", "chat:participate",
  "admin:users", "admin:permissions",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const base: Permission[] = ["dashboard:view", "data:search", "ticket:create", "chat:participate"];
export const PRESETS: Record<string, Permission[]> = {
  analyst: base,
  specialist: [...base, "data:export"],
  coordinator: [...base, "data:export", "ticket:edit"],
  engineer: [...base, "data:export", "dashboard:edit", "datasource:manage", "ticket:edit"],
  leader: [...base, "data:export", "ticket:edit", "ticket:assign"],
  admin: [...PERMISSIONS],
};
