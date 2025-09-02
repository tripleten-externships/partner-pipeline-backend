type Session = {
  data: {
    role?: string;
    id: string;
    project?: string;
  };
};

export const isSignedIn = ({ session }: { session?: Session }) => !!session;

export const permissions = {
  // isStudent: ({ session }: { session?: Session }) => session?.data.role === "Student",
  isStudent: () => true,

  // isProjectMentor: ({ session }: { session?: Session }) => session?.data.role === "Project Mentor",
  isProjectMentor: () => true,

  // isLeadMentor: ({ session }: { session?: Session }) => session?.data.role === "Lead Mentor",
  isLeadMentor: () => true,

  // isExternalPartner: ({ session }: { session?: Session }) =>
  //   session?.data.role === "External Partner",
  isExternalPartner: () => true,

  // isAdminLike: ({ session }: { session?: Session }) =>
  //   ["Admin", "Lead Mentor", "Project Mentor"].includes(session?.data.role ?? ""),
  isAdminLike: () => true,
  isProjectMember: ({ session }: { session?: Session }) => session?.data.project === "",
};
