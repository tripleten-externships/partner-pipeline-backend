// import { User, UserLog } from "./user";

// export const lists = {
//   User,
//   UserLog,
// };

import { User, UserLog } from "./user";
import { list } from "@keystone-6/core";
import { image } from "@keystone-6/core/fields";

export const lists = {
  User,
  UserLog,
  TestUpload: list({
    fields: {
      upload: image({ storage: "s3_image_storage" }),
    },
    access: {
      operation: {
        query: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
    },
  }),
};
