import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import {
  checkbox,
  text,
  password,
  timestamp,
  integer,
  select,
  relationship,
  json,
} from "@keystone-6/core/fields";
import { UserRoleValues } from "../utils/values";
import { permissions, isSignedIn } from "../utils/access";

export const User: ListConfig<Lists.User.TypeInfo<any>> = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => permissions.isAdminLike({ session }),
      update: ({ session }) =>
        permissions.isAdminLike({ session }) || permissions.isStudent({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    filter: {
      query: ({ session }) => {
        if (process.env.NODE_ENV !== "production") return true;
        if (permissions.isAdminLike({ session })) return true;
        // everyone else (students, mentors, partners) → only themselves
        return { id: { equals: session?.data?.id } };
      },
    },
    item: {
      update: ({ session, item }) =>
        permissions.isAdminLike({ session }) || item.id === session?.data?.id,
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    password: password({
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
      bcrypt: require("bcryptjs"),
    }),
    role: select({
      options: UserRoleValues.map((value) => ({ label: value, value })),
      defaultValue: "Student",
    }),
    reminder_count: integer({ defaultValue: 0 }),
    status: select({
      options: [
        { label: "Active", value: "Active" },
        { label: "Unresponsive", value: "Unresponsive" },
      ],
      defaultValue: "Active",
      ui: { displayMode: "segmented-control" },
    }),
    isAdmin: checkbox({ defaultValue: true }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    project: text({
      validation: { isRequired: false }, // ✅ allows empty
      ui: { displayMode: "input" }, // optional: improves Admin UI
    }),
    isActive: checkbox({ defaultValue: false }),
    lastLoginDate: timestamp({ defaultValue: { kind: "now" } }),
    activityLogs: relationship({ ref: "ActivityLog.updatedBy", many: true }),
    projects: relationship({ ref: "Project.members" }),
    invitation: relationship({ ref: "ProjectInvitation.user", many: true }),
  },
  hooks: {
    resolveInput: async (args: {
      resolvedData: Record<string, any>;
      operation: "create" | "update";
      existingItem?: Record<string, any>;
    }) => {
      const { resolvedData, operation } = args;

      let incomingCount = 0;

      if (typeof resolvedData.reminder_count === "number") {
        incomingCount = resolvedData.reminder_count;
      } else if (
        resolvedData.reminder_count &&
        typeof resolvedData.reminder_count.set === "number"
      ) {
        incomingCount = resolvedData.reminder_count.set;
      }

      let currentCount = 0;

      if (operation === "update" && args.existingItem) {
        currentCount = args.existingItem.reminder_count || 0;
      }

      const newCount = currentCount + incomingCount;

      // Flip status based on newCount
      if (newCount > 2) {
        resolvedData.status = "Unresponsive";
      } else {
        resolvedData.status = "Active";
      }

      return resolvedData;
    },

    async afterOperation({ operation, item, originalItem, context }) {
      if (operation === "create" || operation === "update" || operation === "delete") {
        await context.db.UserLog.createOne({
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

export const UserLog: ListConfig<Lists.UserLog.TypeInfo<any>> = list({
  fields: {
    user: relationship({ ref: "User", many: false }),
    operation: text({ validation: { isRequired: true } }), // "create", "update", "delete"
    before: json(),
    after: json(),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
  access: {
    operation: {
      query: ({ session }) => !!session && session.data.isAdmin,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
});
