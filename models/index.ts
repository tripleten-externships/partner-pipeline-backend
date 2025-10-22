import { User, UserLog } from "./user";
import { Project, ProjectLog, ProjectInvitation } from "./project";
import { Milestone } from "./milestone";
import { ActivityLog } from "./activityLog";
import { InvitationToken, InvitationTokenLog } from "./invitationToken";
import { Waitlist } from "./Waitlist";


export const lists = {
  User,
  UserLog,
  Project,
  ProjectLog,
  ProjectInvitation, // <-- Added field
  Milestone,
  ActivityLog,
  InvitationToken,
  InvitationTokenLog,
  Waitlist

};
