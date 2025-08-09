const express = require("express");
const router = express.Router();
const {
	getOrCreateAdvertiser,
	totalAvailableForDay,
} = require("../services/budgetService");
const { otherSpends } = require("../repositories/memoryStores");
const { v4: uuid } = require("uuid");

router.post("/", (req, res) => {
	const { advertiser_id, amount, reason } = req.body || {};
	if (!advertiser_id || typeof amount !== "number" || amount <= 0) {
		return res
			.status(400)
			.json({ error: "advertiser_id and positive amount required" });
	}
	const state = getOrCreateAdvertiser(advertiser_id);
	const remaining = totalAvailableForDay(state);
	if (amount > remaining) {
		return res.json({
			status: "rejected",
			reason: "insufficient_balance",
			remaining_today: remaining,
		});
	}
	state.usedToday += amount;
	const spend = {
		id: uuid(),
		advertiserId: advertiser_id,
		amount,
		reason: reason || "other",
		day: state.currentDay,
	};
	otherSpends.push(spend);
	res.json({ status: "success", remaining_today: totalAvailableForDay(state) });
});

module.exports = router;
