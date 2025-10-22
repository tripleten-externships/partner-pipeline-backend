import { list } from "@keystone-6/core";
import { text, timestamp, select } from "@keystone-6/core/fields";

export const Waitlist = list({
  fields: {
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    name: text(),
    status: select({
      type: "enum",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Contacted", value: "CONTACTED" },
        { label: "Invited", value: "INVITED" },
        { label: "Joined", value: "JOINED" },
      ],
      defaultValue: "PENDING",
    }),
    source: text(), // e.g., "landing page", "referral"
    notes: text({ ui: { displayMode: "textarea" } }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
  },
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  ui: { listView: { initialColumns: ["email", "status", "createdAt"] } },
});
