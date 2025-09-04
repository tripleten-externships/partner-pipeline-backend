import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, relationship, text, timestamp, json } from "@keystone-6/core/fields";
import { permissions, isSignedIn } from "../utils/access";

export const Project: ListConfig<Lists.Project.TypeInfo<any>> = list({
  access: {
    operation: {
      query: ({ session }) => isSignedIn({ session }),

      // create: ({ session }) => {
      //   console.log("Session at create access:", session);
      //   return permissions.isAdminLike({ session });
      // },

      // create: ({ session }) => permissions.isAdminLike({ session }),

      create: isSignedIn,

      update: ({ session }) =>
        permissions.isAdminLike({ session }) || permissions.isProjectMember({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    item: {
      update: ({ session }) => permissions.isAdminLike({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    project: text({ validation: { isRequired: true } }),
    isActive: checkbox({ defaultValue: false }),
    lastUpdate: timestamp({
      defaultValue: { kind: "now" },
    }),
    members: relationship({ ref: "User.projects", many: true }),
    invitation: relationship({ ref: "ProjectInvitation.project", many: true }), // <-- Added field
    // milestones field added for reference to milestone schema
    milestones: relationship({ ref: "Milestone.project", many: true }), // <-- Added field
    activityLogs: relationship({ ref: "ActivityLog.project", many: true }),
    invitations: relationship({ ref: "InvitationToken.project", many: true }),
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
      query: ({ session }) => !!session && session.data.isAdmin,
      create: ({ session }) => !!session && session.data.isAdmin,
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
    project: relationship({ ref: "Project.invitations" }),
    user: relationship({ ref: "User.invitations" }),
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
