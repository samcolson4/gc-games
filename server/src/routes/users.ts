import { Router, Response } from "express";
import db from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, (_req: AuthRequest, res: Response) => {
  const users = db
    .prepare("SELECT id, username, display_name, created_at FROM users ORDER BY display_name ASC")
    .all();
  res.json({ users });
});

export default router;
