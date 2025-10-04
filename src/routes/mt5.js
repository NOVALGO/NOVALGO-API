import { Router } from "express";
import { pool } from "../db.js";
import { encrypt } from "../crypto.js";
import { createMetaApiAccount, attachSubscriberToStrategy } from "../metaapi.js";

const r = Router();

// Connecter le MT5 du client et l'abonner à la stratégie
r.post("/connect", async (req, res) => {
  try {
    const { userId, login, server, password, multiplier=1, maxLot=0.3, maxDailyDD=5 } = req.body;

    // 1) Créer compte MetaApi client
    const acc = await createMetaApiAccount({ login, password, server });

    // 2) Stocker en DB (password chiffré)
    await pool.query(
      `insert into mt5_accounts(user_id, login, server, password_encrypted, status)
       values($1,$2,$3,$4,'connected')
       on conflict (user_id) do update set login=$2, server=$3, password_encrypted=$4`,
      [userId, login, server, encrypt(password)]
    );
    await pool.query(
      `insert into copy_settings(user_id, multiplier, max_lot, max_dd_daily_pct, paused)
       values($1,$2,$3,$4,false)
       on conflict (user_id) do update set multiplier=$2, max_lot=$3, max_dd_daily_pct=$4`,
      [userId, multiplier, maxLot, maxDailyDD]
    );

    // 3) Abonner à la stratégie CopyFactory
    await attachSubscriberToStrategy({
      subscriberAccountId: acc.id,
      settings: { multiplier, maxLot, maxDailyDD }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e?.response?.data || e);
    res.status(500).json({ ok:false, error:"connect_failed" });
  }
});

// Statut MT5
r.get("/status", async (req, res) => {
  const { userId } = req.query;
  const { rows } = await pool.query(
    `select status, last_checked_at from mt5_accounts where user_id=$1`, [userId]
  );
  res.json(rows[0] || { status: "not_connected" });
});

export default r;
