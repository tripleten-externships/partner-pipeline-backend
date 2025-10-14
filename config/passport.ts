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

/// ss 1:

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = await keystoneContext.db.user.findOne({
        where: { email: profile.emails[0].value },
      });
      if (!user) {
        return done(null, false); // No user = fail
      }
      done(null, user);
    }
  )
);

// ss 2

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await keystoneContext.db.User.findOne({ where: { email } });

        // TODO: Also check for invitations and verify that one exists before creating the user
        // We don't want to let just ANYBODY register.

        if (!user) {
          // 👇 Create new user on first login
          user = await keystoneContext.db.User.createOne({
            data: {
              name: profile.displayName || profile.name.givenName,
              email,
              avatar: profile.photos?.[0]?.value,
              googleId: profile.id, // optional if you store it
            },
          });
        }

        return done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

export { passport };
