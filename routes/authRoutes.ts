import { Router } from "express";
import { passport } from "../config/passport";

const router = Router();

// Redirect user to Google for authentication
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: true,
  }),
  (req, res) => {
    // Success: redirect to dashboard or home
    res.redirect("/");
  }
);

/////////////////
//1st screenshot
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   const user = await keystoneContext.db.user.findOne({
//     where: { email: profile.emails[0].value }
//   });
//   if (!user) {
//     return done(null, false); // No user = fail
//   }
//   done(null, user);
// }));
//////////////////////
// 2nd screenshot
//  passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;
//     let user = await keystoneContext.db.User.findOne({ where: { email } });

//     // TODO: Also check for invitations and verify that one exists before creating the user
//     // We don't want to let just ANYBODY register.

//     if (!user) {
//       // 👇 Create new user on first login
//       user = await keystoneContext.db.User.createOne({
//         data: {
//           name: profile.displayName || profile.name.givenName,
//           email,
//           avatar: profile.photos?.[0]?.value,
//           googleId: profile.id, // optional if you store it
//         },
//       });
//     }

//     return done(null, user);
//   } catch (err) {
//     done(err);
//   }
// }));

export default router;
