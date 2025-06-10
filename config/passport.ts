import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth client ID or secret is missing. Check your .env file.");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) {
      // Here, find or create the user in your DB
      // Example: User.findOrCreate({ googleId: profile.id }, done);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user as Express.User);
});
passport.deserializeUser((obj, done) => {
  done(null, obj as Express.User);
});

export default passport;