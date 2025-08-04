import { list } from "@keystone-6/core";
import { relationship, select, timestamp } from "@keystone-6/core/fields";

export const ActivityLog = list({
  ui: {
    isHidden: false,
    labelField: "newStatus",
  },
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => false,
      delete: () => false,
    },
  },
  fields: {
    milestone: relationship({ ref: "Milestone", many: false }),
    oldStatus: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "cat", value: "cat" },
        { label: "dog", value: "dog" },
        { label: "fish", value: "fish" },
        { label: "mouse", value: "mouse" },
      ],
    }),
    newStatus: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "cat", value: "cat" },
        { label: "dog", value: "dog" },
        { label: "fish", value: "fish" },
        { label: "mouse", value: "mouse" },
      ],
    }),
    user: relationship({ ref: "User", many: false }),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
});
