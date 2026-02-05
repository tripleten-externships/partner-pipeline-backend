import dotenv from "dotenv";
dotenv.config();

import { config } from "@keystone-6/core";
import { lists } from "./models";
//import expressSession from "express-session";
import { keystoneSession } from "./config/keystoneSession";
import { withAuth } from "./auth";
import * as Models from "./models";
import authRoutes from "./routes/authRoutes";
//import { setupPassport, passport } from "./config/passport";
import { createMilestoneRouter } from "./routes/milestoneDataRoutes";
import { createActivityLogRouter } from "./routes/activityLogRoute";
import { createInvitationsRouter } from "./routes/invitationsRoute";
import { createCsvImportRouter } from "./routes/csvImportRoute";
import { createInvitationAnalyticsRouter } from "./routes/invitationAnalyticsRoute";
import { createWaitlistEntryRouter } from "./routes/waitlistEntryRoute";
import { createWaitlistRouter } from "./routes/waitlistRoute";

import { sendReminder } from "./controllers/reminderController";

import express from "express";

const { graphqlUploadExpress } = require("graphql-upload");

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
        //GraphQL upload middleware — must come first
        app.use((req, res, next) => {
          if (req.path === "/api/graphql") {
            graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })(req, res, next);
          } else {
            next();
          }
        });

        //Create a scoped router for /api
        const apiRouter = express.Router();

        //Mount custom routers
        apiRouter.use("/projects", createInvitationsRouter(commonContext));
        apiRouter.use("/milestones", createMilestoneRouter(commonContext));
        apiRouter.use("/activity", createActivityLogRouter(commonContext));
        apiRouter.use("/import", createCsvImportRouter(commonContext));
        apiRouter.use("/invitations/analytics", createInvitationAnalyticsRouter(commonContext));
        apiRouter.use("/waitlist-entry", createWaitlistEntryRouter(commonContext));
        apiRouter.use("/waitlist", createWaitlistRouter(commonContext));

        //Mount the /api router once
        app.use("/api", apiRouter);

        //Keystone Auth routes
        app.use(authRoutes);

        //Custom endpoints
        apiRouter.post("/test", (req, res) => {
          console.log("Received test request:", req.body);
          res.json({ message: "Backend is working!" });
        });
        app.get("/api/_root_health", (_req, res) => res.send("ok-root"));
        app.get("/api/test", (_req, res) => res.send("Test route working"));
        app.post("/api/send", async (req, res) => {
          const context = await commonContext.withRequest(req, res);
          await sendReminder(context.req, res, context);
        });
      },
    },
    db: {
      provider: "mysql",
      url: `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
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
