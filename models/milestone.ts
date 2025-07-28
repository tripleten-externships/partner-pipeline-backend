import { list } from "@keystone-6/core";
import { text, timestamp, select, relationship } from "@keystone-6/core/fields";

export const Milestone = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
    name: text({ validation: { isRequired: true } }),
    status: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
      ],
      defaultValue: "not_started",
      ui: { displayMode: "segmented-control" },
    }),
    project: relationship({ ref: "Project", many: false }),
    updatedAt: timestamp({
      defaultValue: { kind: "now" },
      db: { updatedAt: true },
    }),
    updatedBy: relationship({ ref: "User", many: false }),
  },
});
