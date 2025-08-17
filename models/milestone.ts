import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { text, select, relationship, timestamp } from "@keystone-6/core/fields";

export const Milestone: ListConfig<Lists.Milestone.TypeInfo<any>, any> = list({
  fields: {
    // update: add milestones field from Project schema
    project: relationship({ ref: "Project.milestones", many: false }),

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
    }),
    assignee: text({
      validation: { isRequired: false },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },

  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },
});
