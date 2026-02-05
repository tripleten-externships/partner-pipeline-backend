import { list } from "@keystone-6/core";
import { relationship, select, timestamp } from "@keystone-6/core/fields";
import { isSignedIn } from "../utils/access";

export const ActivityLog = list({
  ui: {
    isHidden: false,
    labelField: "newStatus",
  },
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
  },
  fields: {
    project: relationship({ ref: "Project.activityLogs", many: false }),
    milestone: relationship({ ref: "Milestone.activityLogs", many: false }),
    updatedBy: relationship({ ref: "User.activityLogs", many: false }),
    oldStatus: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "pending", value: "pending" },
        { label: "invited", value: "invited" },
        { label: "accepted", value: "accepted" },
        { label: "rejected", value: "rejected" },
      ],
    }),
    newStatus: select({
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "pending", value: "pending" },
        { label: "invited", value: "invited" },
        { label: "accepted", value: "accepted" },
        { label: "rejected", value: "rejected" },
      ],
    }),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
  },
});
