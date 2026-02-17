import { list } from "@keystone-6/core";
import { text, select, timestamp, relationship, checkbox } from "@keystone-6/core/fields";

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
    notes: text({
      ui: { displayMode: "textarea" },
      validation: { isRequired: false },
    }),
    program: select({
      options: [
        { label: "SE", value: "software_engineering" },
        { label: "AI/ML", value: "ai_machine_learning" },
        { label: "AI Automation", value: "ai_automation" },
        { label: "BI Analytics", value: "business_intelligence_analytics" },
        { label: "CS", value: "cyber_security" },
        { label: "QA", value: "quality_assurance" },
        { label: "AI SE", value: "ai_software_engineering" },
        { label: "UX/UI", value: "ux_ui_design" },
      ],
      ui: { displayMode: "select" },
    }),
    completedOn: timestamp(),
    contactedBy: relationship({ ref: "User.waitlistContacts", many: false }),
    lastContactedOn: timestamp(),
    hasVoucher: checkbox({ defaultValue: false }),
  },
});
