const express = require("express");
const router = express.Router();
const { MIN_TOPUP } = require("../domain/constants");
const {
	getOrCreateAdvertiser,
	totalAvailableForDay,
} = require("../services/budgetService");
const { attemptSchedulingFactory } = require("../services/campaignService");
const { topups } = require("../repositories/memoryStores");
const { v4: uuid } = require("uuid");

const attemptScheduling = attemptSchedulingFactory();

router.post("/", (req, res) => {
	const { advertiser_id, amount } = req.body || {};
	if (!advertiser_id || typeof amount !== "number" || amount < MIN_TOPUP) {
		return res.status(400).json({ error: `Minimum top-up is ${MIN_TOPUP}` });
	}
	const state = getOrCreateAdvertiser(advertiser_id);
	state.rolloverBalance += amount;
	const record = {
		id: uuid(),
		advertiserId: advertiser_id,
		amount,
		createdAt: new Date().toISOString(),
	};
	topups.push(record);
	attemptScheduling(state);
	res.json({
		status: "success",
		new_rollover_balance: state.rolloverBalance,
		total_available_today: totalAvailableForDay(state),
	});
});

module.exports = router;
