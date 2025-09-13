import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { text, select, relationship, timestamp } from "@keystone-6/core/fields";

// --------------------
// Helper functions for role-based access
// --------------------
const isAdmin = (session: any) => session?.data?.isAdmin;
const isManager = (session: any) => session?.data?.role === "Manager";

export const Milestone: ListConfig<Lists.Milestone.TypeInfo<any>, any> = list({

  // --------------------
  // Fields
  // --------------------
  fields: {
    project: relationship({ ref: "Project.milestones", many: false }),
    activityLogs: relationship({ ref: "ActivityLog.milestone", many: true }),
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

    updatedAt: timestamp({
      defaultValue: { kind: "now" },
      db: { updatedAt: true },
    }),

    updatedBy: relationship({ ref: "User", many: false }),
  },

  // --------------------
  // Access - more granular, role-based
  // --------------------
  access: {
    // operation-level access: broad rules
    operation: {
      query: ({ session }) => !!session, // allow logged-in users
      create: ({ session }) => isAdmin(session) || isManager(session), // if admin or manager
      update: ({ session }) => !!session, // allow logged-in users
      delete: ({ session }) => isAdmin(session), // only if admin
    },
    // item-level access:
    item: {
      update: ({ session, item }) => {
        if (!session) return false;
        if (isAdmin(session)) return true;
        if (isManager(session) && item.assignee === session.data.id) return true;
        return false;
      },
      delete: ({ session, item }) => {
        return isAdmin(session);
      },
    },
  },

  // --------------------
  // Hooks
  // --------------------
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
});
