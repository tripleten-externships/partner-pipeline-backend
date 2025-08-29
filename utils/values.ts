export const UserRoleValues = [
  "Admin",
  "External Partner",
  "Project Mentor",
  "Lead Mentor",
  "Student",
] as const;

export const PermissionValues = [
  // User Management Permissions
  "users:create",
  "users:read",
  "users:update",
  "users:delete",
  "users:manage_roles",
  
  // Project Management Permissions
  "projects:create",
  "projects:read",
  "projects:update",
  "projects:delete",
  "projects:assign_members",
  
  // Milestone Permissions
  "milestones:create",
  "milestones:read",
  "milestones:update",
  "milestones:delete",
  
  // Activity Log Permissions
  "activity_logs:read",
  "activity_logs:manage",
  
  // System Administration
  "system:admin",
  "system:settings",
] as const;

export const RolePermissions = {
  Admin: [
    "users:create", "users:read", "users:update", "users:delete", "users:manage_roles",
    "projects:create", "projects:read", "projects:update", "projects:delete", "projects:assign_members",
    "milestones:create", "milestones:read", "milestones:update", "milestones:delete",
    "activity_logs:read", "activity_logs:manage",
    "system:admin", "system:settings"
  ],
  "Lead Mentor": [
    "users:read", "users:update",
    "projects:create", "projects:read", "projects:update", "projects:assign_members",
    "milestones:create", "milestones:read", "milestones:update", "milestones:delete",
    "activity_logs:read"
  ],
  "Project Mentor": [
    "users:read",
    "projects:read", "projects:update",
    "milestones:create", "milestones:read", "milestones:update", "milestones:delete",
    "activity_logs:read"
  ],
  "External Partner": [
    "projects:read",
    "milestones:read",
    "activity_logs:read"
  ],
  Student: [
    "projects:read",
    "milestones:read"
  ]
} as const;

export type UserRole = typeof UserRoleValues[number];
export type Permission = typeof PermissionValues[number];
