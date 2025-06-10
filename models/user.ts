import { list } from "@keystone-6/core";
import type { ListConfig } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import { checkbox, text, password, timestamp, select } from "@keystone-6/core/fields";
import { UserRoleValues } from "../utils/values";

export const User: ListConfig<Lists.User.TypeInfo<any>, any> = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        id: { equals: session.data.id },
      }),
    },
    item: {
      update: ({ session, item }) => item.id === session.data.id,
      delete: ({ session, item }) => item.id === session.data.id,
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
