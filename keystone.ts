import dotenv from "dotenv";
import { config } from "@keystone-6/core";
import { lists } from "./models";

dotenv.config();

import expressSession from "express-session";
import { keystoneSession } from "./config/keystoneSession";
import { withAuth } from "./auth";
import * as Models from "./models";
import authRoutes from "./routes/authRoutes";
import { setupPassport, passport } from "./config/passport";
import { createMilestoneRouter } from "./routes/milestoneDataRoutes";
import { createActivityLogRouter } from "./routes/activityLogRoute";
import { createInvitationsRouter } from "./routes/invitationsRoute";
import { acceptInvitationSchema } from "./graphql/acceptInvitation";

export default withAuth(
  config({
    server: {
      port: 8080,
      cors: {
        origin: ["http://localhost:3000"],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
      },
      extendExpressApp: (app, commonContext) => {
        // bypass for dev testing
        setupPassport();

        app.use(
          expressSession({
            secret: process.env.SESSION_SECRET!,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }, // Set to true if using HTTPS
          })
        );

        app.use(passport.initialize());
        app.use(passport.session());

        app.get("/api/_root_health", (_req, res) => res.send("ok-root"));

        app.use(authRoutes);
        // milestone api endpoint with keystone context
        app.use(createMilestoneRouter(commonContext));
        // activity log api endpoint with keystone context
        app.use(createActivityLogRouter(commonContext));
        app.use(createInvitationsRouter(commonContext));
      },
    },
    db: {
      provider: "mysql",
      url: `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`,
      enableLogging: true,
      idField: { kind: "uuid" },
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
        bucketName: process.env.S3_BUCKET_NAME || "partner-pipeline-keystonejs",
        region: process.env.S3_REGION || "us-east-2",
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "keystone",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "keystone",
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
      s3_image_storage: {
        kind: "s3",
        type: "image",
        bucketName: process.env.S3_BUCKET_NAME || "partner-pipeline-keystonejs",
        region: process.env.S3_REGION || "us-east-2",
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "keystone",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "keystone",
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
    },
    lists,
    session: keystoneSession,
  })
);
