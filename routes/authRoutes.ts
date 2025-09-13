import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { passport } from "../config/passport";

const router = Router();
const prisma = new PrismaClient();

// Traditional email/password login
router.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: "Authentication error", details: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || "Authentication failed" });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login error", details: err.message });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      return res.json({ 
        message: "Login successful", 
        user: userWithoutPassword,
        isAuthenticated: true 
      });
    });
  })(req, res, next);
});

// User registration
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = "Student" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        isActive: true,
        createdAt: new Date(),
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Logout
router.post("/auth/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Session destruction failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  });
});

// Get current user
router.get("/auth/me", (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword, isAuthenticated: true });
  } else {
    res.status(401).json({ error: "Not authenticated", isAuthenticated: false });
  }
});

// Google OAuth routes
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
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`,
    session: true,
  }),
  (req, res) => {
    // Success: redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`);
  }
);

export default router;
