import express from "express";
import getRawBody from "raw-body";
import Stripe from "stripe";
import { pool } from "./db.js";

const router = express.Router();

// Stripe nécessite le "raw body"
router.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    getRawBody(req).then(buf => { req.rawBody = buf; next(); }).catch(next);
  } else next();
});

router.post("/webhook", async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const email = s.customer_details.email;
      const u = await pool.query(
        `insert into users(email) values($1)
         on conflict (email) do update set email=$1
         returning id`, [email]
      );
      const userId = u.rows[0].id;
      await pool.query(
        `insert into subscriptions(user_id,status,stripe_customer_id,stripe_sub_id,current_period_end)
         values($1,'active',$2,$3,to_timestamp($4))
         on conflict (user_id) do update set status='active', stripe_customer_id=$2, stripe_sub_id=$3, current_period_end=to_timestamp($4)`,
        [userId, s.customer, s.subscription, (s.expires_at || Math.floor(Date.now()/1000))]
      );
      break;
    }
    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      const obj = event.data.object;
      const id = obj.id || obj.subscription || obj.customer;
      await pool.query(`update subscriptions set status='past_due' where stripe_sub_id=$1 or stripe_customer_id=$1`, [id]);
      break;
    }
    case "invoice.payment_succeeded": {
      const inv = event.data.object;
      await pool.query(`update subscriptions set status='active' where stripe_customer_id=$1`, [inv.customer]);
      break;
    }
  }
  res.json({ received: true });
});

export default router;
