import { Router } from "express";
import { passport } from "../config/passport";

const router = Router();

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: true,
  }),
  (req, res) => {
    const user = req.user as {
      id: string;
      email: string;
      name: string;
      role: string;
      isAdmin: boolean;
    };

    req.session.keystoneSession = {
      data: {
        id: user.id,
        isAdmin: user.isAdmin,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    console.log("🔐 Google login successful:", req.session.keystoneSession);
    res.redirect("/");
  }
);

export default router;
