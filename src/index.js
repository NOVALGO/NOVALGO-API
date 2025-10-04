import express from "express";
import cors from "cors";
import stripeWebhook from "./stripeWebhook.js";
import mt5Routes from "./routes/mt5.js";
import copyRoutes from "./routes/copy.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Webhook Stripe (corps brut requis)
app.use("/stripe", stripeWebhook);

// Routes métier
app.use("/mt5", mt5Routes);
app.use("/copy", copyRoutes);

// Health-check
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("API running on", PORT));
