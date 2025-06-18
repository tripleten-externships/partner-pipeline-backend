
export const isSignedIn = ({ session }: { session: any }) => !!session;

export const permissions = {
  isAdminLike: ({ session }: { session: any }) =>
    session?.data?.role === 'Admin' || session?.data?.isAdmin,
  isStudent: ({ session }: { session: any }) =>
    session?.data?.role === 'Student',
};