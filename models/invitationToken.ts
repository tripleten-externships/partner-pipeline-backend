import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, relationship, text, timestamp, integer, json } from "@keystone-6/core/fields";
import { permissions, isSignedIn } from "../utils/access";

export const InvitationToken: ListConfig<Lists.InvitationToken.TypeInfo<any>> = list({
  access: {
    operation: {
      query: ({ session }) =>
        permissions.isAdminLike({ session }) || permissions.isProjectMember({ session }),
      create: ({ session }) => permissions.isAdminLike({ session }),
      update: ({ session }) => permissions.isAdminLike({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    filter: {
      query: ({ session }) => {
        if (permissions.isAdminLike({ session })) return true;
        if (permissions.isProjectMember({ session })) {
          return { project: { members: { some: { id: { equals: session?.data?.id } } } } };
        }
        return false;
      },
    },
  },
  fields: {
    
    tokenHash: text({ isIndexed: "unique", validation: { isRequired: true } }),

    
    project: relationship({
      ref: "Project.invitationTokens",
      many: false,
      ui: { labelField: "name" },
    }),

    roleToGrant: text({ defaultValue: "Student" }),

    
    expiresAt: timestamp({ validation: { isRequired: true } }),
    maxUses: integer({ defaultValue: 1 }),
    usedCount: integer({ defaultValue: 0 }),
    revoked: checkbox({ defaultValue: false }),

    
    createdBy: relationship({ ref: "User", many: false }),
    notes: text({ ui: { displayMode: "textarea" } }),
  },
  hooks: {
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
      query: ({ session }) => !!session && session.data.isAdmin,
      create: () => true,
      update: () => false,
      delete: () => false,
    },
  },
  fields: {
    operation: text({ validation: { isRequired: true } }),
    before: json(),
    after: json(),
    // before: text({ ui: { displayMode: "textarea" } }),
    // after: text({ ui: { displayMode: "textarea" } }),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
});