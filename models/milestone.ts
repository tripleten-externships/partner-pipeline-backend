import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { text, select, relationship, timestamp } from "@keystone-6/core/fields";

export const Milestone: ListConfig<Lists.Milestone.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },

  hooks: {
    async afterOperation(
      args: {
        operation: "create" | "update" | "delete";
        item?: any;
        originalItem?: any;
        context: any;
      } & { session?: any }
    ) {
      const { operation, item, originalItem, context } = args;

      if (
        operation === "update" &&
        item &&
        originalItem &&
        "id" in item &&
        "status" in item &&
        "status" in originalItem &&
        item.status !== originalItem.status
      ) {
        const id = (item as { id: string }).id;

        await context.db.ActivityLog.createOne({
          data: {
            milestone: { connect: { id } },
            oldStatus: originalItem.status,
            newStatus: item.status,
            user:
              "updatedBy" in item && item.updatedBy?.id
                ? { connect: { id: item.updatedBy.id } }
                : undefined,
            timestamp: new Date().toISOString(),
          },
        });
      }
    },
  },

  fields: {
    milestoneName: text({
      validation: { isRequired: true },
    }),

    status: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Blocked", value: "blocked" },
      ],
      defaultValue: "not_started",
      validation: { isRequired: true },
      isIndexed: true,
      ui: { displayMode: "segmented-control" },
    }),

    assignee: text({
      validation: { isRequired: false },
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    project: relationship({ ref: "Project", many: false }),

    updatedAt: timestamp({
      defaultValue: { kind: "now" },
      db: { updatedAt: true },
    }),

    updatedBy: relationship({ ref: "User", many: false }),
  },
});
