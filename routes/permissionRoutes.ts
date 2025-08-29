import express from "express";
import type { Context } from ".keystone/types";
import { RolePermissions, PermissionValues, UserRoleValues, Permission } from "../utils/values";

export function createPermissionRouter(commonContext: Context) {
  const router = express.Router();

  // Get all available permissions
  router.get("/api/permissions", async (req, res) => {
    try {
      const context = await commonContext.withRequest(req, res);
      
      if (!context.session?.data) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user has permission to view permissions
      const hasPermission = await checkUserPermission(context, "system:admin");
      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const permissions = await context.db.Permission.findMany({
        orderBy: { category: "asc", name: "asc" },
      });

      res.json({
        permissions,
        availablePermissions: PermissionValues,
        rolePermissions: RolePermissions,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user permissions
  router.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const context = await commonContext.withRequest(req, res);
      const { userId } = req.params;
      
      if (!context.session?.data) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user can view permissions (admin or self)
      const canView = context.session.data.id === userId || 
                     await checkUserPermission(context, "users:read");
      
      if (!canView) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const user = await context.db.User.findOne({
        where: { id: userId },
        query: `
          id
          role
          userPermissions {
            id
            permission
            granted
            grantedAt
            grantedBy { id name email }
          }
          customPermissions {
            id
            name
            category
          }
        `,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get role-based permissions
      const rolePermissions = user.role ? RolePermissions[user.role as keyof typeof RolePermissions] || [] : [];

      res.json({
        user,
        rolePermissions,
        effectivePermissions: getEffectivePermissions(user, rolePermissions),
      });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Grant permission to user
  router.post("/api/users/:userId/permissions", async (req, res) => {
    try {
      const context = await commonContext.withRequest(req, res);
      const { userId } = req.params;
      const { permission, granted = "allow" } = req.body;
      
      if (!context.session?.data) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user has permission to manage roles
      const hasPermission = await checkUserPermission(context, "users:manage_roles");
      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      if (!PermissionValues.includes(permission)) {
        return res.status(400).json({ error: "Invalid permission" });
      }

      // Check if permission already exists
      const existingPermission = await context.db.UserPermission.findFirst({
        where: {
          user: { id: { equals: userId } },
          permission: { equals: permission },
        },
      });

      let userPermission;
      if (existingPermission) {
        // Update existing permission
        userPermission = await context.db.UserPermission.updateOne({
          where: { id: existingPermission.id },
          data: {
            granted,
            grantedBy: { connect: { id: context.session.data.id } },
            grantedAt: new Date().toISOString(),
          },
          query: "id permission granted grantedAt",
        });
      } else {
        // Create new permission
        userPermission = await context.db.UserPermission.createOne({
          data: {
            user: { connect: { id: userId } },
            permission,
            granted,
            grantedBy: { connect: { id: context.session.data.id } },
          },
          query: "id permission granted grantedAt",
        });
      }

      res.json({ userPermission });
    } catch (error) {
      console.error("Error granting permission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Revoke permission from user
  router.delete("/api/users/:userId/permissions/:permissionId", async (req, res) => {
    try {
      const context = await commonContext.withRequest(req, res);
      const { userId, permissionId } = req.params;
      
      if (!context.session?.data) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user has permission to manage roles
      const hasPermission = await checkUserPermission(context, "users:manage_roles");
      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      await context.db.UserPermission.deleteOne({
        where: { id: permissionId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking permission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk update user permissions
  router.put("/api/users/:userId/permissions/bulk", async (req, res) => {
    try {
      const context = await commonContext.withRequest(req, res);
      const { userId } = req.params;
      const { permissions } = req.body;
      
      if (!context.session?.data) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user has permission to manage roles
      const hasPermission = await checkUserPermission(context, "users:manage_roles");
      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Validate permissions
      if (!Array.isArray(permissions) || !permissions.every(p => PermissionValues.includes(p.permission))) {
        return res.status(400).json({ error: "Invalid permissions data" });
      }

      // Delete existing permissions
      const existingPermissions = await context.db.UserPermission.findMany({
        where: { user: { id: { equals: userId } } },
      });

      for (const perm of existingPermissions) {
        await context.db.UserPermission.deleteOne({ where: { id: perm.id } });
      }

      // Create new permissions
      const newPermissions = [];
      for (const perm of permissions) {
        const userPermission = await context.db.UserPermission.createOne({
          data: {
            user: { connect: { id: userId } },
            permission: perm.permission,
            granted: perm.granted || "allow",
            grantedBy: { connect: { id: context.session.data.id } },
          },
          query: "id permission granted grantedAt",
        });
        newPermissions.push(userPermission);
      }

      res.json({ permissions: newPermissions });
    } catch (error) {
      console.error("Error bulk updating permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

// Helper function to check user permission
async function checkUserPermission(context: Context, permission: Permission): Promise<boolean> {
  if (!context.session?.data) return false;
  
  const userRole = context.session.data.role;
  if (!userRole) return false;

  // Check role-based permissions
  const rolePermissions = RolePermissions[userRole as keyof typeof RolePermissions] || [];
  if (rolePermissions.includes(permission)) return true;

  // Check custom permissions
  const userPermissions = await context.db.UserPermission.findMany({
    where: {
      user: { id: { equals: context.session.data.id } },
      permission: { equals: permission },
      granted: { equals: "allow" },
    },
  });

  return userPermissions.length > 0;
}

// Helper function to get effective permissions
function getEffectivePermissions(user: any, rolePermissions: readonly string[]): string[] {
  const effectivePermissions = new Set(rolePermissions);
  
  // Add custom permissions that are granted
  if (user.userPermissions) {
    for (const perm of user.userPermissions) {
      if (perm.granted === "allow") {
        effectivePermissions.add(perm.permission);
      } else if (perm.granted === "deny") {
        effectivePermissions.delete(perm.permission);
      }
    }
  }
  
  return Array.from(effectivePermissions);
}
