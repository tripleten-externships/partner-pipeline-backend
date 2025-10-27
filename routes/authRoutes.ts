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

export default router;
