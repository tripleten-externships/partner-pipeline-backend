type Session = {
  data: {
    role?: string;
    id: string;
    project?: string; // (slug or name you store on the User)
  };
};

export const isSignedIn = ({ session }: { session?: Session }) => !!session?.data?.id;

const normalizeRole = (role?: string) => (role ?? "").trim().toLowerCase();

// Granular helpers
export const permissions = {
  isStudent: ({ session }: { session?: Session }) =>
    normalizeRole(session?.data.role) === "student",
  isProjectMentor: ({ session }: { session?: Session }) =>
    normalizeRole(session?.data.role) === "project mentor",
  isLeadMentor: ({ session }: { session?: Session }) =>
    normalizeRole(session?.data.role) === "lead mentor",
  isExternalPartner: ({ session }: { session?: Session }) =>
    normalizeRole(session?.data.role) === "external partner",
  isAdminLike: ({ session }: { session?: Session }) => {
    const role = normalizeRole(session?.data?.role);
    return ["admin", "lead mentor", "project mentor"].includes(role);
  },
  isProjectMember: ({ session }: { session?: Session }) => session?.data.project === "",
};
