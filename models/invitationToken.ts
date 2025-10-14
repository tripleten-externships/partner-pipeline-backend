import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, relationship, text, timestamp, integer, json, select } from "@keystone-6/core/fields";
import { permissions, isSignedIn } from "../utils/access";

export const InvitationToken: ListConfig<Lists.InvitationToken.TypeInfo<any>> = list({
  access: {
    operation: {
      // anyone signed in can attempt to query; filter.query will scope the results
      query: ({ session }) => isSignedIn({ session }),
      create: ({ session }) => permissions.isAdminLike({ session }),
      update: ({ session }) => permissions.isAdminLike({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    filter: {
      // Admin/Lead Mentor → see all
      // Others → only see tokens whose *underlying project* they belong to:
      // InvitationToken.project (ProjectInvitation) -> project (Project) -> members includes current user
      query: ({ session }) =>
        permissions.isAdminLike({ session })
          ? true
          : {
              project: {
                project: {
                  members: { some: { id: { equals: session?.data?.id } } },
                },
              },
            },
      update: ({ session }) =>
        permissions.isAdminLike({ session })
          ? true
          : {
              project: {
                project: {
                  members: { some: { id: { equals: session?.data?.id } } },
                },
              },
            },
      delete: ({ session }) => (permissions.isAdminLike({ session }) ? true : false),
    },
  },

  fields: {
    tokenHash: text({ isIndexed: "unique", validation: { isRequired: true } }),

    // NOTE: This field name is "project" but it actually links to ProjectInvitation.
    // Keeping the name for backward-compat; if you ever rename to "invitation", you’ll need a migration.
    project: relationship({
      ref: "ProjectInvitation.invitationTokens",
      many: false,
      ui: { labelField: "email" },
    }),

    // Optional: make roleToGrant a select to avoid typos
    roleToGrant: select({
      options: [
        { label: "Student", value: "Student" },
        { label: "Project Mentor", value: "Project Mentor" },
        { label: "Lead Mentor", value: "Lead Mentor" },
        { label: "External Partner", value: "External Partner" },
      ],
      defaultValue: "Student",
      ui: { displayMode: "select" },
    }),

    expiresAt: timestamp({ validation: { isRequired: true } }),
    maxUses: integer({ defaultValue: 1 }),
    usedCount: integer({ defaultValue: 0 }),
    revoked: checkbox({ defaultValue: false }),

    createdBy: relationship({ ref: "User", many: false }),
    notes: text({ ui: { displayMode: "textarea" } }),
  },

  hooks: {
    resolveInput: async ({ operation, resolvedData, context, inputData }) => {
      if (operation === "create") {
        // auto-set createdBy if not supplied
        if (!inputData.createdBy && context.session?.data?.id) {
          resolvedData.createdBy = { connect: { id: context.session.data.id } };
        }
      }
      return resolvedData;
    },

    async afterOperation({ operation, item, originalItem, context }) {
      if (operation === "create" || operation === "update" || operation === "delete") {
        await context.db.InvitationTokenLog.createOne({
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

export const InvitationTokenLog: ListConfig<Lists.InvitationTokenLog.TypeInfo<any>> = list({
  access: {
    operation: {
      query: ({ session }) => permissions.isAdminLike({ session }), // tighten from raw isAdmin boolean
      create: () => true,
      update: () => false,
      delete: () => false,
    },
  },
  fields: {
    operation: text({ validation: { isRequired: true } }),
    before: json(),
    after: json(),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
});
