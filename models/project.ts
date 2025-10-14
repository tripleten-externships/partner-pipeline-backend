import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, relationship, text, timestamp, json } from "@keystone-6/core/fields";
import { permissions, isSignedIn } from "../utils/access";

export const Project: ListConfig<Lists.Project.TypeInfo<any>> = list({
  access: {
    // Broad op-level gates
    operation: {
      query: isSignedIn, // must be logged in to see anything
      create: ({ session }) => permissions.isAdminLike({ session }), // ONLY Admin/Lead Mentor
      update: isSignedIn, // allowed, but constrained by filter.update
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },

    // Field-level filter rules for which items a user can act on
    filter: {
      // If admin-like → see all. Otherwise, only projects where you're a member.
      query: ({ session }) =>
        permissions.isAdminLike({ session })
          ? true
          : { members: { some: { id: { equals: session?.data?.id } } } },

      // If admin-like → can update any. Otherwise, only update projects you belong to.
      update: ({ session }) =>
        permissions.isAdminLike({ session })
          ? true
          : { members: { some: { id: { equals: session?.data?.id } } } },

      // Only admin-like can delete
      delete: ({ session }) => (permissions.isAdminLike({ session }) ? true : false),
    },

    // You can drop item-level “update/delete” if you’re using filter.* above;
    // Keystone will AND them together if both exist.
    // item: { ... }
  },

  fields: {
    name: text({ validation: { isRequired: true } }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    project: text({ validation: { isRequired: true } }),
    isActive: checkbox({ defaultValue: false }),
    lastUpdate: timestamp({ defaultValue: { kind: "now" } }),
    members: relationship({ ref: "User.projects", many: true }),
    invitation: relationship({ ref: "ProjectInvitation.project", many: true }),
    milestones: relationship({ ref: "Milestone.project", many: true }),
    activityLogs: relationship({ ref: "ActivityLog.project", many: true }),
  },

  hooks: {
    async afterOperation({ operation, item, originalItem, context }) {
      if (operation === "create" || operation === "update" || operation === "delete") {
        await context.db.ProjectLog.createOne({
          data: {
            operation,
            before: originalItem ? JSON.stringify(originalItem) : null,
            after: item ? JSON.stringify(item) : null,
            timestamp: new Date().toISOString(),
          },
        });
      }
    },
  },
});

export const ProjectLog: ListConfig<Lists.ProjectLog.TypeInfo<any>> = list({
  fields: {
    project: relationship({ ref: "Project", many: false }),
    operation: text({ validation: { isRequired: true } }), // "create", "update", "delete"
    before: json(),
    after: json(),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => false,
      delete: () => false,
    },
  },
});

// ====================
// ProjectInvitation List (Added)
// ====================
export const ProjectInvitation = list({
  fields: {
    email: text(),
    project: relationship({ ref: "Project.invitation" }),
    user: relationship({ ref: "User.invitation" }),
    invitationTokens: relationship({ ref: "InvitationToken.project", many: true }),
  },
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
});
