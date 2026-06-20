import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { username, display_name, password } = req.body as {
    username?: string;
    display_name?: string;
    password?: string;
  };

  if (!username?.trim() || !display_name?.trim() || !password) {
    res.status(400).json({ error: "username, display_name, and password are required" });
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username.trim());
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db
    .prepare("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)")
    .run(username.trim().toLowerCase(), display_name.trim(), hash);

  const user = db
    .prepare("SELECT id, username, display_name, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  const token = jwt.sign(
    { id: (user as { id: number }).id, username: (user as { username: string }).username },
    process.env.JWT_SECRET!,
    { expiresIn: "90d" }
  );

  res.status(201).json({ token, user });
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username?.trim() || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = db
    .prepare("SELECT id, username, display_name, password_hash, created_at FROM users WHERE username = ?")
    .get(username.trim().toLowerCase()) as
    | { id: number; username: string; display_name: string; password_hash: string; created_at: number }
    | undefined;

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "90d" }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, display_name: user.display_name, created_at: user.created_at },
  });
});

router.get("/me", requireAuth, (req: AuthRequest, res: Response) => {
  const user = db
    .prepare("SELECT id, username, display_name, created_at FROM users WHERE id = ?")
    .get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
