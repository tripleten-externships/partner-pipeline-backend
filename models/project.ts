import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, relationship, text, timestamp } from "@keystone-6/core/fields";
import { permissions, isSignedIn } from "../utils/access";

export const Project: ListConfig<Lists.Project.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: ({ session }) => isSignedIn({ session }),
      create: ({ session }) => permissions.isAdminLike({ session }),
      update: ({ session }) =>
        permissions.isAdminLike({ session }) || permissions.isProjectMember({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    item: {
      update: ({ session, item }) => item.id === session.data.id,
      delete: ({ session, item }) => item.id === session.data.id,
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
    members: relationship({ ref: "User.project", many: true }),
  },
  hooks: {
    async afterOperation({ operation, item, originalItem, context }) {
      if (operation === "create" || operation === "update" || operation === "delete") {
        await context.db.ProjectLog.createOne({
          data: {
            user: { connect: { id: item?.id || originalItem?.id } },
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
