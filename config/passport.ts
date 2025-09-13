import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "./config";

const prisma = new PrismaClient();

export function setupPassport() {
  // Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
              userPermissions: {
                include: {
                  permission: true,
                },
              },
            },
          });

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Account is not active" });
          }

          // Update last login date
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginDate: new Date() },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (env.googleClientId && env.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.googleClientId,
          clientSecret: env.googleClientSecret,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email) {
              return done(new Error("No email found in Google profile"), null);
            }

            // Check if user already exists
            let user = await prisma.user.findUnique({
              where: { email },
              include: {
                userPermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            });

            if (!user) {
              // Create new user from Google profile
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || profile.name?.givenName || "User",
                  password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
                  role: "Student", // Default role
                  isActive: true,
                  lastLoginDate: new Date(),
                },
                include: {
                  userPermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              });
            } else {
              // Update last login date
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginDate: new Date() },
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

export { passport };
