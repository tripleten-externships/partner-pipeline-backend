import { Router } from "express";
import { updateWaitlistNotes } from "../controllers/waitlistEntryController";
import { BaseKeystoneTypeInfo } from "@keystone-6/core/types";
import { Context } from ".keystone/types";
import express from "express";

export function createWaitlistEntryRouter(commonContext: Context<BaseKeystoneTypeInfo>) {
  const router = Router();
  router.use(express.json());

  router.patch("/:id/notes", async (req, res) => {
    const context = await commonContext.withRequest(req, res);
    console.log(context);
    if (!context) return res.status(500).send("Failed to get context");

    await updateWaitlistNotes(req, res, context);
  });

  return router;
}
