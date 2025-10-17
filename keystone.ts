import dotenv from "dotenv";
dotenv.config();

import { config } from "@keystone-6/core";
import { lists } from "./models";
import expressSession from "express-session";
import { keystoneSession } from "./config/keystoneSession";
import { withAuth } from "./auth";
import * as Models from "./models";
import authRoutes from "./routes/authRoutes";
import { setupPassport, passport } from "./config/passport";
import { createMilestoneRouter } from "./routes/milestoneDataRoutes";
import { createActivityLogRouter } from "./routes/activityLogRoute";
import { createInvitationsRouter } from "./routes/invitationsRoute";
import { sendReminder } from "./controllers/reminderController";

import express from "express";

const { graphqlUploadExpress } = require("graphql-upload");
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
        // 🔁 Apply graphql-upload middleware conditionally
        app.use((req, res, next) => {
          if (req.path === "/api/graphql") {
            graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })(req, res, next);
          } else {
            next();
          }
        });

        // 🛡️ Setup Passport strategies
        setupPassport();

        // 🧠 Session middleware
        app.use(
          expressSession({
            secret: process.env.SESSION_SECRET!,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }, // Set to true if using HTTPS
          })
        );

        // 🧭 Passport middleware
        app.use(passport.initialize());
        app.use(passport.session());

        // 📦 Optional: JSON body parsing (comment out if Keystone handles it internally)
        // app.use(express.json());

        // ✅ Health check route
        app.get("/api/_root_health", (_req, res) => res.send("ok-root"));

        // 🔐 Auth routes
        app.use(authRoutes);

        // 🧩 Keystone context-aware routes
        app.use(createMilestoneRouter(commonContext));
        app.use(createActivityLogRouter(commonContext));
        app.use(createInvitationsRouter(commonContext));

        // ⏰ Reminder API
        app.post("/api/send", express.json(), async (req, res) => {
          const context = await commonContext.withRequest(req, res);

          // ✅ Bypass session check for public access
          if (!context.session) {
            console.log("⚠️ No session found — allowing public access to /api/send");
          }

          await sendReminder(req, res, context);
        });

        app.get("/api/test", (_req, res) => {
          console.log("✅ /api/test route hit");
          res.send("Test route working");
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
