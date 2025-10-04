import { Router } from "express";
import { pool } from "../db.js";
const r = Router();

r.post("/settings", async (req, res) => {
  const { userId, multiplier, maxLot, maxDailyDD } = req.body;
  await pool.query(
    `update copy_settings set multiplier=$2, max_lot=$3, max_dd_daily_pct=$4 where user_id=$1`,
    [userId, multiplier, maxLot, maxDailyDD]
  );
  res.json({ ok:true });
});

r.post("/pause", async (req, res) => {
  const { userId } = req.body;
  await pool.query(`update copy_settings set paused=true where user_id=$1`, [userId]);
  res.json({ ok:true });
});

r.post("/resume", async (req, res) => {
  const { userId } = req.body;
  await pool.query(`update copy_settings set paused=false where user_id=$1`, [userId]);
  res.json({ ok:true });
});

export default r;
