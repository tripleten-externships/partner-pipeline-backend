import { list } from "@keystone-6/core";
import { text, select, timestamp } from "@keystone-6/core/fields";

// Waitlist model to manage a waitlist of students or users
export const waitListStudent = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },

  ui: {
    listView: {
      initialColumns: ["name", "email", "status", "inviteSentAt", "createdAt"],
      initialSort: { field: "createdAt", direction: "DESC" },
    },
  },
  fields: {
    // Name of the student or person joining the waitlist
    name: text({ validation: { isRequired: true } }),

    // Unique email (cannot be duplicated)
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),

    // Status of the person on the list
    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Invited", value: "invited" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "pending",
      ui: { displayMode: "segmented-control" },
    }),

    // Date and time when the invitation was sent
    inviteSentAt: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
      ui: { itemView: { fieldMode: "read" } },
    }),
  },
});
