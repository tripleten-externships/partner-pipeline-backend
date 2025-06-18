import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { env } from './config'; 

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
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