import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, text, password, timestamp, select } from "@keystone-6/core/fields";
import { UserRoleValues } from "../utils/values";
import { permissions, isSignedIn } from "../utils/access";

export const User: ListConfig<Lists.User.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: ({ session }) => isSignedIn({ session }),
      create: ({ session }) => permissions.isAdminLike({ session }), 
      update: ({ session }) =>
        permissions.isAdminLike({ session }) || permissions.isStudent({ session }),
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
    filter: {
      query: ({ session }) => {
        if (permissions.isAdminLike({ session })) return true;
        if (permissions.isStudent({ session })) {
          return { id: { equals: session?.data?.id } };
        }
        return false;
      },
    },
    item: {
      update: ({ session, item }) =>
        permissions.isAdminLike({ session }) || item.id === session?.data?.id,
      delete: ({ session }) => permissions.isAdminLike({ session }),
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: "unique",
    }),
    password: password({
      validation: {
        length: { min: 10, max: 100 },
        isRequired: true,
        rejectCommon: true,
      },
      bcrypt: require("bcryptjs"),
    }),
    role: select({
      options: UserRoleValues.map((value) => ({ label: value, value })),
      defaultValue: "Student",
      validation: { isRequired: true },
    }),
    isAdmin: checkbox({ defaultValue: true }), 
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    project: text({ validation: { isRequired: true } }),
    isActive: checkbox({ defaultValue: false }),
    lastLoginDate: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});

