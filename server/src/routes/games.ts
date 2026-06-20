import { Router, Response } from "express";
import db from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { GameType, ScoreSubmission } from "../types";

const router = Router();

router.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  const { game_type, player_ids } = req.body as {
    game_type?: GameType;
    player_ids?: number[];
  };

  const validTypes: GameType[] = ["rummy", "golf", "mexican_train"];
  if (!game_type || !validTypes.includes(game_type)) {
    res.status(400).json({ error: "Valid game_type is required" });
    return;
  }
  if (!Array.isArray(player_ids) || player_ids.length < 2) {
    res.status(400).json({ error: "At least 2 player_ids are required" });
    return;
  }

  const insertGame = db.prepare(
    "INSERT INTO games (game_type, created_by) VALUES (?, ?)"
  );
  const insertPlayer = db.prepare(
    "INSERT INTO game_players (game_id, user_id, join_order) VALUES (?, ?, ?)"
  );

  let gameId: number;
  db.exec("BEGIN");
  try {
    const gameResult = insertGame.run(game_type, req.user!.id);
    gameId = Number(gameResult.lastInsertRowid);
    for (let i = 0; i < player_ids.length; i++) {
      insertPlayer.run(gameId, player_ids[i], i);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.status(201).json({ id: gameId! });
});

router.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const { game_type, user_id } = req.query as { game_type?: string; user_id?: string };

  let query = `
    SELECT
      g.id, g.game_type, g.status, g.created_at, g.completed_at,
      COUNT(DISTINCT gp.user_id) AS player_count,
      COUNT(DISTINCT s.round_number) AS round_count
    FROM games g
    LEFT JOIN game_players gp ON gp.game_id = g.id
    LEFT JOIN scores s ON s.game_id = g.id
    WHERE g.status = 'completed'
  `;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];

  if (game_type) {
    query += " AND g.game_type = ?";
    params.push(game_type);
  }
  if (user_id) {
    query += " AND g.id IN (SELECT game_id FROM game_players WHERE user_id = ?)";
    params.push(Number(user_id));
  }

  query += " GROUP BY g.id ORDER BY g.completed_at DESC LIMIT 100";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmt = db.prepare(query) as any;
  const games = (params.length ? stmt.all(...params) : stmt.all()) as {
    id: number;
    game_type: GameType;
    status: string;
    created_at: number;
    completed_at: number | null;
    player_count: number;
    round_count: number;
  }[];

  const playerScoresStmt = db.prepare(`
    SELECT u.display_name, SUM(s.value) AS total
    FROM scores s
    JOIN users u ON u.id = s.user_id
    WHERE s.game_id = ?
    GROUP BY s.user_id
    ORDER BY total ASC
  `);

  const enriched = games.map((g) => {
    const playerScores = playerScoresStmt.all(g.id) as { display_name: string; total: number }[];
    return {
      ...g,
      winner_display_name: playerScores[0]?.display_name ?? null,
      winner_total: playerScores[0]?.total ?? null,
      results: playerScores,
    };
  });

  res.json({ games: enriched });
});

router.get("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  const game = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const players = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.created_at, gp.join_order
    FROM game_players gp
    JOIN users u ON u.id = gp.user_id
    WHERE gp.game_id = ?
    ORDER BY gp.join_order ASC
  `).all(id);

  const scores = db.prepare(`
    SELECT id, game_id, user_id, round_number, value
    FROM scores
    WHERE game_id = ?
    ORDER BY round_number ASC, user_id ASC
  `).all(id);

  res.json({ game, players, scores });
});

router.post("/:id/scores", requireAuth, (req: AuthRequest, res: Response) => {
  const { scores } = req.body as { scores?: ScoreSubmission[] };
  const gameId = String(req.params.id);

  if (!Array.isArray(scores) || scores.length === 0) {
    res.status(400).json({ error: "scores array is required" });
    return;
  }

  const game = db.prepare("SELECT id, status FROM games WHERE id = ?").get(gameId) as
    | { id: number; status: string }
    | undefined;

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.status === "completed") {
    res.status(409).json({ error: "Cannot modify a completed game" });
    return;
  }

  const upsert = db.prepare(`
    INSERT INTO scores (game_id, user_id, round_number, value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(game_id, user_id, round_number) DO UPDATE SET value = excluded.value
  `);

  db.exec("BEGIN");
  try {
    for (const s of scores) {
      upsert.run(gameId, s.user_id, s.round_number, s.value);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.json({ ok: true });
});

router.patch("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status?: string };
  const gameId = String(req.params.id);

  if (status !== "completed") {
    res.status(400).json({ error: "Only 'completed' status is supported" });
    return;
  }

  const game = db.prepare("SELECT id FROM games WHERE id = ?").get(gameId);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  db.prepare("UPDATE games SET status = 'completed', completed_at = unixepoch() WHERE id = ?").run(
    gameId
  );

  res.json({ ok: true });
});

export default router;
