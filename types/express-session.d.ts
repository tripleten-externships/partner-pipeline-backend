import "express-session";

declare module "express-session" {
  interface SessionData {
    keystoneSession?: {
      data: {
        id: string;
        isAdmin: boolean;
        email: string;
        name: string;
        role: string;
      };
    };
  }
}
