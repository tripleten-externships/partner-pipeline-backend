import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { relationship, text, timestamp } from "@keystone-6/core/fields";
import { isSignedIn } from "../utils/access";

export const ActivityLog: ListConfig<Lists.ActivityLog.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
  },
  fields: {
    oldStatus: text({ validation: { isRequired: true } }),
    newStatus: text({ validation: { isRequired: true } }),
    timestamp: timestamp({ defaultValue: { kind: "now" } }),
    projectId: text({
      validation: { isRequired: true },
      isIndexed: true,
    }), // add relationship field when project model is created
    milestoneId: text({
      validation: { isRequired: true },
      isIndexed: true,
    }), // add relationship field when milestone model is created
    updatedBy: relationship({ ref: "User.activityLogs", many: false }),
  },
});
