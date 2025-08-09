const express = require("express");
const router = express.Router();
const {
	getOrCreateAdvertiser,
	totalAvailableForDay,
} = require("../services/budgetService");

router.get("/:advertiserId", (req, res) => {
	const advertiserId = req.params.advertiserId;
	const state = getOrCreateAdvertiser(advertiserId);
	const totalAvailable = totalAvailableForDay(state);
	res.json({
		advertiser_id: advertiserId,
		current_day: state.currentDay,
		daily_budget: state.dailyBudget,
		rollover_balance: state.rolloverBalance,
		total_available: totalAvailable,
		used_today: state.usedToday,
		remaining_today: totalAvailable,
		deferred_campaigns: state.deferredCampaignIds,
	});
});

module.exports = router;
