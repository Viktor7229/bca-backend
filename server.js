// Entry point sets up Express and mounts modular routes. Exports app for testing.
const express = require("express");

const campaignRoutes = require("./src/routes/campaignRoutes");
const topupRoutes = require("./src/routes/topupRoutes");
const simulateRoutes = require("./src/routes/simulateRoutes");
const budgetRoutes = require("./src/routes/budgetRoutes");
const spendRoutes = require("./src/routes/spendRoutes");
const listCampaignsRoutes = require("./src/routes/listCampaignsRoutes");

const app = express();
app.use(express.json());

app.use("/campaigns", campaignRoutes); // POST submit + GET list
app.use("/topup", topupRoutes); // POST
app.use("/simulate", simulateRoutes); // POST /simulate/day
app.use("/budgets", budgetRoutes); // GET /budgets/:advertiserId
app.use("/spend", spendRoutes); // POST
app.use("/all-campaigns", listCampaignsRoutes); // GET alt

app.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = app; // Listening handled in start.js
