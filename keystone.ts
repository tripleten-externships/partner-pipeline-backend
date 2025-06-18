import dotenv from "dotenv";
dotenv.config();

import { config } from "@keystone-6/core";
import expressSession from "express-session";
import { keystoneSession } from "./config/keystoneSession";
import { withAuth } from "./auth";
import * as Models from "./models";
import authRoutes from "./routes/authRoutes";
import { setupPassport, passport } from "./config/passport";

export default withAuth(
  config({
    server: {
      port: 8080,
      cors: {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
      },
      extendExpressApp: (app, _context) => {
        setupPassport();

        app.use(
          expressSession({
            secret: process.env.SESSION_SECRET!,
            resave: false,
            saveUninitialized: false,
          })
        );

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(authRoutes);
      },
    },
    db: {
      provider: "mysql",
      url: `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`,
      enableLogging: true,
      idField: { kind: "uuid" },
      useMigrations: true,
    },
    telemetry: false,
    graphql: {
      playground: true,
      apolloConfig: {
        introspection: true,
      },
    },
    storage: {
      s3_file_storage: {
        kind: "s3",
        type: "file",
        bucketName: process.env.S3_BUCKET_NAME || "project_name-keystonejs",
        region: process.env.S3_REGION || "us-east-2",
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "keystone",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "keystone",
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
      s3_image_storage: {
        kind: "s3",
        type: "image",
        bucketName: process.env.S3_BUCKET_NAME || "project_name-keystonejs",
        region: process.env.S3_REGION || "us-east-2",
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "keystone",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "keystone",
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
    },
    lists: Models,
    session: keystoneSession,
  })
);
