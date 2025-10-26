import { User, UserLog } from "./user";
import { Project, ProjectLog, ProjectInvitation } from "./project";
import { Milestone } from "./milestone";
import { ActivityLog } from "./activityLog";
import { InvitationToken, InvitationTokenLog } from "./invitationToken";
import { WaitlistEntry } from "./WaitlistEntry"; // Add this import

export const lists = {
  User,
  UserLog,
  Project,
  ProjectLog,
  ProjectInvitation,
  Milestone,
  ActivityLog,
  InvitationToken,
  InvitationTokenLog,
  WaitlistEntry, // Added this
};
