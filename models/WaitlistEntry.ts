import { list } from "@keystone-6/core";
import { text, timestamp, select } from "@keystone-6/core/fields";

export const WaitlistEntry = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: "unique",
    }),

    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "pending",
      ui: { displayMode: "segmented-control" },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
