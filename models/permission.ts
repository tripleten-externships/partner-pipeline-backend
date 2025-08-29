import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { text, relationship, select, multiselect, timestamp } from "@keystone-6/core/fields";
import { PermissionValues, UserRoleValues } from "../utils/values";
import { permissions, isSignedIn } from "../utils/access";

export const Permission: ListConfig<Lists.Permission.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: ({ session }) => isSignedIn({ session }),
      create: ({ session }) => permissions.hasPermission({ session, permission: "system:admin" }),
      update: ({ session }) => permissions.hasPermission({ session, permission: "system:admin" }),
      delete: ({ session }) => permissions.hasPermission({ session, permission: "system:admin" }),
    },
  },
  fields: {
    name: text({ 
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    description: text(),
    category: select({
      options: [
        { label: "User Management", value: "users" },
        { label: "Project Management", value: "projects" },
        { label: "Milestones", value: "milestones" },
        { label: "Activity Logs", value: "activity_logs" },
        { label: "System Administration", value: "system" },
      ],
      validation: { isRequired: true },
    }),
    roles: multiselect({
      options: UserRoleValues.map((role) => ({ label: role, value: role })),
      defaultValue: [],
    }),
    users: relationship({ ref: "User.customPermissions", many: true }),
  },
});

export const UserPermission: ListConfig<Lists.UserPermission.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: ({ session }) => isSignedIn({ session }),
      create: ({ session }) => permissions.hasPermission({ session, permission: "users:manage_roles" }),
      update: ({ session }) => permissions.hasPermission({ session, permission: "users:manage_roles" }),
      delete: ({ session }) => permissions.hasPermission({ session, permission: "users:manage_roles" }),
    },
  },
  fields: {
    user: relationship({ ref: "User.userPermissions", validation: { isRequired: true } }),
    permission: select({
      options: PermissionValues.map((perm) => ({ label: perm, value: perm })),
      validation: { isRequired: true },
    }),
    granted: select({
      options: [
        { label: "Allow", value: "allow" },
        { label: "Deny", value: "deny" },
      ],
      defaultValue: "allow",
      validation: { isRequired: true },
    }),
    grantedBy: relationship({ ref: "User" }),
    grantedAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
