// export * from "./user";
// export * from "./project";
// export * from "./activitylog";

import { User, UserLog } from "./user";
import { Project, ProjectLog } from "./project";
import { ActivityLog } from "./activitylog";

export const lists = {
  User,
  UserLog,
  Project,
  ProjectLog,
  ActivityLog,
};
