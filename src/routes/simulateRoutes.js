const express = require("express");
const router = express.Router();
const { advertisers } = require("../repositories/memoryStores");
const { endOfDayRollover, advanceDay } = require("../services/budgetService");
const { attemptSchedulingFactory } = require("../services/campaignService");

const attemptScheduling = attemptSchedulingFactory();

router.post("/day", (req, res) => {
	const result = [];
	for (const state of advertisers.values()) {
		endOfDayRollover(state);
		advanceDay(state, attemptScheduling);
		result.push({
			advertiser_id: state.advertiserId,
			current_day: state.currentDay,
			rollover_balance: state.rolloverBalance,
			deferred_campaigns: state.deferredCampaignIds.length,
		});
	}
	res.json({ status: "ok", advertisers: result });
});

module.exports = router;
