import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { env } from "./config";

export function setupPassport() {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw new Error("Missing Google OAuth credentials");
    // skipping Google OAuth setup
    // console.warn("Skipping Google OAuth setup");
    // return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: "/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        // TODO: Replace with logic to find or create a user in your DB
        return done(null, profile); // TEMP: use Google profile as-is
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj: any, done) => {
    done(null, obj);
  });
}

export { passport };
