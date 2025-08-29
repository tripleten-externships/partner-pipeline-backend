//access.ts
import { RolePermissions, UserRole, Permission } from "./values";

type Session = {
  data: {
    role?: string;
    id: string;
    project?: string;
    permissions?: string[];
  };
};

export const isSignedIn = ({ session }: { session?: Session }) => !!session;

export const permissions = {
  // Role-based checks
  isStudent: ({ session }: { session?: Session }) => session?.data.role === "Student",
  isProjectMentor: ({ session }: { session?: Session }) => session?.data.role === "Project Mentor",
  isLeadMentor: ({ session }: { session?: Session }) => session?.data.role === "Lead Mentor",
  isExternalPartner: ({ session }: { session?: Session }) =>
    session?.data.role === "External Partner",
  isAdmin: ({ session }: { session?: Session }) => session?.data.role === "Admin",
  isAdminLike: ({ session }: { session?: Session }) =>
    ["Admin", "Lead Mentor", "Project Mentor"].includes(session?.data.role ?? ""),
  isProjectMember: ({ session }: { session?: Session }) => session?.data.project === "",

  // Permission-based checks
  hasPermission: ({ session, permission }: { session?: Session; permission: Permission }) => {
    if (!session?.data) return false;
    
    const userRole = session.data.role as UserRole;
    const customPermissions = session.data.permissions || [];
    
    // Check if user has custom permission granted
    if (customPermissions.includes(permission)) return true;
    
    // Check if user's role has this permission
    if (userRole && RolePermissions[userRole]?.includes(permission)) return true;
    
    return false;
  },

  hasAnyPermission: ({ session, permissions: perms }: { session?: Session; permissions: Permission[] }) => {
    return perms.some(perm => permissions.hasPermission({ session, permission: perm }));
  },

  hasAllPermissions: ({ session, permissions: perms }: { session?: Session; permissions: Permission[] }) => {
    return perms.every(perm => permissions.hasPermission({ session, permission: perm }));
  },

  // Resource-specific permissions
  canManageUser: ({ session, targetUserId }: { session?: Session; targetUserId?: string }) => {
    if (!session?.data) return false;
    
    // Admins can manage all users
    if (permissions.hasPermission({ session, permission: "users:update" })) return true;
    
    // Users can manage themselves
    if (targetUserId && session.data.id === targetUserId) return true;
    
    return false;
  },

  canManageProject: ({ session, projectId }: { session?: Session; projectId?: string }) => {
    if (!session?.data) return false;
    
    // Check if user has project management permissions
    if (permissions.hasPermission({ session, permission: "projects:update" })) return true;
    
    // Check if user is a member of the project (would need to query DB)
    return false;
  },
};
