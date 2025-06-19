//access.ts
type Session = {
  data: {
    role?: string;
    id: string;
    project?: string;
  };
};

export const isSignedIn = ({ session }: { session?: Session }) => !!session;

export const permissions = {
  isStudent: ({ session }: { session?: Session }) => session?.data.role === "Student",
  isProjectMentor: ({ session }: { session?: Session }) => session?.data.role === "Project Mentor",
  isLeadMentor: ({ session }: { session?: Session }) => session?.data.role === "Lead Mentor",
  isExternalPartner: ({ session }: { session?: Session }) =>
    session?.data.role === "External Partner",
  isAdminLike: ({ session }: { session?: Session }) =>
    session?.data.role === "Lead Mentor" || session?.data.role === "Project Mentor",
  isProjectMember: ({ session }: { session?: Session }) => session?.data.project === "",
};
